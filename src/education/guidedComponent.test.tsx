// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nProvider } from "../i18n/I18nContext";
import { ReportingWorkflowPage } from "../components/reporting/ReportingWorkflowPage";
import { caseSchema, freshDraft } from "./teaching";
import { ACTIVE_WORKFLOW_DRAFT_KEY } from "../lib/workflowDraftStorage";
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
it("case mode never overwrites the general reporting draft and preserves manual text during structured edits", async () => {
  localStorage.setItem(ACTIVE_WORKFLOW_DRAFT_KEY, "existing unrelated draft");
  const schema = caseSchema(),
    draft = freshDraft(schema);
  draft.report.findings = "Manual learner wording to preserve.";
  const changed = vi.fn();
  await act(async () => {
    root.render(
      <I18nProvider>
        <ReportingWorkflowPage
          schema={schema}
          caseScope="learner:ct-002:v1"
          initialDraft={draft}
          onDraftChange={changed}
          onInsertText={() => {}}
          onSaveDraft={() => {}}
        />
      </I18nProvider>,
    );
  });
  expect(localStorage.getItem(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(
    "existing unrelated draft",
  );
  const label = Array.from(host.querySelectorAll("label")).find((l) =>
    l.textContent?.startsWith("Nodule type"),
  );
  const input = label?.querySelector("select");
  expect(input).toBeTruthy();
  await act(async () => {
    input!.value = "solid";
    input!.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(changed.mock.calls.at(-1)?.[0].values.noduleType).toBe("solid");
  expect(changed.mock.calls.at(-1)?.[0].report.findings).toBe(
    "Manual learner wording to preserve.",
  );
  expect(localStorage.getItem(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(
    "existing unrelated draft",
  );
});
