import fs from "fs";
import path from "path";

const inputPath = "reports/acr-extraction/acr-procedure-rows.csv";
const cleanOutputPath = "data/acr/normalized/acr_procedure_rows_clean.csv";
const rejectedOutputPath = "reports/acr-extraction/acr-rejected-procedure-rows.csv";
const summaryOutputPath = "reports/acr-extraction/acr-cleaning-summary.csv";
const indexOutputPath = "src/data/appropriateness/normalized/acrClinicalIndex.json";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
          return text;
        })
        .join(",")
    )
    .join("\n");
}

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index] ?? "";
  });
  return obj;
}

function classifyAcrOptionKind(procedure) {
  const text = String(procedure ?? '').toLowerCase();

  const treatmentTerms = [
    'embolization',
    'embolisation',
    'drainage',
    'aspiration',
    'biopsy',
    'ablation',
    'thrombolysis',
    'thrombectomy',
    'stent',
    'stenting',
    'nephrostomy',
    'cholecystostomy',
    'arthrocentesis',
    'injection',
    'catheter',
    'treatment',
    'therapy',
    'therapeutic',
    'intervention',
    'interventional',
  ];

  if (treatmentTerms.some((term) => text.includes(term))) {
    return 'treatment_or_interventional';
  }

  return 'diagnostic_imaging';
}

function getField(row, candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key];
  }
  return "";
}

const imagingTerms = [
  "CT",
  "CTA",
  "MRI",
  "MRA",
  "US",
  "Ultrasound",
  "Radiography",
  "X-ray",
  "VQ",
  "V/Q",
  "PET",
  "SPECT",
  "Nuclear medicine",
  "Angiography",
  "Mammography",
  "Fluoroscopy",
  "Myelography",
  "DEXA",
  "Bone scan",
];

const rejectTerms = [
  "Panel Members",
  "Summary of Literature Review",
  "Introduction",
  "Background",
  "References",
  "Expert Panel",
  "Committee",
  "Principal Author",
  "Copyright",
  "ACR Appropriateness Criteria",
  "For additional information",
  "Literature Review",
];

const degreeTerms = [" MD", " MBBS", " PhD", " MPH", " MSc", " FACR"];

function startsWithImagingTerm(text) {
  const t = text.trim().toLowerCase();
  return imagingTerms.some((term) => t.startsWith(term.toLowerCase()));
}

function containsImagingTerm(text) {
  const t = text.toLowerCase();
  return imagingTerms.some((term) => t.includes(term.toLowerCase()));
}

function looksLikeAuthorList(text) {
  const commaCount = (text.match(/,/g) || []).length;
  const degreeCount = degreeTerms.reduce((count, term) => {
    return count + (text.includes(term) ? 1 : 0);
  }, 0);

  return commaCount >= 4 && degreeCount >= 2;
}

function isValidImagingProcedure(text) {
  const value = String(text ?? "").trim();

  if (!value) return false;

  if (rejectTerms.some((term) => value.toLowerCase().includes(term.toLowerCase()))) {
    return false;
  }

  if (looksLikeAuthorList(value)) return false;
  if (!containsImagingTerm(value)) return false;

  if (value.length > 160 && !startsWithImagingTerm(value)) return false;

  const sentenceCount = (value.match(/[.!?]/g) || []).length;
  if (sentenceCount >= 2 && !startsWithImagingTerm(value)) return false;

  return true;
}

function cleanProcedureName(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+;/g, ";")
    .replace(/\s+,/g, ",")
    .trim();
}

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeAppropriateness(value) {
  const text = String(value ?? "").toLowerCase();

  if (text.includes("usually appropriate")) return "Usually Appropriate";
  if (text.includes("may be appropriate")) return "May Be Appropriate";
  if (text.includes("usually not appropriate")) return "Usually Not Appropriate";

  return String(value ?? "").trim() || "Unspecified";
}

function deriveQuestionsFromScenario(topicTitle, variantTitle) {
  const text = `${topicTitle} ${variantTitle}`.toLowerCase();
  const questions = [];
  const seen = new Set();

  const rules = [
    {
      id: "trauma",
      label: "Trauma or recent injury?",
      keywords: ["trauma", "injury", "post-traumatic", "fracture"],
      phrase: "trauma or recent injury",
    },
    {
      id: "acute",
      label: "Acute presentation?",
      keywords: ["acute", "new onset", "sudden"],
      phrase: "acute presentation",
    },
    {
      id: "chronic",
      label: "Chronic or recurrent symptoms?",
      keywords: ["chronic", "recurrent", "follow-up", "surveillance"],
      phrase: "chronic or recurrent symptoms",
    },
    {
      id: "fever-infection",
      label: "Fever, infection, sepsis, or abscess concern?",
      keywords: [
        "fever",
        "infection",
        "infectious",
        "sepsis",
        "abscess",
        "pyelonephritis",
        "osteomyelitis",
      ],
      phrase: "fever or infection concern",
    },
    {
      id: "cancer",
      label: "Known cancer or malignancy concern?",
      keywords: [
        "cancer",
        "malignancy",
        "neoplasm",
        "tumor",
        "metastatic",
        "staging",
        "surveillance",
      ],
      phrase: "known cancer or malignancy concern",
    },
    {
      id: "immunosuppression",
      label: "Immunosuppression or neutropenia?",
      keywords: [
        "immunosuppression",
        "immunocompromised",
        "neutropenic",
        "neutropenia",
      ],
      phrase: "immunosuppression or neutropenia",
    },
    {
      id: "pregnancy",
      label: "Pregnant, postpartum, or pregnancy possible?",
      keywords: ["pregnancy", "pregnant", "postpartum", "peripartum"],
      phrase: "pregnancy or postpartum context",
    },
    {
      id: "hcg-positive",
      label: "β-hCG positive?",
      keywords: ["hcg positive", "β-hcg positive", "beta-hcg positive"],
      phrase: "β-hCG positive",
    },
    {
      id: "hcg-negative",
      label: "β-hCG negative?",
      keywords: ["hcg negative", "β-hcg negative", "beta-hcg negative"],
      phrase: "β-hCG negative",
    },
    {
      id: "gynecologic",
      label: "Gynecologic etiology suspected?",
      keywords: ["gynecologic", "gynaecologic", "adnexal", "ovarian", "endometriosis"],
      phrase: "gynecologic etiology suspected",
    },
    {
      id: "nongynecologic",
      label: "Nongynecologic etiology suspected?",
      keywords: ["nongynecologic", "non-gynecologic", "nongynaecologic"],
      phrase: "nongynecologic etiology suspected",
    },
    {
      id: "right-lower-quadrant",
      label: "Right lower quadrant pain?",
      keywords: ["right lower quadrant", "rlq", "appendicitis"],
      phrase: "right lower quadrant pain",
    },
    {
      id: "right-upper-quadrant",
      label: "Right upper quadrant pain?",
      keywords: ["right upper quadrant", "ruq", "biliary", "cholecystitis"],
      phrase: "right upper quadrant pain",
    },
    {
      id: "left-lower-quadrant",
      label: "Left lower quadrant pain?",
      keywords: ["left lower quadrant", "llq", "diverticulitis"],
      phrase: "left lower quadrant pain",
    },
    {
      id: "flank-stone",
      label: "Flank pain, renal colic, or stone concern?",
      keywords: [
        "flank pain",
        "renal colic",
        "urolithiasis",
        "stone disease",
        "stone",
        "hematuria",
      ],
      phrase: "flank pain, renal colic, or stone concern",
    },
    {
      id: "hematuria",
      label: "Hematuria?",
      keywords: ["hematuria"],
      phrase: "hematuria",
    },
    {
      id: "obstruction",
      label: "Obstruction concern?",
      keywords: ["obstruction", "bowel obstruction", "small-bowel obstruction", "sbo"],
      phrase: "obstruction concern",
    },
    {
      id: "neurologic-deficit",
      label: "Focal neurologic deficit?",
      keywords: ["neurologic deficit", "focal neurologic", "focal deficit", "stroke"],
      phrase: "focal neurologic deficit",
    },
    {
      id: "thunderclap",
      label: "Sudden severe/thunderclap headache?",
      keywords: ["thunderclap", "sudden severe", "maximal severity"],
      phrase: "sudden severe or thunderclap headache",
    },
    {
      id: "papilledema-icp",
      label: "Papilledema or raised ICP concern?",
      keywords: ["papilledema", "intracranial hypertension", "raised icp", "intracranial pressure"],
      phrase: "papilledema or raised ICP concern",
    },
    {
      id: "anticoagulation",
      label: "Anticoagulation?",
      keywords: ["anticoagulation", "anticoagulated"],
      phrase: "anticoagulation",
    },
    {
      id: "renal-contrast",
      label: "Renal function or contrast concern?",
      keywords: ["renal function", "kidney disease", "contrast concern", "renal insufficiency"],
      phrase: "renal function or contrast concern",
    },
    {
      id: "postoperative",
      label: "Recent surgery or postoperative state?",
      keywords: ["postoperative", "post-op", "recent surgery", "prior surgery"],
      phrase: "recent surgery or postoperative state",
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword)) && !seen.has(rule.id)) {
      seen.add(rule.id);
      questions.push({
        id: rule.id,
        label: rule.label,
        positivePhrase: rule.phrase,
      });
    }
  }

  return questions;
}

function buildClinicalIndex(cleanRows) {
  const topicMap = new Map();

  for (const row of cleanRows) {
    const topicTitle =
      getField(row, ["topic_title", "topic", "title"]) || "Unknown topic";

    const variantTitle =
      getField(row, ["variant_title", "variant", "scenario_title", "clinical_variant"]) ||
      "Unspecified scenario";

    const clinicalArea = getField(row, ["clinical_area", "area", "category"]) || "";
    const procedure = cleanProcedureName(
      getField(row, ["procedure", "procedure_name", "imaging_procedure"])
    );
    const appropriateness = normalizeAppropriateness(
      getField(row, ["appropriateness", "rating_category", "category"])
    );
    const radiation = getField(row, ["radiation", "relative_radiation_level", "rrl"]) || "";
    const sourcePdf = getField(row, ["source_pdf", "pdf", "file", "filename"]) || "";
    const pageNumber = getField(row, ["page_number", "page"]) || "";

    const topicId = slugify(topicTitle);
    const scenarioId = slugify(`${topicTitle}-${variantTitle}`);

    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        topicId,
        topicTitle,
        clinicalArea,
        complaintKeywords: Array.from(
          new Set(
            topicTitle
              .toLowerCase()
              .split(/[^a-z0-9]+/)
              .filter((word) => word.length > 2)
          )
        ),
        scenarios: [],
      });
    }

    const topic = topicMap.get(topicId);
    let scenario = topic.scenarios.find((item) => item.scenarioId === scenarioId);

    if (!scenario) {
      scenario = {
        scenarioId,
        scenarioTitle: variantTitle,
        sourcePdf,
        pageNumber,
        questions: deriveQuestionsFromScenario(topicTitle, variantTitle),
        imagingOptions: [],
      };
      topic.scenarios.push(scenario);
    }

    scenario.imagingOptions.push({
      procedure,
      appropriateness,
      radiation,
      optionKind: classifyAcrOptionKind(procedure),
    });
  }

  return Array.from(topicMap.values());
}

if (!fs.existsSync(inputPath)) {
  console.error(`Missing input file: ${inputPath}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(cleanOutputPath), { recursive: true });
fs.mkdirSync(path.dirname(rejectedOutputPath), { recursive: true });
fs.mkdirSync(path.dirname(indexOutputPath), { recursive: true });

const csvText = fs.readFileSync(inputPath, "utf8");
const parsed = parseCsv(csvText);
const rawHeaders = parsed[0] ?? [];
const headers = rawHeaders.map(normalizeHeader);
const rows = parsed.slice(1).map((row) => rowToObject(headers, row));

const cleanRows = [];
const rejectedRows = [];

for (const row of rows) {
  const procedure = getField(row, ["procedure", "procedure_name", "imaging_procedure"]);

  if (isValidImagingProcedure(procedure)) {
    row.procedure = cleanProcedureName(procedure);
    cleanRows.push(row);
  } else {
    rejectedRows.push({
      ...row,
      rejection_reason: "Invalid or contaminated procedure text",
    });
  }
}

const cleanCsvRows = [headers, ...cleanRows.map((row) => headers.map((header) => row[header] ?? ""))];

const rejectedHeaders = [...headers, "rejection_reason"];
const rejectedCsvRows = [
  rejectedHeaders,
  ...rejectedRows.map((row) => rejectedHeaders.map((header) => row[header] ?? "")),
];

fs.writeFileSync(cleanOutputPath, toCsv(cleanCsvRows));
fs.writeFileSync(rejectedOutputPath, toCsv(rejectedCsvRows));

const clinicalIndex = buildClinicalIndex(cleanRows);
fs.writeFileSync(indexOutputPath, JSON.stringify(clinicalIndex, null, 2));

const summaryRows = [
  ["metric", "value"],
  ["input_rows", rows.length],
  ["kept_rows", cleanRows.length],
  ["rejected_rows", rejectedRows.length],
  ["topics", clinicalIndex.length],
  ["scenarios", clinicalIndex.reduce((sum, topic) => sum + topic.scenarios.length, 0)],
  [
    "imaging_options",
    clinicalIndex.reduce(
      (sum, topic) =>
        sum + topic.scenarios.reduce((scenarioSum, scenario) => scenarioSum + scenario.imagingOptions.length, 0),
      0
    ),
  ],
];

fs.writeFileSync(summaryOutputPath, toCsv(summaryRows));

console.log("ACR cleaning complete.");
console.log(`Input rows: ${rows.length}`);
console.log(`Kept rows: ${cleanRows.length}`);
console.log(`Rejected rows: ${rejectedRows.length}`);
console.log(`Topics: ${clinicalIndex.length}`);
console.log(`Scenarios: ${clinicalIndex.reduce((sum, topic) => sum + topic.scenarios.length, 0)}`);
console.log(`Clean CSV: ${cleanOutputPath}`);
console.log(`Rejected rows: ${rejectedOutputPath}`);
console.log(`Clinical index: ${indexOutputPath}`);