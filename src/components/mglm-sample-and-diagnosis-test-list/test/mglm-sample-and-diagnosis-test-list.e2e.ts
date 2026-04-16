import { newE2EPage } from '@stencil/core/testing';

describe('mglm-sample-and-diagnosis-test-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<mglm-sample-and-diagnosis-test-list></mglm-sample-and-diagnosis-test-list>');

    const element = await page.find('mglm-sample-and-diagnosis-test-list');
    expect(element).toHaveClass('hydrated');
  });
});
