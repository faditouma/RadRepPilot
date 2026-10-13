import { readFileSync, writeFileSync } from "node:fs";
import { openStore, saveContent, content } from "../../server/store.mjs";
const db = openStore();
const assets = db
  .prepare("SELECT data FROM assets")
  .all()
  .map((r) => JSON.parse(r.data));
const candidates = JSON.parse(
  readFileSync(
    new URL("../../server/content/import-candidates.json", import.meta.url),
  ),
);
const definitions = {
  "rr-001": {
    body: "Chest",
    objective: "Systematic review and limits of a selected chest image",
    diagnosis: null,
    concept:
      "Describe image quality and distinguish selected-image limitations from a full study",
    importance: "major",
    report:
      "Source identifies a PA chest radiograph and classifies it as normal. A radiologist must verify findings and relevant negatives on this exact image before this draft becomes an answer key.",
  },
  "rr-002": {
    body: "Chest",
    objective: "Describe source-supported focal pulmonary opacity",
    diagnosis: "Right middle lobe pneumonia (source description)",
    concept: "Right middle lobe pulmonary opacity / source-described pneumonia",
    side: "right",
    importance: "major",
    report:
      "Source-supported draft: the selected chest radiograph shows right middle lobe pneumonia according to the creator description. A clinician must verify exact images, distribution, relevant negatives and report wording before publication. Do not attribute a causative organism from the supplied radiograph.",
  },
  "rr-003": {
    body: "Musculoskeletal",
    objective: "Identify proximal humeral injury and study limitations",
    diagnosis: "Complex proximal humerus fracture",
    concept: "Complex proximal humerus fracture",
    importance: "major",
    report:
      "Selected radiograph demonstrates a complex proximal humerus fracture, as described in the source. Laterality, alignment, classification and additional views need review. This is a source-supported draft, not a reviewed example report.",
  },
  "rr-004": {
    body: "Chest",
    objective: "Identify pleural air and prioritize communication",
    diagnosis: "Left pneumothorax",
    concept: "Left pneumothorax",
    side: "left",
    importance: "critical",
    report:
      "Source describes a left pneumothorax, mediastinal displacement and a small left pleural effusion. Assess urgently in the clinical context; physiological tension cannot be established from this image alone. Clinician review must confirm this draft and communication wording.",
  },
  "rr-005": {
    body: "Musculoskeletal",
    objective: "Localize a clavicular injury",
    diagnosis: "Right clavicle fracture",
    concept: "Right clavicle fracture",
    side: "right",
    importance: "major",
    report:
      "Selected radiograph shows a right clavicle fracture according to the source description. Displacement, shortening, associated injuries and further-view requirements remain for clinical review.",
  },
};
for (const x of candidates) {
  const a = assets.find((a) => a.sourceTitle === x.title);
  if (!a || content(db, x.key, 1)) continue;
  const d = definitions[x.key];
  const c = {
    id: x.key,
    version: 1,
    kind: "report",
    status: "draft",
    locale: "en-CA",
    title: `Study ${x.key.slice(-3)} · ${d.body}`,
    audience: ["student", "resident", "referrer"],
    modality: "Radiograph",
    bodySystem: d.body,
    difficulty: "Foundation",
    objectives: [d.objective],
    vignette: {
      text: "Interpret the supplied selected radiograph. No source-patient clinical history is available. State limitations rather than assuming missing context.",
      provenance:
        "Original educational task; no fictional patient demographics added",
      sourcePatientFacts:
        x.key === "rr-002"
          ? [{ fact: "67-year-old man", source: a.sourceUrl }]
          : [],
    },
    studyCompleteness: "Selected image only; not a complete diagnostic study",
    series: [
      {
        id: "series-1",
        label: "Selected radiograph",
        format: "raster",
        assetIds: [a.id],
        orientation: null,
      },
    ],
    assessmentEligible: false,
    sourceSupported: {
      diagnosis: d.diagnosis,
      findingsEvidence: [a.sourceUrl],
      sourceDescription: a.sourceDescription,
    },
    clinicalReferences: [
      {
        url: a.sourceUrl,
        role: "Source-supported findings; clinician verification required",
      },
    ],
    clinicalReview: null,
    rightsReview: null,
    answer: {
      rubricVersion: "1-draft",
      referenceReport:
        d.report ||
        "Source-supported finding draft: " +
          a.sourceDescription +
          ". A clinician must confirm distribution, laterality and example report before publication.",
      rubric: [
        {
          id: "f1",
          expectedConcept: d.concept,
          anatomy: d.body,
          laterality: d.side || "unknown",
          presence: "present",
          acceptedSynonyms: [],
          importance: d.importance,
          support: { assetId: a.id, frame: 0 },
          assessable: d.diagnosis !== null,
          objective: d.objective,
        },
      ],
      requiredFindings: d.diagnosis ? [d.concept] : [],
      relevantNegatives: [],
      acceptableAlternates: [],
      errors: {
        critical:
          d.importance === "critical"
            ? [
                "Failure to recognize or communicate the source-supported pleural abnormality",
              ]
            : [],
        major: [],
        minor: [],
      },
      hints: [
        "Review image quality and available clinical context.",
        "Use a systematic review of the visible anatomy.",
        "Check the study limitations before finalizing your impression.",
      ],
      annotations:
        x.key === "rr-002"
          ? [
              {
                assetId: a.id,
                frame: 0,
                x: 0.31,
                y: 0.72,
                label: "Source-described region · draft annotation",
              },
            ]
          : x.key === "rr-004"
            ? [
                {
                  assetId: a.id,
                  frame: 0,
                  x: 0.75,
                  y: 0.4,
                  label: "Source-described pleural region · draft",
                },
              ]
            : [],
      teaching:
        "Work from these exact images. Describe observations, state uncertainty, and avoid unsupported patient details. All clinical content remains a draft pending review.",
    },
  };
  saveContent(db, c);
}
const url = "https://choosingwiselycanada.org/recommendation/radiology/";
// Original scenarios, concise paraphrases. Evidence is linked, never copied tables/algorithms.
const scenarios = [
  {
    id: "oi-001",
    title: "Back pain in primary care",
    vignette:
      "A fictional adult has five days of low back pain after lifting. Neurologic examination is normal; there is no fever, trauma, cancer history or bladder/bowel disturbance.",
    info: "New weakness, bladder dysfunction, systemic illness, cancer history or substantial trauma would change this pathway.",
    branches: [
      {
        id: "no",
        label: "No imaging now",
        exam: "None",
        contrast: "Not applicable",
        urgency: "No imaging now",
        question: "No requisition is needed at this stage.",
        explanation:
          "This scenario supplies no red flags. Discuss conservative care and reassessment; new concerning features require a different pathway.",
      },
    ],
    objective: "Recognize uncomplicated acute back pain",
  },
  {
    id: "oi-002",
    title: "A familiar headache pattern",
    vignette:
      "A fictional adult has recurrent headaches matching an established migraine pattern, with a normal neurologic examination and no new warning features.",
    info: "A new focal deficit, progressive change, cancer or immunodeficiency could alter the decision.",
    branches: [
      {
        id: "no",
        label: "No imaging now",
        exam: "None",
        contrast: "Not applicable",
        urgency: "No imaging now",
        question:
          "Document the stable pattern and absence of concerning features.",
        explanation:
          "A stable uncomplicated headache pattern does not routinely warrant imaging. A changed presentation requires reassessment.",
      },
    ],
    objective: "Identify headache features that change imaging need",
  },
  {
    id: "oi-003",
    title: "An ankle injury",
    vignette:
      "A fictional adult presents with a new ankle injury. The history does not yet establish weight-bearing ability or the precise site of bony tenderness.",
    info: "Establish pain location, posterior-edge/tip malleolar tenderness, and ability to take four steps immediately after injury and at assessment.",
    branches: [
      {
        id: "more",
        label: "More information needed",
        exam: "Pending examination",
        contrast: "Not applicable",
        urgency: "Assess during this visit",
        question: "Complete the clinical assessment before selecting imaging.",
        explanation:
          "The initial history is insufficient. Clinical examination determines whether a radiograph is appropriate.",
      },
      {
        id: "yes",
        label: "Radiograph after positive clinical criteria",
        requires: "criteria-positive",
        exam: "Ankle radiographs",
        contrast: "No",
        urgency: "During this visit",
        question:
          "Acute ankle injury with malleolar pain and qualifying tenderness or impaired weight bearing; assess for fracture.",
        explanation:
          "The supplied positive branch supports a radiograph; document the qualifying finding.",
      },
      {
        id: "no",
        label: "No imaging after negative clinical criteria",
        requires: "criteria-negative",
        exam: "None",
        contrast: "Not applicable",
        urgency: "No imaging now",
        question: "No requisition; document negative clinical criteria.",
        explanation:
          "With a completed negative assessment, routine ankle radiographs can be avoided.",
      },
    ],
    objective: "Seek missing decision-changing examination findings",
  },
  {
    id: "oi-004",
    title: "Abdominal pain in a child",
    vignette:
      "A fictional school-aged child has focal right lower quadrant tenderness and suspected appendicitis. The child is stable and ultrasound expertise is available.",
    info: "Clinical stability, local ultrasound expertise and the result of initial imaging affect escalation.",
    branches: [
      {
        id: "us",
        label: "Ultrasound first",
        exam: "Right lower quadrant ultrasound",
        contrast: "No",
        urgency: "Urgent, during this assessment",
        question:
          "Focal right lower quadrant pain and tenderness; assess for appendicitis.",
        explanation:
          "Ultrasound should be considered before CT in this pediatric scenario. Equivocal results need reassessment and discussion about further imaging.",
      },
      {
        id: "discuss",
        label: "Discuss with radiology",
        exam: "Discuss ultrasound pathway",
        contrast: "Discuss only if escalation is needed",
        urgency: "Urgent discussion",
        question:
          "Suspected pediatric appendicitis; discuss locally available initial ultrasound and escalation if equivocal.",
        explanation:
          "Discussion is an acceptable way to arrange the ultrasound-first pathway and clarify local capability.",
      },
    ],
    objective: "Consider ultrasound before pediatric CT",
  },
  {
    id: "oi-005",
    title: "Possible pulmonary embolism",
    vignette:
      "A fictional stable adult has symptoms raising possible pulmonary embolism, but pretest probability, relevant rule inputs and D-dimer status are not supplied.",
    info: "Establish validated pretest probability, relevant rule inputs, D-dimer when indicated, pregnancy, renal function, contrast history and chest radiograph context.",
    branches: [
      {
        id: "more",
        label: "More information needed",
        exam: "Risk assessment before selecting imaging",
        contrast: "Not decided",
        urgency: "Prompt clinical assessment",
        question:
          "Clarify pretest probability and appropriate rule/D-dimer inputs before an imaging requisition.",
        explanation:
          "Clinical risk assessment determines whether imaging is needed. Low-risk presentations with appropriate negative testing may avoid imaging. If imaging is needed, CTPA or V/Q selection depends on the context.",
      },
      {
        id: "discuss",
        label: "Discuss with radiology",
        exam: "CTPA / V/Q discussion after risk assessment",
        contrast: "Review contraindications if considering CTPA",
        urgency: "Prompt discussion",
        question:
          "Provide risk assessment and relevant tests; discuss examination selection if imaging is indicated.",
        explanation:
          "Discuss examination selection when clinical risk supports imaging and contrast, pregnancy or other circumstances complicate the choice.",
      },
    ],
    objective: "Avoid reflex CT without pulmonary embolism risk assessment",
    source: "https://choosingwiselycanada.org/recommendation/nuclear-medicine/",
  },
];
for (const s of scenarios) {
  if (content(db, s.id, 1)) continue;
  saveContent(db, {
    id: s.id,
    version: 1,
    kind: "ordering",
    status: "draft",
    locale: "en-CA",
    title: s.title,
    audience: ["student", "resident", "referrer"],
    modality: "Imaging selection",
    bodySystem: "Clinical reasoning",
    difficulty: "Foundation",
    objectives: [s.objective],
    vignette: {
      text: s.vignette,
      provenance:
        "Original fictional teaching vignette; no source-patient facts",
    },
    additionalInfo: s.info,
    assessmentEligible: false,
    questions: [
      "Is imaging needed?",
      "What additional information changes the decision?",
      "Which examination?",
      "Is contrast relevant?",
      "What urgency?",
      "What clinical question belongs on the requisition?",
    ],
    options: [
      { id: "no", label: "No imaging now" },
      { id: "more", label: "More information needed" },
      { id: "us", label: "Ultrasound" },
      { id: "yes", label: "Radiograph" },
      { id: "ct", label: "CT" },
      { id: "discuss", label: "Discuss with radiology" },
    ],
    clinicalReferences: [
      {
        url: s.source || url,
        jurisdiction: "Canada",
        version: s.source
          ? "Current live page accessed 2026-10-13"
          : "September 2026 update",
        accessDate: "2026-10-13",
        reviewDate: null,
      },
    ],
    clinicalReview: null,
    rightsReview: null,
    answer: {
      rubricVersion: "1-draft",
      referenceReport:
        "Acceptable requisition/action examples are listed in the reviewed decision branches after clinical approval.",
      branches: s.branches,
      rubric: [
        {
          id: "decision",
          expectedConcept: s.objective,
          anatomy: "Not applicable",
          laterality: "Not applicable",
          presence: "Not applicable",
          acceptedSynonyms: [],
          importance: "major",
          assessable: true,
          objective: s.objective,
        },
      ],
      hints: [],
      annotations: [],
      teaching:
        "Review the supplied branch conditions and safety-net the fictional scenario. This draft is educational and is not live clinical advice.",
      errors: { critical: [], major: [], minor: [] },
      relevantNegatives: [],
      acceptableAlternates: [],
    },
  });
}
const inventory = db
  .prepare("SELECT id,version,kind,status,data FROM content")
  .all()
  .map((r) => JSON.parse(r.data));
writeFileSync(
  new URL("../../server/content/initial-drafts.json", import.meta.url),
  JSON.stringify(inventory, null, 2),
);
console.log(
  `Seeded ${inventory.filter((c) => c.kind === "report").length} image-based drafts and ${inventory.filter((c) => c.kind === "ordering").length} ordering drafts. No approvals or publication.`,
);
db.close();
