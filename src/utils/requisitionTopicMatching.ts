import type { AppropriatenessTopic, AppropriatenessVariant } from '../data/appropriateness';
import { allAppropriatenessTopics, allClinicalMappings, getTopicById } from './appropriatenessSearch';
import type { ClinicalComplaintMapping } from '../data/appropriateness/clinicalMappings';

const stopWords = new Set([
  'a',
  'an',
  'and',
  'for',
  'in',
  'of',
  'or',
  'the',
  'to',
  'with',
  'without',
]);

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: string) {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function overlapScore(query: string, candidate: string) {
  const queryTokens = tokens(query);
  const candidateTokens = new Set(tokens(candidate));
  if (!queryTokens.length || !candidateTokens.size) return 0;
  const overlap = queryTokens.filter((token) => candidateTokens.has(token)).length;
  return overlap / queryTokens.length;
}

function scoreCandidate(query: string, candidate: string) {
  const normalizedQuery = normalize(query);
  const normalizedCandidate = normalize(candidate);
  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedQuery === normalizedCandidate) return 120;
  if (normalizedCandidate.includes(normalizedQuery)) return 90;
  if (normalizedQuery.includes(normalizedCandidate)) return 78;
  return Math.round(overlapScore(normalizedQuery, normalizedCandidate) * 60);
}

function scoreMapping(query: string, mapping: ClinicalComplaintMapping) {
  return Math.max(
    scoreCandidate(query, mapping.complaint),
    ...mapping.synonyms.map((synonym) => scoreCandidate(query, synonym)),
  );
}

function scoreTopic(query: string, topic: AppropriatenessTopic) {
  const titleScore = Math.max(scoreCandidate(query, topic.title), scoreCandidate(query, topic.id.replace(/-/g, ' ')));
  const keywordScore = Math.max(0, ...topic.keywords.map((keyword) => scoreCandidate(query, keyword) - 25));
  const variantScore = Math.max(
    0,
    ...topic.variants.map((variant) => Math.max(scoreCandidate(query, variant.title), scoreCandidate(query, variant.clinicalScenario)) - 35),
  );
  return Math.max(titleScore, keywordScore, variantScore);
}

export interface RequisitionTopicMatchResult {
  mapping?: ClinicalComplaintMapping;
  topics: AppropriatenessTopic[];
}

export function findRequisitionTopicMatches(query: string): RequisitionTopicMatchResult {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return { topics: [] };

  const rankedMappings = allClinicalMappings()
    .map((mapping) => ({ mapping, score: scoreMapping(normalizedQuery, mapping) }))
    .filter((item) => item.score >= 55)
    .sort((a, b) => b.score - a.score);
  const bestMapping = rankedMappings[0]?.mapping;

  if (bestMapping) {
    const mappedTopics = bestMapping.relatedTopicIds
      .map((topicId) => getTopicById(topicId))
      .filter((topic): topic is AppropriatenessTopic => Boolean(topic));
    if (mappedTopics.length) return { mapping: bestMapping, topics: mappedTopics };
  }

  const topics = allAppropriatenessTopics()
    .map((topic) => ({ topic, score: scoreTopic(normalizedQuery, topic) }))
    .filter((item) => item.score >= 55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.topic);

  return { mapping: bestMapping, topics };
}

export function cleanVariantTitle(value: string) {
  return value
    .replace(/^Variant\s+\d+\s*:\s*/i, '')
    .replace(/\s*Initial imaging\.?\s*$/i, '')
    .replace(/[.\s]+$/g, '')
    .trim();
}

export function buildClinicalQuestion(topic: AppropriatenessTopic, variant: AppropriatenessVariant) {
  const context = normalize(`${topic.title} ${variant.title} ${variant.clinicalScenario}`);

  if (context.includes('headache') && /(sudden|thunderclap|maximal severity)/.test(context)) {
    return 'Assess for acute intracranial hemorrhage or other acute intracranial abnormality';
  }
  if (context.includes('headache')) return 'Assess for a structural intracranial cause corresponding to the described headache scenario';
  if (context.includes('cauda equina')) return 'Assess for cauda equina compression or other urgent spinal canal pathology';
  if (context.includes('low back pain')) return 'Assess for structural spinal pathology corresponding to the described symptoms and red flags';
  if (context.includes('pulmonary embol')) return 'Assess for pulmonary embolism';
  if (context.includes('deep vein thrombosis')) return 'Assess for lower-extremity deep vein thrombosis';
  if (context.includes('hematuria')) return 'Assess for urinary tract stone, mass, obstruction, or other imaging-relevant cause of hematuria';
  if (/(flank pain|stone disease|urolithiasis|renal colic)/.test(context)) return 'Assess for urinary tract calculus, obstruction, and complications';
  if (/(right upper quadrant|biliary|gallbladder)/.test(context)) return 'Assess for cholelithiasis, cholecystitis, biliary obstruction, or alternative biliary pathology';
  if (context.includes('pancreatitis')) return 'Assess for pancreatitis, complications, and alternative causes of pain';
  if (/(right lower quadrant|appendicitis)/.test(context)) return 'Assess for appendicitis or alternative acute right lower quadrant pathology';
  if (/(left lower quadrant|diverticulitis)/.test(context)) return 'Assess for diverticulitis or alternative acute left lower quadrant pathology';
  if (context.includes('bowel obstruction')) return 'Assess for bowel obstruction, transition point, and complications';
  if (context.includes('abdominal pain')) return 'Assess for acute intra-abdominal pathology corresponding to the clinical presentation';

  return `Assess for imaging findings relevant to ${topic.title.toLowerCase()}`;
}
