import { readFile, writeFile, mkdir, cp, access } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
const repo = process.cwd();
const lock = JSON.parse(await readFile(resolve(repo, "viewer/ohif-lock.json")));
const source = resolve(process.env.OHIF_SOURCE || ".ohif-source");
const run = (command, args, cwd) =>
  new Promise((ok, no) => {
    const p = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        PUBLIC_URL: lock.publicUrl,
        APP_CONFIG: "config/radrep.js",
        QUICK_BUILD: "true",
        NODE_ENV: "production",
      },
    });
    p.on("error", no);
    p.on("exit", (code) =>
      code === 0 ? ok() : no(new Error(`${command} exited ${code}`)),
    );
  });
try {
  await access(resolve(source, "yarn.lock"));
} catch {
  await mkdir(source, { recursive: true });
  const archive = resolve(source, "source.tar.gz");
  await run(
    "curl",
    [
      "-L",
      "--fail",
      "--silent",
      "--show-error",
      "--max-time",
      "300",
      `https://codeload.github.com/OHIF/Viewers/tar.gz/${lock.commit}`,
      "-o",
      archive,
    ],
    repo,
  );
  await run(
    "tar",
    ["-xzf", archive, "--strip-components=1", "-C", source],
    repo,
  );
}
await cp(
  resolve(repo, "viewer/config.js"),
  resolve(source, "platform/app/public/config/radrep.js"),
);
await run(
  "npx",
  [
    "--yes",
    "yarn@1.22.22",
    "install",
    "--frozen-lockfile",
    "--production=false",
    "--network-timeout",
    "120000",
  ],
  source,
);
await run("npx", ["--yes", "yarn@1.22.22", "run", "build"], source);
await mkdir(resolve(repo, ".ohif-build"), { recursive: true });
await cp(resolve(source, "platform/app/dist"), resolve(repo, ".ohif-build"), {
  recursive: true,
});
await cp(
  resolve(source, "LICENSE"),
  resolve(repo, ".ohif-build/LICENSE-OHIF.txt"),
);
await cp(
  resolve(repo, "viewer/bridge.js"),
  resolve(repo, ".ohif-build/radrep-bridge.js"),
);
const html = await readFile(resolve(repo, ".ohif-build/index.html"), "utf8");
await writeFile(
  resolve(repo, ".ohif-build/index.html"),
  html.replace(
    "</head>",
    '<script src="/ohif/radrep-bridge.js"></script></head>',
  ),
);
await writeFile(
  resolve(repo, ".ohif-build/radrep-build.json"),
  JSON.stringify({ ...lock, builtAt: new Date().toISOString() }, null, 2),
);
console.log(`Built our OHIF ${lock.tag} at ${lock.publicUrl}`);
