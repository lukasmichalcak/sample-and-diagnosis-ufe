import { newSpecPage } from '@stencil/core/testing';
import { MglmDiagnosticianView } from '../../mglm-diagnostician-view/mglm-diagnostician-view';
import { MglmDocsView } from '../../mglm-docs-view/mglm-docs-view';
import { MglmMeasurementsEditor } from '../../mglm-measurements-editor/mglm-measurements-editor';
import { MglmReportEditor } from '../../mglm-report-editor/mglm-report-editor';
import { MglmSampleDraftForm } from '../../mglm-sample-draft-form/mglm-sample-draft-form';
import { MglmTechnicianView } from '../../mglm-technician-view/mglm-technician-view';
import { MglmSampleAndDiagnosisTestApp } from '../mglm-sample-and-diagnosis-test-app';

const workflowComponents = [
  MglmSampleAndDiagnosisTestApp,
  MglmTechnicianView,
  MglmDiagnosticianView,
  MglmDocsView,
  MglmSampleDraftForm,
  MglmMeasurementsEditor,
  MglmReportEditor,
];

describe('mglm-sample-and-diagnosis-test-app', () => {
  it('renders the technician workflow by default', async () => {
    const page = await newSpecPage({
      components: workflowComponents,
      html: `<mglm-sample-and-diagnosis-test-app></mglm-sample-and-diagnosis-test-app>`,
    });

    await page.waitForChanges();

    const activeRole = page.root.shadowRoot.querySelector('.role-button.active span');
    const heading = page.root.shadowRoot.querySelector('main h2');
    const cards = page.root.shadowRoot.querySelectorAll('.sample-card');

    expect(activeRole?.textContent).toEqual('Technician');
    expect(heading?.textContent).toEqual('Technician samples');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('switches to the diagnostician workflow', async () => {
    const page = await newSpecPage({
      components: workflowComponents,
      html: `<mglm-sample-and-diagnosis-test-app></mglm-sample-and-diagnosis-test-app>`,
    });

    const roleButtons = page.root.shadowRoot.querySelectorAll('.role-button');
    (roleButtons[1] as HTMLButtonElement).click();
    await page.waitForChanges();

    const activeRole = page.root.shadowRoot.querySelector('.role-button.active span');
    const heading = page.root.shadowRoot.querySelector('main h2');
    const queueItems = page.root.shadowRoot.querySelectorAll('.queue-item');

    expect(activeRole?.textContent).toEqual('Diagnostician');
    expect(heading?.textContent).toEqual('Diagnostics queue');
    expect(queueItems.length).toBeGreaterThan(0);
  });

  it('switches to the docs workflow', async () => {
    const page = await newSpecPage({
      components: workflowComponents,
      html: `<mglm-sample-and-diagnosis-test-app></mglm-sample-and-diagnosis-test-app>`,
    });

    const roleButtons = page.root.shadowRoot.querySelectorAll('.role-button');
    (roleButtons[2] as HTMLButtonElement).click();
    await page.waitForChanges();

    const activeRole = page.root.shadowRoot.querySelector('.role-button.active span');
    const heading = page.root.shadowRoot.querySelector('main h2');
    const patientTiles = page.root.shadowRoot.querySelectorAll('.patient-tile');

    expect(activeRole?.textContent).toEqual('Docs');
    expect(heading?.textContent).toEqual('Documentation');
    expect(patientTiles.length).toBeGreaterThan(0);
  });
});
