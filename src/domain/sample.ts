export type UserRole = 'technician' | 'diagnostician' | 'docs';

export type SampleStatus =
  | 'draft'
  | 'collected'
  | 'in_diagnostics'
  | 'report_draft'
  | 'finalized'
  | 'tainted';

export type MeasurementValueType = 'number' | 'text' | 'boolean' | 'select';

export interface MeasurementDefinition {
  code: string;
  label: string;
  valueType: MeasurementValueType;
  unit?: string;
  min?: number;
  max?: number;
  options?: string[];
  required?: boolean;
}

export interface TestType {
  code: string;
  name: string;
  description?: string;
  measurementSchema: MeasurementDefinition[];
}

export interface MeasurementValue {
  testTypeCode: string;
  code: string;
  value: string | number | boolean;
  unit?: string;
  measuredAt?: string;
  enteredByRole?: UserRole;
}

export interface DiagnosticReport {
  id: string;
  sampleId: string;
  patientId?: string;
  summary: string;
  conclusion: string;
  recommendations?: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  author?: string;
  status: 'draft' | 'finalized';
}

export interface Sample {
  id: string;
  patientName: string;
  patientId?: string;
  sampleCode: string;
  collectedAt: string;
  testTypes: string[];
  status: SampleStatus;
  measurements: MeasurementValue[];
  report?: DiagnosticReport;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  finalizedBy?: string;
}

export interface NewSampleDraft {
  patientName: string;
  patientId?: string;
  sampleCode: string;
  collectedAt: string;
  testTypes: string[];
  measurements: MeasurementValue[];
}

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  draft: 'Technician draft',
  collected: 'Collected',
  in_diagnostics: 'In diagnostics',
  report_draft: 'Report draft',
  finalized: 'Finalized',
  tainted: 'Tainted',
};

export const SAMPLE_TEST_TYPES: TestType[] = [
  {
    code: 'crp',
    name: 'CRP',
    description: 'C-reactive protein inflammation marker.',
    measurementSchema: [
      {
        code: 'crp_value',
        label: 'CRP',
        valueType: 'number',
        unit: 'mg/L',
        min: 0,
        required: true,
      },
    ],
  },
  {
    code: 'blood_count',
    name: 'Blood count',
    measurementSchema: [
      {
        code: 'wbc',
        label: 'White blood cells',
        valueType: 'number',
        unit: '10^9/L',
        min: 0,
        required: true,
      },
      {
        code: 'hemoglobin',
        label: 'Hemoglobin',
        valueType: 'number',
        unit: 'g/L',
        min: 0,
      },
    ],
  },
  {
    code: 'glucose',
    name: 'Glucose',
    measurementSchema: [
      {
        code: 'glucose_value',
        label: 'Glucose',
        valueType: 'number',
        unit: 'mmol/L',
        min: 0,
        required: true,
      },
      {
        code: 'fasting',
        label: 'Fasting sample',
        valueType: 'boolean',
      },
    ],
  },
  {
    code: 'covid_antigen',
    name: 'COVID antigen',
    measurementSchema: [
      {
        code: 'result',
        label: 'Result',
        valueType: 'select',
        options: ['negative', 'positive', 'inconclusive'],
        required: true,
      },
    ],
  },
  {
    code: 'urine_chemical',
    name: 'Urine chemical',
    measurementSchema: [
      {
        code: 'protein',
        label: 'Protein',
        valueType: 'select',
        options: ['negative', 'trace', 'positive'],
      },
      {
        code: 'notes',
        label: 'Notes',
        valueType: 'text',
      },
    ],
  },
];

export function createSampleCode(): string {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SMP-${stamp}-${suffix}`;
}

export function toDateTimeInputValue(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeInputValue(value: string): string {
  return new Date(value).toISOString();
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleString();
}

export function createEmptyMeasurements(testTypeCodes: string[]): MeasurementValue[] {
  return SAMPLE_TEST_TYPES
    .filter(testType => testTypeCodes.includes(testType.code))
    .flatMap(testType =>
      testType.measurementSchema.map(definition => ({
        testTypeCode: testType.code,
        code: definition.code,
        value: definition.valueType === 'boolean' ? false : '',
        unit: definition.unit,
      })),
    );
}

export function createNewSampleDraft(): NewSampleDraft {
  return {
    patientName: '',
    patientId: '',
    sampleCode: createSampleCode(),
    collectedAt: toDateTimeInputValue(),
    testTypes: [],
    measurements: [],
  };
}

export function getTestTypeName(code: string): string {
  return SAMPLE_TEST_TYPES.find(testType => testType.code === code)?.name || code;
}

export function getMeasurementDefinition(testTypeCode: string, code: string): MeasurementDefinition | undefined {
  return SAMPLE_TEST_TYPES
    .find(testType => testType.code === testTypeCode)
    ?.measurementSchema.find(definition => definition.code === code);
}

export function isMeasurementValueComplete(value: MeasurementValue): boolean {
  const definition = getMeasurementDefinition(value.testTypeCode, value.code);
  if (!definition?.required) {
    return true;
  }

  if (definition.valueType === 'boolean') {
    return typeof value.value === 'boolean';
  }

  return String(value.value).trim().length > 0;
}

export function areRequiredMeasurementsComplete(measurements: MeasurementValue[]): boolean {
  return measurements.every(isMeasurementValueComplete);
}
