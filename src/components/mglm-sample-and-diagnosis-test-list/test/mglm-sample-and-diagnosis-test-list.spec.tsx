import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestList } from '../mglm-sample-and-diagnosis-test-list';

describe('mglm-sample-and-diagnosis-test-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestList],
      html: `<mglm-sample-and-diagnosis-test-list></mglm-sample-and-diagnosis-test-list>`,
    });
    expect(page.root).toEqualHtml(`
      <mglm-sample-and-diagnosis-test-list>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </mglm-sample-and-diagnosis-test-list>
    `);
  });
});
