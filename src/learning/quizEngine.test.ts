import { describe, it, expect } from "vitest";
import { generateReport, answerIssues, type QuizCase } from "./quizEngine";
const c: QuizCase = {
  id: "software-only",
  version: 1,
  title: "QA",
  modality: "X-ray",
  bodySystem: "QA",
  difficulty: "QA",
  minutes: 1,
  context: "Provided history",
  contextProvenance: "fixture",
  creditLimitation: "",
  assessmentEligible: false,
  hints: [],
  assets: [],
  questions: [
    {
      id: "finding",
      label: "Observation",
      section: "findings",
      kind: "select",
      options: [
        { id: "present", label: "Present", sentence: "QA finding present." },
        { id: "none", label: "Absent", sentence: "QA finding absent." },
      ],
    },
  ],
  conflicts: [
    {
      when: { finding: "none", impression: "positive" },
      message: "Incompatible selections",
    },
  ],
};
describe("quiz report generation", () => {
  it("does not insert normal findings for unassessed answers", () => {
    const r = generateReport(c, {});
    expect(r).toContain("Provided history");
    expect(r).not.toContain("FINDINGS");
    expect(r).not.toContain("absent");
  });
  it("reports the selected answer without correcting it", () => {
    expect(generateReport(c, { finding: "none" })).toContain(
      "QA finding absent",
    );
  });
  it("flags inconsistent answers without revealing an answer key", () => {
    expect(
      answerIssues(c, { finding: "none", impression: "positive" }),
    ).toContain("Incompatible selections");
  });
});
