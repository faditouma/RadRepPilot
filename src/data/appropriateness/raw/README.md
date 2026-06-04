# Raw ACR Extraction Output

This folder is for local, unreviewed JSON files produced from source PDFs.

Raw files should not be imported into the public app or treated as clinical content. They are extraction drafts for human review.

Expected raw JSON fields:

- `sourceFile`
- `extractedTitle`
- `extractedYear`
- `reviewStatus: "unreviewed"`
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
