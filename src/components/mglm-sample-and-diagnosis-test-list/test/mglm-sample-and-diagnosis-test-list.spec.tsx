import { newSpecPage } from '@stencil/core/testing';
import { MglmSampleAndDiagnosisTestList } from '../mglm-sample-and-diagnosis-test-list';
import { TestListEntry } from '../../../api/sample-and-diagnosis-test/models';
import fetchMock from 'jest-fetch-mock';


describe('mglm-sample-and-diagnosis-test-list', () => {
  const sampleEntries: TestListEntry[] = [
    {
      id: "entry-1",
      patientId: "p-1",
      name: "Juraj Prvý",
      testSince: new Date("20240203T12:00"),
      estimatedDurationMinutes: 20
    },
    {
      id: "entry-2",
      patientId: "p-2",
      name: "James Druhý",
      testSince: new Date("20240203T12:00"),
      estimatedDurationMinutes: 5
    }
  ];

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  it('renders sample entries', async () => {
    // Mock the API response using sampleEntries
    fetchMock.mockResponseOnce(JSON.stringify(sampleEntries));
    
    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestList],
      html: `<mglm-sample-and-diagnosis-test-list sample-and-diagnosis-id="test-ambulance", api-base="http://test/api"></mglm-sample-and-diagnosis-test-list>`,
    });
    const wlList = page.rootInstance as MglmSampleAndDiagnosisTestList;
    const expectedPatients = wlList?.waitingPatients?.length

    // Wait for the DOM to update
    await page.waitForChanges();

    // Query the rendered list items
    const items = page.root.shadowRoot.querySelectorAll("md-list-item");

    // Assert that the expected number of patients and rendered items match the sample entries
    expect(expectedPatients).toEqual(sampleEntries.length);
    expect(items.length).toEqual(expectedPatients);
  });

  it('renders error message on network issues', async () => {
    // Mock the network error
    fetchMock.mockRejectOnce(new Error('Network Error'));

    const page = await newSpecPage({
      components: [MglmSampleAndDiagnosisTestList],
      html: `<Mglm-sample-and-diagnosis-test-list sample-and-diagnosis-id="test-ambulance" api-base="http://test/api"></Mglm-sample-and-diagnosis-test-list>`,
    });

    const wlList = page.rootInstance as MglmSampleAndDiagnosisTestList;
    const expectedPatients = wlList?.waitingPatients?.length;

    // Wait for the DOM to update
    await page.waitForChanges();

    // Query the DOM for error message and list items
    const errorMessage = page.root.shadowRoot.querySelectorAll(".error");
    const items = page.root.shadowRoot.querySelectorAll("md-list-item");

    // Assert that the error message is displayed and no patients are listed
    expect(errorMessage.length).toBeGreaterThanOrEqual(1);
    expect(expectedPatients).toEqual(0);
    expect(items.length).toEqual(expectedPatients);
  });
});
