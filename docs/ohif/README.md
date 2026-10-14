# Protected CT editorial preview

The `education/ohif-ct` branch adds an independently built OHIF application in an iframe beside the existing reporting application. It does not replace RadRepPilot’s French workspace, templates or calculators. The teaching case is an unpublished draft, with no manufactured findings, rubric, reviewer or approval date. Assessment remains disabled.

## Versions and source

OHIF/Viewers **v3.11.1**, commit `3c2b027e8bc7a238ffe46ecb5f57c6c913069c3e`, is pinned in `viewer/ohif-lock.json`. The implementation follows the official [iframe deployment](https://docs.ohif.org/3.11/deployment/iframe/), [production build](https://docs.ohif.org/3.11/deployment/build-for-production/) and [DICOM JSON datasource](https://docs.ohif.org/3.11/configuration/datasources/dicom-json/) instructions. This is a separately compiled application, not a React component. OHIF's MIT notice accompanies its distribution; image licensing remains separate.

Study `ct-001` comes from the TCGA-LUAD collection, [DOI 10.7937/K9/TCIA.2016.JGNIHEP5](https://doi.org/10.7937/K9/TCIA.2016.JGNIHEP5), acquired through supported anonymous IDC S3 access with s5cmd. Four independently checked CT series have **CC BY 3.0** licences. The full per-series source evidence, required citations, geometry, source/delivery/pixel checksums and modifications are recorded in `ct-001-source-rights.json`. The source collection label does not establish an imaging diagnosis. See [IDC licensing](https://learn.canceridc.dev/data/licensing) and [supported downloads](https://learn.canceridc.dev/data/downloading-data/downloading-data).

There are **89 instances in all four series listed for this study by IDC** (38 + 38 + 11 + 2 scouts), approximately 47 MB. This is complete against the source inventory; a clinician must still determine diagnostic completeness and suitability. No SR, SEG or answer annotations were acquired. Required attribution is visible in the case page. The collection name may reveal diagnostic context; this draft is unsuitable for blinded assessment until that limitation is reviewed.

## Reproduce the import and build

Use Node 22 with npm, Python 3.11+ and sufficient disk space (about 3 GB for the OHIF source/dependencies plus 250 MB deployment output). Install Python acquisition tools in an isolated environment:

```sh
python3 -m venv .dicom-study/venv
.dicom-study/venv/bin/pip install idc-index==0.13.0 pydicom==3.0.2
.dicom-study/venv/bin/python scripts/dicom/acquire-study.py --repo . --s5cmd .dicom-study/venv/bin/s5cmd
npm ci
npm run build:ohif
npm run build:ohif-preview
```

The importer accepts only the recorded supported bucket/UUID paths, a small reviewed CT inventory, allowed licences and exact expected source checksums. It has a five-minute acquisition timeout, a 100 MB inventory limit, geometry/calibration validation, duplicate SOP detection and count validation. Repeating preparation overwrites deterministic delivery filenames without duplicating assets. It preserves pixels, orientation and calibration and orders slices by patient geometry, with acquisition metadata tie-breakers. This is a curated administrative script, not a public URL upload endpoint. Arbitrary URLs, archives and patient uploads are not supported.

Original files and derivative DICOM delivery files live in ignored `.dicom-study/`; OHIF source/build live in ignored `.ohif-source/` and `.ohif-build/`. Large binary datasets are not committed. Preserve source evidence and checksums with every transfer. Delivery copies remove private/descriptive/identifier/date fields and use neutral filenames. This metadata minimization does **not** certify de-identification: unknown burned-in annotation requires visual inspection, and clinical/privacy approval remains unset.

## Storage, deployment and access

The prebuilt package contains the RadRepPilot Vite application at `/`, our OHIF build at `/ohif/`, and curated DICOM files plus manifest at `/imaging/ct-001/`. It uses Vercel immutable static deployment storage, not local ignored files or unstable hotlinks. The browser does not use IDC's public viewer or backend. COOP/COEP/CORP, same-origin iframe policy, correct routing, workers/codecs, JSON/DICOM MIME types and missing-image 404s are configured by `package-preview.mjs`.

Deploy **only to the existing protected preview environment**:

```sh
npx vercel@64.0.2 deploy --prebuilt --target preview --scope fadi-t-projects12 --yes
```

Open the returned preview URL with `/#/learn/ct/ct-001`. Sign in to Vercel using the existing account with preview access. No bypass link is provided. Production is unchanged. Vercel authentication protects the page, viewer and image files together; the code must not be promoted to an unprotected production environment as an editorial-access mechanism.

A normal `npm run build` does not package the ignored study or viewer. The explicit preview packaging step is required. One study transfer is around 47 MB; 100 complete study loads would transfer approximately 4.7 GB before browser/CDN reuse. Actual charges depend on the existing plan. No new paid storage was provisioned.

## Reports and account storage

The report editor remains in the parent application while OHIF runs in the iframe. A draft belongs to the exact case ID/version and signed-in identity. Browser-local drafts are clearly labelled when no RadRepPilot account is signed in. Signing in to RadRepPilot enables private Supabase draft and immutable attempt sync. Vercel preview sign-in and RadRepPilot sign-in are separate.

Migration `supabase/migrations/20261014022829_ohif_owned_drafts_and_attempts.sql` was applied to the existing Supabase project. It enables owner-only RLS and denies anonymous access. Submitted account attempts cannot be updated or deleted by learners. No service-role key is shipped in the frontend. Retain the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment configuration; use Supabase CLI migrations for fresh environments, not privileged browser keys.

Submission saves the report against case/version and OHIF version. It does not invent an expert report or grading result for an unreviewed study. Required next steps are pixel/privacy inspection, source-supported clinical interpretation, a clinician-authored reference report/rubric and actual clinical/rights approval before learner publication.

## Verification

OHIF compiled from the pinned commit. DICOM metadata/geometry, all 89 pixel checksums and inventory counts validated. Preliminary source contact-sheet inspection performed (not clinical or privacy approval). Existing application checks: 212 Vitest tests and eight education API test groups pass; TypeScript/Vite build passes. The protected remote manifest confirms 4 series/89 instances; viewer configuration confirms `/ohif` routing. Browser verification on the protected deployment confirms actual CT images render beside the report editor; wheel/keyboard/scrollbar slice navigation, series selection, DICOM window/level, lung presets, zoom, pan, fullscreen and cine controls work. A browser-local editorial draft saves and resumes after reload. Account-sync RLS/ACLs were inspected; this browser session did not sign in to RadRepPilot, so account-sync submission is not browser-verified. Code tests are not clinical validation.

Source presets for acquisition 2 and scouts initially produce dark images; apply an appropriate OHIF window preset or adjust window/level. All source window values remain preserved. A series change after cine can briefly retain the previous slice index; moving the navigation scrollbar selects an in-range image. These usability limitations need review before learner publication.

Final protected preview: https://radreppilot-i973gdfhv-fadi-t-projects12.vercel.app/#/learn/ct/ct-001

This prebuilt CT preview packages the static application and Supabase report sync. The older education API server is not deployed in this artifact; its dashboard/library APIs require their documented backend deployment. Use the direct CT route above for this acceptance slice. Existing reporting tools remain available in the static application.

The browser-local report submission was verified against ct-001 version 1 with editing locked afterward. Screenshots of the actual workspace and submission are saved alongside this document. A repeated import produced exactly 89 delivery files with unchanged checksums and retained citations; unknown licence evidence was rejected before DICOM processing.
