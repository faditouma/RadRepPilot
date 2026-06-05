## Appropriateness data model notes

RadRepPilot imports reviewed curated topics and generated extracted table summaries only. Do not import source PDFs or full PDF text into the public app.

Optional narrative fields are available on topics and variants for future validated extraction:

- `clinicalSummary`
- `keyClinicalConsiderations`
- `missingClinicalInfoPrompts`
- `requisitionPearls`
- `reportingPearls`
- `followUpPearls`
- `sourceExcerptPreview`

TODO: future local extraction can populate these fields from short, validated PDF narrative summaries. Keep `sourceExcerptPreview` very short and never use it to reproduce long proprietary guideline text. Clinical summaries should be reviewed before being marked `reviewed` or `manually_curated`.
