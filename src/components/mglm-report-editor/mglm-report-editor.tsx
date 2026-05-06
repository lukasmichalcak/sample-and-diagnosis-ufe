import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { DiagnosticReport } from '../../domain/sample';

export type ReportDraft = Pick<DiagnosticReport, 'summary' | 'conclusion' | 'recommendations'>;

@Component({
  tag: 'mglm-report-editor',
  shadow: false,
})
export class MglmReportEditor {
  @Prop() reportDraft: ReportDraft = {
    summary: '',
    conclusion: '',
    recommendations: '',
  };
  @Prop() canDiscard: boolean = false;

  @Event() reportDraftChanged: EventEmitter<ReportDraft>;
  @Event() reportPreliminarySaved: EventEmitter<void>;
  @Event() reportPreliminaryDiscarded: EventEmitter<void>;
  @Event() reportFinalized: EventEmitter<void>;

  render() {
    return (
      <section class="report-section">
        <h3>Diagnostic report</h3>
        <label>
          Summary <span class="required-marker">*</span>
          <textarea
            value={this.reportDraft.summary}
            onInput={(ev: Event) => this.patchReport({ summary: (ev.target as HTMLTextAreaElement).value })}
          ></textarea>
        </label>
        <label>
          Conclusion <span class="required-marker">*</span>
          <textarea
            value={this.reportDraft.conclusion}
            onInput={(ev: Event) => this.patchReport({ conclusion: (ev.target as HTMLTextAreaElement).value })}
          ></textarea>
        </label>
        <label>
          Recommendations
          <textarea
            value={this.reportDraft.recommendations || ''}
            onInput={(ev: Event) => this.patchReport({ recommendations: (ev.target as HTMLTextAreaElement).value })}
          ></textarea>
        </label>

        <div class="actions">
          <md-outlined-button
            disabled={!this.canDiscard}
            onClick={() => this.reportPreliminaryDiscarded.emit()}
          >
            <md-icon slot="icon">delete</md-icon>
            Discard preliminary
          </md-outlined-button>
          <md-filled-tonal-button onClick={() => this.reportPreliminarySaved.emit()}>
            Save preliminary
          </md-filled-tonal-button>
          <md-filled-button onClick={() => this.reportFinalized.emit()}>
            <md-icon slot="icon">verified</md-icon>
            Finalize
          </md-filled-button>
        </div>
      </section>
    );
  }

  private patchReport(patch: Partial<ReportDraft>): void {
    this.reportDraftChanged.emit({
      ...this.reportDraft,
      ...patch,
    });
  }
}
