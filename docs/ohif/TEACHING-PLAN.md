# Teaching integration plan
1. Reuse ReportingWorkflowPage with a case-scoped persistence adapter, preserving structured fields, existing generator, manual report edits and helper controls.
2. Relabel ct-001 as an interventional demonstration (CT LUNG BIOPSY / DYNAMIC MODE); retain immutable old attempts and use a new content version.
3. Acquire a small diagnostic LIDC-IDRI CT and exact series-linked reader annotations; keep source interpretation distinct from unapproved authored teaching content.
4. Add Supabase editorial role membership, private versioned reference fields, a review state machine, server-side answer reveal after owned submission, and structured self-assessment. No automatic grading without an approved rubric.
5. Correct OHIF initial series/window configuration and clamp stale slice position after series changes/cine. Record the small source patch against the pinned release.
6. Supply a working preview case listing; verify account sign-in, structured draft resume and versioned submission in the protected browser.

Assumptions: existing nodule reporting schema is relevant to a focused reader-annotation study; guideline support remains educational and must not infer patient eligibility. No source facts, reviewer identities or approval dates will be invented. Clinical/privacy approval remains a real dependency.
