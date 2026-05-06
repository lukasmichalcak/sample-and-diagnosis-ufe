import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestList } from '../mglm-sample-and-diagnosis-test-list';

describe('mglm-sample-and-diagnosis-test-list', () => {
  it('renders as a legacy compatibility placeholder', async () => {
    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestList],
      html: `<mglm-sample-and-diagnosis-test-list sample-and-diagnosis-id="old" api-base="http://test/api"></mglm-sample-and-diagnosis-test-list>`,
    });

    const placeholder = page.root.shadowRoot.querySelector('.legacy-placeholder');

    expect(placeholder?.textContent).toContain('Legacy test-list component');
  });
});
