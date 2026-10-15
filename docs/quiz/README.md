# X-ray teaching preview

This branch adds a focused context → image → questions → editable generated report → immutable submission → draft correction exercise. Production and `main` are unchanged. The preview remains English-only. Existing reporting modules/calculators remain under Reference tools; existing self-hosted OHIF CT routes remain available from the case library.

## Access and status

Open the protected teaching preview, authenticate to Vercel with an existing authorized project/team account, then choose an X-ray case. A RadRepPilot email session is **not required** for this editorial software review. Progress is browser-local and tied to this site's origin; it does not sync to an account or between preview domains/browsers. Clearing browser data removes it. A 30-day HttpOnly browser session binds signed submission receipts; losing that cookie prevents reopening protected draft comparisons for those receipts, even if the local history remains.

There are three unapproved case drafts, four actual radiographs, **zero clinically approved/published X-ray cases**. After submission choose **Preview draft corrections** to inspect source-supported draft comparisons, then **Build a corrected practice report** for separate revised wording. The original report remains preserved. Comparison concerns structured choices only; no numerical competency score or free-text/AI assessment is claimed.

The `/api/quiz` server handler admits draft testing only when `VERCEL_ENV=preview` and `QUIZ_EDITORIAL_PREVIEW=1`. The deployment's existing Vercel Authentication is the access boundary for this **read-only team editorial sandbox**. Never disable Deployment Protection or apply an unauthenticated bypass alias to it. This capability does not grant Supabase author/reviewer roles, content editing, or publication. Existing Supabase editorial write/publication controls are separate. Production fails closed even if the draft flag is accidentally present. Direct reference requests are denied; draft comparison additionally requires an owned, signed submission and explicit editorial action. Approved learner-answer requests remain denied while clinical review is null.

## Image inventory and evidence

Full records: [source-rights.json](source-rights.json), including individual stable page IDs, creators, source/download URLs, licence/version, rights evidence, modifications, checksums, byte counts, and separate privacy/clinical status. [source-pins.json](source-pins.json) freezes the inspected originals. The preparation script requires a new source/rights/privacy review if an original checksum changes.

| Case | Source | Licence | Scope and limitation |
| --- | --- | --- | --- |
| xr-001 | [Clavicle fracture](https://commons.wikimedia.org/wiki/File:Clavicle_fracture.jpg), mexican 2000 | CC BY-SA 2.0 | One selected image. Rectangular crop excludes peripheral burned-in identifying text; R marker retained. Caption supports right clavicle fracture, not detailed morphology or a comprehensive trauma report. |
| xr-002 | [Pneumothorax CXR](https://commons.wikimedia.org/wiki/File:Pneumothorax_CXR.jpg), Clinical Cases | CC BY-SA 2.5 | One unannotated image; source already has a black redaction. Caption supports left pleural air, displacement and small left effusion. Its fictional tension vignette is not patient history or proof of clinical tension physiology. |
| xr-003 | [PA](https://commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg) and [lateral](https://commons.wikimedia.org/wiki/File:Normal_lateral_chest_radiograph_(X-ray).jpg), Mikael Häggström | CC0 | Companion pages explicitly link the views and supply the same history. Source describes a normal chest without injury; no exhaustive normal findings or occult-injury exclusion is inferred. Prior lateral cropping retained in provenance. |

The suggested Colles image has diagnostic circles; the suggested pneumothorax composite has arrows/multiple stages. Neither is used as an unassisted quiz image. No diagnostic pixels were reconstructed, no synthetic imaging was generated. Visual technical inspection is recorded; final clinical privacy/suitability review remains pending.

Required credits, licence links and modification notices are available beside every image. These can reveal the source diagnosis, so all cases are explicitly **ineligible for blinded assessment**. ShareAlike obligations apply to applicable adapted image material and are distinct from application-code licensing. CC0 credit is retained voluntarily. Display/commercial reuse/adaptation/redistribution were reviewed; retrieval indexing and AI inference remain unknown and unused. Training is prohibited by platform policy.

## Storage and reproducible setup

Use Node 24+ for the importer's built-in SQLite. Install the package-lock dependencies with `npm ci`. No extra paid storage is provisioned. Downloading is performed by the application tooling, not manually by the user:

```sh
npm run quiz:prepare
```

This uses the existing official Commons API importer with HTTPS hostname allowlisting, public-address validation/DNS pinning, no unsafe redirects, timeouts, file-size limits, format decoding and SHA256 deduplication. Originals and evidence stay under ignored `.education-storage`; sanitized/cropped PNG delivery copies go under ignored `.quiz-images`. Repeating the command reuses the same source records and delivery paths. `server/quiz-content/cases.json` contains private source-supported question/rubric/reference drafts generated by `scripts/quiz/build-content.mjs`; it is packaged only into the API function, never the browser bundle/static directory. Keep source patient history separate from authored teaching explanations.

Four raster delivery images total **9,167,423 bytes (~9.17 MB)**. One hundred complete loads of all four transfer about 0.92 GB before browser/CDN caching. Exact hosting cost depends on the project's existing Vercel plan and traffic. Deployed copies are persistent immutable Vercel static assets served from the same protected origin, not Commons hotlinks or local-only paths. Original files/evidence should be backed up to an authorized private archive; do not add imaging datasets or signing secrets to Git. The packaged OHIF/CT assets are larger and remain documented under `docs/ohif`.

Local software test (loopback only):

```sh
node server/quiz-local.cjs
VITE_TEACHING_PREVIEW=true npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

The local server explicitly permits only that development origin; this exception is not packaged into the deployed function.

Protected preview packaging/deployment, after preparing the existing pinned OHIF and CT delivery assets described in `docs/ohif`:

```sh
npm run build:ohif-preview
npx --yes vercel@64.0.2 deploy --prebuilt --target preview --scope fadi-t-projects12 --yes
```

The package script creates a private ignored `.quiz-signing-secret` once and injects it into the server function environment only. Preserve it across preview rebuilds to keep submission receipts valid. Do not expose `.vc-config.json` function environment values or copy the secret into a `VITE_` variable. Preview packaging uses absolute app asset paths, same-origin images and private rubrics; existing OHIF isolation headers/workers/codecs remain intact. Do not promote this editorial sandbox to production.

## Review dependencies

A real clinical reviewer must approve image suitability/privacy, questions, expected concepts/alternatives, negative findings, critical-error classifications and reference wording. Add reviewed image coordinates/annotations only when actually authored and checked. The Commons captions are source evidence, not clinician-approved reference reports. No reviewer identities/dates have been fabricated.

Account-synced quiz attempts are not implemented in this slice; sign-in/recovery verification remains separately deferred as requested. Browser-local history is not a remote medical record or a cross-device learning record. Feedback questions are saved locally for inspection, not delivered to a remote editor inbox. Profile selection changes the displayed learner profile; these initial question drafts do not yet offer separate clinically reviewed profile-specific curricula. No AI service receives images/reports and no new migrations or account roles are required for this preview.
