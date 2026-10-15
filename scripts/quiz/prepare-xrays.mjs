import { importCommons } from "../education/import.mjs";
import { openStore, storage } from "../../server/store.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
const specs = [
  {
    id: "xr-001",
    files: ["File:Clavicle fracture.jpg"],
    crops: [{ left: 70, top: 60, width: 880, height: 740 }],
    suitability:
      "Selected right clavicle photograph. Peripheral burned-in identifiers excluded by a rectangular crop; anatomy in the selected field and R marker retained. No claims about a complete trauma series.",
  },
  {
    id: "xr-002",
    files: ["File:Pneumothorax CXR.jpg"],
    crops: [null],
    suitability:
      "Single unannotated chest image; original contains an existing black redaction. Source describes left pleural air, displacement and a small left effusion. Fictional source vignette is not source-patient history.",
  },
  {
    id: "xr-003",
    files: [
      "File:Normal posteroanterior (PA) chest radiograph (X-ray).jpg",
      "File:Normal lateral chest radiograph (X-ray).jpg",
    ],
    crops: [null, null],
    suitability:
      "Linked PA/lateral sources describe the same age/history and identify the companion view. Lateral source notes previous cropping for a low field. Selected two views, not a complete diagnostic study.",
  },
];
const pins = JSON.parse(await readFile("docs/quiz/source-pins.json", "utf8"));
const db = openStore();
const manifest = {
  accessDate: new Date().toISOString(),
  cases: [],
  excluded: [
    {
      source: "File:Colles fracture.JPG",
      reason:
        "Fracture circles reveal the answer; not used for an unassisted question.",
    },
    {
      source: "File:Chest X-ray of pneumothorax.png",
      reason:
        "Annotated multistage treatment composite; not imported for the quiz.",
    },
  ],
};
await mkdir(".quiz-images", { recursive: true });
for (const spec of specs) {
  const assets = [];
  for (let i = 0; i < spec.files.length; i++) {
    const { asset: a } = await importCommons(db, spec.files[i]);
    if (pins[spec.files[i]] !== a.checksum)
      throw Error(
        "Source asset changed: rights, privacy and clinical source review required before rebuilding.",
      );
    if (
      ["commercial", "redistribution", "display", "adaptation"].some(
        (k) => a.rights[k]?.status !== "allowed",
      )
    )
      throw Error("Unknown/prohibited rights");
    const input = resolve(storage, "images", a.id + ".png");
    const pipe = sharp(input);
    if (spec.crops[i]) pipe.extract(spec.crops[i]);
    const bytes = await pipe.png().toBuffer();
    const checksum = createHash("sha256").update(bytes).digest("hex");
    const name = checksum.slice(0, 32) + ".png";
    await writeFile(resolve(".quiz-images", name), bytes);
    const dimensions = await sharp(bytes).metadata();
    assets.push({
      ...a,
      rightsReviewStatus: "verified",
      imagePath: "/quiz-images/" + name,
      deliveryChecksum: checksum,
      deliveryBytes: bytes.length,
      width: dimensions.width,
      height: dimensions.height,
      caseId: spec.id,
      viewIndex: i,
      modifications: [
        ...a.modifications,
        ...(spec.crops[i]
          ? [
              `Rectangular crop ${JSON.stringify(spec.crops[i])}; no reconstruction or generative editing; R marker preserved`,
            ]
          : []),
      ],
      technicalPrivacyInspection: {
        metadata: "PNG output strips EXIF/XMP",
        visibleIdentifiers: spec.crops[i]
          ? "Peripheral burned-in identifying text excluded by crop"
          : "No names, dates or accession numbers observed in visual inspection",
        clinicalPrivacyApproval: null,
      },
      suitability: spec.suitability,
    });
  }
  manifest.cases.push({ id: spec.id, assets });
}
await writeFile(
  "docs/quiz/source-rights.json",
  JSON.stringify(manifest, null, 2),
);
db.close();
console.log(
  JSON.stringify(
    manifest.cases.map((c) => ({
      id: c.id,
      assets: c.assets.length,
      bytes: c.assets.reduce((s, a) => s + a.deliveryBytes, 0),
    })),
  ),
);
