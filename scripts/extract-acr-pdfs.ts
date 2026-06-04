import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type ReviewStatus = 'unreviewed';
type ExtractedAppropriatenessCategory =
  | 'Usually Appropriate'
  | 'May Be Appropriate'
  | 'May Be Appropriate (Disagreement)'
  | 'Usually Not Appropriate'
  | 'Unknown';
type ExtractedRadiationLevel = 'O' | '☢' | '☢☢' | '☢☢☢' | '☢☢☢☢' | '☢☢☢☢☢' | 'Varies' | 'Unknown';

interface RawProcedureRow {
  procedure: string;
  appropriatenessCategory: ExtractedAppropriatenessCategory;
  radiationLevel: ExtractedRadiationLevel;
  confidence: number;
}

interface RawVariant {
  variantTitle: string;
  procedureRows: RawProcedureRow[];
}

interface RawAcrExtraction {
  sourceFile: string;
  extractedTitle: string;
  extractedYear: string;
  reviewStatus: ReviewStatus;
  variants: RawVariant[];
  extractionWarnings: string[];
}

const inputDir = path.resolve(process.cwd(), 'acr-source-pdfs');
const outputDir = path.resolve(process.cwd(), 'src/data/appropriateness/raw');

function titleFromFilename(filename: string) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createPlaceholderExtraction(filename: string): RawAcrExtraction {
  return {
    sourceFile: filename,
    extractedTitle: titleFromFilename(filename),
    extractedYear: 'unknown',
    reviewStatus: 'unreviewed',
    variants: [],
    extractionWarnings: [
      'Placeholder extraction only. PDF text parsing is not enabled yet.',
      'Install and wire a PDF parser such as pdf-parse before using this for real extraction.',
      'Manual human review is required before converting raw JSON into curated topic TypeScript files.',
    ],
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  let entries: string[];
  try {
    entries = await readdir(inputDir);
  } catch {
    throw new Error(`Input folder not found: ${inputDir}. Create acr-source-pdfs/ and add local PDFs before running.`);
  }

  const pdfs = entries.filter((entry) => entry.toLowerCase().endsWith('.pdf'));

  if (!pdfs.length) {
    console.log('No PDF files found in acr-source-pdfs/. Nothing to extract.');
    return;
  }

  for (const filename of pdfs) {
    const raw = createPlaceholderExtraction(filename);
    const outputName = `${path.basename(filename, path.extname(filename)).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-raw.json`;
    const outputPath = path.join(outputDir, outputName);
    await writeFile(outputPath, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${outputPath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
