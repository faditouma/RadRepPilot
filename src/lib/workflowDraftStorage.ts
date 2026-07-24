import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';

export const ACTIVE_WORKFLOW_DRAFT_KEY = 'radreppilot.activeWorkflowDraft';

export interface StoredWorkflowDraft {
  workflowId: string;
  moduleType: string;
  values: WorkflowValues;
  report: ReportSections & { internalNotes?: string };
  activeQuickFillId?: string;
  lastUpdatedAt: string;
}

interface WorkflowDraftInput {
  schema: ReportingWorkflowSchema;
  values: WorkflowValues;
  report: ReportSections & { internalNotes?: string };
  activeQuickFillId?: string;
  now?: Date;
}

export function createStoredWorkflowDraft({
  schema,
  values,
  report,
  activeQuickFillId = '',
  now = new Date(),
}: WorkflowDraftInput): StoredWorkflowDraft {
  return {
    workflowId: schema.moduleId,
    moduleType: schema.moduleType,
    values,
    report,
    activeQuickFillId,
    lastUpdatedAt: now.toISOString(),
  };
}

export function readStoredWorkflowDraft(
  storage: Pick<Storage, 'getItem'>,
  schema: ReportingWorkflowSchema,
): StoredWorkflowDraft | null {
  try {
    const raw = storage.getItem(ACTIVE_WORKFLOW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredWorkflowDraft>;
    if (
      parsed.workflowId !== schema.moduleId ||
      parsed.moduleType !== schema.moduleType ||
      !parsed.values ||
      !parsed.report
    ) {
      return null;
    }

    return {
      workflowId: parsed.workflowId,
      moduleType: parsed.moduleType,
      values: parsed.values,
      report: parsed.report,
      activeQuickFillId: parsed.activeQuickFillId ?? '',
      lastUpdatedAt: parsed.lastUpdatedAt ?? new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeStoredWorkflowDraft(
  storage: Pick<Storage, 'setItem'>,
  draft: StoredWorkflowDraft,
): void {
  storage.setItem(ACTIVE_WORKFLOW_DRAFT_KEY, JSON.stringify(draft));
}
