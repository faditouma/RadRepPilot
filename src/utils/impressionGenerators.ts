import type { WorkflowValues } from '../data/reportingWorkflowSchemas';

export function workflowValue(values: WorkflowValues, id: string): string {
  const raw = values[id];
  return Array.isArray(raw) ? raw.join(', ') : raw?.trim() ?? '';
}

export function workflowList(values: WorkflowValues, id: string): string[] {
  const raw = values[id];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw?.trim() ? [raw.trim()] : [];
}

export function yes(values: WorkflowValues, id: string): boolean {
  return workflowValue(values, id) === 'yes';
}

export function numberOrNull(values: WorkflowValues, id: string): number | null {
  const parsed = Number.parseFloat(workflowValue(values, id));
  return Number.isFinite(parsed) ? parsed : null;
}

export function sentenceList(items: string[]): string {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function cleanLines(lines: Array<string | undefined | null>): string {
  return lines.filter((line): line is string => Boolean(line?.trim())).join('\n');
}

export function formatMeasurement(value: string, fallback: string): string {
  return value.trim() || fallback;
}
