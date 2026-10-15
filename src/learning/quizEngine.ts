import { buildFullReport } from "../radrep/reportLogic";
import type { ReportSections } from "../radrep/types";
export type Answers = Record<string, string | string[]>;
export interface QuizOption {
  id: string;
  label: string;
  sentence: string;
}
export interface QuizQuestion {
  id: string;
  label: string;
  section: "technique" | "findings" | "impression";
  kind: "select" | "checkbox-group";
  options: QuizOption[];
}
export interface QuizCase {
  id: string;
  version: number;
  title: string;
  modality: string;
  bodySystem: string;
  difficulty: string;
  minutes: number;
  context: string;
  contextProvenance: string;
  creditLimitation: string;
  assessmentEligible: boolean;
  questions: QuizQuestion[];
  hints: string[];
  assets: Array<{
    path: string;
    label: string;
    attribution: string;
    sourceUrl: string;
    license: { name: string; url: string };
    modifications: string[];
  }>;
  conflicts: Array<{ when: Record<string, string>; message: string }>;
}
export function generateReport(c: QuizCase, answers: Answers) {
  const sections: ReportSections = {
    indication: c.context,
    technique: "",
    findings: "",
    impression: "",
  };
  for (const q of c.questions) {
    const value = answers[q.id];
    for (const option of q.options)
      if (
        Array.isArray(value) ? value.includes(option.id) : value === option.id
      )
        sections[q.section] +=
          (sections[q.section] ? "\n" : "") + option.sentence;
  }
  return buildFullReport(sections);
}
export function answerIssues(c: QuizCase, answers: Answers) {
  const issues: string[] = [];
  for (const q of c.questions) {
    const value = answers[q.id];
    if (!value || (Array.isArray(value) && !value.length))
      issues.push(`Answer “${q.label}”, or choose uncertain/not assessable.`);
    if (
      Array.isArray(value) &&
      value.length > 1 &&
      value.some((v) => ["none", "uncertain", "not_assessable"].includes(v))
    )
      issues.push(
        "Choose either a positive observation or an exclusive none/uncertain/not assessable answer.",
      );
  }
  for (const rule of c.conflicts || [])
    if (Object.entries(rule.when).every(([k, v]) => answers[k] === v))
      issues.push(rule.message);
  return issues;
}
export async function quizApi(action: string, data?: unknown, caseId?: string) {
  const res = await fetch(
    `/api/quiz?action=${action}${caseId ? `&case=${encodeURIComponent(caseId)}` : ""}`,
    {
      method: data ? "POST" : "GET",
      headers: data ? { "Content-Type": "application/json" } : undefined,
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  const result = await res.json();
  if (!res.ok) throw Error(result.error || "Unable to reach learning services");
  return result;
}
