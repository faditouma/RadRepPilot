# Generated App-Readable ACR Summaries

Generated structured recommendation files can be created from raw extraction after review.

These files are app-readable summaries, not full PDF reproductions. They should contain only concise structured data:

- topic
- variants
- procedures
- appropriateness category
- radiation level
- extraction status
- concise source/review notes

Generated summaries should not include full PDF text or long copied guideline passages. They are intended to bridge local extraction and public Imaging Guide/Requisition use.

Only import generated topics into the public registry intentionally, with clear `reviewStatus` labels such as `extracted`, `needs_validation`, `reviewed`, or `manually_curated`.

## Generate summaries

Run:

```sh
npm run generate:acr-topics
```

The generator reads `src/data/appropriateness/raw/*.raw.json` and writes:

- `*.generated.ts` topic files
- `index.ts` exporting `generatedAppropriatenessTopics`

Generated topics are table summaries only. They are labeled as extracted/needs validation and should not include full PDF text or unreviewed clinical rationale.
