# RadRepPilot — image-first education

Incremental education platform on the existing React/TypeScript/Vite application. Existing reporting workflows, requisitions and calculators remain under `/workspace`. The new `/learn` workspace adds profile switching, reporting and ordering exercises, private draft autosave, versioned submissions, answer reveal, self-assessment, progress/review scheduling and protected editorial controls.

Five actual individually licensed radiographs have been imported locally and linked to five unpublished reporting drafts. Five original source-supported Canadian ordering scenarios are also drafts. **Zero clinically reviewed cases are published.** No patient-image upload or automated clinical decision service exists.

## Run local editorial preview

Use Node 24.16 and the locked dependencies:

```sh
npm ci
npm run education:import
npm run education:seed
npm run build
npm run education:preview
```

Open `http://127.0.0.1:8787/#/learn` in a regular browser. The explicit loopback preview has author-only privileges and cannot manufacture reviewer approval. For frontend development, run `npm run dev` in another terminal; Vite proxies the education API. The existing Supabase sign-in is used in authenticated deployments; see setup below.

## Verification

```sh
npm test
npm run education:test
npm run build
```

212 existing Vitest tests and 8 Node API test groups passed. Import repeated without duplicates. All five image endpoints returned matching delivery checksums. Browser UI verification remains incomplete because the in-app browser did not load the app's module/CSS resources; see the verification record. Code tests are not clinical validation.

## Documentation

- [Repository audit](docs/education/AUDIT.md)
- [Implementation plan and assumptions](docs/education/PLAN.md)
- [Setup, migrations, auth, storage, transfer and deployment](docs/education/SETUP.md)
- [Actual imported assets and clinical/permission dependencies](docs/education/CONTENT-INVENTORY.md)
- [Source/rights manifest](docs/education/asset-manifest.json)
- [Unpublished case/series/rubric inventory](server/content/initial-drafts.json)
- [Verification and remaining browser checks](docs/education/VERIFICATION.md)

Originals, evidence and delivery images are in ignored `.education-storage`; do not commit large datasets or serve that directory publicly. Editorial JSON includes answer keys and must not be copied into frontend bundles/public directories. GitHub Pages alone cannot host the protected server. No paid resources, production deployment or remote database change was made. Scrollable CT/DICOM and optional AI grading are not released; their prerequisites are documented.
