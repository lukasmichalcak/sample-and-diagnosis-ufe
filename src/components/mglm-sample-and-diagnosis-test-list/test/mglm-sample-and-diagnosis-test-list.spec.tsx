import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestList } from '../mglm-sample-and-diagnosis-test-list';

describe('mglm-sample-and-diagnosis-test-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestList],
      html: `<mglm-sample-and-diagnosis-test-list></mglm-sample-and-diagnosis-test-list>`,
    });
    const wlList = page.rootInstance as MglmSampleAndDiagnosisTestList;
    const expectedPatients = wlList?.waitingPatients?.length

    const items = page.root.shadowRoot.querySelectorAll("md-list-item");
    expect(items.length).toEqual(expectedPatients);
  });
});
