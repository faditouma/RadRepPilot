import { readFile, writeFile } from "node:fs/promises";
const manifest = JSON.parse(
  await readFile("docs/quiz/source-rights.json", "utf8"),
);
const extra = [
  ["uncertain", "Uncertain", "I am uncertain about this observation."],
  [
    "not_assessable",
    "Not assessable from supplied images",
    "This finding cannot be assessed from the supplied images.",
  ],
];
const q = (id, label, section, options, kind = "select") => ({
  id,
  label,
  section,
  kind,
  options: [...options, ...extra].map(([id, label, sentence]) => ({
    id,
    label,
    sentence,
  })),
});
const common = q(
  "scope",
  "How should the supplied examination be described?",
  "technique",
  [
    [
      "selected",
      "Selected image(s); a complete examination is not supplied",
      "Selected radiographic image(s) reviewed. A complete examination is not supplied.",
    ],
    [
      "complete",
      "Complete examination with calibrated measurements",
      "Complete radiographic examination with calibrated measurements reviewed.",
    ],
  ],
);
const limits = q(
  "limits",
  "What measurement limitation belongs in your report?",
  "technique",
  [
    [
      "uncalibrated",
      "No reliable spatial calibration is supplied",
      "No reliable spatial calibration is supplied; calibrated measurements are not reported.",
    ],
    [
      "measured",
      "Calibrated measurements are available",
      "Spatially calibrated measurements are available.",
    ],
  ],
);
const group = (
  id,
  title,
  expected,
  wording,
  explanation,
  evidence,
  severity = "major",
) => ({
  id,
  title,
  expected,
  wording,
  explanation,
  evidence,
  severity,
  provenance:
    "Authored draft explanation based on the linked source; clinical review pending",
  assessable: true,
});
function assets(id) {
  return manifest.cases
    .find((c) => c.id === id)
    .assets.map((a, i) => ({
      path: a.imagePath,
      label: id === "xr-003" ? (i ? "Lateral" : "PA") : "Selected radiograph",
      width: a.width,
      height: a.height,
      attribution: a.attribution,
      sourceUrl: a.sourceUrl,
      license: a.license,
      modifications: a.modifications,
    }));
}
const source = (id) => assets(id)[0].sourceUrl;
const cases = [
  {
    id: "xr-001",
    version: 1,
    title: "Shoulder-region radiograph 01",
    modality: "X-ray",
    bodySystem: "Musculoskeletal",
    difficulty: "Introductory",
    minutes: 5,
    context:
      "Clinical history and indication were not supplied with the source image. Describe the selected shoulder-region radiograph; do not infer a mechanism of injury or additional views.",
    contextProvenance:
      "Original teaching task; no fictional patient history added.",
    questions: [
      common,
      limits,
      q(
        "finding",
        "Which broad osseous observation is supported?",
        "findings",
        [
          [
            "fracture",
            "A fracture is visible",
            "A fracture is visible in the supplied image.",
          ],
          [
            "none",
            "No fracture is visible",
            "No fracture is visible in the supplied image.",
          ],
        ],
      ),
      q("location", "Where is the principal osseous finding?", "findings", [
        [
          "right_clavicle",
          "Right clavicle",
          "The principal finding involves the right clavicle.",
        ],
        [
          "left_clavicle",
          "Left clavicle",
          "The principal finding involves the left clavicle.",
        ],
        [
          "right_humerus",
          "Right proximal humerus",
          "The principal finding involves the right proximal humerus.",
        ],
        [
          "none",
          "No focal osseous finding",
          "No focal osseous abnormality is identified.",
        ],
      ]),
      q(
        "impression",
        "Choose the impression that best matches your observations.",
        "impression",
        [
          ["fracture", "Clavicular fracture", "Clavicular fracture."],
          [
            "normal",
            "No acute osseous abnormality",
            "No acute osseous abnormality.",
          ],
          [
            "humerus",
            "Proximal humeral fracture",
            "Proximal humeral fracture.",
          ],
        ],
      ),
    ],
    conflicts: [
      {
        when: { finding: "none", impression: "fracture" },
        message:
          "Your findings and impression disagree about whether a fracture is present. Reconcile them before submitting.",
      },
      {
        when: { finding: "fracture", impression: "normal" },
        message:
          "Your findings and impression disagree about whether a fracture is present. Reconcile them before submitting.",
      },
    ],
    hints: [
      "Follow the visible cortex of each bone from one end to the other.",
      "Check orientation markings before describing laterality.",
    ],
    rubric: [
      group(
        "study-scope",
        "State the study limitations",
        { scope: ["selected"], limits: ["uncalibrated"] },
        "Selected radiographic image reviewed; calibrated measurements and the complete trauma series are not supplied.",
        "This is a selected photograph of a radiograph, with no reliable DICOM spatial calibration.",
        "Image provenance and delivery manifest",
        "minor",
      ),
      group(
        "clavicle-fracture",
        "Identify the fracture and its location",
        {
          finding: ["fracture"],
          location: ["right_clavicle"],
          impression: ["fracture"],
        },
        "Fracture of the right clavicle.",
        "The source specifically documents a right clavicle fracture. A fracture mentioned in findings, a wrong location, and an inconsistent impression are evaluated as one underlying concept, rather than three repeated penalties.",
        source("xr-001"),
      ),
    ],
    referenceDraft: {
      technique:
        "Selected right shoulder-region radiograph. A complete trauma series and valid spatial calibration are not supplied.",
      findings:
        "A fracture of the right clavicle is shown. Further characterization and exclusion of additional injuries require review of the original examination.",
      impression: "Right clavicle fracture.",
    },
    sourceDiagnosis: "Right clavicle fracture",
    sourceFindings: ["Right clavicle fracture"],
    additionalInterpretations:
      "Fracture morphology, precise segment, displacement measurements and other negative findings are not established from the caption and await clinical review.",
  },
  {
    id: "xr-002",
    version: 1,
    title: "Chest radiograph 02",
    modality: "X-ray",
    bodySystem: "Chest",
    difficulty: "Intermediate",
    minutes: 7,
    context:
      "Source-patient history and indication are unavailable. Review the selected frontal chest image. The source’s separate fictional vignette is not used as this patient’s history.",
    contextProvenance:
      "Original teaching task; no fictional patient facts added.",
    questions: [
      common,
      limits,
      q("pleura", "Which broad pleural observation is supported?", "findings", [
        ["air", "Pleural air is visible", "Pleural air is visible."],
        [
          "none",
          "No pleural abnormality is visible",
          "No pleural abnormality is visible.",
        ],
        [
          "opacity",
          "Pleural opacity without pleural air",
          "Pleural opacity without pleural air is present.",
        ],
      ]),
      q("side", "Where is the principal pleural abnormality?", "findings", [
        ["left", "Left", "The principal pleural abnormality is left-sided."],
        ["right", "Right", "The principal pleural abnormality is right-sided."],
        ["both", "Both sides", "Pleural abnormalities involve both sides."],
        [
          "none",
          "No focal pleural abnormality",
          "No focal pleural abnormality is identified.",
        ],
      ]),
      q(
        "additional",
        "Which additional source-supported observations did you identify?",
        "findings",
        [
          [
            "shift",
            "Tracheal/cardiac displacement away from the affected side",
            "Tracheal and cardiac displacement away from the affected side is present.",
          ],
          [
            "fluid",
            "A small pleural effusion on the affected side",
            "A small pleural effusion is present on the affected side.",
          ],
          [
            "none",
            "No additional observation",
            "No additional observation is identified.",
          ],
        ],
        "checkbox-group",
      ),
      q(
        "impression",
        "Choose a cautious impression consistent with your observations.",
        "impression",
        [
          [
            "pneumothorax",
            "Pneumothorax; clinical tension physiology is not established here",
            "Pneumothorax. Clinical tension physiology cannot be established from this image and the supplied context alone.",
          ],
          ["normal", "No pleural abnormality", "No pleural abnormality."],
          [
            "tension",
            "Tension pneumothorax is clinically confirmed",
            "Tension pneumothorax is clinically confirmed.",
          ],
        ],
      ),
    ],
    conflicts: [
      {
        when: { pleura: "none", impression: "pneumothorax" },
        message:
          "Your pleural findings and impression are incompatible. Reconcile them before submitting.",
      },
      {
        when: { pleura: "air", impression: "normal" },
        message:
          "Your pleural findings and impression are incompatible. Reconcile them before submitting.",
      },
    ],
    hints: [
      "Review the lung margins and peripheral lung markings systematically.",
      "Revisit orientation, the mediastinum and the costophrenic regions.",
    ],
    rubric: [
      group(
        "pleural-air",
        "Identify the pleural finding and side",
        { pleura: ["air"], side: ["left"], impression: ["pneumothorax"] },
        "Left pneumothorax.",
        "The source describes a left pneumothorax and specifies how patient left relates to the displayed image. It does not provide real source-patient physiology.",
        source("xr-002"),
      ),
      group(
        "shift",
        "Recognize displacement",
        { additional: ["shift"] },
        "Tracheal and cardiac displacement away from the left-sided abnormality.",
        "Displacement is explicitly described by the source.",
        source("xr-002"),
      ),
      group(
        "effusion",
        "Recognize the additional pleural finding",
        { additional: ["fluid"] },
        "Small left pleural effusion.",
        "The source description also documents a small left pleural effusion.",
        source("xr-002"),
        "minor",
      ),
    ],
    criticalErrors: [
      {
        when: { impression: "tension" },
        title: "Unsupported clinical certainty",
        explanation:
          "The source links to a fictional vignette. The supplied image and task do not establish that the source patient had clinically confirmed tension physiology.",
        evidence: source("xr-002"),
        reviewStatus: "draft",
      },
    ],
    referenceDraft: {
      technique:
        "Selected frontal chest radiograph; a complete examination is not supplied.",
      findings:
        "Left pneumothorax with tracheal/cardiac displacement away from the affected side and a small left pleural effusion.",
      impression:
        "Left pneumothorax. Clinical tension physiology requires clinical assessment and is not established by the supplied context.",
    },
    sourceDiagnosis: "Left pneumothorax",
    sourceFindings: [
      "Left pleural air",
      "Tracheal/cardiac displacement",
      "Small left pleural effusion",
    ],
    additionalInterpretations:
      "Clinical physiology and management recommendations await clinical review.",
  },
  {
    id: "xr-003",
    version: 1,
    title: "Chest radiographs 03",
    modality: "X-ray",
    bodySystem: "Chest",
    difficulty: "Introductory",
    minutes: 5,
    context:
      "A 21-year-old woman presented with left-sided thoracic pain after a collision with another player during soccer.",
    contextProvenance:
      "Source-provided history from the linked PA and lateral image descriptions; no new patient facts added.",
    questions: [
      q("views", "Which supplied views are available?", "technique", [
        [
          "pa_lateral",
          "PA and lateral radiographs",
          "Supplied PA and lateral chest radiographs reviewed.",
        ],
        ["ap", "AP radiograph only", "AP chest radiograph reviewed."],
        ["ct", "CT series", "CT series reviewed."],
      ]),
      limits,
      q(
        "finding",
        "What broad conclusion is supported by the supplied images?",
        "findings",
        [
          [
            "no_injury",
            "No convincing injury is identified",
            "No convincing injury is identified on the supplied radiographs.",
          ],
          [
            "fracture",
            "A visible osseous injury",
            "A visible osseous injury is present.",
          ],
          ["pleural_air", "Pleural air is visible", "Pleural air is visible."],
        ],
      ),
      q(
        "impression",
        "Choose the conclusion that matches your observations.",
        "impression",
        [
          [
            "no_injury",
            "No convincing acute injury on supplied images",
            "No convincing acute injury on the supplied images.",
          ],
          ["fracture", "Visible osseous injury", "Visible osseous injury."],
          ["pneumothorax", "Pneumothorax", "Pneumothorax."],
        ],
      ),
    ],
    conflicts: [
      {
        when: { finding: "no_injury", impression: "fracture" },
        message:
          "Your findings and impression disagree about injury. Reconcile them before submitting.",
      },
      {
        when: { finding: "no_injury", impression: "pneumothorax" },
        message:
          "Your findings and impression disagree about pleural air. Reconcile them before submitting.",
      },
    ],
    hints: [
      "Use the same systematic review even when the image initially appears unremarkable.",
    ],
    rubric: [
      group(
        "views",
        "Identify the supplied projections",
        { views: ["pa_lateral"] },
        "PA and lateral chest radiographs.",
        "The paired source pages identify their respective projections and provide the same patient history.",
        source("xr-003"),
        "minor",
      ),
      group(
        "no-injury",
        "Avoid unsupported injury findings",
        { finding: ["no_injury"], impression: ["no_injury"] },
        "No convincing acute injury on the supplied chest images.",
        "The source describes a normal chest without signs of injury. This is not evidence for an exhaustive normal report or for excluding occult injury.",
        source("xr-003"),
      ),
    ],
    referenceDraft: {
      technique:
        "Supplied PA and lateral chest radiographs. The lateral source notes prior field cropping.",
      findings:
        "No convincing acute injury is identified on the supplied images. A complete original examination is not supplied.",
      impression:
        "No convincing acute injury on the supplied chest radiographs.",
    },
    sourceDiagnosis: "Normal chest; no signs of injury described by the source",
    sourceFindings: ["Source describes normal chest without signs of injury"],
    additionalInterpretations:
      "A comprehensive normal report and exclusion of occult injury are not supported by the caption and await clinical review.",
  },
];
for (const c of cases) {
  c.assets = assets(c.id);
  c.status = "draft";
  c.clinicalReview = null;
  c.privacyReview = null;
  c.rubricVersion = "1-draft";
  c.assessmentEligible = false;
  c.creditLimitation =
    "Required source credits can reveal the source diagnosis. These drafts are not available as blinded assessments.";
  c.learningObjectives = [
    "Describe supplied images without inventing missing information",
    "Match observations to a concise impression",
  ];
}
await writeFile(
  "server/quiz-content/cases.json",
  JSON.stringify(cases, null, 2),
);
console.log("Prepared 3 source-supported, unapproved quiz drafts.");
