import { acrAppropriatenessRegistry, type AcrAppropriatenessEntry } from '../data/acrAppropriatenessRegistry';
import type { ReferralFormState } from '../radrep/types';

export function matchAppropriatenessEntry(form: ReferralFormState): AcrAppropriatenessEntry | undefined {
  return acrAppropriatenessRegistry.find((entry) => entry.templateIds.includes(form.requestType));
}

export function generateAppropriatenessSentence(entry: AcrAppropriatenessEntry | undefined): string {
  if (!entry) {
    return 'ACR Appropriateness Criteria prototype support: no curated topic mapping is attached to this request yet. Verify imaging choice against official ACR guidance and local protocol.';
  }

  return `ACR Appropriateness Criteria prototype support: relevant official topic to verify may be "${entry.acrTopicName}" (${entry.variantLabelPlaceholder}). Full rating tables require official ACR verification; this prototype does not determine appropriateness.`;
}
