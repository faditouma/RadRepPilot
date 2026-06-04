import { inflateSync } from 'node:zlib';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const inputDir = path.resolve(process.cwd(), 'acr-source-pdfs');
const outputDir = path.resolve(process.cwd(), 'src/data/appropriateness/raw');

const categoryPatterns = [
  'May Be Appropriate (Disagreement)',
  'Usually Appropriate',
  'May Be Appropriate',
  'Usually Not Appropriate',
];

const categoryPattern = /(May Be Appropriate\s*\(Disagreement\)|Usually Appropriate|May Be Appropriate|Usually Not Appropriate)/i;
const radiationPattern = /(☢{1,5}|O|Varies)/i;
const yearPattern = /\b(20\d{2}|19\d{2})\b/;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeWhitespace(value) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodePdfEscapes(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
}

function decodeHexString(hex) {
  const compact = hex.replace(/\s+/g, '');
  const pairs = compact.match(/[0-9a-fA-F]{2}/g) ?? [];
  return pairs.map((pair) => String.fromCharCode(Number.parseInt(pair, 16))).join('');
}

function extractStringsFromTextLayer(text) {
  const fragments = [];
  const literalPattern = /\((?:\\.|[^\\)])*\)/g;
  const hexPattern = /<([0-9a-fA-F\s]{4,})>/g;

  for (const match of text.matchAll(literalPattern)) {
    fragments.push(decodePdfEscapes(match[0].slice(1, -1)));
  }

  for (const match of text.matchAll(hexPattern)) {
    fragments.push(decodeHexString(match[1]));
  }

  return fragments.join('\n');
}

function extractTextFromPdfBuffer(buffer) {
  const latin = buffer.toString('latin1');
  const fragments = [extractStringsFromTextLayer(latin)];
  const streamPattern = /<<(?:.|\n|\r)*?>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;

  for (const match of latin.matchAll(streamPattern)) {
    const objectText = match[0].slice(0, Math.min(match[0].indexOf('stream'), 1000));
    const streamBody = Buffer.from(match[1], 'latin1');

    if (!/FlateDecode/i.test(objectText)) continue;

    try {
      const inflated = inflateSync(streamBody).toString('latin1');
      fragments.push(extractStringsFromTextLayer(inflated));
    } catch {
      // Some PDFs have predictor filters or stream formatting that this lightweight parser cannot inflate.
    }
  }

  return normalizeWhitespace(fragments.filter(Boolean).join('\n'));
}

function extractTitle(text, filename) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Variant[:\s]/i.test(line));

  const criteriaLine = lines.find((line) => /Appropriateness Criteria/i.test(line));
  if (criteriaLine) {
    const cleaned = criteriaLine
      .replace(/ACR\s+Appropriateness\s+Criteria\s*[:\-]?/i, '')
      .replace(/Appropriateness\s+Criteria\s*[:\-]?/i, '')
      .trim();
    if (cleaned.length >= 4) return cleaned;
  }

  const titleLike = lines.find((line) => line.length >= 8 && line.length <= 90 && /[A-Za-z]/.test(line));
  return titleLike ?? path.basename(filename, path.extname(filename)).replace(/[-_]+/g, ' ');
}

function extractYear(text) {
  const nearby = text.slice(0, 4000);
  const revised = nearby.match(/(?:Revised|Published|Date|Last reviewed)[^\d]{0,30}(20\d{2}|19\d{2})/i);
  if (revised) return revised[1];
  return nearby.match(yearPattern)?.[1] ?? 'unknown';
}

function splitVariants(text) {
  const matches = [...text.matchAll(/(?:^|\n)\s*(Variant\s+\d+[:.\s][^\n]+)/gi)];
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? text.length;
    return {
      variantTitle: normalizeWhitespace(match[1]),
      body: text.slice(start, end),
    };
  });
}

function confidenceForRow(procedure, category, radiationLevel) {
  if (!procedure || category === 'Unknown') return 'low';
  if (radiationLevel === 'Unknown') return 'medium';
  return 'high';
}

function normalizeCategory(value) {
  const match = categoryPatterns.find((category) => category.toLowerCase() === value.toLowerCase().replace(/\s+/g, ' ').trim());
  return match ?? 'Unknown';
}

function normalizeRadiation(value) {
  if (!value) return 'Unknown';
  const normalized = value.trim();
  if (/^o$/i.test(normalized)) return 'O';
  if (/^varies$/i.test(normalized)) return 'Varies';
  if (/^☢{1,5}$/.test(normalized)) return normalized;
  return 'Unknown';
}

function cleanProcedure(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[.:;\-–—]+$/g, '')
    .trim();
}

function extractRowsFromVariant(variantBody) {
  const rows = [];
  const lines = variantBody
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const joinedWindows = [];

  for (let index = 0; index < lines.length; index += 1) {
    joinedWindows.push(lines.slice(index, index + 4).join(' '));
  }

  for (const window of joinedWindows) {
    const categoryMatch = window.match(categoryPattern);
    if (!categoryMatch) continue;

    const beforeCategory = window.slice(0, categoryMatch.index).trim();
    const afterCategory = window.slice((categoryMatch.index ?? 0) + categoryMatch[0].length);
    const radiationMatch = afterCategory.match(radiationPattern);
    const procedure = cleanProcedure(beforeCategory.replace(/^Variant\s+\d+[:.\s].*?(?=[A-Z][a-z])/i, ''));
    const appropriatenessCategory = normalizeCategory(categoryMatch[0]);
    const radiationLevel = normalizeRadiation(radiationMatch?.[1] ?? '');

    if (procedure.length < 5) continue;
    if (rows.some((row) => row.procedure === procedure && row.appropriatenessCategory === appropriatenessCategory)) continue;

    rows.push({
      procedure,
      appropriatenessCategory,
      radiationLevel,
      confidence: confidenceForRow(procedure, appropriatenessCategory, radiationLevel),
    });
  }

  return rows;
}

function warningsForExtraction(raw) {
  const warnings = [];
  if (!raw.variants.length) warnings.push('No Variant blocks were found.');

  const allRows = raw.variants.flatMap((variant) => variant.procedureRows);
  if (!allRows.length) warnings.push('No procedure rows were found.');

  for (const variant of raw.variants) {
    if (!variant.procedureRows.length) warnings.push(`No procedure rows found for ${variant.variantTitle}.`);

    for (const row of variant.procedureRows) {
      if (row.radiationLevel === 'Unknown') warnings.push(`Missing or unclear radiation level: ${row.procedure}.`);
      if (row.appropriatenessCategory === 'Unknown') warnings.push(`Unclear appropriateness category: ${row.procedure}.`);
      if (row.procedure.length < 12 || /,$/.test(row.procedure)) warnings.push(`Procedure text may be truncated: ${row.procedure}.`);
    }
  }

  return warnings;
}

async function processPdf(filename) {
  const sourcePath = path.join(inputDir, filename);
  const buffer = await readFile(sourcePath);
  const text = extractTextFromPdfBuffer(buffer);
  const variantBlocks = splitVariants(text);
  const variants = variantBlocks.map((variant) => ({
    variantTitle: variant.variantTitle,
    procedureRows: extractRowsFromVariant(variant.body),
  }));
  const raw = {
    sourceFile: filename,
    extractedTitle: extractTitle(text, filename),
    extractedYear: extractYear(text),
    reviewStatus: 'unreviewed',
    variants,
    extractionWarnings: [],
  };
  raw.extractionWarnings = warningsForExtraction(raw);
  return raw;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  let entries = [];
  try {
    entries = await readdir(inputDir);
  } catch {
    console.log(`Input folder not found: ${inputDir}`);
    console.log('Create acr-source-pdfs/ and add local ACR PDFs, then run npm run extract:acr.');
    return;
  }

  const pdfs = entries.filter((entry) => entry.toLowerCase().endsWith('.pdf')).sort();
  if (!pdfs.length) {
    console.log('No PDF files found in acr-source-pdfs/. Nothing to extract.');
    return;
  }

  const summary = {
    pdfsProcessed: 0,
    topicsExtracted: 0,
    variantsExtracted: 0,
    rowsExtracted: 0,
    warningsCount: 0,
  };

  for (const filename of pdfs) {
    const raw = await processPdf(filename);
    const outputName = `${slugify(path.basename(filename, path.extname(filename)))}.raw.json`;
    const outputPath = path.join(outputDir, outputName);
    await writeFile(outputPath, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');

    const rowCount = raw.variants.reduce((total, variant) => total + variant.procedureRows.length, 0);
    summary.pdfsProcessed += 1;
    summary.topicsExtracted += raw.extractedTitle ? 1 : 0;
    summary.variantsExtracted += raw.variants.length;
    summary.rowsExtracted += rowCount;
    summary.warningsCount += raw.extractionWarnings.length;

    console.log(`Wrote ${path.relative(process.cwd(), outputPath)} (${raw.variants.length} variants, ${rowCount} rows, ${raw.extractionWarnings.length} warnings)`);
  }

  console.log('\nACR extraction summary');
  console.log(`PDFs processed: ${summary.pdfsProcessed}`);
  console.log(`Topics extracted: ${summary.topicsExtracted}`);
  console.log(`Variants extracted: ${summary.variantsExtracted}`);
  console.log(`Rows extracted: ${summary.rowsExtracted}`);
  console.log(`Warnings count: ${summary.warningsCount}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
