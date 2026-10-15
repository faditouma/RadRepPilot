# Verification — 2026-10-15

Code checks are software verification, not clinical validation.

- Commons import/preparation repeated successfully: same 3 case IDs, 4 images, delivery paths and checksums; source pins matched. No manual dataset transfer required.
- Vite/TypeScript preview build and existing OHIF packaging pass.
- Vitest: 38 files / 224 tests pass (`npm test -- --no-cache`; no cache writes through the shared dependency symlink).
- Existing education API: 8 tests pass, including owned autosave/submission, role/answer-access enforcement, clinical/rights publication gates, retirement and importer protections.
- Quiz API: 5 tests pass, including production denial, pre-submission answer stripping/reference denial, immutable receipt tampering rejection, other-session denial, origin rejection and explicit unreviewed comparison.
- Browser checked the actual protected remote deployment, not only localhost. Shoulder radiograph loads beside all questions. Initial choices are empty. Deliberately wrong laterality stays in generated report. Manual edits and confidence survive reload. Submission preserves the edited original. Editorial comparison identifies the location error once, with linked source evidence and no free-text score; corrected practice wording is separate.
- PA/lateral same-study views switch and render remotely. Zoom/reset/fullscreen work; tablet 1024×768 keeps image and questions beside each other, with no document overflow. Desktop tested at the browser's default 1280×720. Loading state observed during transfer of larger PNGs.
- Case switching initializes the new case's own draft, without carrying the previous case's answers/report. Original attempts remain linked from My progress.
- No account sync or clinical validation was claimed. Vercel deployment protection remains enabled; production is unchanged.

Screenshots under `screenshots/` show the real protected preview: questions, laterality correction, and tablet PA/lateral question layout. Screenshot image portions retain the applicable source-image licence described in source-rights.json; the screenshots do not establish clinical approval.
