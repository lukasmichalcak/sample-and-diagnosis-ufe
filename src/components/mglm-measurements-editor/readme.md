# mglm-measurements-editor



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute | Description | Type                                        | Default           |
| -------------- | --------- | ----------- | ------------------------------------------- | ----------------- |
| `measurements` | --        |             | `MeasurementValue[]`                        | `[]`              |
| `role`         | `role`    |             | `"diagnostician" \| "docs" \| "technician"` | `'diagnostician'` |


## Events

| Event                 | Description | Type                              |
| --------------------- | ----------- | --------------------------------- |
| `measurementsChanged` |             | `CustomEvent<MeasurementValue[]>` |


## Dependencies

### Used by

 - [mglm-diagnostician-view](../mglm-diagnostician-view)

### Graph
```mermaid
graph TD;
  mglm-diagnostician-view --> mglm-measurements-editor
  style mglm-measurements-editor fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
