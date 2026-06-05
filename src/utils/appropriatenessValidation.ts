import type { AppropriatenessCategory, ImagingOption, RadiationLevel } from '../data/appropriateness';

export type AppropriatenessCheckSeverity = 'appropriate' | 'conditional' | 'not_appropriate' | 'unknown' | 'not_selected';

export interface RequestedImagingCheck {
  match?: ImagingOption;
  appropriatenessCategory?: AppropriatenessCategory;
  radiationLevel?: RadiationLevel;
  severity: AppropriatenessCheckSeverity;
  message: string;
  suggestedAlternatives: ImagingOption[];
}

const stopWords = new Set(['imaging', 'study', 'exam', 'examination', 'with', 'without', 'and', 'or', 'iv', 'contrast']);

export function normalizeProcedureName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bw\/o\b/g, 'without')
    .replace(/\bw\/\b/g, 'with')
    .replace(/[^a-z0-9+/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: string): string[] {
  return normalizeProcedureName(value)
    .split(' ')
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function similarity(a: string, b: string) {
  const normalizedA = normalizeProcedureName(a);
  const normalizedB = normalizeProcedureName(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) return 0.9;

  const aTokens = new Set(tokens(a));
  const bTokens = new Set(tokens(b));
  if (!aTokens.size || !bTokens.size) return 0;
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  return overlap / Math.max(aTokens.size, bTokens.size);
}

function bestAlternatives(options: ImagingOption[]) {
  const usually = options.filter((option) => option.appropriatenessCategory === 'Usually Appropriate');
  const may = options.filter((option) => option.appropriatenessCategory.startsWith('May Be Appropriate'));
  return (usually.length ? usually : may).slice(0, 4);
}

export function findMatchingImagingOption(requestedProcedure: string, options: ImagingOption[]): ImagingOption | undefined {
  const scored = options
    .map((option) => ({ option, score: similarity(requestedProcedure, option.procedure) }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score >= 0.5 ? scored[0].option : undefined;
}

export function classifyRequestedImaging(requestedProcedure: string, options: ImagingOption[]): RequestedImagingCheck {
  const requested = requestedProcedure.trim();
  const suggestedAlternatives = bestAlternatives(options);

  if (!requested) {
    return {
      severity: 'not_selected',
      message: 'Select a requested imaging option to check appropriateness against the selected clinical scenario.',
      suggestedAlternatives,
    };
  }

  const match = findMatchingImagingOption(requested, options);

  if (!match) {
    return {
      severity: 'unknown',
      message: `"${requested}" was not found in the selected scenario table. Confirm the request locally or choose a listed option.`,
      suggestedAlternatives,
    };
  }

  if (match.appropriatenessCategory === 'Usually Appropriate') {
    return {
      match,
      appropriatenessCategory: match.appropriatenessCategory,
      radiationLevel: match.radiationLevel,
      severity: 'appropriate',
      message: `${match.procedure} is listed as Usually Appropriate for the selected clinical scenario.`,
      suggestedAlternatives,
    };
  }

  if (match.appropriatenessCategory === 'Usually Not Appropriate') {
    return {
      match,
      appropriatenessCategory: match.appropriatenessCategory,
      radiationLevel: match.radiationLevel,
      severity: 'not_appropriate',
      message: `${match.procedure} is listed as Usually Not Appropriate for the selected clinical scenario. Consider a Usually Appropriate option if it matches the clinical question.`,
      suggestedAlternatives,
    };
  }

  return {
    match,
    appropriatenessCategory: match.appropriatenessCategory,
    radiationLevel: match.radiationLevel,
    severity: 'conditional',
    message: `${match.procedure} is listed as ${match.appropriatenessCategory}. This may be reasonable depending on the clinical details and local protocol.`,
    suggestedAlternatives,
  };
}
