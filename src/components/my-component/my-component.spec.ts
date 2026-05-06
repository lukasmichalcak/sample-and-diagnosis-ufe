import { newSpecPage } from '@stencil/core/testing';
import { MyComponent } from './my-component';

describe('my-component', () => {
  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [MyComponent],
      html: '<my-component></my-component>',
    });
    expect(root.shadowRoot.querySelector('div').textContent).toEqual("Hello, World! I'm ");
  });

  it('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [MyComponent],
      html: `<my-component first="Stencil" middle="'Don't call me a framework'" last="JS"></my-component>`,
    });
    expect(root.shadowRoot.querySelector('div').textContent).toEqual(
      "Hello, World! I'm Stencil 'Don't call me a framework' JS",
    );
  });
});
