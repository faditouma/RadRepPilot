import {
  readFile,
  writeFile,
  mkdir,
  cp,
  access,
  readdir,
  rm,
} from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
const root = process.cwd();
const run = (command, args) =>
  new Promise((ok, no) => {
    const p = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    p.on("error", no);
    p.on("exit", (c) =>
      c === 0 ? ok() : no(new Error(`${command} exited ${c}`)),
    );
  });
await access(resolve(root, ".ohif-build/index.html"));
await access(resolve(root, ".dicom-study/delivery/manifest.json"));
process.env.VITE_TEACHING_PREVIEW = "true";
await run("npm", ["run", "build"]);
const output = resolve(root, ".vercel/output");
const stat = resolve(output, "static");
await rm(stat, { recursive: true, force: true });
await mkdir(stat, { recursive: true });
await cp(resolve(root, "dist"), stat, { recursive: true });
await cp(resolve(root, ".ohif-build"), resolve(stat, "ohif"), {
  recursive: true,
});
const catalogues = [];
for (const caseId of ["ct-001", "ct-002"]) {
  const delivery = resolve(
    root,
    caseId === "ct-001"
      ? ".dicom-study/delivery"
      : `.dicom-study/${caseId}/delivery`,
  );
  await cp(delivery, resolve(stat, `imaging/${caseId}`), { recursive: true });
  const catalog = JSON.parse(
    await readFile(resolve(root, `docs/ohif/${caseId}-catalog.json`), "utf8"),
  );
  catalogues.push(catalog);
  await writeFile(
    resolve(stat, `imaging/${caseId}/catalog.json`),
    JSON.stringify(catalog),
  );
}
await writeFile(
  resolve(stat, "imaging/cases.json"),
  JSON.stringify(catalogues),
);
await writeFile(
  resolve(output, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: "/(.*)",
          headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Resource-Policy": "same-origin",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "same-origin",
          },
          continue: true,
        },
        {
          src: "/ohif/(.*)",
          headers: { "Content-Security-Policy": "frame-ancestors 'self'" },
          continue: true,
        },
        {
          src: "/imaging/(.*)",
          headers: { "Cache-Control": "private, max-age=3600" },
          continue: true,
        },
        { handle: "filesystem" },
        { src: "/imaging/(.*)", status: 404 },
        { src: "/ohif/(.*)", dest: "/ohif/index.html" },
        { src: "/(.*)", dest: "/index.html" },
      ],
      overrides: {
        ...Object.fromEntries(
          (
            await Promise.all(
              ["ct-001", "ct-002"].map(async (id) =>
                (await readdir(resolve(stat, `imaging/${id}`)))
                  .filter((f) => f.endsWith(".dcm"))
                  .map((f) => [
                    `imaging/${id}/${f}`,
                    { contentType: "application/dicom" },
                  ]),
              ),
            )
          ).flat(),
        ),
        "imaging/ct-002/manifest.json": { contentType: "application/json" },
        "imaging/ct-002/catalog.json": { contentType: "application/json" },
        "imaging/cases.json": { contentType: "application/json" },
        "imaging/ct-001/manifest.json": { contentType: "application/json" },
        "imaging/ct-001/catalog.json": { contentType: "application/json" },
      },
    },
    null,
    2,
  ),
);
console.log(
  "Packaged immutable same-origin preview assets. Deploy ONLY to the protected Vercel preview environment.",
);
