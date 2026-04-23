import { newE2EPage } from '@stencil/core/testing';

describe('mglm-sample-and-diagnosis-test-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<mglm-sample-and-diagnosis-test-editor></mglm-sample-and-diagnosis-test-editor>');

    const element = await page.find('mglm-sample-and-diagnosis-test-editor');
    expect(element).toHaveClass('hydrated');
  });
});
