import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rawDir = path.resolve(process.cwd(), 'src/data/appropriateness/raw');
const reportDir = path.resolve(process.cwd(), 'reports/acr-extraction');
const summaryPath = path.join(rawDir, 'extraction-summary.json');
const generatedAt = new Date().toISOString();

const csvFiles = {
  summary: 'acr-extraction-summary.csv',
  topicQuality: 'acr-topic-quality.csv',
  variantQuality: 'acr-variant-quality.csv',
  procedureRows: 'acr-procedure-rows.csv',
  warningLog: 'acr-warning-log.csv',
  reviewQueue: 'acr-manual-review-queue.csv',
};

const warningSeverity = {
  noVariantFound: 'high',
  noProcedureRowsFound: 'high',
  unclearAppropriatenessCategory: 'high',
  unclearRadiationLevel: 'medium',
  suspiciouslyFewRows: 'medium',
  possibleTruncatedProcedure: 'medium',
  duplicateVariant: 'low',
  duplicateTopicTitle: 'low',
};

const warningActions = {
  noVariantFound: 'Review source PDF text extraction and manually identify variant sections.',
  noProcedureRowsFound: 'Review source table extraction and manually verify procedure rows.',
  unclearAppropriatenessCategory: 'Check the procedure row against the source table and correct the appropriateness category.',
  unclearRadiationLevel: 'Check the source table and correct the relative radiation level.',
  suspiciouslyFewRows: 'Compare extracted rows against the full source table for missing rows.',
  possibleTruncatedProcedure: 'Verify and complete the procedure name from the original source.',
  duplicateVariant: 'Check whether duplicate variant headings represent repeated extraction or true source structure.',
  duplicateTopicTitle: 'Confirm whether duplicate topic titles are expected or require file/title cleanup.',
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled-topic';
}

function topicIdFromFilename(filename) {
  return path.basename(filename, '.raw.json');
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\r?\n|\r/g, ' ').trim();
  if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function toCsv(columns, rows) {
  return [columns.join(','), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(','))].join('\n') + '\n';
}

function truncate(value, max = 250) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function warningType(warning) {
  return warning?.category || warning?.type || warning?.warningType || 'minorParsingConcern';
}

function warningMessage(warning) {
  return warning?.message || warning?.warningMessage || warning?.description || '';
}

function severityForWarning(type) {
  return warningSeverity[type] || 'low';
}

function actionForWarning(type) {
  return warningActions[type] || 'Review this parsing concern against the original source document.';
}

function radiationPlain(level) {
  const normalized = String(level || '').trim();
  if (!normalized || /^unknown$/i.test(normalized)) return 'unclear';
  if (/^O$/i.test(normalized)) return 'none';
  if (normalized === '☢') return 'very_low';
  if (normalized === '☢☢') return 'low';
  if (normalized === '☢☢☢') return 'moderate';
  if (normalized === '☢☢☢☢') return 'higher';
  if (normalized === '☢☢☢☢☢') return 'highest';
  if (/^varies$/i.test(normalized)) return 'varies';
  return 'unclear';
}

function confidenceCounts(rows) {
  return rows.reduce(
    (counts, row) => {
      const confidence = String(row.confidence || '').toLowerCase();
      if (confidence === 'high') counts.high += 1;
      else if (confidence === 'medium') counts.medium += 1;
      else counts.low += 1;
      return counts;
    },
    { high: 0, medium: 0, low: 0 },
  );
}

function procedureAppearsTruncated(procedure) {
  const text = String(procedure || '').trim();
  return !text || text.length < 12 || /[,;:–—-]$/.test(text);
}

function rowNeedsReview(row) {
  return (
    String(row.confidence || '').toLowerCase() === 'low' ||
    !row.appropriatenessCategory ||
    /^unknown$/i.test(row.appropriatenessCategory) ||
    !row.radiationLevel ||
    /^unknown$/i.test(row.radiationLevel) ||
    procedureAppearsTruncated(row.procedure)
  );
}

function warningBelongsToVariant(warning, variant) {
  if (!warning || !variant) return false;
  if (warning.variantId && warning.variantId === variant.id) return true;
  if (warning.variantTitle && warning.variantTitle === variant.variantTitle) return true;
  return false;
}

function warningsForVariant(raw, variant) {
  return (raw.extractionWarnings || []).filter((warning) => warningBelongsToVariant(warning, variant));
}

async function readJsonIfExists(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
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

  for (const file of rawFiles) {
    try {
      const raw = JSON.parse(await readFile(path.join(rawDir, file), 'utf8'));
      topics.push({ file, topicId: topicIdFromFilename(file), raw });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      topics.push({ file, topicId: topicIdFromFilename(file), raw: null, readError: message });
    }
  }

  return topics;
}

function topicWarningCounts(raw) {
  const warnings = raw?.extractionWarnings || [];
  const types = new Set(warnings.map(warningType));
  return {
    warningCount: warnings.length,
    hasUnclearRadiation: types.has('unclearRadiationLevel'),
    hasUnclearCategory: types.has('unclearAppropriatenessCategory'),
    hasSuspiciouslyFewRows: types.has('suspiciouslyFewRows'),
  };
}

function buildTopicQualityRows(topics) {
  return topics.map(({ file, topicId, raw, readError }) => {
    const variants = raw?.variants || [];
    const procedureRows = variants.flatMap((variant) => variant.procedureRows || []);
    const counts = confidenceCounts(procedureRows);
    const warningCounts = topicWarningCounts(raw);
    const hasNoVariants = !variants.length;
    const hasNoRows = !procedureRows.length;
    const needsManualReview = Boolean(
      readError ||
        hasNoVariants ||
        hasNoRows ||
        counts.low > 0 ||
        warningCounts.hasUnclearRadiation ||
        warningCounts.hasUnclearCategory ||
        warningCounts.hasSuspiciouslyFewRows ||
        String(raw?.extractionConfidence || '').toLowerCase() === 'low',
    );
    const notes = [
      readError ? 'Unable to read raw JSON: ' + readError : '',
      hasNoVariants ? 'No variants found' : '',
      hasNoRows ? 'No procedure rows found' : '',
      counts.low > 0 ? counts.low + ' low-confidence row(s)' : '',
      warningCounts.hasUnclearRadiation ? 'Unclear radiation warning present' : '',
      warningCounts.hasUnclearCategory ? 'Unclear category warning present' : '',
      warningCounts.hasSuspiciouslyFewRows ? 'Suspiciously few rows warning present' : '',
    ]
      .filter(Boolean)
      .join('; ');

    return {
      topic_id: topicId,
      source_file: raw?.sourceFile || file,
      extracted_title: raw?.extractedTitle || '',
      extracted_year: raw?.extractedYear || '',
      review_status: raw?.reviewStatus || '',
      extraction_confidence: raw?.extractionConfidence || '',
      variant_count: variants.length,
      procedure_row_count: procedureRows.length,
      warning_count: warningCounts.warningCount,
      high_confidence_row_count: counts.high,
      medium_confidence_row_count: counts.medium,
      low_confidence_row_count: counts.low,
      has_no_variants: hasNoVariants,
      has_no_procedure_rows: hasNoRows,
      needs_manual_review: needsManualReview,
      notes,
    };
  });
}

function buildVariantQualityRows(topics) {
  const rows = [];
  for (const { topicId, raw } of topics) {
    if (!raw) continue;
    for (const variant of raw.variants || []) {
      const procedureRows = variant.procedureRows || [];
      const variantWarnings = warningsForVariant(raw, variant);
      const hasNoRows = !procedureRows.length;
      const hasLowConfidenceRows = procedureRows.some((row) => String(row.confidence || '').toLowerCase() === 'low');
      const hasHighSeverityWarning = variantWarnings.some((warning) => severityForWarning(warningType(warning)) === 'high');
      const needsManualReview = hasNoRows || hasLowConfidenceRows || hasHighSeverityWarning;
      const notes = [
        hasNoRows ? 'No procedure rows found for variant' : '',
        hasLowConfidenceRows ? 'Low-confidence row present' : '',
        hasHighSeverityWarning ? 'High-priority warning present' : '',
      ]
        .filter(Boolean)
        .join('; ');

      rows.push({
        topic_id: topicId,
        source_file: raw.sourceFile || '',
        topic_title: raw.extractedTitle || '',
        variant_id: variant.id || slugify(variant.variantTitle),
        variant_title: variant.variantTitle || '',
        procedure_row_count: procedureRows.length,
        warning_count: variantWarnings.length,
        has_no_procedure_rows: hasNoRows,
        needs_manual_review: needsManualReview,
        notes,
      });
    }
  }
  return rows;
}

function buildProcedureRows(topics) {
  const rows = [];
  for (const { topicId, raw } of topics) {
    if (!raw) continue;
    for (const variant of raw.variants || []) {
      for (const row of variant.procedureRows || []) {
        rows.push({
          topic_id: topicId,
          source_file: raw.sourceFile || '',
          topic_title: raw.extractedTitle || '',
          variant_id: variant.id || slugify(variant.variantTitle),
          variant_title: variant.variantTitle || '',
          procedure: row.procedure || '',
          appropriateness_category: row.appropriatenessCategory || '',
          radiation_level: row.radiationLevel || '',
          radiation_level_plain: radiationPlain(row.radiationLevel),
          confidence: row.confidence || '',
          needs_manual_review: rowNeedsReview(row),
          raw_line_preview: truncate(row.rawLine, 250),
        });
      }
    }
  }
  return rows;
}

function buildWarningRows(topics) {
  const rows = [];
  for (const { topicId, raw, readError, file } of topics) {
    if (readError) {
      rows.push({
        topic_id: topicId,
        source_file: file,
        topic_title: '',
        variant_id: '',
        warning_type: 'rawJsonReadError',
        warning_message: readError,
        severity: 'high',
        suggested_action: 'Fix or regenerate this raw JSON file before review.',
      });
      continue;
    }
    if (!raw) continue;
    for (const warning of raw.extractionWarnings || []) {
      const type = warningType(warning);
      const variantId = warning.variantId || (warning.variantTitle ? slugify(warning.variantTitle) : '');
      rows.push({
        topic_id: topicId,
        source_file: raw.sourceFile || '',
        topic_title: raw.extractedTitle || '',
        variant_id: variantId,
        warning_type: type,
        warning_message: warningMessage(warning),
        severity: severityForWarning(type),
        suggested_action: actionForWarning(type),
      });
    }
  }
  return rows;
}

function addReviewQueueItem(queue, item) {
  queue.push({
    priority: item.priority,
    review_item_type: item.review_item_type,
    topic_id: item.topic_id || '',
    source_file: item.source_file || '',
    topic_title: item.topic_title || '',
    variant_title: item.variant_title || '',
    issue: item.issue || '',
    suggested_action: item.suggested_action || '',
    review_status: 'pending',
    reviewer_notes: '',
  });
}

function buildManualReviewQueue(topicRows, variantRows, procedureRows, warningRows) {
  const queue = [];

  for (const row of topicRows) {
    if (String(row.needs_manual_review) !== 'true') continue;
    const priority = row.has_no_variants || row.has_no_procedure_rows || /unclear category/i.test(row.notes) ? 'high' : 'medium';
    addReviewQueueItem(queue, {
      priority,
      review_item_type: 'topic',
      topic_id: row.topic_id,
      source_file: row.source_file,
      topic_title: row.extracted_title,
      issue: row.notes || 'Topic requires manual review',
      suggested_action: 'Open the source PDF and verify variants, procedure rows, category, and radiation extraction.',
    });
  }

  for (const row of variantRows) {
    if (String(row.needs_manual_review) !== 'true') continue;
    const priority = row.has_no_procedure_rows ? 'high' : 'medium';
    addReviewQueueItem(queue, {
      priority,
      review_item_type: 'variant',
      topic_id: row.topic_id,
      source_file: row.source_file,
      topic_title: row.topic_title,
      variant_title: row.variant_title,
      issue: row.notes || 'Variant requires manual review',
      suggested_action: 'Compare the variant block against the source table and correct missing rows or categories.',
    });
  }

  for (const row of procedureRows) {
    if (String(row.needs_manual_review) !== 'true') continue;
    const priority = !row.appropriateness_category || /^unknown$/i.test(row.appropriateness_category) ? 'high' : 'medium';
    const issues = [
      String(row.confidence).toLowerCase() === 'low' ? 'Low confidence row' : '',
      !row.appropriateness_category || /^unknown$/i.test(row.appropriateness_category) ? 'Unclear appropriateness category' : '',
      !row.radiation_level || /^unknown$/i.test(row.radiation_level) ? 'Unclear radiation level' : '',
      procedureAppearsTruncated(row.procedure) ? 'Possible truncated procedure' : '',
    ]
      .filter(Boolean)
      .join('; ');
    addReviewQueueItem(queue, {
      priority,
      review_item_type: 'procedure_row',
      topic_id: row.topic_id,
      source_file: row.source_file,
      topic_title: row.topic_title,
      variant_title: row.variant_title,
      issue: issues || 'Procedure row requires manual review',
      suggested_action: 'Verify procedure, appropriateness category, and radiation level against the original table.',
    });
  }

  for (const row of warningRows) {
    if (row.severity === 'low') continue;
    addReviewQueueItem(queue, {
      priority: row.severity,
      review_item_type: 'topic',
      topic_id: row.topic_id,
      source_file: row.source_file,
      topic_title: row.topic_title,
      variant_title: '',
      issue: row.warning_type + ': ' + row.warning_message,
      suggested_action: row.suggested_action,
    });
  }

  const rank = { high: 1, medium: 2, low: 3 };
  return queue.sort((a, b) => (rank[a.priority] || 4) - (rank[b.priority] || 4) || a.topic_id.localeCompare(b.topic_id));
}

function buildSummaryRows(summary, topics, procedureRows, warningRows) {
  const counts = confidenceCounts(procedureRows);
  const failedFiles = summary.failedFiles?.length ?? 0;
  return [
    {
      generated_at: generatedAt,
      processed_files: summary.processedFiles?.length ?? topics.filter((topic) => topic.raw).length,
      failed_files: failedFiles,
      total_topics: summary.totalTopics ?? topics.filter((topic) => topic.raw).length,
      total_variants: summary.totalVariants ?? topics.flatMap((topic) => topic.raw?.variants || []).length,
      total_procedure_rows: summary.totalProcedureRows ?? procedureRows.length,
      total_warnings: summary.totalWarnings ?? warningRows.length,
      high_confidence_rows: counts.high,
      medium_confidence_rows: counts.medium,
      low_confidence_rows: counts.low,
    },
  ];
}

async function writeCsv(filename, columns, rows) {
  await writeFile(path.join(reportDir, filename), toCsv(columns, rows), 'utf8');
}

async function main() {
  await mkdir(reportDir, { recursive: true });
  const topics = await readRawTopics();
  const summary = await readJsonIfExists(summaryPath, {});

  const topicRows = buildTopicQualityRows(topics);
  const variantRows = buildVariantQualityRows(topics);
  const procedureRows = buildProcedureRows(topics);
  const warningRows = buildWarningRows(topics);
  const reviewQueueRows = buildManualReviewQueue(topicRows, variantRows, procedureRows, warningRows);
  const summaryRows = buildSummaryRows(summary, topics, procedureRows, warningRows);

  await writeCsv(csvFiles.summary, [
    'generated_at',
    'processed_files',
    'failed_files',
    'total_topics',
    'total_variants',
    'total_procedure_rows',
    'total_warnings',
    'high_confidence_rows',
    'medium_confidence_rows',
    'low_confidence_rows',
  ], summaryRows);

  await writeCsv(csvFiles.topicQuality, [
    'topic_id',
    'source_file',
    'extracted_title',
    'extracted_year',
    'review_status',
    'extraction_confidence',
    'variant_count',
    'procedure_row_count',
    'warning_count',
    'high_confidence_row_count',
    'medium_confidence_row_count',
    'low_confidence_row_count',
    'has_no_variants',
    'has_no_procedure_rows',
    'needs_manual_review',
    'notes',
  ], topicRows);

  await writeCsv(csvFiles.variantQuality, [
    'topic_id',
    'source_file',
    'topic_title',
    'variant_id',
    'variant_title',
    'procedure_row_count',
    'warning_count',
    'has_no_procedure_rows',
    'needs_manual_review',
    'notes',
  ], variantRows);

  await writeCsv(csvFiles.procedureRows, [
    'topic_id',
    'source_file',
    'topic_title',
    'variant_id',
    'variant_title',
    'procedure',
    'appropriateness_category',
    'radiation_level',
    'radiation_level_plain',
    'confidence',
    'needs_manual_review',
    'raw_line_preview',
  ], procedureRows);

  await writeCsv(csvFiles.warningLog, [
    'topic_id',
    'source_file',
    'topic_title',
    'variant_id',
    'warning_type',
    'warning_message',
    'severity',
    'suggested_action',
  ], warningRows);

  await writeCsv(csvFiles.reviewQueue, [
    'priority',
    'review_item_type',
    'topic_id',
    'source_file',
    'topic_title',
    'variant_title',
    'issue',
    'suggested_action',
    'review_status',
    'reviewer_notes',
  ], reviewQueueRows);

  console.log('ACR extraction quality reports generated.');
  console.log('Raw topics read: ' + topics.filter((topic) => topic.raw).length);
  console.log('Topic quality rows: ' + topicRows.length);
  console.log('Variant quality rows: ' + variantRows.length);
  console.log('Procedure rows: ' + procedureRows.length);
  console.log('Warning rows: ' + warningRows.length);
  console.log('Manual review queue rows: ' + reviewQueueRows.length);
  console.log('Output folder: ' + path.relative(process.cwd(), reportDir));
  console.log('Excel workbook generation skipped; CSV files can be imported into Excel, Numbers, or Google Sheets.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
