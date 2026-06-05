# ACR Ingestion Workflow

RadRepPilot supports a local workflow for turning ACR Appropriateness Criteria PDFs into concise structured educational summaries.

This workflow does not redistribute full ACR PDFs, does not expose raw PDF text in the public app, and does not replace the original criteria, local protocol, or radiologist judgment.

## Step 1: Download PDFs Locally

Place downloaded ACR PDFs in:

```text
acr-source-pdfs/
```

This folder is ignored by Git except for its README. Do not commit source PDFs.

## Step 2: Run Extraction

From the project root:

```bash
npm run extract:acr
```

The extractor reads local PDFs and writes raw JSON to:

```text
src/data/appropriateness/raw/
```

Raw JSON is local review material. It is not imported into the public app.

## Step 3: Inspect Extraction Summary

After extraction, review:

```text
src/data/appropriateness/raw/extraction-summary.json
```

Check:

- processed files
- failed files
- total variants
- total procedure rows
- warning counts
- low-confidence or missing table fields

## Step 4: Generate App-Readable Topic Summaries

Use reviewed raw JSON as the starting point for structured summaries. Draft conversions can be created with:

```bash
npm run convert:acr -- src/data/appropriateness/raw/example.raw.json
```

Draft output is written under:

```text
src/data/appropriateness/topics/
```

Future generated summaries may also live under:

```text
src/data/appropriateness/generated/
```

Generated files should contain concise structured recommendation data only: topic, variants, procedure rows, appropriateness category, radiation level, extraction confidence, and review status.

## Step 5: Review High-Risk or Low-Confidence Topics

Prioritize manual review when:

- no variants were found
- no procedure rows were found
- radiation level is unclear
- appropriateness category is unclear
- procedure text looks truncated
- duplicate topic titles are detected
- clinical scenario mapping is ambiguous

High-risk topics should not be labeled `reviewed` or `manually_curated` until checked against the original source and local/radiology guidance.

## Step 6: Import Reviewed or Generated Topics

The public Imaging Guide and Imaging Requisition tools read from:

```text
src/data/appropriateness/index.ts
```

To add a topic:

1. Keep the source PDF local.
2. Review or transform raw extraction.
3. Create a structured topic file in `topics/` or a generated summary in `generated/`.
4. Import the topic in `index.ts`.
5. Add it to the registry intentionally.
6. Use an honest `reviewStatus`:
   - `extracted`
   - `needs_validation`
   - `reviewed`
   - `manually_curated`

Do not import raw JSON directly. Do not include full PDF text. Keep public data concise, structured, educational, and clearly labeled.
