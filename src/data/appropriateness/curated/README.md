# Curated ACR-Style Topic Review Notes

This folder can hold review notes, checklists, or intermediate files for human-curated Imaging Guide topics.

Runtime topic files live in:

```text
src/data/appropriateness/topics/
```

Only reviewed and manually structured topic files should be imported into the public topic registry.

Curated content should:

- Use concise educational summaries.
- Avoid long copied guideline text.
- Preserve source attribution and review status.
- Include local protocol/radiologist verification cautions.
- Be marked reviewed only after human review.

## Draft Conversion

Convert one reviewed raw JSON starting point into a draft topic file:

```bash
npm run convert:acr -- src/data/appropriateness/raw/example.raw.json
```

The converter writes:

```text
src/data/appropriateness/topics/[topic].draft.ts
```

Draft files are not automatically imported into the registry. Human review and manual editing are required first.
