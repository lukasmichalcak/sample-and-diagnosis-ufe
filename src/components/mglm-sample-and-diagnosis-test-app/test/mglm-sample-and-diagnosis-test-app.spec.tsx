import { newSpecPage } from '@stencil/core/testing';
import { MglmDiagnosticianView } from '../../mglm-diagnostician-view/mglm-diagnostician-view';
import { MglmDocsView } from '../../mglm-docs-view/mglm-docs-view';
import { MglmMeasurementsEditor } from '../../mglm-measurements-editor/mglm-measurements-editor';
import { MglmReportEditor } from '../../mglm-report-editor/mglm-report-editor';
import { MglmSampleDraftForm } from '../../mglm-sample-draft-form/mglm-sample-draft-form';
import { MglmTechnicianView } from '../../mglm-technician-view/mglm-technician-view';
import { MglmSampleAndDiagnosisTestApp } from '../mglm-sample-and-diagnosis-test-app';

const workflowComponents = [
  MglmSampleAndDiagnosisTestApp,
  MglmTechnicianView,
  MglmDiagnosticianView,
  MglmDocsView,
  MglmSampleDraftForm,
  MglmMeasurementsEditor,
  MglmReportEditor,
];

const fixtureSamples = [
  {
    id: 'sample-001',
    patientId: 'P-1002',
    patientName: 'Eva Novakova',
    sampleCode: 'SMP-TEST-001',
    testTypes: ['glucose'],
    collectedAt: '2026-05-07T08:00:00.000Z',
    status: 'collected',
    measurements: [
      {
        testTypeCode: 'glucose',
        code: 'glucose_value',
        value: '',
        unit: 'mmol/L',
      },
      {
        testTypeCode: 'glucose',
        code: 'fasting',
        value: 'false',
      },
    ],
    createdAt: '2026-05-07T08:00:00.000Z',
    updatedAt: '2026-05-07T08:00:00.000Z',
  },
  {
    id: 'sample-002',
    patientId: 'P-1002',
    patientName: 'Eva Novakova',
    sampleCode: 'SMP-TEST-002',
    testTypes: ['glucose'],
    collectedAt: '2026-05-06T08:00:00.000Z',
    status: 'finalized',
    measurements: [
      {
        testTypeCode: 'glucose',
        code: 'glucose_value',
        value: '5.4',
        unit: 'mmol/L',
      },
      {
        testTypeCode: 'glucose',
        code: 'fasting',
        value: 'true',
      },
    ],
    report: {
      id: 'report-002',
      sampleId: 'sample-002',
      patientId: 'P-1002',
      summary: 'Stable glucose result.',
      conclusion: 'No urgent follow-up needed.',
      status: 'finalized',
      createdAt: '2026-05-06T09:00:00.000Z',
      updatedAt: '2026-05-06T09:30:00.000Z',
      finalizedAt: '2026-05-06T09:30:00.000Z',
    },
    createdAt: '2026-05-06T08:00:00.000Z',
    updatedAt: '2026-05-06T09:30:00.000Z',
    finalizedBy: 'Diagnostician',
  },
];

const testAppHtml = `<mglm-sample-and-diagnosis-test-app api-base="http://test.local/api"></mglm-sample-and-diagnosis-test-app>`;

const jsonResponse = (body: unknown, status = 200) => {
  const response = {
    status,
    json: jest.fn().mockResolvedValue(body),
    clone: () => response,
  };

  return Promise.resolve(response as unknown as Response);
};

const flushBackendRefresh = async page => {
  await new Promise(resolve => setTimeout(resolve, 0));
  await page.waitForChanges();
};

describe('mglm-sample-and-diagnosis-test-app', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith('http://test.local/api/samples')) {
        return jsonResponse(fixtureSamples);
      }

      return jsonResponse({ message: 'not found' }, 404);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the technician workflow by default', async () => {
    const page = await newSpecPage({
      components: workflowComponents,
      html: testAppHtml,
    });

    await flushBackendRefresh(page);

    const activeRole = page.root.shadowRoot.querySelector('.role-button.active span');
    const heading = page.root.shadowRoot.querySelector('main h2');
    const cards = page.root.shadowRoot.querySelectorAll('.sample-card');

    expect(activeRole?.textContent).toEqual('Technician');
    expect(heading?.textContent).toEqual('Technician samples');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('switches to the diagnostician workflow', async () => {
    const page = await newSpecPage({
      components: workflowComponents,
      html: testAppHtml,
    });

    await flushBackendRefresh(page);

    const roleButtons = page.root.shadowRoot.querySelectorAll('.role-button');
    (roleButtons[1] as HTMLButtonElement).click();
    await page.waitForChanges();

    const activeRole = page.root.shadowRoot.querySelector('.role-button.active span');
    const heading = page.root.shadowRoot.querySelector('main h2');
    const queueItems = page.root.shadowRoot.querySelectorAll('.queue-item');

    expect(activeRole?.textContent).toEqual('Diagnostician');
    expect(heading?.textContent).toEqual('Diagnostics queue');
    expect(queueItems.length).toBeGreaterThan(0);
  });

  it('switches to the docs workflow', async () => {
    const page = await newSpecPage({
      components: workflowComponents,
      html: testAppHtml,
    });

    await flushBackendRefresh(page);

    const roleButtons = page.root.shadowRoot.querySelectorAll('.role-button');
    (roleButtons[2] as HTMLButtonElement).click();
    await page.waitForChanges();

    const activeRole = page.root.shadowRoot.querySelector('.role-button.active span');
    const heading = page.root.shadowRoot.querySelector('main h2');
    const patientTiles = page.root.shadowRoot.querySelectorAll('.patient-tile');

    expect(activeRole?.textContent).toEqual('Docs');
    expect(heading?.textContent).toEqual('Documentation');
    expect(patientTiles.length).toBeGreaterThan(0);
  });
});
