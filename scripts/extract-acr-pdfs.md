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
2. Run the optional extraction script.
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
          "confidence": 0.72
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

## Optional Dependencies

The optional TypeScript script is dependency-light and does not run during app build. For real PDF text extraction, install a parser only when needed, for example:

```bash
npm install -D pdf-parse
```

Do not add a dependency until the extraction workflow is actively being tested.
