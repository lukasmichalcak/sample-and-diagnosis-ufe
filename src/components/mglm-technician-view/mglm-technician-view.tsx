import { Component, h, State } from '@stencil/core';
import {
  NewSampleDraft,
  SAMPLE_STATUS_LABELS,
  Sample,
  createNewSampleDraft,
  formatDateTime,
  getTestTypeName,
  toDateTimeInputValue,
} from '../../domain/sample';
import { showAppAlert, showAppConfirm } from '../../services/app-dialog';
import { sampleStore } from '../../services/sample-store';

@Component({
  tag: 'mglm-technician-view',
  shadow: false,
})
export class MglmTechnicianView {
  @State() private samples: Sample[] = [];
  @State() private showTainted = false;
  @State() private createExpanded = false;
  @State() private editingSampleId?: string;
  @State() private editSample?: NewSampleDraft;
  @State() private newSample: NewSampleDraft = createNewSampleDraft();

  private unsubscribeStore?: () => void;

  componentWillLoad() {
    this.unsubscribeStore = sampleStore.subscribe(samples => {
      this.samples = samples;
    });
  }

  disconnectedCallback() {
    this.unsubscribeStore?.();
  }

  render() {
    const visibleSamples = this.samples
      .filter(sample => sample.status !== 'finalized')
      .filter(sample => this.showTainted || sample.status !== 'tainted');

    return (
      <section class="view-grid">
        {this.createExpanded
          ? (
            <section class="panel">
              <mglm-sample-draft-form
                draft={this.newSample}
                formTitle="New taken sample"
                submitLabel="Create draft"
                cancelLabel="Cancel"
                onSampleDraftSubmit={(ev: CustomEvent<NewSampleDraft>) => this.createSample(ev.detail)}
                onSampleDraftCancel={() => this.closeCreateForm()}
              ></mglm-sample-draft-form>
            </section>
          )
          : undefined}

        <section class="panel">
          <div class="section-header">
            <div>
              <div class="section-title">
                <md-icon>science</md-icon>
                <h2>Technician samples</h2>
              </div>
              <p>Drafts can be edited. Saved samples move to the diagnostics queue.</p>
            </div>
            {!this.createExpanded
              ? (
                <md-filled-button onClick={() => this.openCreateForm()}>
                  <md-icon slot="icon">add</md-icon>
                  New sample
                </md-filled-button>
              )
              : undefined}
          </div>

          <label class="inline-control">
            <input
              type="checkbox"
              checked={this.showTainted}
              onChange={(ev: Event) => this.showTainted = (ev.target as HTMLInputElement).checked}
            />
            Show tainted samples
          </label>

          {visibleSamples.length === 0
            ? <div class="empty-state">No samples match the current filter.</div>
            : <div class="sample-list">{visibleSamples.map(sample => this.renderSample(sample))}</div>}
        </section>
      </section>
    );
  }

  private renderSample(sample: Sample) {
    if (this.editingSampleId === sample.id && this.editSample) {
      return (
        <article class="sample-card">
          <mglm-sample-draft-form
            draft={this.editSample}
            formTitle="Edit sample draft"
            submitLabel="Save changes"
            cancelLabel="Cancel"
            onSampleDraftSubmit={(ev: CustomEvent<NewSampleDraft>) => this.saveDraftEdits(sample, ev.detail)}
            onSampleDraftCancel={() => this.cancelDraftEdit()}
          ></mglm-sample-draft-form>
        </article>
      );
    }

    return (
      <article class="sample-card">
        <div class="sample-card-main">
          <div>
            <h3>{sample.sampleCode}</h3>
            <p>{sample.patientName}</p>
          </div>
          <span class={`status status-${sample.status}`}>{SAMPLE_STATUS_LABELS[sample.status]}</span>
        </div>
        <dl>
          <div>
            <dt>Collected</dt>
            <dd>{formatDateTime(sample.collectedAt)}</dd>
          </div>
          <div>
            <dt>Tests</dt>
            <dd>{sample.testTypes.map(getTestTypeName).join(', ')}</dd>
          </div>
        </dl>
        <div class="card-actions">
          {sample.status === 'draft'
            ? [
              <md-outlined-button onClick={() => this.startDraftEdit(sample)}>
                <md-icon slot="icon">edit</md-icon>
                Edit
              </md-outlined-button>,
              <md-filled-button onClick={() => this.confirmPublishSample(sample)}>
                <md-icon slot="icon">save</md-icon>
                Save
              </md-filled-button>,
            ]
            : undefined}
          {sample.status !== 'tainted'
            ? (
              <md-outlined-button onClick={() => this.confirmMarkTainted(sample)}>
                <md-icon slot="icon">warning</md-icon>
                Mark tainted
              </md-outlined-button>
            )
            : undefined}
          <md-filled-tonal-button
            disabled={sample.status === 'finalized'}
            onClick={() => this.confirmDeleteSample(sample)}
          >
            <md-icon slot="icon">delete</md-icon>
            Delete
          </md-filled-tonal-button>
        </div>
      </article>
    );
  }

  private openCreateForm(): void {
    this.createExpanded = true;
    this.cancelDraftEdit();
  }

  private closeCreateForm(): void {
    this.createExpanded = false;
    this.newSample = createNewSampleDraft();
  }

  private async createSample(draft: NewSampleDraft): Promise<void> {
    if (!await this.isValidDraft(draft)) {
      return;
    }
    try {
      await sampleStore.createSample(draft);
      this.newSample = createNewSampleDraft();
      this.createExpanded = false;
    } catch (error) {
      this.showError(error);
    }
  }

  private async saveDraftEdits(sample: Sample, draft: NewSampleDraft): Promise<void> {
    if (!await this.isValidDraft(draft)) {
      return;
    }
    try {
      await sampleStore.updateDraftSample(sample.id, draft);
      this.cancelDraftEdit();
    } catch (error) {
      this.showError(error);
    }
  }

  private async isValidDraft(draft: NewSampleDraft): Promise<boolean> {
    if (!draft.patientName.trim()) {
      await showAppAlert('Patient name is required.');
      return false;
    }
    if (!draft.patientId?.trim()) {
      await showAppAlert('Patient identifier is required.');
      return false;
    }
    if (!draft.sampleCode.trim()) {
      await showAppAlert('Sample code is required.');
      return false;
    }
    if (draft.testTypes.length === 0) {
      await showAppAlert('Select at least one test type.');
      return false;
    }
    return true;
  }

  private startDraftEdit(sample: Sample): void {
    if (sample.status !== 'draft') {
      return;
    }
    this.createExpanded = false;
    this.editingSampleId = sample.id;
    this.editSample = this.sampleToDraft(sample);
  }

  private cancelDraftEdit(): void {
    this.editingSampleId = undefined;
    this.editSample = undefined;
  }

  private sampleToDraft(sample: Sample): NewSampleDraft {
    return {
      patientName: sample.patientName,
      patientId: sample.patientId || '',
      sampleCode: sample.sampleCode,
      collectedAt: toDateTimeInputValue(new Date(sample.collectedAt)),
      testTypes: [...sample.testTypes],
      measurements: sample.measurements.map(measurement => ({ ...measurement })),
    };
  }

  private async confirmPublishSample(sample: Sample): Promise<void> {
    if (await showAppConfirm(`Save sample ${sample.sampleCode} for diagnostics? The technician will no longer be able to edit it.`)) {
      try {
        await sampleStore.publishSample(sample.id);
        this.cancelDraftEdit();
      } catch (error) {
        this.showError(error);
      }
    }
  }

  private async confirmMarkTainted(sample: Sample): Promise<void> {
    if (await showAppConfirm(`Mark sample ${sample.sampleCode} as tainted?`)) {
      try {
        await sampleStore.markTainted(sample.id);
      } catch (error) {
        this.showError(error);
      }
    }
  }

  private async confirmDeleteSample(sample: Sample): Promise<void> {
    if (!await showAppConfirm(`Delete sample ${sample.sampleCode}? This cannot be undone unless you are an admin (in MongoDB).`)) {
      return;
    }
    try {
      if (!await sampleStore.deleteSample(sample.id)) {
        await showAppAlert('Finalized samples cannot be deleted.');
      }
    } catch (error) {
      this.showError(error);
    }
  }

  private showError(error: unknown): void {
    showAppAlert(error instanceof Error ? error.message : 'Backend request failed.', 'Request failed');
  }
}
