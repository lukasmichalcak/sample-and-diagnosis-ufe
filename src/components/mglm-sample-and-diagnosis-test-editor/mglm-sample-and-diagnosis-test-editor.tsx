import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'mglm-sample-and-diagnosis-test-editor',
  styleUrl: 'mglm-sample-and-diagnosis-test-editor.css',
  shadow: true,
})
export class MglmSampleAndDiagnosisTestEditor {
  @Prop() entryId: string;
  @Prop() sampleAndDiagnosisId: string;
  @Prop() apiBase: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  render() {
    return (
      <Host>
        <div class="legacy-placeholder">
          <md-icon>info</md-icon>
          <strong>Legacy test-list editor</strong>
          <p>The generated API no longer contains the old waiting-list entry model. Use the active role-based workflow instead.</p>
          <md-outlined-button onClick={() => this.editorClosed.emit('cancel')}>Close</md-outlined-button>
        </div>
      </Host>
    );
  }
}
