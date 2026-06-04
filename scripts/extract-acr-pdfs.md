# ACR PDF Extraction Pipeline Scaffold

This scaffold prepares RadRepPilot for future local processing of ACR Appropriateness Criteria PDFs into raw JSON files for human review.

This pipeline is intentionally local-only. Do not add source PDFs to the public app bundle, do not import raw extracted JSON into runtime UI, and do not overwrite curated topic files without review.

## Folder Layout

Input PDFs:

```text
acr-source-pdfs/
```

Raw extraction output:

```text
src/data/appropriateness/raw/
```

Curated reviewed topic output:

```text
src/data/appropriateness/topics/
```

## Workflow

1. Put source PDFs in `acr-source-pdfs/`.
2. Run the local extraction script:

```bash
npm run extract:acr
```

3. The script outputs one raw JSON file per PDF in `src/data/appropriateness/raw/`.
4. A human reviewer checks each raw JSON file for topic title, year, variants, rows, categories, radiation levels, and extraction warnings.
5. Reviewed content is manually converted into curated TypeScript topic files under `src/data/appropriateness/topics/`.
6. The topic registry imports reviewed curated topics only.

## Raw JSON Shape

Each extracted PDF should produce a raw JSON object like:

```json
{
  "sourceFile": "Chronic Pancreatitis.pdf",
  "extractedTitle": "Chronic Pancreatitis",
  "extractedYear": "2024",
  "reviewStatus": "unreviewed",
  "variants": [
    {
      "variantTitle": "Variant 1: Suspected chronic pancreatitis or complications, initial imaging",
      "procedureRows": [
        {
          "procedure": "MRI abdomen without and with IV contrast with MRCP",
          "appropriatenessCategory": "Usually Appropriate",
          "radiationLevel": "O",
          "confidence": "high"
        }
      ]
    }
  ],
  "extractionWarnings": [
    "Manual review required for appropriateness category boundaries."
  ]
}
```

## Review Rules

- Raw JSON is not clinical content ready for the app.
- Curated topic files must be reviewed before import into the Imaging Guide.
- Do not reproduce long proprietary guideline passages.
- Keep curated rationales concise, educational, and manually written.
- Confirm against original criteria, current updates, local protocols, and radiologist judgment.

## Script Notes

The current script is `scripts/extract-acr-pdfs.mjs`. It uses Node built-ins only, including a lightweight text extraction pass over PDF string objects and Flate-compressed streams. This keeps the website build independent from PDF tooling.

PDF table extraction is inherently imperfect. Treat output as raw review material, not curated clinical content.

If the built-in parser is not enough for a future batch, consider testing a dedicated local dependency such as `pdf-parse` or another table-aware extractor, then keep that tooling outside the public app bundle.

## Running Locally

```bash
mkdir -p acr-source-pdfs
# add local ACR PDFs to acr-source-pdfs/
npm run extract:acr
```

Raw JSON files appear in:

```text
src/data/appropriateness/raw/
```

The batch summary appears at:

```text
src/data/appropriateness/raw/extraction-summary.json
```

Each raw JSON file must be reviewed before any content is converted into public curated topic files.

## Batch Behavior

The extractor is designed for large local folders. If one PDF fails, the script logs the failure, continues with the remaining files, and includes failed files in `extraction-summary.json`.

The summary includes:

- `processedFiles`
- `failedFiles`
- `totalTopics`
- `totalVariants`
- `totalProcedureRows`
- `totalWarnings`
- `timestamp`

## Warning Categories

Raw extraction warnings use these categories:

- `noVariantFound`
- `noProcedureRowsFound`
- `unclearRadiationLevel`
- `unclearAppropriatenessCategory`
- `possibleTruncatedProcedure`
- `duplicateTopicTitle`
