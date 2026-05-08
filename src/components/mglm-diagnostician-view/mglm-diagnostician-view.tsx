import { Component, h, State } from '@stencil/core';
import {
  DiagnosticReport,
  MeasurementValue,
  SAMPLE_STATUS_LABELS,
  Sample,
  areRequiredMeasurementsComplete,
  formatDateTime,
  getTestTypeName,
} from '../../domain/sample';
import { showAppAlert, showAppConfirm } from '../../services/app-dialog';
import { sampleStore } from '../../services/sample-store';

type ReportDraft = Pick<DiagnosticReport, 'summary' | 'conclusion' | 'recommendations'>;

@Component({
  tag: 'mglm-diagnostician-view',
  shadow: false,
})
export class MglmDiagnosticianView {
  @State() private samples: Sample[] = [];
  @State() private selectedSampleId?: string;
  @State() private measurementDraft: MeasurementValue[] = [];
  @State() private reportQueryPatientId = '';
  @State() private reportDraft: ReportDraft = {
    summary: '',
    conclusion: '',
    recommendations: '',
  };

  private unsubscribeStore?: () => void;

  componentWillLoad() {
    this.unsubscribeStore = sampleStore.subscribe(samples => {
      this.samples = samples;
      if (!this.selectedSampleId) {
        const first = this.findFirstQueuedSample(samples);
        if (first) {
          this.selectDiagnosticSample(first);
        }
      }
    });
  }

  disconnectedCallback() {
    this.unsubscribeStore?.();
  }

  render() {
    const queue = this.samples.filter(sample =>
      sample.status === 'collected' ||
      sample.status === 'in_diagnostics' ||
      sample.status === 'report_draft'
    );
    const selected = this.selectedSampleId
      ? this.samples.find(sample => sample.id === this.selectedSampleId)
      : undefined;

    return (
      <section class="view-grid diagnostics-grid">
        <section class="panel">
          <div class="section-header">
            <div>
              <div class="section-title">
                <md-icon>pending_actions</md-icon>
                <h2>Diagnostics queue</h2>
              </div>
              <p>Collected means not started; in diagnostics means measured values were saved.</p>
            </div>
          </div>

          {queue.length === 0
            ? <div class="empty-state">No samples are waiting for diagnostics.</div>
            : (
              <div class="queue-list">
                {queue.map(sample => (
                  <button
                    type="button"
                    class={selected?.id === sample.id ? 'queue-item selected' : 'queue-item'}
                    onClick={() => this.selectDiagnosticSample(sample)}
                  >
                    <span>{sample.sampleCode}</span>
                    <small>{sample.patientName}</small>
                    <em>{SAMPLE_STATUS_LABELS[sample.status]}</em>
                  </button>
                ))}
              </div>
            )}

          {this.renderPatientReportQuery()}
        </section>

        <section class="panel">
          {selected ? this.renderDiagnosticEditor(selected) : <div class="empty-state">Select a sample.</div>}
        </section>
      </section>
    );
  }

  private renderDiagnosticEditor(sample: Sample) {
    const measurementsComplete = areRequiredMeasurementsComplete(this.measurementDraft);
    const measurementsSaved = measurementsComplete && this.areMeasurementsSaved(sample);
    const previousReports = sampleStore.previousReportsForPatient(sample.patientId, sample.id);
    return (
      <div class="diagnostic-editor">
        <div class="section-header">
          <div>
            <div class="section-title">
              <md-icon>biotech</md-icon>
              <h2>{sample.sampleCode}</h2>
            </div>
            <p>{sample.patientName} {sample.patientId ? `(${sample.patientId})` : ''}</p>
          </div>
          <span class={`status status-${sample.status}`}>{SAMPLE_STATUS_LABELS[sample.status]}</span>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>Collected</dt>
            <dd>{formatDateTime(sample.collectedAt)}</dd>
          </div>
          <div>
            <dt>Tests</dt>
            <dd>{sample.testTypes.map(getTestTypeName).join(', ')}</dd>
          </div>
        </dl>

        <mglm-measurements-editor
          measurements={this.measurementDraft}
          role="diagnostician"
          onMeasurementsChanged={(ev: CustomEvent<MeasurementValue[]>) => this.measurementDraft = ev.detail}
        ></mglm-measurements-editor>

        <div class="actions">
          <md-filled-tonal-button
            disabled={!measurementsComplete}
            onClick={() => this.saveDiagnosticMeasurements(sample)}
          >
            <md-icon slot="icon">fact_check</md-icon>
            Save values
          </md-filled-tonal-button>
        </div>

        <md-divider></md-divider>

        {measurementsSaved
          ? [
            this.renderPreviousReports(previousReports, sample.patientId),
            <mglm-report-editor
              reportDraft={this.reportDraft}
              canDiscard={sample.status === 'report_draft'}
              onReportDraftChanged={(ev: CustomEvent<ReportDraft>) => this.reportDraft = ev.detail}
              onReportPreliminarySaved={() => this.saveReportDraft(sample)}
              onReportPreliminaryDiscarded={() => this.confirmDiscardReport(sample)}
              onReportFinalized={() => this.confirmFinalizeReport(sample)}
            ></mglm-report-editor>,
          ]
          : (
            <div class="empty-state">
              Complete all required measured values and save them before comparing previous reports or preparing a diagnostic report.
            </div>
          )}
      </div>
    );
  }

  private renderPreviousReports(previousReports: Sample[], patientId?: string) {
    return (
      <section>
        <div class="section-title compact-title">
          <md-icon>history</md-icon>
          <h3>Previous finalized reports</h3>
        </div>
        <p class="helper-text">
          Matching uses patient identifier{patientId ? ` ${patientId}` : ''}. Patient names are not used as identifiers.
        </p>
        {previousReports.length === 0
          ? <div class="empty-state compact">No previous finalized reports found for this patient identifier.</div>
          : (
            <div class="previous-list">
              {previousReports.map(previous => (
                <article>
                  <strong>{formatDateTime(previous.report?.finalizedAt || previous.updatedAt)}</strong>
                  <span>{previous.report?.conclusion}</span>
                </article>
              ))}
            </div>
          )}
      </section>
    );
  }

  private renderPatientReportQuery() {
    const reports = sampleStore.previousReportsForPatient(this.reportQueryPatientId || undefined);
    return (
      <section class="query-box">
        <div class="section-title compact-title">
          <md-icon>manage_search</md-icon>
          <h3>Finalized report query</h3>
        </div>
        <p class="helper-text">Search by patient identifier. Names are display text only.</p>
        <label>
          Patient identifier
          <input
            value={this.reportQueryPatientId}
            onInput={(ev: Event) => this.reportQueryPatientId = (ev.target as HTMLInputElement).value}
          />
        </label>
        {this.reportQueryPatientId.trim().length === 0
          ? <div class="empty-state compact">Enter a patient identifier to search finalized reports.</div>
          : reports.length === 0
            ? <div class="empty-state compact">No finalized reports found.</div>
            : (
              <div class="previous-list">
                {reports.map(reportSample => (
                  <article>
                    <strong>{reportSample.patientName} · {formatDateTime(reportSample.report?.finalizedAt || reportSample.updatedAt)}</strong>
                    <span>{reportSample.report?.conclusion}</span>
                  </article>
                ))}
              </div>
            )}
      </section>
    );
  }

  private findFirstQueuedSample(samples: Sample[]): Sample | undefined {
    return samples.find(sample =>
      sample.status === 'collected' ||
      sample.status === 'in_diagnostics' ||
      sample.status === 'report_draft'
    );
  }

  private selectDiagnosticSample(sample: Sample): void {
    this.selectedSampleId = sample.id;
    this.measurementDraft = sample.measurements.map(measurement => ({ ...measurement }));
    this.reportDraft = {
      summary: sample.report?.summary || '',
      conclusion: sample.report?.conclusion || '',
      recommendations: sample.report?.recommendations || '',
    };
  }

  private async saveDiagnosticMeasurements(sample: Sample): Promise<void> {
    if (!areRequiredMeasurementsComplete(this.measurementDraft)) {
      await showAppAlert('Complete all required measured values before saving.');
      return;
    }
    try {
      await sampleStore.saveMeasurements(sample.id, this.measurementDraft, 'diagnostician');
    } catch (error) {
      this.showError(error);
    }
  }

  private async saveReportDraft(sample: Sample): Promise<void> {
    if (!this.reportDraft.summary.trim() || !this.reportDraft.conclusion.trim()) {
      await showAppAlert('Summary and conclusion are required before saving a preliminary report.');
      return;
    }
    try {
      await sampleStore.saveReportDraft(sample.id, this.reportDraft);
    } catch (error) {
      this.showError(error);
    }
  }

  private async confirmDiscardReport(sample: Sample): Promise<void> {
    if (await showAppConfirm(`Discard preliminary report for sample ${sample.sampleCode}?`)) {
      try {
        await sampleStore.discardReport(sample.id);
        const updatedSample = await sampleStore.getSample(sample.id);
        if (updatedSample) {
          this.selectDiagnosticSample(updatedSample);
        }
      } catch (error) {
        this.showError(error);
      }
    }
  }

  private async confirmFinalizeReport(sample: Sample): Promise<void> {
    if (!areRequiredMeasurementsComplete(this.measurementDraft)) {
      await showAppAlert('Complete all required measured values before finalizing.');
      return;
    }

    if (!sample.report && (!this.reportDraft.summary.trim() || !this.reportDraft.conclusion.trim())) {
      await showAppAlert('Create a preliminary report before finalizing.');
      return;
    }

    if (!sample.report) {
      try {
        await sampleStore.saveReportDraft(sample.id, this.reportDraft);
      } catch (error) {
        this.showError(error);
        return;
      }
    }

    if (await showAppConfirm(`Finalize report for sample ${sample.sampleCode}? Finalized reports cannot be deleted.`)) {
      try {
        await sampleStore.finalizeReport(sample.id);
        this.selectedSampleId = undefined;
      } catch (error) {
        this.showError(error);
      }
    }
  }

  private areMeasurementsSaved(sample: Sample): boolean {
    if (sample.status === 'collected') {
      return false;
    }

    const normalize = (measurements: MeasurementValue[]) =>
      measurements.map(measurement => ({
        testTypeCode: measurement.testTypeCode,
        code: measurement.code,
        value: measurement.value,
      }));

    return JSON.stringify(normalize(sample.measurements)) === JSON.stringify(normalize(this.measurementDraft));
  }

  private showError(error: unknown): void {
    showAppAlert(error instanceof Error ? error.message : 'Backend request failed.', 'Request failed');
  }
}
