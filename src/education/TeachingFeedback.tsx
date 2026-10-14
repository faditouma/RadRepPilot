import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { StoredWorkflowDraft } from "../lib/workflowDraftStorage";
import type { TeachingStudy } from "./teaching";
type Item = { id: string; text: string };
type Feedback = {
  status: string;
  reference_report?: Record<string, string>;
  expected_findings?: Item[];
  acceptable_alternatives?: Item[];
  key_negatives?: Item[];
  critical_errors?: Item[];
  teaching_notes?: string;
  reviewed_at?: string;
};
export function TeachingFeedback({
  attemptId,
  accountSynced,
  draft,
  study,
}: {
  attemptId: string;
  accountSynced: boolean;
  draft: StoredWorkflowDraft;
  study: TeachingStudy;
}) {
  const [feedback, setFeedback] = useState<Feedback | null>(null),
    [error, setError] = useState(""),
    [ratings, setRatings] = useState<Record<string, string>>({}),
    [reflection, setReflection] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    if (accountSynced && supabase) {
      supabase
        .rpc("education_feedback", { p_attempt: attemptId })
        .then(({ data, error }) => {
          if (active) {
            if (error) setError(error.message);
            else setFeedback(data);
          }
        });
    } else setFeedback({ status: "browser_local" });
    return () => {
      active = false;
    };
  }, [attemptId, accountSynced]);
  async function save() {
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) return;
    const { error } = await supabase!
      .from("education_self_assessments")
      .upsert({
        attempt_id: attemptId,
        user_id: user.id,
        ratings,
        reflection,
        updated_at: new Date().toISOString(),
      });
    if (error) setError(error.message);
    else setSaved(true);
  }
  const groups: [string, Item[]][] = [
    ["Expected findings", feedback?.expected_findings || []],
    ["Acceptable alternatives", feedback?.acceptable_alternatives || []],
    ["Key negatives", feedback?.key_negatives || []],
    ["Critical errors", feedback?.critical_errors || []],
  ];
  return (
    <section className="edu-feedback">
      <h2>
        Submitted: {study.id} · version {study.version}
      </h2>
      <p>
        {accountSynced
          ? "Account-synced attempt"
          : "Browser-local attempt · not account synced"}{" "}
        · {study.viewerVersion}. Structured answers, generated report and your
        edited report are preserved.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {feedback?.status === "approved" ? (
        <>
          <p>
            Clinically reviewed {feedback.reviewed_at}. This reference report is
            an acceptable example, not the only correct wording.
          </p>
          <div className="edu-comparison">
            {[
              ["Your submitted report", draft.report],
              ["Approved reference report", feedback.reference_report || {}],
            ].map(([label, report]) => (
              <article key={String(label)}>
                <h3>{String(label)}</h3>
                {Object.entries(report).map(([k, v]) =>
                  v ? (
                    <div key={k}>
                      <strong>{k}</strong>
                      <p>{v}</p>
                    </div>
                  ) : null,
                )}
              </article>
            ))}
          </div>
          <h3>Structured self-assessment</h3>
          {groups.map(([label, items]) => (
            <section key={label}>
              <h4>{label}</h4>
              {items.map((i) => (
                <label className="edu-field" key={i.id}>
                  <span>{i.text}</span>
                  <select
                    value={ratings[i.id] || ""}
                    onChange={(e) => {
                      setRatings({ ...ratings, [i.id]: e.target.value });
                      setSaved(false);
                    }}
                  >
                    <option value="">Choose…</option>
                    <option value="matched">Addressed appropriately</option>
                    <option value="missed">Omitted / incorrect</option>
                    <option value="unsupported">Unsupported assertion</option>
                    <option value="uncertain">
                      Uncertain / needs discussion
                    </option>
                  </select>
                </label>
              ))}
            </section>
          ))}
          <label className="edu-field">
            Reflection / questionable feedback
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </label>
          <button onClick={save}>Save self-assessment</button>
          {saved ? (
            <p role="status">Self-assessment saved to your account.</p>
          ) : null}
          <p>{feedback.teaching_notes}</p>
        </>
      ) : (
        <p>
          {feedback?.status === "browser_local"
            ? "Protected reference comparison requires an account-synced submission."
            : "No approved reference is available yet. Clinical and privacy review remain pending; no score or expert answer is fabricated."}
        </p>
      )}
      <p>
        Automated grading is disabled. It requires a separately approved
        case-specific rubric and evaluation.
      </p>
    </section>
  );
}
