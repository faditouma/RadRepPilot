# Guided teaching preview

## Operational scope

The protected preview supplies its own functioning case listing at `/#/learn` and two working image routes. It no longer relies on the undeployed older education dashboard API for this slice. The existing reporting/requisition tools remain linked. Production is unchanged.

`ct-001`, version 2, is explicitly an **interventional imaging demonstration**: source StudyDescription is `CT LUNG BIOPSY`, with `DYNAMIC MODE`. Downloading all source-listed CT series does not establish routine diagnostic completeness. This demonstration cannot be approved for diagnostic assessment. Historical version-1 attempts remain unchanged.

`ct-002`, version 1, is a **diagnostic teaching candidate**, using a selected 101-image LIDC-IDRI thoracic CT series (`ThoraxRoutine 3.0 B31f`). Individual-series IDC licence evidence confirms CC BY 3.0. Original source DOI: 10.7937/K9/TCIA.2015.LO9QL9SX. The exact source XML, `tcia-lidc-xml/187/107.xml`, matches both StudyInstanceUID and SeriesInstanceUID; all characterized reader marks reference SOP instances actually imported. TCIA independently licences those XML annotations as CC BY 3.0. Source geometry and all pixel checksums are preserved.

Four anonymous source readers each recorded characterized nodule marks, with additional small-nodule/non-nodule marks. Their feature ratings and mark identities are retained **without forced consensus or inferred malignancy**. They are source-provided interpretation evidence, not a complete diagnostic report and not a RadRepPilot approval. Full contour provenance is in `ct-002-clinical-evidence.json`; it is not copied into the static learner package. A concise protected source record is stored in Supabase. The authored vignette is an original task, with no fictional patient facts. Expected findings, reference report, alternatives, key negatives and critical errors remain blank pending clinical authorship/review.

## Existing guided reporting workflow

The image workspace mounts the existing `ReportingWorkflowPage`, `StructuredFieldRenderer`, `ReportDraftPanel`, report generator, key-negative/incidental tools and `HelperDrawer`. The relevant pulmonary-nodule schema is adapted to start with **unassessed** choices; scenario quick-fills are hidden. The original general reporting workspace retains its own defaults and storage. Case mode does not read or overwrite its global draft key.

Case draft/attempt storage records identity, case/version, workflow ID/version, OHIF version, structured answers, generated report and manually edited report separately. Manual wording survives structured-field edits until the learner explicitly regenerates. The original nodule generator was corrected to avoid asserting a solitary nodule when no nodule descriptors were entered. Source patient risk and guideline eligibility are not inferred. Existing Fleischner support is labelled supplementary international prototype assistance; the source study does not establish guideline applicability. Primary reference: https://pubs.rsna.org/doi/10.1148/radiol.2017161659 . No protected guideline tables were copied.

## Viewer fixes

OHIF remains pinned at v3.11.1 / commit 3c2b027e8bc7a238ffe46ecb5f57c6c913069c3e, with a reproducible `radrep.1` patch in `scripts/dicom/patch-ohif.mjs`. It stops cine on a series change, resets the new stack to its middle slice, clears stale position/LUT presentation and clamps the index before applying the stack. It selects the preferred series using OHIF's documented `initialSeriesInstanceUID` parameter. `radrepWindow` sets a display preset (soft tissue for the demonstration; lung for the diagnostic candidate). Source pixel data and DICOM window metadata remain unchanged. The OHIF series panel starts collapsed to provide a larger image; it can be reopened for series switching.

## Protected editorial and feedback workflow

Migration `20261014030747_guided_teaching_references.sql` is applied to the existing Supabase project. Editorial membership is a separate server-managed `education_editor_roles` table; learner profile roles/user metadata do not grant access. Public/anonymous roles cannot read private references, memberships or self-assessments. Editors can save private fields and request review. Only explicitly assigned reviewers can record privacy inspection and approve clinical content. Approval requires a diagnostic task, verified rights, actual privacy review, source interpretation, expected findings and a reference report. Reviewer ID/time come from the authenticated action. Approved/retired reference versions cannot be edited in place.

`education_feedback(attempt_id)` requires an owned submitted attempt and returns no reference while review is pending. For an approved version it returns the acceptable example report and reviewed concepts for side-by-side comparison and structured self-assessment. The self-assessment table is owner-protected. Critical-error concepts remain visible independently of any total; there is no automatic score. Automated grading is disabled and requires a separately approved case-specific rubric and evaluation.

No real clinical approval, privacy approval, reviewer identity, approval date or reference truth was manufactured. The comparison branch is verified with software-only test fixtures, not by approving these cases.

### Provisioning editorial access

A trusted project administrator must verify a human's identity and assign only the appropriate role. Run in the Supabase SQL editor with the exact confirmed RadRepPilot auth UUID:

```sql
insert into public.education_editor_roles(user_id,role)
values ('CONFIRMED_AUTH_USER_UUID','author');
```

Use `reviewer` only for a suitably qualified, authorized reviewer. This grant is not clinical approval. No account has been automatically promoted, and the role table currently requires administrator provisioning. Never use a frontend service-role key or self-editable profile fields for this.

## Import, storage and deployment

Use `scripts/dicom/acquire-study.py --case-id ct-002 --repo . --s5cmd PATH_TO_S5CMD` to reacquire verified DICOM through supported IDC anonymous access, with expected original checksums. `prepare-study.py` verifies a separately reviewed rights record before processing, then validates count/CT format/geometry/calibration and preserves pixels. Individual-source/annotation rights and citations are in `ct-002-source-rights.json`. Image files and the OHIF build remain ignored by Git.

`npm run build:ohif-preview` explicitly packages both study deliveries and a safe catalogue at `/imaging/cases.json`. It sets `VITE_TEACHING_PREVIEW=true`; ordinary builds preserve the broader application's routing. Our OHIF application and both imaging deliveries are hosted as same-origin immutable static Vercel artifacts behind existing preview authentication. Supabase stores private account drafts, attempts and reference/review records. About 100 MB total imaging payload is present (47 MB + 53 MB); 100 full loads of both studies would transfer roughly 10 GB before caching. No new paid resources were created.

## Verification and remaining dependencies

All 217 application tests pass (212 existing plus five additional teaching tests). The teaching tests verify blank/unassessed defaults, separate generated/edited output, global-draft isolation, manual-edit preservation, pending-answer concealment and structured self-assessment with software-only fixtures. Eight existing education API test groups also pass. Production TypeScript/Vite build and our patched OHIF build pass. Real delivery checks confirm 89 + 101 instances and unchanged pixels. Remote database checks confirm RLS and reject unauthorized reference access/writes.

Browser verification confirms actual diagnostic CT rendering, automatic middle-slice selection and lung preset, slice navigation and window/level changes alongside the existing guided controls. Browser-local structured draft save, reload/resume and submission have been verified on the protected deployed preview. Account sign-in/resume/submission is pending the user's sign-in; browser-local saves are explicitly labelled and must not be reported as account-synced verification. A real clinically approved reference cannot be demonstrated until the human review dependency is fulfilled.

Remaining content dependencies: determine the precise focused teaching task for ct-002; inspect all supplied pixels for privacy/quality; author a source-supported reference report, acceptable interpretations/negatives/critical errors; record real clinical review. Consider whether mandatory source attribution and the guided module's name preclude blinded assessment. Do not convert ordinal reader malignancy ratings into diagnoses or use collection names as imaging truth.

## Preview account recovery

Protected deployment: https://radreppilot-teaching-preview-fadi-t-projects12.vercel.app . Target is preview; Vercel Authentication remains enabled. Production is unchanged.

Login/signup now provide confirmation resend and password recovery. The standalone `/auth/callback` page lets Supabase process its auth fragment before the HashRouter mounts, and handles password reset entry by the user. Configure Supabase Authentication → URL Configuration with these exact additional redirect URLs, preserving the production Site URL and existing allowlist:

- `https://radreppilot-teaching-preview-fadi-t-projects12.vercel.app/auth/callback`
- `https://radreppilot-teaching-preview-fadi-t-projects12.vercel.app/auth/callback?mode=recovery`

Dashboard configuration and actual reset-email delivery still need verification after administrator dashboard sign-in. Do not change email confirmation requirements or manually confirm accounts. Open the protected preview in the same browser before following a reset link. Existing confirmed accounts should use sign-in/password recovery; repeat signup does not prove a new email was sent. Profiles are created by the existing account-setup workflow, separately from Auth registration.

Migration `20261014141808_guided_teaching_attempt_guards.sql` is applied. It prevents new account drafts/attempts for retired or unknown/unverified cases, bounds generated/structured payload sizes, and exposes only safe case-status metadata to the preview listing. Reference answers remain private.

### Recovery flow correction (October 14)

The reset email was reported to land on the legacy GitHub Pages site (`faditouma.github.io/RadRepPilot/`), which did not contain the preview callback. The project administrator confirmed saving the exact protected-preview recovery redirect above. The production Site URL was not changed. Request a new email from the preview after that configuration change; old links may be used or expired.

The application now intercepts `PASSWORD_RECOVERY` globally, including a recovery link that lands at the home page without `mode=recovery`. It captures only recovery intent before the SDK consumes the fragment and stores no tokens in that marker. The password form stays visible until the user submits a change. A separate protected `/#/account/security` route and profile links are available from the case listing and settings. Successful password change displays explicit confirmation.

Auth accounts, learner profiles and preferences remain separate. A narrow existence check confirmed the troubleshooting user's profile and preference records both exist; no personal profile values were read or changed. End-to-end actual password change remains a user handoff: automated tests validate recovery routing and no automatic password change, but must not be claimed as the user's completed reset.
