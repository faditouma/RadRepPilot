# RadRepPilot GitHub Update Checklist

Use this folder as the RadRepPilot project root:

`/Users/faditouma/Documents/New project/RadRepPilot`

Remote already configured:

`https://github.com/faditouma/RadRepPilot.git`

## Files that belong in the RadRepPilot GitHub repo

- `src/`
- `public/radrepilot-icon.svg`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `README.md`
- `.gitignore`
- `GITHUB_UPDATE_FILES.md`

## Do not commit

- `node_modules/`
- `dist/` unless you intentionally want to publish a static build artifact
- `.vite/`
- `.DS_Store`
- `.Rhistory`
- `*.tsbuildinfo`
- `.env` or any real secrets

## Usual update flow

From this folder:

```bash
cd "/Users/faditouma/Documents/New project/RadRepPilot"
npm install
npm test
npm run build
git status
git add src public index.html package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json README.md .gitignore GITHUB_UPDATE_FILES.md
git commit -m "Update RadRepPilot"
git push -u origin main
```

If GitHub asks for authentication, use your normal GitHub Desktop, token, SSH, or browser-based workflow.

## Quick sanity check before publishing

- App builds without errors.
- No patient-identifying information is present.
- No proprietary guideline text is copied verbatim.
- Safety language remains visible: prototype only, user-entered findings only, clinician/radiologist verification required.
