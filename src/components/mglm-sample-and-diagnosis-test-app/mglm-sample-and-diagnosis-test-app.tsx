import { Component, Host, Prop, State, h } from '@stencil/core';
import { UserRole } from '../../domain/sample';
import { AppDialogRequest, closeAppDialog, subscribeAppDialog } from '../../services/app-dialog';
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
  @State() private dialogRequest?: AppDialogRequest;

  private unsubscribeDialog?: () => void;

  componentWillLoad() {
    sampleStore.configure(this.apiBase);
    this.unsubscribeDialog = subscribeAppDialog(request => {
      this.dialogRequest = request ? { ...request } : undefined;
    });
  }

  disconnectedCallback() {
    this.unsubscribeDialog?.();
  }

  render() {
    return (
      <Host>
        <div class="app-shell">
          {this.renderTopNav()}
          <main>{this.renderActiveView()}</main>
          {this.renderAppDialog()}
        </div>
      </Host>
    );
  }

  private renderTopNav() {
    return (
      <header class="top-bar">
        <div>
          <h1>Sample and Diagnosis</h1>
          <p>A unified place for Lab Technicians and Diagnosticians to conduct their work</p>
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

  private renderAppDialog() {
    const dialog = this.dialogRequest;
    if (!dialog) {
      return undefined;
    }

    return (
      <md-dialog
        class="app-dialog"
        open
        type={dialog.kind === 'alert' ? 'alert' : undefined}
        onCancel={(ev: Event) => {
          ev.preventDefault();
          closeAppDialog(dialog.id, false);
        }}
      >
        <div slot="headline" class="dialog-title">
          <md-icon>{dialog.icon}</md-icon>
          <span>{dialog.title}</span>
        </div>
        <div slot="content" class="dialog-message">{dialog.message}</div>
        <div slot="actions" class="dialog-actions">
          {dialog.cancelLabel
            ? (
              <md-outlined-button onClick={() => closeAppDialog(dialog.id, false)}>
                {dialog.cancelLabel}
              </md-outlined-button>
            )
            : undefined}
          <md-filled-button autofocus onClick={() => closeAppDialog(dialog.id, true)}>
            {dialog.confirmLabel}
          </md-filled-button>
        </div>
      </md-dialog>
    );
  }
}
