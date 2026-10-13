# Run and operate the education platform

## Existing project and branch

Implementation now lives in `/Users/faditouma/Documents/GitHub/RadRepPilot`, the newer checkout of `faditouma/RadRepPilot`, on `education/image-first`. Existing /workspace reporting modules, incidental helpers, calculators, requisitions, Supabase account routes and saved reports remain available. The home page now introduces image-first learning. No remote deployment, paid resource, reviewer or approval has been created.

## Local editorial preview

Node **24.16 or later within Node 24** is the tested runtime; `node:sqlite` remains experimental in Node 24. Use `npm ci` to install locked dependencies.

```sh
npm run education:import
npm run education:seed
npm run education:preview
# Second terminal:
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/#/learn`. The explicit local preview is bound to 127.0.0.1 and uses `local-editor` with **author only** permissions. It permits inspecting/editing drafts and testing the learner flow; it cannot approve clinical content, asset inspections, publish, or retire content. It is rejected when NODE_ENV=production. Never expose this preview through a public tunnel. This simulator accepts practice text only; no image-upload endpoint exists.

Import/seed are local operator scripts. Filesystem access to the private store is privileged. Do not give learners shell access. Browser imports require server-side author/reviewer/admin permissions and accept only a Commons File: PNG/JPEG identifier.

## Authenticated operation

Use the existing Supabase project for identity. No privileged Supabase key is needed by this service. Set server variables in the process environment (or .env.local for `education:server`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-public-publishable-or-legacy-anon-key
EDUCATION_AUTHORS=comma-separated-auth-user-UUIDs
EDUCATION_REVIEWERS=comma-separated-verified-clinician-auth-user-UUIDs
EDUCATION_ADMINS=comma-separated-admin-auth-user-UUIDs
EDUCATION_ORIGIN=https://your-frontend.example
EDUCATION_STORAGE=/absolute/private/persistent-volume
EDUCATION_HOST=127.0.0.1
EDUCATION_PORT=8787
NODE_ENV=production
```

Do not put role lists or server credentials in VITE_ variables. Reviewer provisioning is a human administrative decision: verify clinical credentials before assigning IDs. Role assignment is checked from server configuration on each request, never editable user_metadata. Supabase `getUser(token)` verifies bearer tokens remotely; private data is keyed to the returned user ID. Rate limits are 120 authenticated requests/minute per user. Request bodies are capped at 64 KiB, text fields at 8,000 characters. No AI provider requests occur.

Configure the existing frontend `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Prefer same-origin `/api/education` reverse proxy. Vite has the local proxy preconfigured. A separate `VITE_EDUCATION_API_URL` exists for future hosting adapters but cross-origin deployments currently need a same-origin reverse proxy; this service deliberately does not advertise permissive CORS.

```sh
npm run education:server
npm run build
```

The Node server can serve built `dist/` and `/api/education` on one origin. Put HTTPS, process supervision, backups and a persistent private volume in front of it. Start one instance with one local SQLite volume. This implementation is **not suitable for ephemeral Vercel Function filesystems or concurrent replicated instances**. Do not deploy private storage under a public web root. GitHub Pages can retain the legacy static tools but cannot host authenticated answers; configure the education service before releasing the new frontend. The existing Pages main-branch workflow is preserved and the dedicated branch is not automatically deployed.

## Database and migrations

`server/store.mjs` creates the private SQLite file, enables WAL/foreign keys and applies the idempotent `server/migrations/001-education.sql`. The schema includes content/version/status, checksum-unique assets, immutable published snapshots, owned drafts, owned attempts with complete answer/rubric snapshot, reviews, error flags and audit logs. Version 1 is recorded in schema_migrations. Future migrations must be applied once in a transaction after a database backup; this runner currently supports the initial migration only. No remote Supabase schema has been altered.

Back up SQLite consistently using SQLite backup tools (include WAL correctly, do not copy a live database alone), originals, evidence files and delivery images. Restore them together so manifest IDs remain attached to content. Import and seed preserve existing records and reviews. On a fresh installation, reimport then seed; asset UUIDs are generated and linked by the seed, not copied from another installation’s manifest.

## Import behaviour / storage transfer

Supported current adapter: Wikimedia Commons imageinfo API + original upload.wikimedia.org PNG/JPEG. Individually verified CC0, CC BY 2.0/2.5/3.0/4.0 and corresponding ShareAlike licences are accepted; noncommercial, nonfree, unclear and additional-restriction assets fail closed. The importer stores the raw API evidence privately, original bytes and SHA-256, validated PNG delivery bytes and SHA-256, source/page identifier, creator, licence/version/URL, per-use rights/evidence, access date, modifications, AI/indexing/training restrictions, and inspection status. Clinical references live separately in cases.

Downloads have a 30-second total timeout, 20 MiB streamed limit and a 40-megapixel decode limit; SVG, GIF, DICOM, archives, polyglot unsupported formats and arbitrary URLs are not accepted. HTTP redirects are rejected. DNS is resolved before connection, public IPv4 is required, and the connection is pinned to that address with the original TLS hostname. HTTPS hosts are exact-allowlisted; credentials, ports, IP literals and suffix tricks are rejected. Sharp fully decodes the raster and strips EXIF/XMP from the delivery copy. Burned-in text is untouched and requires human inspection. Import failures are reported individually; duplicate checksums return the existing asset. Changed source bytes create a new asset rather than silently changing published cases.

Actual copies are in ignored `.education-storage/originals/` and `.education-storage/images/`; never commit these datasets. Transfer the complete private volume securely, or rerun imports and seed on a new server. `docs/education/asset-manifest.json` is a tracked provenance inventory and `server/content/initial-drafts.json` links local cases to assets/series. These files contain editorial answers and must never be placed in dist/public or served as a static repository on the education origin. The manifest is not a declaration of human clinical/privacy approval.

Storage/bandwidth cost model: original + delivery bytes + SQLite/evidence + backup replicas. Each image is downloaded per viewer open (private no-store). Monthly delivery GiB = sum(delivery bytes × image views)/2^30; multiply by the chosen host's verified current egress price. No paid storage was provisioned. The initial set is small; full CT studies can be hundreds of MiB and need separate transfer/storage limits and a DICOM adapter.

## Editorial workflow

Authors import assets, create image-linked drafts, edit structured JSON including rubric/hints/normalized x,y annotations, and request clinical review. Reviewers personally verify findings, negatives, alternatives, urgency, branch logic and reference reports; the authenticated ID/time is recorded only when they attest actual clinical review. Reviewers inspect every asset for metadata, burned-in identifiers, facial risk, orientation, sequence, resolution and correspondence with findings; comments are required. Rights approval is separate. Publication checks all source rights, evidence, inspection and review dependencies. Unknown display/adaptation/redistribution/commercial rights block publication; unknown AI/indexing rights block those uses because these operations are not implemented.

Published snapshots are immutable. Create a new draft version to revise; retirement removes a version from new case listing/submission while prior owned attempts retain their exact snapshot. Authors cannot approve; only administrators retire. Required attribution remains visible. If it reveals the answer, assessment publication is blocked; a clinician can explicitly select `learningOnly: true` in a reviewed draft so the case can be published for learning without assessment. All imported cases start assessment-ineligible. Annotations are visible only after submission (except protected editorial JSON).

## AI and localization

No automated grading is released. The server returns a disabled/fallback state and the expert-example/self-assessment flow works independently. No provider credentials or images/reports are sent externally for grading, indexing or training. `server/content/ai-evaluation-drafts.json` defines evaluation inputs requiring clinician-authored expected matches before AI implementation/release. A future flag must default off, require reviewed rubrics and evaluation sign-off, validate structured evidence, handle injection/negation/uncertainty/laterality/contradictions, deterministic scores, timeouts/cost limits and fallback. Setting an arbitrary env flag cannot enable grading today.

Content uses locale `en-CA`, stable finding/branch/objective identifiers and versioned schemas. Primary navigation/profile UI strings are centralized in `src/education/locales.ts`; French can be added separately. Clinical French translations require actual clinical review; none have been published.

Actual initial storage: 7.84 MB originals plus 15.70 MB PNG delivery copies, before evidence/database/backups.

For browser verification without Vite, build first, then use the built app on `http://127.0.0.1:8787/#/learn` while the local preview server runs. Browser verification limitations and manual checks are in VERIFICATION.md.
