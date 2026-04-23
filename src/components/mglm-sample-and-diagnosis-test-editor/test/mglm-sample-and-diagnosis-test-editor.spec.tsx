import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestEditor } from '../mglm-sample-and-diagnosis-test-editor';

describe('mglm-sample-and-diagnosis-test-editor', () => {
  it('buttons shall be of different type', async () => {
    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestEditor],
      html: `<mglm-sample-and-diagnosis-test-editor entry-id="@new"></mglm-sample-and-diagnosis-test-editor>`,
    });
    let items: any = await page.root.shadowRoot.querySelectorAll("md-filled-button");
    expect(items.length).toEqual(1);
    items = await page.root.shadowRoot.querySelectorAll("md-outlined-button");
    expect(items.length).toEqual(1);

    items = await page.root.shadowRoot.querySelectorAll("md-filled-tonal-button");
    expect(items.length).toEqual(1);
  });
});
