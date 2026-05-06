import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestEditor } from '../mglm-sample-and-diagnosis-test-editor';

describe('mglm-sample-and-diagnosis-test-editor', () => {
  it('renders as a legacy compatibility placeholder', async () => {
    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestEditor],
      html: `<mglm-sample-and-diagnosis-test-editor entry-id="old-entry" sample-and-diagnosis-id="old" api-base="http://test/api"></mglm-sample-and-diagnosis-test-editor>`,
    });

    const placeholder = page.root.shadowRoot.querySelector('.legacy-placeholder');

    expect(placeholder?.textContent).toContain('Legacy test-list editor');
  });
});
