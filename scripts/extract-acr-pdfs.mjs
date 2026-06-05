import { inflateSync } from 'node:zlib';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const inputDir = path.resolve(process.cwd(), 'acr-source-pdfs');
const outputDir = path.resolve(process.cwd(), 'src/data/appropriateness/raw');

const categoryPatterns = [
  'May Be Appropriate (Disagreement)',
  'Usually Appropriate',
  'May Be Appropriate',
  'Usually Not Appropriate',
];

const categoryPattern = /(May Be Appropriate\s*\(Disagreement\)|Usually Appropriate|May Be Appropriate|Usually Not Appropriate)/i;
const radiationPattern = /(☢{1,5}|\bO\b|\bVaries\b)/i;
const yearPattern = /\b(20\d{2}|19\d{2})\b/;
const summaryFile = path.join(outputDir, 'extraction-summary.json');
const bundledPdfJsPath = path.join(
  process.env.HOME ?? '',
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs',
);
let pdfJsModulePromise;

const warningCategories = {
  noVariantFound: 'noVariantFound',
  noProcedureRowsFound: 'noProcedureRowsFound',
  unclearRadiationLevel: 'unclearRadiationLevel',
  unclearAppropriatenessCategory: 'unclearAppropriatenessCategory',
  possibleTruncatedProcedure: 'possibleTruncatedProcedure',
  duplicateVariant: 'duplicateVariant',
  suspiciouslyFewRows: 'suspiciouslyFewRows',
  duplicateTopicTitle: 'duplicateTopicTitle',
};

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

async function loadPdfJs() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = (async () => {
      try {
        return await import('pdfjs-dist/legacy/build/pdf.mjs');
      } catch {
        try {
          return await import(pathToFileURL(bundledPdfJsPath).href);
        } catch {
          return null;
        }
      }
    })();
  }

  return pdfJsModulePromise;
}

async function extractTextWithPdfJs(buffer) {
  const pdfjs = await loadPdfJs();
  if (!pdfjs) return '';

  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    verbosity: pdfjs.VerbosityLevel?.ERRORS,
  }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join('\n'));
  }

  await document.destroy();
  return normalizeWhitespace(pages.join('\n'));
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

async function extractText(buffer) {
  try {
    const pdfJsText = await extractTextWithPdfJs(buffer);
    if (pdfJsText && /Variant\s+\d+/i.test(pdfJsText)) {
      return pdfJsText;
    }
  } catch {
    // Fall through to the lightweight parser so one difficult PDF does not stop the batch.
  }

  return extractTextFromPdfBuffer(buffer);
}

function extractTitle(text, filename) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Variant[:\s]/i.test(line));

  const criteriaIndex = lines.findIndex((line) => /ACR\s+Appropriateness\s+Criteria/i.test(line));
  if (criteriaIndex >= 0) {
    const titleLine = lines.slice(criteriaIndex + 1).find((line) => {
      if (/American College of Radiology/i.test(line)) return false;
      if (/Appropriateness Criteria/i.test(line)) return false;
      if (/^Revised\s+\d{4}/i.test(line)) return false;
      if (/^Procedure$/i.test(line)) return false;
      if (/^Appropriateness Category$/i.test(line)) return false;
      if (/^Relative Radiation Level$/i.test(line)) return false;
      return line.length >= 4 && line.length <= 120 && /[A-Za-z]/.test(line);
    });

    if (titleLine) {
      return titleLine.replace(/[®©]/g, '').trim();
    }
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
  const matches = [...text.matchAll(/(?:^|\n)\s*Variant:\s*(\d+)\s*/gi)];
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const nextStart = matches[index + 1]?.index ?? text.length;
    const trailingSection = text.slice(start, nextStart).search(/\n\s*(Summary of Recommendations|Supporting Documents|Discussion|Literature Search|References)\b/i);
    const end = trailingSection >= 0 ? start + trailingSection : nextStart;
    const body = text.slice(start, end);
    const variantNumber = match[1];
    const scenario = extractClinicalScenarioFromTableBlock(body);
    const variantTitle = scenario ? `Variant ${variantNumber}: ${scenario}` : `Variant ${variantNumber}`;
    const clinicalScenario = extractClinicalScenario(variantTitle);
    return {
      id: createVariantId(variantTitle, index),
      variantTitle,
      clinicalScenario,
      body,
    };
  });
}

function extractClinicalScenarioFromTableBlock(variantBody) {
  const procedureIndex = variantBody.search(/\n\s*Procedure\s*\n/i);
  const headingBlock = procedureIndex >= 0 ? variantBody.slice(0, procedureIndex) : variantBody.slice(0, 1000);
  const lines = headingBlock
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Variant:\s*\d+/i.test(line))
    .filter((line) => !/^Revised\s+\d{4}/i.test(line))
    .filter((line) => !/^ACR Appropriateness Criteria/i.test(line))
    .filter((line) => !/^American College of Radiology/i.test(line));

  return normalizeWhitespace(lines.join(' '));
}

function createVariantId(variantTitle, index) {
  const scenario = extractClinicalScenario(variantTitle);
  const slug = slugify(scenario || variantTitle);
  return slug ? `variant-${index + 1}-${slug}` : `variant-${index + 1}`;
}

function extractClinicalScenario(variantTitle) {
  return normalizeWhitespace(variantTitle.replace(/^Variant\s+\d+[:.\s]*/i, '')).trim();
}

function confidenceForRow(procedure, category, radiationLevel) {
  if (!procedure || category === 'Unknown') return 'low';
  if (radiationLevel === 'Unknown') return 'medium';
  return 'high';
}

function confidenceForExtraction(variants) {
  const rows = variants.flatMap((variant) => variant.procedureRows);
  if (!variants.length || !rows.length) return 'low';
  if (rows.some((row) => row.confidence === 'low')) return 'medium';
  if (rows.some((row) => row.confidence === 'medium')) return 'medium';
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

function isTableHeaderLine(line) {
  return /^(Procedure|Appropriateness Category|Relative Radiation Level|Revised\s+\d{4})$/i.test(line);
}

function isLikelyNonProcedureLine(line) {
  return (
    isTableHeaderLine(line) ||
    /^ACR Appropriateness Criteria/i.test(line) ||
    /^American College of Radiology/i.test(line) ||
    /^Variant:\s*\d+/i.test(line) ||
    /^(Summary of Recommendations|Supporting Documents|Discussion|Literature Search|References)\b/i.test(line)
  );
}

function extractRowsFromTableLines(variantBody) {
  const rows = [];
  const lines = variantBody
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const procedureStart = lines.findIndex((line) => /^Procedure$/i.test(line));
  const tableLines = procedureStart >= 0 ? lines.slice(procedureStart + 1) : lines;
  let procedureParts = [];

  for (let index = 0; index < tableLines.length; index += 1) {
    const line = tableLines[index];
    if (isLikelyNonProcedureLine(line)) continue;

    const categoryMatch = line.match(categoryPattern);
    if (categoryMatch) {
      const procedurePrefix = line.slice(0, categoryMatch.index).trim();
      if (procedurePrefix) procedureParts.push(procedurePrefix);

      let radiationLevel = 'Unknown';
      let radiationIndex = -1;
      const afterCategory = line.slice((categoryMatch.index ?? 0) + categoryMatch[0].length);
      const sameLineRadiation = afterCategory.match(radiationPattern);

      if (sameLineRadiation) {
        radiationLevel = normalizeRadiation(sameLineRadiation[1]);
      } else {
        for (let lookahead = index + 1; lookahead < Math.min(index + 4, tableLines.length); lookahead += 1) {
          const candidate = tableLines[lookahead].trim();
          if (!candidate || isTableHeaderLine(candidate)) continue;
          const radiationMatch = candidate.match(radiationPattern);
          if (radiationMatch && candidate.replace(radiationMatch[0], '').trim().length <= 8) {
            radiationLevel = normalizeRadiation(radiationMatch[1]);
            radiationIndex = lookahead;
            break;
          }
        }
      }

      const procedure = cleanProcedure(procedureParts.join(' '));
      const appropriatenessCategory = normalizeCategory(categoryMatch[0]);

      if (procedure.length >= 5 && !rows.some((row) => row.procedure === procedure && row.appropriatenessCategory === appropriatenessCategory)) {
        rows.push({
          procedure,
          appropriatenessCategory,
          radiationLevel,
          confidence: confidenceForRow(procedure, appropriatenessCategory, radiationLevel),
          rawLine: [procedure, categoryMatch[0], radiationLevel].filter(Boolean).join(' | '),
        });
      }

      procedureParts = [];
      if (radiationIndex > index) index = radiationIndex;
      continue;
    }

    if (!radiationPattern.test(line)) {
      procedureParts.push(line);
    }
  }

  return rows;
}

function extractRowsFromTextWindows(variantBody) {
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
      rawLine: window,
    });
  }

  return rows;
}

function extractRowsFromVariant(variantBody) {
  const tableRows = extractRowsFromTableLines(variantBody);
  return tableRows.length ? tableRows : extractRowsFromTextWindows(variantBody);
}

function createWarning(category, message, context = {}) {
  return {
    category,
    message,
    ...context,
  };
}

function warningsForExtraction(raw) {
  const warnings = [];
  if (!raw.variants.length) {
    warnings.push(createWarning(warningCategories.noVariantFound, 'No Variant blocks were found.'));
  }

  const allRows = raw.variants.flatMap((variant) => variant.procedureRows);
  if (!allRows.length) {
    warnings.push(createWarning(warningCategories.noProcedureRowsFound, 'No procedure rows were found.'));
  }
  if (allRows.length > 0 && allRows.length < 3) {
    warnings.push(
      createWarning(warningCategories.suspiciouslyFewRows, `Only ${allRows.length} procedure row(s) found for this topic.`, {
        procedureRows: allRows.length,
      }),
    );
  }

  const variantCounts = new Map();
  for (const variant of raw.variants) {
    const key = slugify(variant.clinicalScenario || variant.variantTitle);
    variantCounts.set(key, (variantCounts.get(key) ?? 0) + 1);
  }
  for (const variant of raw.variants) {
    const key = slugify(variant.clinicalScenario || variant.variantTitle);
    if (variantCounts.get(key) > 1) {
      warnings.push(
        createWarning(warningCategories.duplicateVariant, `Duplicate variant detected: ${variant.variantTitle}.`, {
          variantId: variant.id,
          variantTitle: variant.variantTitle,
        }),
      );
    }
  }

  for (const variant of raw.variants) {
    if (!variant.procedureRows.length) {
      warnings.push(
        createWarning(warningCategories.noProcedureRowsFound, `No procedure rows found for ${variant.variantTitle}.`, {
          variantTitle: variant.variantTitle,
        }),
      );
    }
    if (variant.procedureRows.length > 0 && variant.procedureRows.length < 3) {
      warnings.push(
        createWarning(warningCategories.suspiciouslyFewRows, `Only ${variant.procedureRows.length} row(s) found for ${variant.variantTitle}.`, {
          variantId: variant.id,
          variantTitle: variant.variantTitle,
          procedureRows: variant.procedureRows.length,
        }),
      );
    }

    for (const row of variant.procedureRows) {
      if (row.radiationLevel === 'Unknown') {
        warnings.push(
          createWarning(warningCategories.unclearRadiationLevel, `Missing or unclear radiation level: ${row.procedure}.`, {
            procedure: row.procedure,
            variantTitle: variant.variantTitle,
          }),
        );
      }
      if (row.appropriatenessCategory === 'Unknown') {
        warnings.push(
          createWarning(warningCategories.unclearAppropriatenessCategory, `Unclear appropriateness category: ${row.procedure}.`, {
            procedure: row.procedure,
            variantTitle: variant.variantTitle,
          }),
        );
      }
      if (row.procedure.length < 12 || /,$/.test(row.procedure)) {
        warnings.push(
          createWarning(warningCategories.possibleTruncatedProcedure, `Procedure text may be truncated: ${row.procedure}.`, {
            procedure: row.procedure,
            variantTitle: variant.variantTitle,
          }),
        );
      }
    }
  }

  return warnings;
}

function duplicateTitleWarnings(raw, titleCounts) {
  if (!raw.extractedTitle || titleCounts.get(raw.extractedTitle) <= 1) return [];

  return [
    createWarning(warningCategories.duplicateTopicTitle, `Duplicate extracted topic title: ${raw.extractedTitle}.`, {
      extractedTitle: raw.extractedTitle,
    }),
  ];
}

function createExtractionSummary() {
  return {
    timestamp: new Date().toISOString(),
    processedFiles: [],
    failedFiles: [],
    totalTopics: 0,
    totalVariants: 0,
    totalProcedureRows: 0,
    totalWarnings: 0,
    warningCountsByType: {},
    lowConfidenceFiles: [],
  };
}

function countWarningsByType(warnings) {
  return warnings.reduce((counts, warning) => {
    const category = warning.category ?? 'unknown';
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});
}

function mergeWarningCounts(target, warnings) {
  for (const warning of warnings) {
    const category = warning.category ?? 'unknown';
    target[category] = (target[category] ?? 0) + 1;
  }
}

function logSummary(summary, discoveredPdfCount) {
  console.log('\nACR extraction summary');
  console.log(`PDFs processed: ${discoveredPdfCount}`);
  console.log(`Successful extractions: ${summary.processedFiles.length}`);
  console.log(`Failed extractions: ${summary.failedFiles.length}`);
  console.log(`Topics extracted: ${summary.totalTopics}`);
  console.log(`Variants extracted: ${summary.totalVariants}`);
  console.log(`Rows extracted: ${summary.totalProcedureRows}`);
  console.log(`Warnings count: ${summary.totalWarnings}`);
  if (summary.failedFiles.length) {
    console.log('Failed file list:');
    for (const failedFile of summary.failedFiles) {
      console.log(`- ${failedFile.sourceFile}: ${failedFile.error}`);
    }
  }
  console.log(`Summary file: ${path.relative(process.cwd(), summaryFile)}`);
  console.log('Raw extraction complete. Review required before public use.');
}

async function processPdf(filename) {
  const sourcePath = path.join(inputDir, filename);
  const buffer = await readFile(sourcePath);
  const text = await extractText(buffer);
  const variantBlocks = splitVariants(text);
  const variants = variantBlocks.map((variant) => ({
    id: variant.id,
    variantTitle: variant.variantTitle,
    clinicalScenario: variant.clinicalScenario,
    procedureRows: extractRowsFromVariant(variant.body),
  }));
  const raw = {
    sourceFile: filename,
    extractedTitle: extractTitle(text, filename),
    extractedYear: extractYear(text),
    reviewStatus: 'extracted',
    extractionConfidence: confidenceForExtraction(variants),
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
  const summary = createExtractionSummary();

  if (!pdfs.length) {
    console.log('No PDF files found in acr-source-pdfs/. Nothing to extract.');
    await writeFile(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    logSummary(summary, 0);
    return;
  }

  const titleCounts = new Map();
  const pendingWrites = [];
  const outputNameCounts = new Map();

  for (const filename of pdfs) {
    try {
      const raw = await processPdf(filename);
      titleCounts.set(raw.extractedTitle, (titleCounts.get(raw.extractedTitle) ?? 0) + 1);
      pendingWrites.push({ filename, raw });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.failedFiles.push({ sourceFile: filename, error: message });
      console.error(`Failed ${filename}: ${message}`);
    }
  }

  for (const item of pendingWrites) {
    const raw = {
      ...item.raw,
      extractionWarnings: [...item.raw.extractionWarnings, ...duplicateTitleWarnings(item.raw, titleCounts)],
    };
    const warningCountsByType = countWarningsByType(raw.extractionWarnings);
    const baseOutputName = slugify(path.basename(item.filename, path.extname(item.filename))) || 'acr-topic';
    const outputNameCount = outputNameCounts.get(baseOutputName) ?? 0;
    outputNameCounts.set(baseOutputName, outputNameCount + 1);
    const outputName = `${outputNameCount === 0 ? baseOutputName : `${baseOutputName}-${outputNameCount + 1}`}.raw.json`;
    const outputPath = path.join(outputDir, outputName);
    await writeFile(outputPath, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');

    const rowCount = raw.variants.reduce((total, variant) => total + variant.procedureRows.length, 0);
    summary.processedFiles.push({
      sourceFile: item.filename,
      outputFile: path.relative(process.cwd(), outputPath),
      extractedTitle: raw.extractedTitle,
      variants: raw.variants.length,
      procedureRows: rowCount,
      warnings: raw.extractionWarnings.length,
      extractionConfidence: raw.extractionConfidence,
      warningCountsByType,
    });
    if (raw.extractionConfidence !== 'high') {
      summary.lowConfidenceFiles.push({
        sourceFile: item.filename,
        outputFile: path.relative(process.cwd(), outputPath),
        extractionConfidence: raw.extractionConfidence,
        warnings: raw.extractionWarnings.length,
      });
    }
    summary.totalTopics += raw.extractedTitle ? 1 : 0;
    summary.totalVariants += raw.variants.length;
    summary.totalProcedureRows += rowCount;
    summary.totalWarnings += raw.extractionWarnings.length;
    mergeWarningCounts(summary.warningCountsByType, raw.extractionWarnings);

    console.log(`Wrote ${path.relative(process.cwd(), outputPath)} (${raw.variants.length} variants, ${rowCount} rows, ${raw.extractionWarnings.length} warnings)`);
  }

  await writeFile(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  logSummary(summary, pdfs.length);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
