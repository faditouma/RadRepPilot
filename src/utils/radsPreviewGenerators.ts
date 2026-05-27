import type { RadsSystemDefinition } from '../radrep/types';

export function generateRadsPreviewSentence(system: RadsSystemDefinition): string {
  return system.reportReadySentenceTemplate;
}

export function summarizeRadsInputs(system: RadsSystemDefinition, maxItems = 5): string {
  return system.keyInputs.slice(0, maxItems).join(', ');
}
