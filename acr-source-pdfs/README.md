# Local ACR PDF Source Folder

Put downloaded ACR Appropriateness Criteria PDFs here locally before running extraction.

Do not commit PDFs to GitHub. This folder is used only for local developer extraction, review, and conversion into concise structured educational summaries.

Expected flow:

1. Download or place PDFs in this folder.
2. Run `npm run extract:acr`.
3. Review generated raw JSON in `src/data/appropriateness/raw/`.
4. Convert and curate only reviewed structured summaries for app use.
