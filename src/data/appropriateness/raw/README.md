# Raw ACR Extraction Output

Raw extracted JSON lives here.

Raw extraction requires validation before public use. Raw JSON should not be imported directly into the public registry unless intentionally reviewed or transformed into app-readable structured summaries.

Raw files should not be treated as clinical content. They are extraction drafts for human review.

Expected raw JSON fields:

- `sourceFile`
- `extractedTitle`
- `extractedYear`
- `reviewStatus: "extracted"`
- `extractionConfidence`
- `variants`
- `extractionWarnings`

Each variant should include:

- `variantTitle`
- `procedureRows`

Each procedure row should include:

- `procedure`
- `appropriatenessCategory`
- `radiationLevel`
- `confidence`

After review, convert accepted content into app-readable generated summaries or curated topic files.

## Run Extraction

From the project root:

```bash
npm run extract:acr
```

The script reads local PDFs from `acr-source-pdfs/` and writes `[slug].raw.json` files here.

It also writes:

```text
extraction-summary.json
```

The summary includes processed files, failed files, total topics, variants, procedure rows, warnings, and timestamp.

Do not import these raw files into the public app. They must be reviewed, transformed, and intentionally imported first.
