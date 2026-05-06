# mglm-sample-and-diagnosis-test-app



<!-- Auto Generated Below -->


## Properties

| Property               | Attribute                 | Description | Type     | Default     |
| ---------------------- | ------------------------- | ----------- | -------- | ----------- |
| `apiBase`              | `api-base`                |             | `string` | `undefined` |
| `basePath`             | `base-path`               |             | `string` | `''`        |
| `sampleAndDiagnosisId` | `sample-and-diagnosis-id` |             | `string` | `undefined` |


## Dependencies

### Depends on

- [mglm-diagnostician-view](../mglm-diagnostician-view)
- [mglm-docs-view](../mglm-docs-view)
- [mglm-technician-view](../mglm-technician-view)

### Graph
```mermaid
graph TD;
  mglm-sample-and-diagnosis-test-app --> mglm-diagnostician-view
  mglm-sample-and-diagnosis-test-app --> mglm-docs-view
  mglm-sample-and-diagnosis-test-app --> mglm-technician-view
  mglm-diagnostician-view --> mglm-measurements-editor
  mglm-diagnostician-view --> mglm-report-editor
  mglm-technician-view --> mglm-sample-draft-form
  style mglm-sample-and-diagnosis-test-app fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
