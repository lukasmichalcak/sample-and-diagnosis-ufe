import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'mglm-sample-and-diagnosis-test-list',
  styleUrl: 'mglm-sample-and-diagnosis-test-list.css',
  shadow: true,
})
export class MglmSampleAndDiagnosisTestList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() sampleAndDiagnosisId: string;

  render() {
    return (
      <Host>
        <div class="legacy-placeholder">
          <md-icon>info</md-icon>
          <strong>Legacy test-list component</strong>
          <p>The active workflow uses technician, diagnostician, and docs views. This component is kept only for old tag compatibility.</p>
        </div>
      </Host>
    );
  }
}
