import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rawDir = path.resolve(process.cwd(), 'src/data/appropriateness/raw');
const generatedDir = path.resolve(process.cwd(), 'src/data/appropriateness/generated');

const validCategories = new Set([
  'Usually Appropriate',
  'May Be Appropriate',
  'May Be Appropriate (Disagreement)',
  'Usually Not Appropriate',
]);

const validRadiationLevels = new Set(['O', '☢', '☢☢', '☢☢☢', '☢☢☢☢', '☢☢☢☢☢', 'Varies']);

const stopWords = new Set([
  'acr',
  'and',
  'are',
  'criteria',
  'for',
  'from',
  'imaging',
  'not',
  'of',
  'or',
  'the',
  'to',
  'with',
  'without',
]);

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toIdentifier(value) {
  const slug = slugify(value);
  const camel = slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
  return `${camel || 'acr'}GeneratedTopic`;
}

function quote(value) {
  return JSON.stringify(value ?? '');
}

function renderArray(values, indent = 2) {
  const cleanValues = Array.from(new Set(values.filter((value) => String(value ?? '').trim()).map((value) => String(value).trim())));
  if (!cleanValues.length) return '[]';

  const padding = ' '.repeat(indent);
  const itemPadding = ' '.repeat(indent + 2);
  return `[\n${cleanValues.map((value) => `${itemPadding}${quote(value)},`).join('\n')}\n${padding}]`;
}

function topicIdFromRaw(raw, inputFile) {
  const title = raw.extractedTitle && raw.extractedTitle !== 'unknown' ? raw.extractedTitle : path.basename(inputFile, '.raw.json');
  return slugify(title) || slugify(path.basename(inputFile, path.extname(inputFile)));
}

function normalizeTitle(raw, inputFile) {
  const title = String(raw.extractedTitle ?? '').trim();
  if (title && title.toLowerCase() !== 'unknown') return title;
  return path.basename(inputFile, '.raw.json').replace(/[-_]+/g, ' ');
}

function clinicalAreaFromTitle(title) {
  const normalized = String(title ?? '').toLowerCase();
  if (/(head|brain|neuro|stroke|dementia|seizure|vision|sinus|spine|myelopathy|radiculopathy)/.test(normalized)) return 'Neuro';
  if (/(chest|lung|pulmonary|pleural|dyspnea|cough|hemoptysis|rib)/.test(normalized)) return 'Chest';
  if (/(abdomen|abdominal|bowel|appendicitis|pancrea|liver|jaundice|hernia|mesenteric|crohn|right upper quadrant|left lower quadrant)/.test(normalized)) return 'Abdomen';
  if (/(renal|kidney|urinary|hematuria|prostate|scrotal|adrenal|bladder|pelvic|uterine|ovarian|adnexal|pregnancy|vaginal)/.test(normalized)) return 'GU/Pelvis';
  if (/(breast|mammography|nipple)/.test(normalized)) return 'Breast';
  if (/(bone|fracture|joint|hip|knee|shoulder|ankle|foot|hand|wrist|elbow|soft tissue|musculoskeletal)/.test(normalized)) return 'MSK';
  if (/(aortic|arterial|venous|vascular|thrombosis|embolism|claudication|aneurysm)/.test(normalized)) return 'Vascular';
  if (/(cancer|tumor|neoplasm|staging|surveillance|oncology|melanoma|leukemia|lymphoma)/.test(normalized)) return 'Oncology';
  return 'General';
}

function wordsFromText(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word));
}

function keywordsForRaw(raw, title) {
  const variantText = Array.isArray(raw.variants)
    ? raw.variants.flatMap((variant) => [variant.variantTitle, variant.clinicalScenario]).join(' ')
    : '';
  const procedureText = Array.isArray(raw.variants)
    ? raw.variants
        .flatMap((variant) => (Array.isArray(variant.procedureRows) ? variant.procedureRows.map((row) => row.procedure) : []))
        .join(' ')
    : '';
  return Array.from(new Set([...wordsFromText(title), ...wordsFromText(variantText), ...wordsFromText(procedureText)])).slice(0, 40);
}

function warningText(warning) {
  if (!warning) return '';
  if (typeof warning === 'string') return warning;
  const category = warning.category ? `${warning.category}: ` : '';
  return `${category}${warning.message ?? JSON.stringify(warning)}`.replace(/\s+/g, ' ').trim();
}

function warningsForVariant(raw, variant) {
  const warnings = Array.isArray(raw.extractionWarnings) ? raw.extractionWarnings : [];
  const relevantWarnings = warnings
    .filter((warning) => {
      if (!warning || typeof warning === 'string') return true;
      return !warning.variantTitle || warning.variantTitle === variant.variantTitle || warning.variantId === variant.id;
    })
    .map(warningText)
    .filter(Boolean);

  return Array.from(
    new Set([
      'Appropriateness table extracted. Clinical summary pending.',
      'Validate extracted table rows against the source document before clinical use.',
      ...relevantWarnings,
    ]),
  ).slice(0, 10);
}

function sanitizeCategory(value) {
  return validCategories.has(value) ? value : undefined;
}

function sanitizeRadiation(value) {
  return validRadiationLevels.has(value) ? value : 'Varies';
}

function optionFromRow(row) {
  const category = sanitizeCategory(row.appropriatenessCategory);
  const procedure = String(row.procedure ?? '').trim();
  if (!procedure || !category) return undefined;

  return {
    procedure,
    appropriatenessCategory: category,
    radiationLevel: sanitizeRadiation(row.radiationLevel),
    extractionConfidence: ['high', 'medium', 'low'].includes(row.confidence) ? row.confidence : 'low',
    shortRationale: `${procedure} is listed as ${category} for this scenario.`,
  };
}

function variantFromRaw(raw, variant, index) {
  const title = variant.variantTitle || `Variant ${index + 1}`;
  const clinicalScenario = variant.clinicalScenario || title.replace(/^Variant\s+\d+[:.\s]*/i, '').trim() || title;
  const imagingOptions = (Array.isArray(variant.procedureRows) ? variant.procedureRows : [])
    .map(optionFromRow)
    .filter(Boolean);

  return {
    id: variant.id || slugify(title) || `variant-${index + 1}`,
    title,
    clinicalScenario,
    missingInformationPrompts: [],
    imagingOptions,
    requisitionSuggestions: [],
    reportingPearls: [],
    followUpPearls: [],
    cautions: warningsForVariant(raw, variant),
    extractionConfidence: ['high', 'medium', 'low'].includes(raw.extractionConfidence) ? raw.extractionConfidence : 'low',
  };
}

function topicFromRaw(raw, inputFile) {
  const title = normalizeTitle(raw, inputFile);
  const variants = (Array.isArray(raw.variants) ? raw.variants : []).map((variant, index) => variantFromRaw(raw, variant, index));
  return {
    id: topicIdFromRaw(raw, inputFile),
    title,
    year: raw.extractedYear || 'unknown',
    clinicalArea: clinicalAreaFromTitle(title),
    keywords: keywordsForRaw(raw, title),
    sourceLabel: 'ACR Appropriateness Criteria',
    sourceNote: 'Extracted structured table summary. Validate against source document before clinical use.',
    reviewStatus: raw.reviewStatus === 'extracted' ? 'extracted' : 'needs_validation',
    extractionConfidence: ['high', 'medium', 'low'].includes(raw.extractionConfidence) ? raw.extractionConfidence : 'low',
    variants,
  };
}

function renderImagingOption(option) {
  return `        {
          procedure: ${quote(option.procedure)},
          appropriatenessCategory: ${quote(option.appropriatenessCategory)},
          radiationLevel: ${quote(option.radiationLevel)},
          shortRationale: ${quote(option.shortRationale)},
          extractionConfidence: ${quote(option.extractionConfidence)},
        }`;
}

function renderVariant(variant) {
  return `    {
      id: ${quote(variant.id)},
      title: ${quote(variant.title)},
      clinicalScenario: ${quote(variant.clinicalScenario)},
      missingInformationPrompts: [],
      imagingOptions: [
${variant.imagingOptions.map(renderImagingOption).join(',\n')}
      ],
      requisitionSuggestions: [],
      reportingPearls: [],
      followUpPearls: [],
      cautions: ${renderArray(variant.cautions, 6)},
      extractionConfidence: ${quote(variant.extractionConfidence)},
    }`;
}

function renderTopicFile(topic, variableName, rawFileName) {
  return `import type { AppropriatenessTopic } from '../types';

// Generated from ${rawFileName}.
// Appropriateness table extracted. Clinical summary pending.
// Validate against source document before clinical use.
export const ${variableName}: AppropriatenessTopic = {
  id: ${quote(topic.id)},
  title: ${quote(topic.title)},
  year: ${quote(topic.year)},
  clinicalArea: ${quote(topic.clinicalArea)},
  keywords: ${renderArray(topic.keywords, 2)},
  sourceLabel: ${quote(topic.sourceLabel)},
  sourceNote: ${quote(topic.sourceNote)},
  reviewStatus: ${quote(topic.reviewStatus)},
  extractionConfidence: ${quote(topic.extractionConfidence)},
  variants: [
${topic.variants.map(renderVariant).join(',\n')}
  ],
};
`;
}

function renderGeneratedIndex(generatedTopics) {
  if (!generatedTopics.length) {
    return `import type { AppropriatenessTopic } from '../types';

export const generatedAppropriatenessTopics: AppropriatenessTopic[] = [];
`;
  }

  const imports = generatedTopics
    .map((topic) => `import { ${topic.variableName} } from './${topic.fileBaseName}';`)
    .join('\n');
  const variables = generatedTopics.map((topic) => `  ${topic.variableName},`).join('\n');

  return `${imports}
import type { AppropriatenessTopic } from '../types';

export const generatedAppropriatenessTopics: AppropriatenessTopic[] = [
${variables}
];
`;
}

async function readRawTopics() {
  let entries = [];
  try {
    entries = await readdir(rawDir);
  } catch {
    return [];
  }

  const rawFiles = entries.filter((entry) => entry.endsWith('.raw.json')).sort();
  const topics = [];
  const seenTopicIds = new Map();

  for (const rawFile of rawFiles) {
    const inputFile = path.join(rawDir, rawFile);
    const raw = JSON.parse(await readFile(inputFile, 'utf8'));
    const topic = topicFromRaw(raw, inputFile);
    const baseTopicId = topic.id;
    const duplicateCount = seenTopicIds.get(baseTopicId) ?? 0;
    seenTopicIds.set(baseTopicId, duplicateCount + 1);

    if (duplicateCount > 0) {
      topic.id = `${baseTopicId}-${duplicateCount + 1}`;
      topic.keywords = Array.from(new Set([...(topic.keywords ?? []), baseTopicId]));
      topic.sourceNote = `${topic.sourceNote} Duplicate extracted title disambiguated for registry import.`;
    }

    const fileBaseName = `${topic.id}.generated`;
    topics.push({
      topic,
      rawFile,
      fileBaseName,
      outputFile: `${fileBaseName}.ts`,
      variableName: toIdentifier(topic.id),
    });
  }

  return topics;
}

async function main() {
  await mkdir(generatedDir, { recursive: true });
  const generatedTopics = await readRawTopics();

  for (const item of generatedTopics) {
    const outputPath = path.join(generatedDir, item.outputFile);
    await writeFile(outputPath, renderTopicFile(item.topic, item.variableName, item.rawFile), 'utf8');
  }

  await writeFile(path.join(generatedDir, 'index.ts'), renderGeneratedIndex(generatedTopics), 'utf8');

  console.log('ACR generated topic transform complete');
  console.log(`Raw topics found: ${generatedTopics.length}`);
  console.log(`Generated topics written: ${generatedTopics.length}`);
  console.log(`Generated registry: ${path.relative(process.cwd(), path.join(generatedDir, 'index.ts'))}`);
  console.log('Generated topics are extracted table summaries only. Clinical summary validation remains required.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
