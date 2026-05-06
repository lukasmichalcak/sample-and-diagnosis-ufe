import {
  DiagnosticReport,
  MeasurementValue,
  NewSampleDraft,
  Sample,
  SampleStatus,
  createEmptyMeasurements,
  createSampleCode,
  fromDateTimeInputValue,
} from '../domain/sample';

type Listener = (samples: Sample[]) => void;

const now = () => new Date().toISOString();

function cloneSamples(samples: Sample[]): Sample[] {
  return samples.map(sample => ({
    ...sample,
    testTypes: [...sample.testTypes],
    measurements: sample.measurements.map(measurement => ({ ...measurement })),
    report: sample.report ? { ...sample.report } : undefined,
  }));
}

function seedSamples(): Sample[] {
  const createdAt = now();
  return [
    {
      id: 'sample-001',
      patientName: 'Juraj Prvy',
      patientId: 'P-1001',
      sampleCode: 'SMP-20260506-A1B2',
      collectedAt: new Date('2026-05-06T08:20:00').toISOString(),
      testTypes: ['crp', 'blood_count'],
      status: 'collected',
      measurements: [
        { testTypeCode: 'crp', code: 'crp_value', value: 18, unit: 'mg/L', enteredByRole: 'technician' },
        { testTypeCode: 'blood_count', code: 'wbc', value: '', unit: '10^9/L' },
        { testTypeCode: 'blood_count', code: 'hemoglobin', value: '', unit: 'g/L' },
      ],
      createdAt,
      updatedAt: createdAt,
      createdBy: 'Lab technician',
    },
    {
      id: 'sample-002',
      patientName: 'Eva Novakova',
      patientId: 'P-1002',
      sampleCode: 'SMP-20260506-C3D4',
      collectedAt: new Date('2026-05-06T09:05:00').toISOString(),
      testTypes: ['glucose'],
      status: 'in_diagnostics',
      measurements: [
        { testTypeCode: 'glucose', code: 'glucose_value', value: 6.1, unit: 'mmol/L', enteredByRole: 'technician' },
        { testTypeCode: 'glucose', code: 'fasting', value: true, enteredByRole: 'technician' },
      ],
      createdAt,
      updatedAt: createdAt,
      createdBy: 'Lab technician',
    },
    {
      id: 'sample-003',
      patientName: 'Martin Kral',
      patientId: 'P-1003',
      sampleCode: 'SMP-20260506-E5F6',
      collectedAt: new Date('2026-05-06T09:30:00').toISOString(),
      testTypes: ['covid_antigen'],
      status: 'report_draft',
      measurements: [
        { testTypeCode: 'covid_antigen', code: 'result', value: 'positive', enteredByRole: 'diagnostician' },
      ],
      report: {
        id: 'report-003',
        sampleId: 'sample-003',
        patientId: 'P-1003',
        summary: 'Antigen test is positive.',
        conclusion: 'Findings are consistent with acute viral infection.',
        recommendations: 'Repeat confirmation test if symptoms persist.',
        createdAt,
        updatedAt: createdAt,
        author: 'Diagnostician',
        status: 'draft',
      },
      createdAt,
      updatedAt: createdAt,
      createdBy: 'Lab technician',
    },
    {
      id: 'sample-004',
      patientName: 'Eva Novakova',
      patientId: 'P-1002',
      sampleCode: 'SMP-20260428-G7H8',
      collectedAt: new Date('2026-04-28T10:10:00').toISOString(),
      testTypes: ['glucose'],
      status: 'finalized',
      measurements: [
        { testTypeCode: 'glucose', code: 'glucose_value', value: 5.4, unit: 'mmol/L', enteredByRole: 'diagnostician' },
        { testTypeCode: 'glucose', code: 'fasting', value: true, enteredByRole: 'diagnostician' },
      ],
      report: {
        id: 'report-004',
        sampleId: 'sample-004',
        patientId: 'P-1002',
        summary: 'Glucose level within expected fasting range.',
        conclusion: 'No diagnostic escalation required.',
        createdAt,
        updatedAt: createdAt,
        finalizedAt: createdAt,
        author: 'Diagnostician',
        status: 'finalized',
      },
      createdAt,
      updatedAt: createdAt,
      createdBy: 'Lab technician',
      finalizedBy: 'Diagnostician',
    },
    {
      id: 'sample-005',
      patientName: 'Tomas Biely',
      patientId: 'P-1004',
      sampleCode: 'SMP-20260506-I9J0',
      collectedAt: new Date('2026-05-06T10:00:00').toISOString(),
      testTypes: ['urine_chemical'],
      status: 'tainted',
      measurements: createEmptyMeasurements(['urine_chemical']),
      createdAt,
      updatedAt: createdAt,
      createdBy: 'Lab technician',
    },
  ];
}

export class SampleStore {
  private samples = seedSamples();
  private listeners: Listener[] = [];
  private sequence = this.samples.length + 1;

  subscribe(listener: Listener): () => void {
    this.listeners = [...this.listeners, listener];
    listener(this.listSamples());
    return () => {
      this.listeners = this.listeners.filter(current => current !== listener);
    };
  }

  listSamples(): Sample[] {
    return cloneSamples(this.samples);
  }

  getSample(id: string): Sample | undefined {
    return cloneSamples(this.samples).find(sample => sample.id === id);
  }

  createSample(draft: NewSampleDraft): Sample {
    const timestamp = now();
    const sampleCode = draft.sampleCode.trim() || createSampleCode();
    const sample: Sample = {
      id: `sample-${String(this.sequence++).padStart(3, '0')}`,
      patientName: draft.patientName.trim(),
      patientId: draft.patientId?.trim() || undefined,
      sampleCode,
      collectedAt: fromDateTimeInputValue(draft.collectedAt),
      testTypes: [...draft.testTypes],
      status: 'draft',
      measurements: draft.measurements.map(measurement => ({
        ...measurement,
        enteredByRole: undefined,
        measuredAt: undefined,
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: 'Lab technician',
    };

    this.samples = [sample, ...this.samples];
    this.emit();
    return { ...sample };
  }

  updateDraftSample(id: string, draft: NewSampleDraft): boolean {
    let updated = false;
    this.samples = this.samples.map(sample => {
      if (sample.id !== id || sample.status !== 'draft') {
        return sample;
      }

      updated = true;
      return {
        ...sample,
        patientName: draft.patientName.trim(),
        patientId: draft.patientId?.trim() || undefined,
        sampleCode: draft.sampleCode.trim() || sample.sampleCode,
        collectedAt: fromDateTimeInputValue(draft.collectedAt),
        testTypes: [...draft.testTypes],
        measurements: draft.measurements.map(measurement => ({
          ...measurement,
          enteredByRole: undefined,
          measuredAt: undefined,
        })),
        updatedAt: now(),
      };
    });

    if (updated) {
      this.emit();
    }
    return updated;
  }

  publishSample(id: string): boolean {
    let published = false;
    this.samples = this.samples.map(sample => {
      if (sample.id !== id || sample.status !== 'draft') {
        return sample;
      }

      published = true;
      return {
        ...sample,
        status: 'collected',
        updatedAt: now(),
      };
    });

    if (published) {
      this.emit();
    }
    return published;
  }

  updateSampleStatus(id: string, status: SampleStatus): void {
    this.samples = this.samples.map(sample =>
      sample.id === id
        ? {
            ...sample,
            status,
            updatedAt: now(),
          }
        : sample,
    );
    this.emit();
  }

  markTainted(id: string): void {
    this.updateSampleStatus(id, 'tainted');
  }

  deleteSample(id: string): boolean {
    const sample = this.samples.find(current => current.id === id);
    if (!sample || sample.status === 'finalized') {
      return false;
    }
    this.samples = this.samples.filter(current => current.id !== id);
    this.emit();
    return true;
  }

  saveMeasurements(id: string, measurements: MeasurementValue[], role: 'technician' | 'diagnostician'): void {
    this.samples = this.samples.map(sample =>
      sample.id === id
        ? {
            ...sample,
            status: sample.status === 'collected' && role === 'diagnostician' ? 'in_diagnostics' : sample.status,
            measurements: measurements.map(measurement => ({
              ...measurement,
              enteredByRole: measurement.enteredByRole || role,
              measuredAt: measurement.measuredAt || now(),
            })),
            updatedAt: now(),
          }
        : sample,
    );
    this.emit();
  }

  saveReportDraft(id: string, reportData: Pick<DiagnosticReport, 'summary' | 'conclusion' | 'recommendations'>): void {
    const timestamp = now();
    this.samples = this.samples.map(sample => {
      if (sample.id !== id || sample.status === 'finalized') {
        return sample;
      }

      const report: DiagnosticReport = {
        id: sample.report?.id || `report-${sample.id}`,
        sampleId: sample.id,
        patientId: sample.patientId,
        summary: reportData.summary,
        conclusion: reportData.conclusion,
        recommendations: reportData.recommendations,
        createdAt: sample.report?.createdAt || timestamp,
        updatedAt: timestamp,
        author: sample.report?.author || 'Diagnostician',
        status: 'draft',
      };

      return {
        ...sample,
        status: 'report_draft',
        report,
        updatedAt: timestamp,
      };
    });
    this.emit();
  }

  discardReport(id: string): void {
    this.samples = this.samples.map(sample =>
      sample.id === id && sample.status === 'report_draft'
        ? {
            ...sample,
            status: 'in_diagnostics',
            report: undefined,
            updatedAt: now(),
          }
        : sample,
    );
    this.emit();
  }

  finalizeReport(id: string): boolean {
    const timestamp = now();
    let finalized = false;
    this.samples = this.samples.map(sample => {
      if (sample.id !== id || !sample.report || sample.status === 'finalized') {
        return sample;
      }

      finalized = true;
      return {
        ...sample,
        status: 'finalized',
        finalizedBy: 'Diagnostician',
        report: {
          ...sample.report,
          status: 'finalized',
          finalizedAt: timestamp,
          updatedAt: timestamp,
        },
        updatedAt: timestamp,
      };
    });
    this.emit();
    return finalized;
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

  finalizedPatientIds(): string[] {
    return Array.from(new Set(
      this.samples
        .filter(sample => sample.status === 'finalized' && sample.report && sample.patientId)
        .map(sample => sample.patientId),
    )).sort();
  }

  private emit(): void {
    const snapshot = this.listSamples();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

export const sampleStore = new SampleStore();
