import {
  reportingWorkflowSchemas,
  type ReportingWorkflowSchema,
} from "../data/reportingWorkflowSchemas";
import type { StoredWorkflowDraft } from "../lib/workflowDraftStorage";
import { generateReportingWorkflowReport } from "../utils/reportGenerators";
import type { DICOMStudy } from "./OHIFViewer";
export interface TeachingStudy extends DICOMStudy {
  title: string;
  history: string;
  historyProvenance: string;
  purpose: "demonstration" | "diagnostic_candidate";
  workflow: "nodule";
  series: Array<{
    SeriesInstanceUID: string;
    SeriesDescription: string;
    count: number;
  }>;
  licence: { name: string; url: string };
  attribution: { citations: string[]; idc_acknowledgment: string };
  modifications: string[];
}
export function caseSchema(): ReportingWorkflowSchema {
  const original = reportingWorkflowSchemas.nodule;
  return {
    ...original,
    quickFills: [],
    defaultValues: Object.fromEntries(
      Object.keys(original.defaultValues).map((k) => [
        k,
        Array.isArray(original.defaultValues[k]) ? [] : "",
      ]),
    ),
    sections: original.sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) => ({
        ...f,
        options:
          f.type === "select"
            ? [
                { value: "", label: "Not assessed" },
                ...(f.options || []).filter((o) => o.value !== ""),
              ]
            : f.options,
      })),
    })),
  };
}
export function freshDraft(
  schema: ReportingWorkflowSchema,
): StoredWorkflowDraft {
  return {
    workflowId: schema.moduleId,
    moduleType: schema.moduleType,
    values: schema.defaultValues,
    report: generateReportingWorkflowReport(
      schema.moduleType,
      schema.defaultValues,
    ),
    lastUpdatedAt: new Date().toISOString(),
  };
}
export function draftPayload(draft: StoredWorkflowDraft) {
  return {
    report: draft.report,
    structured_answers: draft.values,
    generated_report: generateReportingWorkflowReport("nodule", draft.values),
    workflow_id: draft.workflowId,
    workflow_version: "radrep-nodule-1",
  };
}
