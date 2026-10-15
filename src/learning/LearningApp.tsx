import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { RadRepPilotLogo } from "../components/branding/RadRepPilotLogo";
import { StructuredFieldRenderer } from "../components/reporting/StructuredFieldRenderer";
import { RadiographViewer } from "./RadiographViewer";
import {
  answerIssues,
  generateReport,
  quizApi,
  type Answers,
  type QuizCase,
  type QuizQuestion,
} from "./quizEngine";
import "./learning.css";
const historyKey = "radrep:quiz:attempts";
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
const draftKey = (c: { id: string; version: number }) =>
  `radrep:quiz:browser:${c.id}:v${c.version}`;
export function LearningApp() {
  const [editorial, setEditorial] = useState(false),
    [catalog, setCatalog] = useState<any[]>([]),
    [error, setError] = useState(""),
    [profile, setProfile] = useState(
      () => localStorage.getItem("radrep:learner-profile") || "Medical student",
    );
  const location = useLocation();
  useEffect(() => {
    let active = true;
    quizApi("capabilities")
      .then((d) => {
        if (active) setEditorial(d.editorialPreview);
      })
      .catch(() => {});
    quizApi("catalog")
      .then((d) => {
        if (active) setCatalog(d.cases);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const section = location.pathname.split("/")[2] || "home";
  return (
    <div className="lrn-app">
      <header className="lrn-header">
        <Link className="lrn-brand" to="/learn">
          <RadRepPilotLogo variant="iconOnly" size={32} />
          <strong>RadRepPilot</strong>
        </Link>
        <nav aria-label="Learning navigation">
          <NavLink end to="/learn">
            Learn
          </NavLink>
          <NavLink to="/learn/library">Case library</NavLink>
          <NavLink to="/learn/progress">My progress</NavLink>
          <Link to="/workspace/modules">Reference tools</Link>
          {editorial ? (
            <NavLink to="/learn/editorial">Editorial preview</NavLink>
          ) : null}
        </nav>
        <details className="lrn-profile">
          <summary>Profile</summary>
          <div>
            <label>
              Learning profile
              <select
                value={profile}
                onChange={(e) => {
                  setProfile(e.target.value);
                  localStorage.setItem(
                    "radrep:learner-profile",
                    e.target.value,
                  );
                }}
              >
                {[
                  "Medical student",
                  "Radiology resident",
                  "GP / referring clinician",
                ].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <Link to="/preferences">Account settings</Link>
            <Link to="/account/security">Change password</Link>
            <Link to="/login" state={{ from: { pathname: location.pathname } }}>
              Sign in / recovery
            </Link>
          </div>
        </details>
      </header>
      <main className="lrn-main">
        {error ? (
          <p role="alert" className="lrn-notice">
            {error}
          </p>
        ) : null}
        {section === "case" ? (
          <QuizWorkspace editorial={editorial} profile={profile} />
        ) : section === "progress" ? (
          <Progress />
        ) : (
          <Library
            cases={catalog}
            editorial={section === "editorial"}
            home={section === "home"}
            authorized={editorial}
          />
        )}
      </main>
      <footer className="lrn-footer">
        Educational practice · No patient uploads · Clinical drafts await review
      </footer>
    </div>
  );
}
function Library({
  cases,
  editorial,
  home,
  authorized,
}: {
  cases: any[];
  editorial: boolean;
  home: boolean;
  authorized: boolean;
}) {
  if (editorial && !authorized)
    return (
      <section className="lrn-panel">
        <h1>Editorial access required</h1>
        <p>
          Draft review is available only to authorized viewers of the protected
          editorial deployment.
        </p>
      </section>
    );
  return (
    <>
      <section className="lrn-hero">
        <p className="lrn-eyebrow">
          {editorial
            ? "Protected editorial testing"
            : home
              ? "Learn with real images"
              : "Case library"}
        </p>
        <h1>
          {editorial
            ? "Inspect the complete teaching exercise."
            : home
              ? "See it. Describe it. Learn from it."
              : "Choose your next case."}
        </h1>
        <p>
          {editorial
            ? "Question sets, report wording and corrections are drafts—not clinically approved assessments. Content editing and publication still require reviewer permissions."
            : "Review an image, answer focused questions, then build and refine your report."}
        </p>
        {home && cases[0] ? (
          <Link className="lrn-primary" to={"/learn/case/" + cases[0].id}>
            Start an X-ray case
          </Link>
        ) : null}
      </section>
      <div className="lrn-section-heading">
        <h2>X-ray learning exercises</h2>
        <span>Review pending</span>
      </div>
      <section className="lrn-cards">
        {cases.map((c) => {
          const draft = read<any>(draftKey(c), null);
          return (
            <article className="lrn-case-card" key={c.id}>
              <div className="lrn-card-top">
                <span className="lrn-pill">{c.modality}</span>
                <span>{c.minutes} min</span>
              </div>
              <h3>{c.title}</h3>
              <p>
                {c.bodySystem} · {c.difficulty}
              </p>
              <p className="lrn-card-description">
                Focused questions and an editable report.
              </p>
              <Link className="lrn-secondary" to={"/learn/case/" + c.id}>
                {draft?.snapshot
                  ? "Review attempt"
                  : draft
                    ? "Resume"
                    : "Start case"}{" "}
                →
              </Link>
            </article>
          );
        })}
      </section>
      <section className="lrn-reference-strip">
        <div>
          <h2>Explore a CT study</h2>
          <p>Existing scrollable DICOM studies remain available.</p>
        </div>
        <Link to="/learn/ct/ct-002">Open CT workspace →</Link>
        <Link to="/learn/ct/ct-001">Interventional demonstration →</Link>
      </section>
    </>
  );
}
function Progress() {
  const attempts = read<any[]>(historyKey, []),
    flags = read<any[]>("radrep:quiz:feedback-flags", []);
  return (
    <>
      <section className="lrn-hero">
        <p className="lrn-eyebrow">My progress</p>
        <h1>Your practice, over time.</h1>
        <p>
          Saved on this browser. Account sync is separate and is not verified
          for this preview.
        </p>
      </section>
      <section className="lrn-panel">
        <h2>
          {attempts.length} practice{" "}
          {attempts.length === 1 ? "attempt" : "attempts"}
        </h2>
        <p>
          These are draft exercises, not competency or certification results.
        </p>
        {attempts.length ? (
          attempts
            .slice()
            .reverse()
            .map((a) => (
              <article className="lrn-attempt" key={a.id}>
                <Link to={"/learn/case/" + a.caseId + "?attempt=" + a.id}>
                  {a.title}
                </Link>
                <span>
                  {new Date(a.submittedAt).toLocaleDateString("en-CA")} ·{" "}
                  {a.hintsUsed ? `${a.hintsUsed} hints used` : "No hints"} ·
                  Confidence {a.confidence || "not entered"}
                </span>
                <span>
                  Review again{" "}
                  {new Date(
                    new Date(a.submittedAt).getTime() + 86400000,
                  ).toLocaleDateString("en-CA")}
                </span>
              </article>
            ))
        ) : (
          <p>Complete a case to save a practice attempt here.</p>
        )}
        <p>
          {flags.length} feedback questions saved for review on this browser.
        </p>
      </section>
    </>
  );
}
function Question({
  q,
  value,
  onChange,
}: {
  q: QuizQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  if (q.options.length > 7)
    return (
      <StructuredFieldRenderer
        field={{
          id: q.id,
          label: q.label,
          type: q.kind,
          options: q.options.map((o) => ({ value: o.id, label: o.label })),
        }}
        value={value}
        onChange={onChange}
      />
    );
  return (
    <fieldset className="lrn-question">
      <legend>{q.label}</legend>
      <p>
        {q.kind === "checkbox-group"
          ? "Select all observations you identified."
          : "Choose one answer."}
      </p>
      <div className="lrn-choice-grid">
        {q.options.map((o) => {
          const selected = Array.isArray(value)
            ? value.includes(o.id)
            : value === o.id;
          return (
            <label
              className={"lrn-choice" + (selected ? " selected" : "")}
              key={o.id}
            >
              <input
                type={q.kind === "checkbox-group" ? "checkbox" : "radio"}
                name={q.id}
                checked={selected}
                onChange={() => {
                  if (q.kind !== "checkbox-group") return onChange(o.id);
                  const previous = Array.isArray(value) ? value : [];
                  if (["none", "uncertain", "not_assessable"].includes(o.id))
                    return onChange(selected ? [] : [o.id]);
                  onChange(
                    selected
                      ? previous.filter((v) => v !== o.id)
                      : [
                          ...previous.filter(
                            (v) =>
                              !["none", "uncertain", "not_assessable"].includes(
                                v,
                              ),
                          ),
                          o.id,
                        ],
                  );
                }}
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
function QuizWorkspace({
  editorial,
  profile,
}: {
  editorial: boolean;
  profile: string;
}) {
  const { caseId = "xr-001" } = useParams();
  const caseLocation = useLocation();
  const [c, setC] = useState<QuizCase | null>(null),
    [answers, setAnswers] = useState<Answers>({}),
    [phase, setPhase] = useState("context"),
    [question, setQuestion] = useState(0),
    [manual, setManual] = useState<string | null>(null),
    [hints, setHints] = useState(0),
    [confidence, setConfidence] = useState(""),
    [snapshot, setSnapshot] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState<any>(null),
    [saved, setSaved] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    const n = ++generation.current;
    setC(null);
    setFeedback(null);
    setBusy(false);
    setError("");
    quizApi("case", undefined, caseId)
      .then((data) => {
        if (n !== generation.current) return;
        const attemptId = new URLSearchParams(caseLocation.search).get(
          "attempt",
        );
        const prior = attemptId
          ? read<any[]>(historyKey, []).find(
              (a) =>
                a.id === attemptId &&
                a.caseId === data.id &&
                a.version === data.version,
            )
          : null;
        const draft = prior
          ? {
              answers: prior.answers,
              phase: "feedback",
              manual: prior.editedReport,
              hints: prior.hintsUsed,
              confidence: prior.confidence,
              snapshot: prior,
            }
          : read<any>(draftKey(data), {});
        setAnswers(draft.answers || {});
        setPhase(draft.phase || "context");
        setQuestion(draft.question || 0);
        setManual(draft.manual ?? null);
        setHints(draft.hints || 0);
        setConfidence(draft.confidence || "");
        setSnapshot(draft.snapshot || null);
        setC(data);
      })
      .catch((e) => {
        if (n === generation.current) setError(e.message);
      });
    return () => {
      generation.current++;
    };
  }, [caseId, caseLocation.search]);
  const generated = useMemo(
    () => (c ? generateReport(c, answers) : ""),
    [c, answers],
  );
  const report = manual ?? generated;
  useEffect(() => {
    if (!c) return;
    try {
      localStorage.setItem(
        draftKey(c),
        JSON.stringify({
          answers,
          phase,
          question,
          manual,
          hints,
          confidence,
          snapshot,
        }),
      );
      setSaved(true);
    } catch {
      setSaved(false);
      setError("This browser could not save progress. Keep this page open.");
    }
  }, [c, answers, phase, question, manual, hints, confidence, snapshot]);
  async function submit() {
    if (!c || busy) return;
    const problems = answerIssues(c, answers);
    if (problems.length) {
      setError(problems.join(" "));
      return;
    }
    const n = generation.current;
    setBusy(true);
    setError("");
    try {
      const receipt = await quizApi("submit", {
        caseId: c.id,
        version: c.version,
        answers,
        generatedReport: generated,
        editedReport: report,
        confidence,
        hintsUsed: hints,
      });
      const attempt = JSON.parse(
        JSON.stringify({
          ...receipt,
          caseId: c.id,
          version: c.version,
          title: c.title,
          answers,
          generatedReport: generated,
          editedReport: report,
          confidence,
          hintsUsed: hints,
        }),
      );
      const history = read<any[]>(historyKey, []);
      localStorage.setItem(historyKey, JSON.stringify([...history, attempt]));
      if (n === generation.current) {
        setSnapshot(attempt);
        setPhase("feedback");
      }
    } catch (e) {
      if (n === generation.current) setError((e as Error).message);
    } finally {
      if (n === generation.current) setBusy(false);
    }
  }
  async function showDraft() {
    if (!snapshot) return;
    const n = generation.current;
    setBusy(true);
    try {
      const result = await quizApi("feedback", {
        receipt: snapshot.receipt,
        editorialDraft: true,
      });
      if (n === generation.current) {
        setFeedback(result);
        setError("");
      }
    } catch (e) {
      if (n === generation.current) setError((e as Error).message);
    } finally {
      if (n === generation.current) setBusy(false);
    }
  }
  if (!c)
    return (
      <section className="lrn-panel">
        <h1>{error ? "Case unavailable" : "Loading your case…"}</h1>
        {error ? <p role="alert">{error}</p> : null}
      </section>
    );
  const current = c.questions[Math.min(question, c.questions.length - 1)],
    steps = [
      ["context", "Context"],
      ["image", "Image review"],
      ["questions", "Questions"],
      ["report", "Your report"],
      ["feedback", "Corrections"],
    ];
  return (
    <>
      <div className="lrn-case-heading">
        <div>
          <Link to="/learn/library">← Case library</Link>
          <h1>{c.title}</h1>
          <p>
            {c.modality} · {c.bodySystem} · {c.minutes} min
          </p>
        </div>
        <span className="lrn-pill">Draft learning exercise</span>
      </div>
      <nav className="lrn-steps" aria-label="Case steps">
        {steps.map(([id, label], i) => (
          <button
            key={id}
            aria-current={phase === id ? "step" : undefined}
            disabled={id === "feedback" && !snapshot}
            onClick={() => {
              setPhase(id);
              setError("");
            }}
          >
            <span>{i + 1}</span>
            {label}
          </button>
        ))}
      </nav>
      <div className="lrn-reading-room">
        <aside className="lrn-image-column">
          <RadiographViewer study={c} />
          <details className="lrn-credits">
            <summary>Image credits and study scope</summary>
            <p>
              Selected images, not a complete examination. {c.creditLimitation}
            </p>
            {c.assets.map((a) => (
              <div key={a.path}>
                <p>{a.attribution}</p>
                <a href={a.sourceUrl} target="_blank" rel="noreferrer">
                  Original source
                </a>{" "}
                ·{" "}
                <a href={a.license.url} target="_blank" rel="noreferrer">
                  {a.license.name}
                </a>
                <p>{a.modifications.join("; ")}</p>
              </div>
            ))}
          </details>
        </aside>
        <section className="lrn-task-panel">
          <div className="lrn-task-meta">
            <span>{profile}</span>
            <span role="status">
              {saved ? "Saved in this browser" : "Saving…"}
            </span>
          </div>
          {error ? (
            <p role="alert" className="lrn-notice">
              {error}
            </p>
          ) : null}
          {phase === "context" ? (
            <>
              <p className="lrn-eyebrow">Clinical context</p>
              <h2>History and indication</h2>
              <p className="lrn-context">{c.context}</p>
              <p className="lrn-small">{c.contextProvenance}</p>
              <div className="lrn-tip">
                <strong>Your task</strong>
                <p>
                  Review the image, record your observations and build a concise
                  report. Context is provided; you do not need to invent patient
                  details.
                </p>
              </div>
              <button className="lrn-primary" onClick={() => setPhase("image")}>
                Review the image →
              </button>
            </>
          ) : null}
          {phase === "image" ? (
            <>
              <p className="lrn-eyebrow">Image review</p>
              <h2>Take a systematic look.</h2>
              <p>
                The image stays beside your questions. Use zoom, drag to pan, or
                fullscreen to inspect it.
              </p>
              <p>
                No findings are preselected. Choose uncertain or not assessable
                when needed.
              </p>
              <button
                className="lrn-primary"
                onClick={() => setPhase("questions")}
              >
                Start questions →
              </button>
            </>
          ) : null}
          {phase === "questions" ? (
            <>
              <div className="lrn-question-heading">
                <p className="lrn-eyebrow">
                  Question {question + 1} of {c.questions.length}
                </p>
                <details>
                  <summary>Clinical context</summary>
                  <p>{c.context}</p>
                </details>
              </div>
              <fieldset disabled={Boolean(snapshot)} className="lrn-answered">
                <Question
                  q={current}
                  value={answers[current.id]}
                  onChange={(v) => {
                    setAnswers((a) => ({ ...a, [current.id]: v }));
                    setError("");
                  }}
                />
              </fieldset>
              <div className="lrn-task-actions">
                <button
                  disabled={question === 0}
                  onClick={() => setQuestion((q) => q - 1)}
                >
                  Previous
                </button>
                <button
                  className="lrn-primary"
                  onClick={() =>
                    question < c.questions.length - 1
                      ? setQuestion((q) => q + 1)
                      : setPhase("report")
                  }
                >
                  {question < c.questions.length - 1
                    ? "Next question →"
                    : "Review your report →"}
                </button>
              </div>
              <details className="lrn-hints">
                <summary>Optional learning hints</summary>
                {c.hints.slice(0, hints).map((h, i) => (
                  <p key={i}>{h}</p>
                ))}
                <button
                  disabled={hints >= c.hints.length}
                  onClick={() => setHints((h) => h + 1)}
                >
                  Reveal a hint
                </button>
                <p className="lrn-small">
                  Hint use is recorded for this attempt.
                </p>
              </details>
            </>
          ) : null}
          {phase === "report" ? (
            <>
              <p className="lrn-eyebrow">Report preview</p>
              <h2>Review your wording.</h2>
              <p>
                Your selections generate this report. You can edit it before
                submission.
              </p>
              <label className="lrn-report-label">
                Your report
                <textarea
                  value={report}
                  onChange={(e) => setManual(e.target.value)}
                  rows={15}
                  readOnly={Boolean(snapshot)}
                />
              </label>
              <div className="lrn-task-actions">
                <button
                  disabled={Boolean(snapshot)}
                  onClick={() => setManual(null)}
                >
                  Regenerate from answers
                </button>
                <button onClick={() => setPhase("questions")}>
                  Review answers
                </button>
              </div>
              <label className="lrn-confidence">
                Confidence (optional)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  disabled={Boolean(snapshot)}
                />
                <span>0–100</span>
              </label>
              <p className="lrn-small">
                Only structured choices can be compared. Your edited free text
                is not automatically assessed.
              </p>
              <button
                className="lrn-primary"
                disabled={busy || Boolean(snapshot)}
                onClick={submit}
              >
                {busy
                  ? "Submitting…"
                  : snapshot
                    ? "Attempt already submitted"
                    : "Submit my report →"}
              </button>
            </>
          ) : null}
          {phase === "feedback" && snapshot ? (
            <>
              <p className="lrn-eyebrow">Submitted attempt</p>
              <h2>Your report is preserved.</h2>
              <p>
                Your original answers and wording are saved with this attempt.
                Clinical approval is pending, so approved learner feedback is
                unavailable.
              </p>
              {editorial ? (
                <div className="lrn-editor-callout">
                  <strong>Protected editorial testing</strong>
                  <p>
                    Inspect source-supported draft corrections and draft
                    reference wording. This is not a clinically approved
                    assessment.
                  </p>
                  <button
                    className="lrn-secondary"
                    onClick={showDraft}
                    disabled={busy}
                  >
                    {busy
                      ? "Loading draft comparison…"
                      : "Preview draft corrections"}
                  </button>
                </div>
              ) : null}
              {feedback ? (
                <Feedback feedback={feedback} snapshot={snapshot} study={c} />
              ) : (
                <details open>
                  <summary>Your submitted report</summary>
                  <pre className="lrn-report-text">{snapshot.editedReport}</pre>
                </details>
              )}
              <div className="lrn-task-actions">
                <button
                  onClick={() => {
                    setSnapshot(null);
                    setFeedback(null);
                    setAnswers({});
                    setManual(null);
                    setQuestion(0);
                    setHints(0);
                    setConfidence("");
                    setPhase("context");
                  }}
                >
                  Start a new practice attempt
                </button>
                <Link className="lrn-secondary" to="/learn/library">
                  Choose another case →
                </Link>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}
function Feedback({
  feedback: f,
  snapshot,
  study,
}: {
  feedback: any;
  snapshot: any;
  study: QuizCase;
}) {
  const caseId = study.id;
  const [suggested, setSuggested] = useState<string | null>(null);
  const optionLabel = (id: string, value: string) =>
    study.questions
      .find((q) => q.id === id)
      ?.options.find((o) => o.id === value)?.label || value;
  function buildCorrection() {
    const next: Answers = JSON.parse(JSON.stringify(snapshot.answers));
    for (const item of f.items)
      for (const [key, values] of Object.entries(item.expected) as Array<
        [string, string[]]
      >) {
        const q = study.questions.find((q) => q.id === key);
        if (q?.kind === "checkbox-group") {
          const existing = Array.isArray(next[key])
            ? (next[key] as string[])
            : [];
          next[key] = Array.from(
            new Set([
              ...existing.filter(
                (v) => !["none", "uncertain", "not_assessable"].includes(v),
              ),
              ...values,
            ]),
          );
        } else next[key] = values[0];
      }
    const wording = generateReport(study, next);
    setSuggested(wording);
    localStorage.setItem(
      "radrep:quiz:correction:" + snapshot.id,
      JSON.stringify({
        report: wording,
        rubricVersion: f.rubricVersion,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  const [flag, setFlag] = useState(""),
    [flagSaved, setFlagSaved] = useState(false);
  const saveFlag = () => {
    const flags = read<any[]>("radrep:quiz:feedback-flags", []);
    localStorage.setItem(
      "radrep:quiz:feedback-flags",
      JSON.stringify([
        ...flags,
        {
          attemptId: snapshot.id,
          caseId,
          text: flag,
          at: new Date().toISOString(),
        },
      ]),
    );
    setFlagSaved(true);
  };
  return (
    <div className="lrn-feedback">
      <h3>Draft correction review</h3>
      <p className="lrn-small">
        Unreviewed editorial comparison · structured choices only · no free-text
        score. Each underlying concept is listed once.
      </p>
      {f.criticalErrors.length ? (
        <section className="lrn-critical">
          <h4>Important draft error checks</h4>
          {f.criticalErrors.map((e: any, i: number) => (
            <p key={i}>
              <strong>{e.title}</strong> — {e.explanation}
            </p>
          ))}
        </section>
      ) : null}
      {f.items.map((item: any) => (
        <article className={"lrn-correction " + item.status} key={item.id}>
          <span className="lrn-pill">
            {item.status === "aligned"
              ? "Observation aligned"
              : item.status === "uncertain"
                ? "Uncertain / needs review"
                : "Missed, incorrect or unsupported"}
          </span>
          <h4>{item.title}</h4>
          <div className="lrn-checks">
            {item.checks.map((check: any) => (
              <p key={check.key}>
                <strong>
                  {check.match
                    ? "Aligned"
                    : check.uncertain
                      ? "Uncertain"
                      : check.key === "location" || check.key === "side"
                        ? "Location / laterality correction"
                        : "Review this selection"}
                  :
                </strong>{" "}
                {Array.isArray(check.value)
                  ? check.value
                      .map((v: string) => optionLabel(check.key, v))
                      .join("; ")
                  : optionLabel(check.key, check.value)}
                {!check.match ? (
                  <span>
                    {" "}
                    →{" "}
                    {item.expected[check.key]
                      .map((v: string) => optionLabel(check.key, v))
                      .join(" / ")}
                  </span>
                ) : null}
              </p>
            ))}
          </div>
          <p>
            <strong>Suggested wording:</strong> {item.wording}
          </p>
          <p>{item.explanation}</p>
          <a
            href={
              item.evidence.startsWith("http")
                ? item.evidence
                : "/#/learn/library"
            }
            target="_blank"
            rel="noreferrer"
          >
            {item.evidence.startsWith("http")
              ? "Source evidence"
              : "Study scope evidence"}
          </a>
          <p className="lrn-small">{item.provenance}</p>
        </article>
      ))}
      <section className="lrn-corrected">
        <button className="lrn-secondary" onClick={buildCorrection}>
          Build a corrected practice report
        </button>
        <p className="lrn-small">
          Based on corrected structured choices. Your original edited report
          remains preserved; free text has not been assessed.
        </p>
        {suggested ? <pre className="lrn-report-text">{suggested}</pre> : null}
      </section>
      <div className="lrn-report-comparison">
        <section>
          <h4>Your original submitted report</h4>
          <pre className="lrn-report-text">{snapshot.editedReport}</pre>
        </section>
        <section>
          <h4>Draft reference report</h4>
          <p className="lrn-small">
            Acceptable example wording—not the only wording. Clinical review
            pending.
          </p>
          <pre className="lrn-report-text">
            {Object.entries(f.referenceDraft)
              .map(([k, v]) => k.toUpperCase() + ":\n" + v)
              .join("\n\n")}
          </pre>
        </section>
      </div>
      <details>
        <summary>Provenance and limits of this draft</summary>
        <p>
          <strong>Source-documented diagnosis:</strong> {f.sourceDiagnosis}
        </p>
        <p>
          <strong>Source-documented observations:</strong>{" "}
          {f.sourceFindings.join("; ")}
        </p>
        <p>
          <strong>Additional interpretation awaiting review:</strong>{" "}
          {f.additionalInterpretations}
        </p>
        <p>No reviewed image annotations are available yet.</p>
      </details>
      <label className="lrn-report-label">
        Question this feedback
        <textarea
          rows={3}
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="Describe what needs review"
        />
      </label>
      <button onClick={saveFlag} disabled={!flag.trim() || flagSaved}>
        Save feedback question
      </button>
      {flagSaved ? (
        <p role="status">Saved on this browser for review.</p>
      ) : null}
    </div>
  );
}
