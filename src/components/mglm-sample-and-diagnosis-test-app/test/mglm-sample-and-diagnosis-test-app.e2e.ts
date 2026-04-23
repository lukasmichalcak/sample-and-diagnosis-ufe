import { newE2EPage } from '@stencil/core/testing';

describe('mglm-sample-and-diagnosis-test-app', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<mglm-sample-and-diagnosis-test-app></mglm-sample-and-diagnosis-test-app>');

    const element = await page.find('mglm-sample-and-diagnosis-test-app');
    expect(element).toHaveClass('hydrated');
  });
});
