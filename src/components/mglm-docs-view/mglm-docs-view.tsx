import { Component, h, State } from '@stencil/core';
import { Sample, formatDateTime, getTestTypeName } from '../../domain/sample';
import { sampleStore } from '../../services/sample-store';

@Component({
  tag: 'mglm-docs-view',
  shadow: false,
})
export class MglmDocsView {
  @State() private samples: Sample[] = [];
  @State() private selectedPatientId?: string;

  private unsubscribeStore?: () => void;

  componentWillLoad() {
    this.unsubscribeStore = sampleStore.subscribe(samples => {
      this.samples = samples;
      if (!this.selectedPatientId) {
        this.selectedPatientId = sampleStore.finalizedPatientIds()[0];
      }
    });
  }

  disconnectedCallback() {
    this.unsubscribeStore?.();
  }

  render() {
    const patientIds = sampleStore.finalizedPatientIds();
    const selectedPatientId = this.selectedPatientId || patientIds[0];
    const reports = this.finalizedReportsForPatient(selectedPatientId);

    return (
      <section class="view-grid docs-grid">
        <section class="panel">
          <div class="section-header">
            <div>
              <div class="section-title">
                <md-icon>folder_open</md-icon>
                <h2>Documentation</h2>
              </div>
              <p>Finalized reports grouped by patient identifier.</p>
            </div>
          </div>

          {patientIds.length === 0
            ? <div class="empty-state">No finalized patient documentation exists yet.</div>
            : (
              <div class="patient-tile-grid">
                {patientIds.map(patientId => {
                  const patientReports = this.finalizedReportsForPatient(patientId);
                  const firstReport = patientReports[0];
                  return (
                    <button
                      type="button"
                      class={selectedPatientId === patientId ? 'patient-tile selected' : 'patient-tile'}
                      onClick={() => this.selectedPatientId = patientId}
                    >
                      <md-icon>badge</md-icon>
                      <strong>{patientId}</strong>
                      <span>{firstReport?.patientName || 'Unknown patient'}</span>
                      <small>{patientReports.length} finalized report{patientReports.length === 1 ? '' : 's'}</small>
                    </button>
                  );
                })}
              </div>
            )}
        </section>

        <section class="panel">
          {selectedPatientId
            ? this.renderPatientReports(selectedPatientId, reports)
            : <div class="empty-state">Select a patient identifier.</div>}
        </section>
      </section>
    );
  }

  private renderPatientReports(patientId: string, reports: Sample[]) {
    return (
      <section class="docs-detail">
        <div class="section-header">
          <div>
            <div class="section-title">
              <md-icon>badge</md-icon>
              <h2>{patientId}</h2>
            </div>
            <p>Read-only finalized report history.</p>
          </div>
        </div>

        {reports.length === 0
          ? <div class="empty-state">No finalized reports found for this patient identifier.</div>
          : (
            <div class="docs-report-list">
              {reports.map(sample => (
                <article class="docs-report">
                  <div class="sample-card-main">
                    <div>
                      <h3>{sample.sampleCode}</h3>
                      <p>{sample.patientName}</p>
                    </div>
                    <span class="status status-finalized">Finalized</span>
                  </div>
                  <dl class="detail-grid">
                    <div>
                      <dt>Finalized</dt>
                      <dd>{formatDateTime(sample.report?.finalizedAt || sample.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt>Tests</dt>
                      <dd>{sample.testTypes.map(getTestTypeName).join(', ')}</dd>
                    </div>
                  </dl>
                  <div class="report-readonly">
                    <strong>Summary</strong>
                    <p>{sample.report?.summary}</p>
                    <strong>Conclusion</strong>
                    <p>{sample.report?.conclusion}</p>
                    {sample.report?.recommendations
                      ? [
                        <strong>Recommendations</strong>,
                        <p>{sample.report.recommendations}</p>,
                      ]
                      : undefined}
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    );
  }

  private finalizedReportsForPatient(patientId?: string): Sample[] {
    if (!patientId) {
      return [];
    }
    return this.samples.filter(sample =>
      sample.patientId === patientId &&
      sample.status === 'finalized' &&
      Boolean(sample.report),
    );
  }
}
