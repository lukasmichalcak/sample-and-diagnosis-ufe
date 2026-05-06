import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { MeasurementValue, UserRole, getMeasurementDefinition } from '../../domain/sample';

@Component({
  tag: 'mglm-measurements-editor',
  shadow: false,
})
export class MglmMeasurementsEditor {
  @Prop() measurements: MeasurementValue[] = [];
  @Prop() role: UserRole = 'diagnostician';

  @Event() measurementsChanged: EventEmitter<MeasurementValue[]>;

  render() {
    if (this.measurements.length === 0) {
      return <div class="empty-state compact">No measurement fields are expected until a test type is selected.</div>;
    }

    return (
      <fieldset>
        <legend>{this.role === 'technician' ? 'Initial measured values' : 'Measured values'}</legend>
        <div class="measurement-grid">
          {this.measurements.map((measurement, index) => {
            const definition = getMeasurementDefinition(measurement.testTypeCode, measurement.code);
            const label = definition?.label || measurement.code;
            return (
              <label>
                {label}{measurement.unit ? ` (${measurement.unit})` : ''}{definition?.required ? <span class="required-marker">*</span> : undefined}
                {this.renderMeasurementInput(measurement, index)}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  private renderMeasurementInput(measurement: MeasurementValue, index: number) {
    const definition = getMeasurementDefinition(measurement.testTypeCode, measurement.code);
    const update = (value: string | number | boolean) => {
      this.measurementsChanged.emit(this.measurements.map((current, currentIndex) =>
        currentIndex === index ? { ...current, value } : { ...current },
      ));
    };

    if (definition?.valueType === 'boolean') {
      return (
        <span class="inline-control">
          <input
            type="checkbox"
            checked={Boolean(measurement.value)}
            onChange={(ev: Event) => update((ev.target as HTMLInputElement).checked)}
          />
          Yes
        </span>
      );
    }

    if (definition?.valueType === 'select') {
      return (
        <select onChange={(ev: Event) => update((ev.target as HTMLSelectElement).value)}>
          <option value="" selected={String(measurement.value) === ''}>Select value</option>
          {(definition.options || []).map(option => (
            <option value={option} selected={String(measurement.value) === option}>{option}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={definition?.valueType === 'number' ? 'number' : 'text'}
        min={definition?.min}
        max={definition?.max}
        value={String(measurement.value)}
        onInput={(ev: Event) => {
          const value = (ev.target as HTMLInputElement).value;
          update(definition?.valueType === 'number' && value !== '' ? Number(value) : value);
        }}
      />
    );
  }
}
