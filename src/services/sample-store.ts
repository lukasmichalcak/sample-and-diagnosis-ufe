import {
  Configuration,
  PatientReportsApi,
  SampleMeasurementsApi,
  SampleReportsApi,
  SamplesApi,
  ResponseError,
} from '../api/sample-and-diagnosis-test';
import type {
  MeasurementValue as ApiMeasurementValue,
  NewSample as ApiNewSample,
  Sample as ApiSample,
  SampleStatus as ApiSampleStatus,
} from '../api/sample-and-diagnosis-test';
import {
  DiagnosticReport,
  MeasurementValue,
  NewSampleDraft,
  Sample,
  SampleStatus,
  fromDateTimeInputValue,
  getMeasurementDefinition,
} from '../domain/sample';

type Listener = (samples: Sample[]) => void;

function normalizeBasePath(basePath?: string): string {
  const value = (basePath || '/api').trim();
  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}

function cloneSamples(samples: Sample[]): Sample[] {
  return samples.map(sample => ({
    ...sample,
    testTypes: [...sample.testTypes],
    measurements: sample.measurements.map(measurement => ({ ...measurement })),
    report: sample.report ? { ...sample.report } : undefined,
  }));
}

function apiDate(value?: Date | string): string | undefined {
  if (!value) {
    return undefined;
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function fromApiMeasurement(value: ApiMeasurementValue): MeasurementValue {
  const definition = getMeasurementDefinition(value.testTypeCode, value.code);
  let parsed: string | number | boolean = value.value;

  if (definition?.valueType === 'number' && value.value !== '') {
    parsed = Number(value.value);
  } else if (definition?.valueType === 'boolean') {
    parsed = value.value === 'true' || value.value === '1';
  }

  return {
    testTypeCode: value.testTypeCode,
    code: value.code,
    value: parsed,
    unit: value.unit,
    measuredAt: apiDate(value.measuredAt),
    enteredByRole: value.enteredByRole,
  };
}

function toApiMeasurement(value: MeasurementValue): ApiMeasurementValue {
  return {
    testTypeCode: value.testTypeCode,
    code: value.code,
    value: String(value.value),
    unit: value.unit,
    measuredAt: value.measuredAt ? new Date(value.measuredAt) : undefined,
    enteredByRole: value.enteredByRole === 'technician' || value.enteredByRole === 'diagnostician'
      ? value.enteredByRole
      : undefined,
  };
}

function fromApiReport(report: ApiSample['report']): DiagnosticReport | undefined {
  if (!report) {
    return undefined;
  }

  return {
    ...report,
    createdAt: apiDate(report.createdAt) || '',
    updatedAt: apiDate(report.updatedAt) || '',
    finalizedAt: apiDate(report.finalizedAt),
  };
}

function fromApiSample(sample: ApiSample): Sample {
  return {
    id: sample.id,
    patientName: sample.patientName,
    patientId: sample.patientId,
    sampleCode: sample.sampleCode,
    collectedAt: apiDate(sample.collectedAt) || '',
    testTypes: [...sample.testTypes],
    status: sample.status as SampleStatus,
    measurements: sample.measurements.map(fromApiMeasurement),
    report: fromApiReport(sample.report),
    createdAt: apiDate(sample.createdAt) || '',
    updatedAt: apiDate(sample.updatedAt) || '',
    createdBy: sample.createdBy,
    finalizedBy: sample.finalizedBy,
  };
}

function toApiNewSample(draft: NewSampleDraft): ApiNewSample {
  return {
    patientName: draft.patientName.trim(),
    patientId: draft.patientId?.trim() || '',
    sampleCode: draft.sampleCode.trim(),
    collectedAt: new Date(fromDateTimeInputValue(draft.collectedAt)),
    testTypes: [...draft.testTypes],
  };
}

async function userFacingError(error: unknown): Promise<string> {
  if (error instanceof ResponseError) {
    try {
      const body = await error.response.clone().json();
      return body?.message || body?.error || `Request failed with status ${error.response.status}.`;
    } catch {
      return `Request failed with status ${error.response.status}.`;
    }
  }

  return error instanceof Error ? error.message : 'Request failed.';
}

export class SampleStore {
  private listeners: Listener[] = [];
  private samples: Sample[] = [];
  private configuration = new Configuration({ basePath: '/api' });
  private samplesApi = new SamplesApi(this.configuration);
  private measurementsApi = new SampleMeasurementsApi(this.configuration);
  private reportsApi = new SampleReportsApi(this.configuration);
  private patientReportsApi = new PatientReportsApi(this.configuration);

  configure(basePath?: string): void {
    const normalized = normalizeBasePath(basePath);
    if (this.configuration.basePath === normalized) {
      return;
    }

    this.configuration = new Configuration({ basePath: normalized });
    this.samplesApi = new SamplesApi(this.configuration);
    this.measurementsApi = new SampleMeasurementsApi(this.configuration);
    this.reportsApi = new SampleReportsApi(this.configuration);
    this.patientReportsApi = new PatientReportsApi(this.configuration);
    this.refresh();
  }

  subscribe(listener: Listener): () => void {
    this.listeners = [...this.listeners, listener];
    listener(this.listSamples());
    this.refresh();
    return () => {
      this.listeners = this.listeners.filter(current => current !== listener);
    };
  }

  listSamples(): Sample[] {
    return cloneSamples(this.samples);
  }

  async getSample(id: string): Promise<Sample | undefined> {
    try {
      const sample = fromApiSample(await this.samplesApi.getSample({ sampleId: id }));
      this.upsertSample(sample);
      return { ...sample };
    } catch (error) {
      if (error instanceof ResponseError && error.response.status === 404) {
        this.samples = this.samples.filter(sample => sample.id !== id);
        this.emit();
        return undefined;
      }
      throw new Error(await userFacingError(error));
    }
  }

  async createSample(draft: NewSampleDraft): Promise<Sample> {
    return this.saveReturnedSample(
      this.samplesApi.createSample({ newSample: toApiNewSample(draft) }),
    );
  }

  async updateDraftSample(id: string, draft: NewSampleDraft): Promise<boolean> {
    await this.saveReturnedSample(
      this.samplesApi.updateSample({ sampleId: id, newSample: toApiNewSample(draft) }),
    );
    return true;
  }

  async publishSample(id: string): Promise<boolean> {
    await this.saveReturnedSample(
      this.samplesApi.updateSampleStatus({
        sampleId: id,
        sampleStatusUpdate: { status: 'collected' },
      }),
    );
    return true;
  }

  async markTainted(id: string): Promise<void> {
    await this.updateSampleStatus(id, 'tainted');
  }

  async updateSampleStatus(id: string, status: SampleStatus): Promise<void> {
    await this.saveReturnedSample(
      this.samplesApi.updateSampleStatus({
        sampleId: id,
        sampleStatusUpdate: { status: status as ApiSampleStatus },
      }),
    );
  }

  async deleteSample(id: string): Promise<boolean> {
    try {
      await this.samplesApi.deleteSample({ sampleId: id });
      this.samples = this.samples.filter(sample => sample.id !== id);
      this.emit();
      return true;
    } catch (error) {
      if (error instanceof ResponseError && error.response.status === 409) {
        return false;
      }
      throw new Error(await userFacingError(error));
    }
  }

  async saveMeasurements(id: string, measurements: MeasurementValue[], _role?: 'technician' | 'diagnostician'): Promise<void> {
    await this.saveReturnedSample(
      this.measurementsApi.saveSampleMeasurements({
        sampleId: id,
        measurementValuesUpdate: { measurements: measurements.map(toApiMeasurement) },
      }),
    );
  }

  async saveReportDraft(
    id: string,
    reportData: Pick<DiagnosticReport, 'summary' | 'conclusion' | 'recommendations'>,
  ): Promise<void> {
    await this.saveReturnedSample(
      this.reportsApi.saveSampleReport({
        sampleId: id,
        reportDraft: {
          summary: reportData.summary,
          conclusion: reportData.conclusion,
          recommendations: reportData.recommendations,
        },
      }),
    );
  }

  async discardReport(id: string): Promise<void> {
    await this.saveReturnedSample(this.reportsApi.deleteSampleReport({ sampleId: id }));
  }

  async finalizeReport(id: string): Promise<boolean> {
    await this.saveReturnedSample(this.reportsApi.finalizeSampleReport({ sampleId: id }));
    return true;
  }

  previousReportsForPatient(patientId?: string, excludeSampleId?: string): Sample[] {
    if (!patientId) {
      return [];
    }
    return this
      .listSamples()
      .filter(sample =>
        sample.patientId === patientId &&
        sample.id !== excludeSampleId &&
        sample.status === 'finalized' &&
        sample.report,
      );
  }

  async fetchReportsForPatient(patientId: string): Promise<Sample[]> {
    if (!patientId.trim()) {
      return [];
    }

    try {
      const reports = (await this.patientReportsApi.getPatientReports({ patientId: patientId.trim() }))
        .map(fromApiSample);
      reports.forEach(report => this.upsertSample(report, false));
      this.emit();
      return reports;
    } catch (error) {
      if (error instanceof ResponseError && error.response.status === 404) {
        return [];
      }
      throw new Error(await userFacingError(error));
    }
  }

  finalizedPatientIds(): string[] {
    return Array.from(new Set(
      this.samples
        .filter(sample => sample.status === 'finalized' && sample.report && sample.patientId)
        .map(sample => sample.patientId),
    )).sort();
  }

  async refresh(): Promise<void> {
    try {
      const samples = await this.samplesApi.getSamples({ includeTainted: true });
      this.samples = samples.map(fromApiSample);
      this.emit();
    } catch (error) {
      console.error('Failed to load samples from backend', error);
    }
  }

  private async saveReturnedSample(request: Promise<ApiSample>): Promise<Sample> {
    try {
      const sample = fromApiSample(await request);
      this.upsertSample(sample);
      return sample;
    } catch (error) {
      throw new Error(await userFacingError(error));
    }
  }

  private upsertSample(sample: Sample, emit = true): void {
    const next = cloneSamples(this.samples);
    const index = next.findIndex(current => current.id === sample.id);
    if (index === -1) {
      this.samples = [sample, ...next];
    } else {
      next[index] = sample;
      this.samples = next;
    }
    if (emit) {
      this.emit();
    }
  }

  private emit(): void {
    const snapshot = this.listSamples();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

export const sampleStore = new SampleStore();
