import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestApp } from '../mglm-sample-and-diagnosis-test-app';

describe('mglm-sample-and-diagnosis-test-app', () => {

  it('renders editor', async () => {
    const page = await newSpecPage({
      url: `http://localhost/entry/@new`,
      components: [MglmSampleAndDiagnosisTestApp],
      html: `<mglm-sample-and-diagnosis-test-app base-path="/"></mglm-sample-and-diagnosis-test-app>`,
    });
    page.win.navigation = new EventTarget()
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual ("mglm-sample-and-diagnosis-test-editor");
    
  });

  it('renders list', async () => {
    const page = await newSpecPage({
      url: `http://localhost/sample-and-diagnosis-test/`,
      components: [MglmSampleAndDiagnosisTestApp],
      html: `<mglm-sample-and-diagnosis-test-app base-path="/sample-and-diagnosis-test/"></mglm-sample-and-diagnosis-test-app>`,
    });
    page.win.navigation = new EventTarget()
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual("mglm-sample-and-diagnosis-test-list");
  });
});
