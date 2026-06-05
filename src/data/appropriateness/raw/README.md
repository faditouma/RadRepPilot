# Raw ACR Extraction Output

This folder is for local, unreviewed JSON files produced from source PDFs.

Raw files should not be imported into the public app or treated as clinical content. They are extraction drafts for human review.

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

After review, convert accepted content into curated topic files in `src/data/appropriateness/topics/`.

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

Do not import these raw files into the public app. They must be reviewed and curated first.
