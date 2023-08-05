# send-ci-result-to-bigquery-action [![ts](https://github.com/quipper/send-ci-result-to-bigquery-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/quipper/send-ci-result-to-bigquery-action/actions/workflows/ts.yaml)

This is an action to send test results of JUnit XML to Google Cloud BigQuery.

## Getting Started

**Status:** still in beta

```yaml
jobs:
  rspec:
    steps:
      - uses: actions/checkout@v3
      # Generate a test result in JUnit XML.
      # For example,
      - run: bundle exec rspec --format RspecJunitFormatter --out report/rspec.xml
      - uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
          service_account: 'my-service-account@my-project.iam.gserviceaccount.com'
      - uses: quipper/send-ci-result-to-bigquery-action@v0
        with:
          test-result-xml-glob: report/rspec.xml
          bigquery-dataset-name: ci_result
          bigquery-ci-result-table-name: ci_result
          bigquery-ci-context-table-name: ci_context
          github-matrix-context-json: ${{ toJson(matrix) }} # only if using matrix
```

## Specification

### Inputs

| Name                             | Default    | Description                  |
| -------------------------------- | ---------- | ---------------------------- |
| `test-result-xml-glob`           | (required) | Glob pattern of test results |
| `bigquery-dataset-name`          | (required) | Dataset name                 |
| `bigquery-ci-result-table-name`  | (required) | Table name of CI result      |
| `bigquery-ci-context-table-name` | (required) | Table name of CI context     |

### Outputs

None.
