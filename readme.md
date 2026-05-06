# Sample and Diagnosis UFE

Stencil-based micro frontend for a sample collection, diagnostics, and finalized report workflow. The current UI runs against an in-memory frontend store while the OpenAPI contract and generated TypeScript client are prepared for the later WebAPI step.

## Main Component

The application entry component is:

```html
<mglm-sample-and-diagnosis-test-app
  api-base="http://localhost:5000/api"
  base-path="/sample-and-diagnosis-test/"
></mglm-sample-and-diagnosis-test-app>
```

### Current Views

| View | Purpose |
| --- | --- |
| Technician | Create and edit technician drafts, publish collected samples, mark tainted samples, delete non-finalized samples. |
| Diagnostician | Complete measured values, save preliminary reports, discard preliminary reports, finalize reports, query finalized reports by patient identifier. |
| Docs | Browse finalized reports grouped by patient identifier. |

The old demo list/editor tags still exist only as compatibility placeholders. The active app no longer uses the old `TestListEntry`, `Condition`, or `/test-list/...` API shape.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Stencil dev server together with the OpenAPI mock server:

```bash
npm start
```

This runs:

| Script | Purpose |
| --- | --- |
| `start:app` | Starts Stencil in dev/watch/serve mode. |
| `start:mock` | Converts the OpenAPI YAML file and starts `open-api-mocker` on port `5000`. |
| `convert-openapi` | Converts `api/sample-and-diagnosis-test.openapi.yaml` to `.openapi.json` for mock API usage. |

The development HTML page in `src/index.html` mounts the app component without backend attributes because the active UI is still local-store backed.

## API Contract

The API contract is:

```text
api/sample-and-diagnosis-test.openapi.yaml
```

Main resources:

```text
GET    /test-types
GET    /samples
POST   /samples
GET    /samples/{sampleId}
PUT    /samples/{sampleId}
DELETE /samples/{sampleId}
PATCH  /samples/{sampleId}/status
PUT    /samples/{sampleId}/measurements
PUT    /samples/{sampleId}/report
DELETE /samples/{sampleId}/report
POST   /samples/{sampleId}/report/finalize
GET    /patients/{patientId}/reports
```

When the WebAPI project is created, copy this YAML into the backend repo instead of the old demo waiting-list contract.

## API Client

Generate the TypeScript fetch client:

```bash
npm run openapi
```

Generated files are written to:

```text
src/api/sample-and-diagnosis-test
```

The generator configuration lives in `openapitools.json` and uses Docker-backed OpenAPI Generator `v6.6.0`.

## Build

Create a production build and regenerate component README documentation:

```bash
npm run build
```

Stencil outputs:

| Output | Purpose |
| --- | --- |
| `dist` | Lazy-loaded web component bundle and loader. |
| `dist-custom-elements` | Custom element exports. |
| `www` | Static application files used by the Docker image. |
| `docs-readme` | Generated component README files. |

## Testing

Run the Jest configuration directly:

```bash
npm run test:jest
```

Run Stencil spec and e2e tests:

```bash
npm test
```

## Deployment

The Docker image is built from `build/docker/Dockerfile`. It compiles the Stencil app, copies `www` into the Polyfea SPA base image, and exposes the app on port `8080`.

GitOps manifests for the micro frontend live under:

```text
../sample-and-diagnosis-gitops/apps/mglm-sample-and-diagnosis-ufe
```

Once the backend and Gateway API route exist, the Polyfea `api-base` value should be changed from local mock usage to the deployed gateway path.
