# Image-first education implementation

Base: RadRepPilot-upgrade-20260720, newer checkout of faditouma/RadRepPilot. React 18 + TypeScript + Vite + HashRouter, Supabase auth/saved reports; GitHub Pages workflow and local Vercel linkage. No existing education backend or migration history. No AGENTS.md discovered. Preserve reporting schemas, calculators, requisition builders, saved reports and /workspace routes.

1. Add versioned case/asset/rights/rubric records and SQLite server migrations outside frontend imports.
2. Import individually licensed Commons images into ignored private storage using supported imageinfo API. Investigate TCIA/IDC separately; no collection-label diagnosis inference.
3. Add authenticated education API, learner ownership, draft autosave, submission, answer reveal and structured self-assessment.
4. Add reading-room UI and protected editorial gates; no seed approvals or public draft access.
5. Add five ordering scenario drafts from current Canadian sources; track independent/assisted attempts and simple review scheduling.
6. Verify import idempotency, publication gates, API security and existing tests/build. Document storage/deployment and genuine clinical dependencies.

Assumptions: existing newer checkout is intended base; use reversible new /learn routes. Local development uses Node 24 SQLite plus existing Supabase authentication; no paid resources provisioned. GitHub Pages alone cannot host protected answers. Drafts are available to editors only. AI is disabled until clinical rubric review; manual assessment remains functional. English content only; localized UI dictionaries can expand without machine-translating clinical content.
