import { Component, Event, EventEmitter, h, Prop, State, Watch } from '@stencil/core';
import {
  NewSampleDraft,
  SAMPLE_TEST_TYPES,
  createEmptyMeasurements,
  createNewSampleDraft,
  createSampleCode,
} from '../../domain/sample';

@Component({
  tag: 'mglm-sample-draft-form',
  shadow: false,
})
export class MglmSampleDraftForm {
  @Prop() draft: NewSampleDraft;
  @Prop() formTitle: string = 'Sample draft';
  @Prop() submitLabel: string = 'Save';
  @Prop() cancelLabel: string = 'Cancel';
  @Prop() description: string = 'The technician records sample metadata and selects required tests. Measured values are entered during diagnostics.';

  @Event() sampleDraftSubmit: EventEmitter<NewSampleDraft>;
  @Event() sampleDraftCancel: EventEmitter<void>;

  @State() private workingDraft: NewSampleDraft = createNewSampleDraft();

  componentWillLoad() {
    this.resetWorkingDraft();
  }

  @Watch('draft')
  protected resetWorkingDraft(): void {
    const source = this.draft || createNewSampleDraft();
    this.workingDraft = {
      ...source,
      testTypes: [...source.testTypes],
      measurements: source.measurements.map(measurement => ({ ...measurement })),
    };
  }

  render() {
    return (
      <form class="form" onSubmit={(ev: Event) => this.handleSubmit(ev)}>
        <div class="section-header compact">
          <div>
            <div class="section-title">
              <md-icon>assignment_add</md-icon>
              <h2>{this.formTitle}</h2>
            </div>
            <p>{this.description}</p>
          </div>
          <button type="button" class="icon-command" title="Close" onClick={() => this.sampleDraftCancel.emit()}>
            <md-icon>close</md-icon>
          </button>
        </div>

        <label>
          Patient name <span class="required-marker">*</span>
          <input
            required
            value={this.workingDraft.patientName}
            onInput={(ev: Event) => this.patchDraft({ patientName: (ev.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          Patient identifier <span class="required-marker">*</span>
          <input
            required
            value={this.workingDraft.patientId || ''}
            onInput={(ev: Event) => this.patchDraft({ patientId: (ev.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          Sample code <span class="required-marker">*</span>
          <span class="input-row">
            <input
              required
              value={this.workingDraft.sampleCode}
              onInput={(ev: Event) => this.patchDraft({ sampleCode: (ev.target as HTMLInputElement).value })}
            />
            <button
              type="button"
              class="icon-command"
              title="Generate sample code"
              onClick={() => this.patchDraft({ sampleCode: createSampleCode() })}
            >
              <md-icon>autorenew</md-icon>
            </button>
          </span>
        </label>

        <label>
          Collection time <span class="required-marker">*</span>
          <input
            required
            type="datetime-local"
            value={this.workingDraft.collectedAt}
            onInput={(ev: Event) => this.patchDraft({ collectedAt: (ev.target as HTMLInputElement).value })}
          />
        </label>

        <fieldset>
          <legend>Test types <span class="required-marker">*</span></legend>
          <div class="choice-grid">
            {SAMPLE_TEST_TYPES.map(testType => (
              <label class="choice">
                <input
                  type="checkbox"
                  checked={this.workingDraft.testTypes.includes(testType.code)}
                  onChange={() => this.toggleTest(testType.code)}
                />
                <span>
                  <strong>{testType.name}</strong>
                  {testType.description ? <small>{testType.description}</small> : undefined}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div class="actions">
          <md-outlined-button type="button" onClick={() => this.sampleDraftCancel.emit()}>
            <md-icon slot="icon">close</md-icon>
            {this.cancelLabel}
          </md-outlined-button>
          <md-filled-button type="submit">
            <md-icon slot="icon">save</md-icon>
            {this.submitLabel}
          </md-filled-button>
        </div>
      </form>
    );
  }

  private patchDraft(patch: Partial<NewSampleDraft>): void {
    this.workingDraft = {
      ...this.workingDraft,
      ...patch,
    };
  }

  private toggleTest(testTypeCode: string): void {
    const testTypes = this.workingDraft.testTypes.includes(testTypeCode)
      ? this.workingDraft.testTypes.filter(code => code !== testTypeCode)
      : [...this.workingDraft.testTypes, testTypeCode];

    const measurements = createEmptyMeasurements(testTypes).map(next => {
      const existing = this.workingDraft.measurements.find(current =>
        current.testTypeCode === next.testTypeCode && current.code === next.code
      );
      return existing || next;
    });

    this.workingDraft = {
      ...this.workingDraft,
      testTypes,
      measurements,
    };
  }

  private handleSubmit(ev: Event): void {
    ev.preventDefault();
    this.sampleDraftSubmit.emit({
      ...this.workingDraft,
      patientName: this.workingDraft.patientName.trim(),
      patientId: this.workingDraft.patientId?.trim() || '',
      sampleCode: this.workingDraft.sampleCode.trim(),
      testTypes: [...this.workingDraft.testTypes],
      measurements: this.workingDraft.measurements.map(measurement => ({ ...measurement })),
    });
  }
}
