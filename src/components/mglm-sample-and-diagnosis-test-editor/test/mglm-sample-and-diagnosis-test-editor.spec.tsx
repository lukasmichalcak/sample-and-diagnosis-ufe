import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestEditor } from '../mglm-sample-and-diagnosis-test-editor';
import fetchMock from 'jest-fetch-mock';
import { Condition, TestListEntry } from '../../../api/sample-and-diagnosis-test';

describe('mglm-sample-and-diagnosis-test-editor', () => {
  const sampleEntry: TestListEntry = {
    id: "entry-1",
    patientId: "p-1",
    name: "Juraj Prvý",
    testSince: new Date("20240203T12:00"),
    estimatedDurationMinutes: 20,
    condition: {
      value: "Nevoľnosť",
      code: "nausea",
      reference: "https://zdravoteka.sk/priznaky/nevolnost/"
    }
  };

  const sampleConditions: Condition[] = [
    {
      value: "Teploty",
      code: "subfebrilia",
      reference: "https://zdravoteka.sk/priznaky/zvysena-telesna-teplota/",
      typicalDurationMinutes: 20
    },
    {
      value: "Nevoľnosť",
      code: "nausea",
      reference: "https://zdravoteka.sk/priznaky/nevolnost/",
      typicalDurationMinutes: 45
    },
  ];

  let delay = async (milliseconds: number) => await new Promise<void>(resolve => {
    setTimeout(() => resolve(), milliseconds);
  });

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  it('buttons shall be of different type', async () => {
    fetchMock.mockResponses(
      [JSON.stringify(sampleEntry), { status: 200 }],
      [JSON.stringify(sampleConditions), { status: 200 }]
    );

    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestEditor],
      html: `<mglm-sample-and-diagnosis-test-editor entry-id="test-entry" sample-and-diagnosis-id="test-sample-and-diagnosis" api-base="http://sample.test/api"></mglm-sample-and-diagnosis-test-editor>`,
    });

    await delay(300);
    await page.waitForChanges();

    const items: any = await page.root.shadowRoot.querySelectorAll("md-filled-button");
    expect(items.length).toEqual(1);
    // Continue with other assertions...
  });

  it('first text field is patient name', async () => {
    fetchMock.mockResponses(
      [JSON.stringify(sampleEntry), { status: 200 }],
      [JSON.stringify(sampleConditions), { status: 200 }]
    );

    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestEditor],
      html: `<mglm-sample-and-diagnosis-test-editor entry-id="test-entry" sample-and-diagnosis-id="test-sample-and-diagnosis" api-base="http://sample.test/api"></mglm-sample-and-diagnosis-test-editor>`,
    });

    await delay(300);
    await page.waitForChanges();

    const items: any = await page.root.shadowRoot.querySelectorAll("md-filled-text-field");
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].getAttribute("value")).toEqual(sampleEntry.name);
  });
});
