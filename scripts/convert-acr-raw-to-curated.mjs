import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'src/data/appropriateness/topics');

const validCategories = new Set([
  'Usually Appropriate',
  'May Be Appropriate',
  'May Be Appropriate (Disagreement)',
  'Usually Not Appropriate',
]);

const validRadiationLevels = new Set(['O', '☢', '☢☢', '☢☢☢', '☢☢☢☢', '☢☢☢☢☢', 'Varies']);

function usage() {
  console.log('Usage: npm run convert:acr -- src/data/appropriateness/raw/example.raw.json');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toIdentifier(value) {
  const slug = slugify(value);
  const camel = slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
  return `${camel || 'acrTopic'}DraftTopic`;
}

function quote(value) {
  return JSON.stringify(value ?? '');
}

function topicIdFromRaw(raw, inputFile) {
  const title = raw.extractedTitle && raw.extractedTitle !== 'unknown' ? raw.extractedTitle : path.basename(inputFile, '.raw.json');
  return slugify(title) || slugify(path.basename(inputFile, path.extname(inputFile)));
}

function categoryExpression(value) {
  if (validCategories.has(value)) return quote(value);
  return `${quote(value || 'Unknown')} as any`;
}

function radiationExpression(value) {
  if (validRadiationLevels.has(value)) return quote(value);
  return `${quote(value || 'Unknown')} as any`;
}

function clinicalAreaFromTitle(title) {
  const normalized = String(title ?? '').toLowerCase();
  if (normalized.includes('pancrea') || normalized.includes('abdomen') || normalized.includes('liver')) return 'Abdomen';
  if (normalized.includes('head') || normalized.includes('brain') || normalized.includes('spine')) return 'Neuro';
  if (normalized.includes('chest') || normalized.includes('lung') || normalized.includes('pulmonary')) return 'Chest';
  if (normalized.includes('pelvic') || normalized.includes('renal') || normalized.includes('urinary')) return 'GU';
  return 'TODO clinical area';
}

function warningComments(raw) {
  const warnings = Array.isArray(raw.extractionWarnings) ? raw.extractionWarnings : [];
  if (!warnings.length) return '  // Extraction warnings: none recorded by the raw extractor.\n';
  return (
    warnings
      .map((warning) => {
        if (typeof warning === 'string') return `  // Extraction warning: ${warning.replace(/\n/g, ' ')}`;
        const category = warning?.category ? `${warning.category}: ` : '';
        const message = warning?.message ?? JSON.stringify(warning);
        return `  // Extraction warning: ${category}${String(message).replace(/\n/g, ' ')}`;
      })
      .join('\n') + '\n'
  );
}

function renderImagingOption(row) {
  return `        {
          procedure: ${quote(row.procedure)},
          appropriatenessCategory: ${categoryExpression(row.appropriatenessCategory)},
          radiationLevel: ${radiationExpression(row.radiationLevel)},
          shortRationale: 'TODO: Write concise reviewed rationale. Raw extraction confidence: ${row.confidence ?? 'unknown'}.',
        }`;
}

function renderVariant(variant, index) {
  const variantTitle = variant.variantTitle || `Variant ${index + 1}`;
  const rows = Array.isArray(variant.procedureRows) ? variant.procedureRows : [];
  const options = rows.length
    ? rows.map(renderImagingOption).join(',\n')
    : `        {
          procedure: 'TODO: Add reviewed procedure',
          appropriatenessCategory: 'May Be Appropriate',
          radiationLevel: 'Varies',
          shortRationale: 'TODO: Add reviewed rationale.',
        }`;

  return `    {
      id: ${quote(slugify(variantTitle) || `variant-${index + 1}`)},
      title: ${quote(variantTitle)},
      clinicalScenario: 'TODO: Summarize the clinical scenario in one concise sentence after source review.',
      missingInformationPrompts: [
        'TODO: Add missing clinical information prompt',
      ],
      imagingOptions: [
${options}
      ],
      requisitionSuggestions: [
        'TODO: Add concise requisition-ready wording after human review.',
      ],
      reportingPearls: [
        'TODO: Add reporting pearl after human review.',
      ],
      cautions: [
        'Review against original source before importing into the public topic registry.',
      ],
    }`;
}

function renderTopic(raw, inputFile) {
  const topicId = topicIdFromRaw(raw, inputFile);
  const variableName = toIdentifier(topicId);
  const variants = Array.isArray(raw.variants) && raw.variants.length ? raw.variants : [{ variantTitle: 'TODO variant', procedureRows: [] }];

  return `import type { AppropriatenessTopic } from '../types';

// Draft generated from ${path.basename(inputFile)}.
// Review against original source before importing into the public topic registry.
// Do not import this draft into src/data/appropriateness/index.ts until manually reviewed.
${warningComments(raw)}export const ${variableName}: AppropriatenessTopic = {
  id: ${quote(topicId)},
  title: ${quote(raw.extractedTitle || 'TODO title')},
  year: ${quote(raw.extractedYear || 'unknown')},
  clinicalArea: ${quote(clinicalAreaFromTitle(raw.extractedTitle))},
  keywords: [
    'TODO keyword',
  ],
  sourceLabel: ${quote(raw.extractedTitle ? `ACR Appropriateness Criteria: ${raw.extractedTitle}` : 'TODO source label')},
  sourceUrl: 'https://www.acr.org/clinical-resources/acr-appropriateness-criteria',
  sourceNote:
    'Draft converted from local raw extraction. Requires human review against the original source before public use.',
  reviewStatus: 'needs_validation',
  variants: [
${variants.map(renderVariant).join(',\n')}
  ],
};
`;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    usage();
    process.exitCode = 1;
    return;
  }

  const inputFile = path.resolve(process.cwd(), inputArg);
  const raw = JSON.parse(await readFile(inputFile, 'utf8'));
  const topicId = topicIdFromRaw(raw, inputFile);
  const outputPath = path.join(outputDir, `${topicId}.draft.ts`);

  if (await exists(outputPath)) {
    throw new Error(`Refusing to overwrite existing draft: ${outputPath}`);
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, renderTopic(raw, inputFile), 'utf8');
  console.log(`Wrote draft curated topic: ${path.relative(process.cwd(), outputPath)}`);
  console.log('Next: manually review/edit this draft, keep reviewStatus unreviewed until verified, then import only reviewed topics into the registry.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
