import { Component, Host, Prop, State, h } from '@stencil/core';
import { UserRole } from '../../domain/sample';
import { sampleStore } from '../../services/sample-store';

@Component({
  tag: 'mglm-sample-and-diagnosis-test-app',
  styleUrl: 'mglm-sample-and-diagnosis-test-app.css',
  shadow: true,
})
export class MglmSampleAndDiagnosisTestApp {
  @Prop() basePath: string = '';
  @Prop() apiBase: string;
  @Prop() sampleAndDiagnosisId: string;

  @State() private activeRole: UserRole = 'technician';

  componentWillLoad() {
    sampleStore.configure(this.apiBase);
  }

  render() {
    return (
      <Host>
        <div class="app-shell">
          {this.renderTopNav()}
          <main>{this.renderActiveView()}</main>
        </div>
      </Host>
    );
  }

  private renderTopNav() {
    return (
      <header class="top-bar">
        <div>
          <h1>Sample and Diagnosis</h1>
          <p>Local UFE workflow prototype</p>
        </div>
        <nav aria-label="Role navigation">
          <button
            class={this.activeRole === 'technician' ? 'role-button active' : 'role-button'}
            type="button"
            onClick={() => this.activeRole = 'technician'}
          >
            <md-icon>biotech</md-icon>
            <span>Technician</span>
          </button>
          <button
            class={this.activeRole === 'diagnostician' ? 'role-button active' : 'role-button'}
            type="button"
            onClick={() => this.activeRole = 'diagnostician'}
          >
            <md-icon>clinical_notes</md-icon>
            <span>Diagnostician</span>
          </button>
          <button
            class={this.activeRole === 'docs' ? 'role-button active' : 'role-button'}
            type="button"
            onClick={() => this.activeRole = 'docs'}
          >
            <md-icon>folder_open</md-icon>
            <span>Docs</span>
          </button>
        </nav>
      </header>
    );
  }

  private renderActiveView() {
    if (this.activeRole === 'diagnostician') {
      return <mglm-diagnostician-view></mglm-diagnostician-view>;
    }

    if (this.activeRole === 'docs') {
      return <mglm-docs-view></mglm-docs-view>;
    }

    return <mglm-technician-view></mglm-technician-view>;
  }
}
