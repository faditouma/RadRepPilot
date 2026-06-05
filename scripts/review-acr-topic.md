# ACR Raw JSON Review Workflow

This workflow converts locally extracted ACR-like raw JSON into human-reviewed Imaging Guide topic files.

Raw extraction output is not trusted clinical content. Do not import raw JSON or draft topics into the public topic registry until a human has reviewed and edited the content.

## Folders

Source PDFs:

```text
acr-source-pdfs/
```

Raw extraction output:

```text
src/data/appropriateness/raw/
```

Draft and curated topic files:

```text
src/data/appropriateness/topics/
```

## Review Steps

1. Extract PDFs:

```bash
npm run extract:acr
```

2. Open the generated raw JSON in `src/data/appropriateness/raw/`.

3. Review the extracted title, year, variant blocks, procedure names, appropriateness categories, radiation levels, and extraction warnings against the original source PDF.

4. Convert one raw JSON file into a draft curated TypeScript file:

```bash
npm run convert:acr -- src/data/appropriateness/raw/example.raw.json
```

5. Manually edit the generated `.draft.ts` file:

- Add keywords.
- Fill missing clinical information prompts.
- Write concise requisition suggestions.
- Write reporting pearls.
- Add cautions and applicability notes.
- Replace placeholder rationales with manually reviewed, concise educational summaries.

6. Keep `reviewStatus: "needs_validation"` until content has been checked against the source and reviewed.

7. After review, rename or copy the draft to a final topic file, set `reviewStatus: "reviewed"`, and import it into `src/data/appropriateness/index.ts`.

## Guardrails

- Do not copy long proprietary guideline text.
- Do not import unreviewed raw JSON or draft files into the public registry.
- Do not overwrite existing curated topic files.
- Do not use extracted content clinically without radiologist/local protocol verification.
- Keep the public Imaging Guide limited to reviewed or explicitly marked prototype seed topics.
