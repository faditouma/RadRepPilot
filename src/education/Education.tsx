import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "./api";
import { supabase } from "../lib/supabaseClient";
import { Viewer } from "./Viewer";
import type { Answer, Asset, Attempt, Case, Profile } from "./types";
import "./education.css";
import { educationLabels } from "./locales";
const nav = educationLabels["en-CA"].navigation;
const empty = {
  technique: "",
  comparison: "",
  findings: "",
  impression: "",
  communication: "",
  confidence: "",
  decision: "",
  exam: "",
  contrast: "",
  urgency: "",
  question: "",
  additionalInformation: "",
  branchCondition: "",
};
export function Education() {
  const [section, setSection] = useState("Dashboard"),
    [profile, setProfile] = useState<Profile>("resident"),
    [me, setMe] = useState<{
      id: string;
      role: string;
      localEditorialPreview: boolean;
    } | null>(null),
    [cases, setCases] = useState<Case[]>([]),
    [attempts, setAttempts] = useState<Attempt[]>([]),
    [study, setStudy] = useState<Case | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [saved, setSaved] = useState(""),
    [report, setReport] = useState(empty),
    [mode, setMode] = useState("learning"),
    [ready, setReady] = useState(false),
    [hints, setHints] = useState<string[]>([]),
    [feedback, setFeedback] = useState<{
      id: string;
      answer: Answer;
      status: string;
      clinicalReferences?: Case["clinicalReferences"];
    } | null>(null),
    [ratings, setRatings] = useState<Record<string, string>>({}),
    [concerns, setConcerns] = useState<Record<string, boolean>>({}),
    [notes, setNotes] = useState(""),
    [summary, setSummary] = useState(""),
    [flag, setFlag] = useState(""),
    [busy, setBusy] = useState(false),
    [timer, setTimer] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [tools, setTools] = useState(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshGeneration = useRef(0);
  const draftGeneration = useRef(0);
  const lastSave = useRef<Promise<unknown>>(Promise.resolve());
  async function refresh() {
    const generation = ++refreshGeneration.current;
    const [user, bank, history] = await Promise.all([
      request("me"),
      request("cases"),
      request("attempts"),
    ]);
    if (generation === refreshGeneration.current) {
      setMe(user);
      setCases(bank);
      setAttempts(history);
    }
  }
  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const listener = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
        draftGeneration.current++;
        setReady(false);
        setStudy(null);
        setFeedback(null);
        setReport(empty);
        setAttempts([]);
        setCases([]);
        setMe(null);
        refresh().catch((e) => setError(e.message));
      }
    });
    return () => listener?.data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    setElapsed(0);
    if (!study || !timer || feedback) return;
    const id = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [study?.id, timer, feedback]);
  async function flushDraft() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await lastSave.current;
    if (study && ready && !feedback) {
      await request(
        `cases/${study.id}/${study.version}/draft?mode=${mode}`,
        "PUT",
        { ...report, profile, elapsedSeconds: elapsed },
      );
    }
  }
  async function navigate(n: string) {
    try {
      await flushDraft();
      draftGeneration.current++;
      setReady(false);
      setStudy(null);
      setFeedback(null);
      setSection(n);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function open(c: Case, m = mode) {
    try {
      await flushDraft();
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    const generation = ++draftGeneration.current;
    setReady(false);
    setFeedback(null);
    setRatings({});
    setSummary("");
    setConcerns({});
    setNotes("");
    setHints([]);
    setStudy(c);
    setMode(m);
    setError("");
    try {
      await lastSave.current;
      const d = await request(`cases/${c.id}/${c.version}/draft?mode=${m}`);
      if (generation !== draftGeneration.current) return;
      setReport({ ...empty, ...d });
      setSaved("Resumed server draft");
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!study || !ready || feedback) return;
    const c = study,
      generation = draftGeneration.current;
    setSaved("Unsaved changes");
    const timeout = setTimeout(() => {
      const promise = request(
        `cases/${c.id}/${c.version}/draft?mode=${mode}`,
        "PUT",
        { ...report, profile, elapsedSeconds: elapsed },
      );
      lastSave.current = promise;
      promise
        .then(() => {
          if (generation === draftGeneration.current)
            setSaved("Saved to your account");
        })
        .catch((e) => {
          if (generation === draftGeneration.current) {
            setSaved("Save failed");
            setError(e.message);
          }
        });
    }, 700);
    autosaveTimer.current = timeout;
    return () => clearTimeout(timeout);
  }, [report, study, mode, ready, feedback, profile]);
  async function submit() {
    if (!study) return;
    setBusy(true);
    setError("");
    try {
      await flushDraft();
      const f = await request(
        `cases/${study.id}/${study.version}/submit`,
        "POST",
        { ...report, profile, mode, elapsedSeconds: elapsed },
      );
      setFeedback(f);
      setReady(false);
      setSaved("Submitted · exact case version preserved");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revealAttempt(a: Attempt) {
    setBusy(true);
    try {
      const r = await request(`attempts/${a.id}`);
      draftGeneration.current++;
      setReady(false);
      setStudy({ ...r.snapshot, assets: r.assets });
      setReport({ ...empty, ...r.report });
      setFeedback({
        id: r.id,
        answer: r.answer,
        status: r.snapshot.status,
        clinicalReferences: r.snapshot.clinicalReferences,
      });
      setMode(r.mode);
      setSection("Report a Case");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const field = (key: keyof typeof empty, label: string, placeholder = "") => (
    <label className="edu-field" key={key}>
      <span>{label}</span>
      <textarea
        rows={key === "findings" ? 6 : 3}
        value={report[key]}
        placeholder={placeholder}
        disabled={!ready || !!feedback}
        onChange={(e) => setReport((r) => ({ ...r, [key]: e.target.value }))}
      />
    </label>
  );
  const isEditor =
    me && ["author", "reviewer", "administrator"].includes(me.role);
  const bank = cases.filter((c) =>
    section === "Report a Case"
      ? c.kind === "report"
      : section === "Choose Imaging"
        ? c.kind === "ordering"
        : true,
  );
  const cards = (list: Case[]) => (
    <div className="edu-card-grid">
      {list.map((c) => (
        <button
          className="edu-case-card"
          key={`${c.id}:${c.version}`}
          onClick={() => {
            setSection(
              c.kind === "report" ? "Report a Case" : "Choose Imaging",
            );
            open(c);
          }}
        >
          <span className="edu-pill">
            {c.modality} · {c.difficulty}
          </span>
          <h3>{c.title}</h3>
          <p>{c.objectives[0]}</p>
          <small>
            {c.status === "published"
              ? "Reviewed published content"
              : "Unpublished editorial draft"}{" "}
            · v{c.version}
          </small>
          <strong>Open study →</strong>
        </button>
      ))}
    </div>
  );
  return (
    <div className="edu-shell">
      <aside className="edu-sidebar">
        <Link to="/learn" className="edu-brand">
          <span>
            R<span className="edu-brand-dot">·</span>
          </span>
          <div>
            RadRepPilot<small>Image-first learning</small>
          </div>
        </Link>
        <nav aria-label="Learning navigation">
          {nav
            .filter((n) => n !== "Editorial" || isEditor)
            .map((n, i) => (
              <button
                key={n}
                className={n === section ? "active" : ""}
                onClick={() => navigate(n)}
              >
                <span>{["◫", "▣", "↗", "▤", "↻", "▥", "⚙"][i]}</span>
                {n}
              </button>
            ))}
        </nav>
        <div className="edu-sidebar-bottom">
          <label>
            Learning profile
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as Profile)}
            >
              <option value="student">Medical student</option>
              <option value="resident">Radiology resident</option>
              <option value="referrer">GP / referring clinician</option>
            </select>
          </label>
          <Link to="/workspace/modules">Existing reporting tools ↗</Link>
          <Link to="/workspace/requisitions">Requisition builder ↗</Link>
          <Link to="/login">Account / sign in</Link>
        </div>
      </aside>
      <main className="edu-main">
        <header className="edu-topbar">
          <span>EDUCATION / {section.toUpperCase()}</span>
          <span>{me?.role || "Sign in to save progress"} · EN-CA</span>
        </header>
        <div className="edu-safety">
          Educational simulator · No real-patient uploads or live clinical
          advice.
          {me?.localEditorialPreview
            ? " Local editorial preview — unpublished drafts, no clinical approval."
            : ""}
        </div>
        {error ? (
          <div className="edu-error" role="alert">
            {error}
            <button
              onClick={() => {
                setError("");
                refresh().catch((e) => setError(e.message));
              }}
            >
              Retry
            </button>
          </div>
        ) : null}
        {loading ? <p role="status">Loading your learning workspace…</p> : null}
        {!me && !loading ? (
          <section className="edu-hero">
            <span className="edu-eyebrow">READ. REASON. REPORT.</span>
            <h1>
              Learn radiology
              <br />
              from the images.
            </h1>
            <p>
              Interpret a study, write your report and compare it with a
              reviewed example. Practise choosing imaging and asking a focused
              clinical question.
            </p>
            <Link className="edu-primary" to="/login">
              Sign in to learn
            </Link>
            <p>
              Local setup: run the education server and Vite. Drafts remain
              editor-only until reviewed.
            </p>
          </section>
        ) : null}
        {me && !study && section === "Dashboard" ? (
          <>
            <section className="edu-hero">
              <span className="edu-eyebrow">YOUR READING ROOM</span>
              <h1>
                Build your eye.
                <br />
                Sharpen your reasoning.
              </h1>
              <p>
                {profile === "student"
                  ? "Start with guided, systematic interpretation."
                  : profile === "referrer"
                    ? "Choose the right examination and communicate the clinical question."
                    : "Read independently, prioritize findings and practise clear reporting."}
              </p>
              <div className="edu-actions">
                <button
                  className="edu-primary"
                  onClick={() => setSection("Report a Case")}
                >
                  Report a Case →
                </button>
                <button onClick={() => setSection("Choose Imaging")}>
                  Choose the Right Imaging
                </button>
              </div>
            </section>
            <div className="edu-stats">
              <article>
                <strong>
                  {cases.filter((c) => c.status === "published").length}
                </strong>
                <span>Reviewed cases available</span>
              </article>
              <article>
                <strong>{new Set(attempts.map((a) => a.case_id)).size}</strong>
                <span>Cases completed</span>
              </article>
              <article>
                <strong>
                  {
                    attempts.filter(
                      (a) => a.due_at && new Date(a.due_at) <= new Date(),
                    ).length
                  }
                </strong>
                <span>Due for review</span>
              </article>
            </div>
            <h2>
              {isEditor ? "Content awaiting review" : "Continue learning"}
            </h2>
            {cards(cases.slice(0, 5))}
            {!cases.length ? (
              <p>
                No reviewed content is published yet. Clinical and rights
                approval are required.
              </p>
            ) : null}
          </>
        ) : null}
        {me &&
        !study &&
        ["Report a Case", "Choose Imaging", "Learning Library"].includes(
          section,
        ) ? (
          <>
            <div className="edu-heading">
              <span className="edu-eyebrow">
                {section === "Choose Imaging"
                  ? "CLINICAL REASONING"
                  : "IMAGE-FIRST PRACTICE"}
              </span>
              <h1>{section}</h1>
              <p>
                {section === "Choose Imaging"
                  ? "Original branching exercises based on current Canadian guidance."
                  : "Every reporting case starts with an imported study and an individual rights record."}
              </p>
            </div>
            {cards(bank)}
            {!bank.length ? (
              <p>
                No reviewed cases are available. Drafts are visible only to
                authorized editors.
              </p>
            ) : null}
            {section === "Learning Library" ? (
              <div className="edu-tool-links">
                <Link to="/workspace/calculators">
                  Calculators and classification tools
                </Link>
                <Link to="/workspace/modules">Reporting templates</Link>
                <Link to="/workspace/requisitions">
                  Structured requisition builder
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
        {study ? (
          <>
            <div className="edu-reading-header">
              <div>
                <span className="edu-eyebrow">
                  {study.id.toUpperCase()} · VERSION {study.version}
                </span>
                <h1>{study.title}</h1>
                <span className="edu-pill">
                  {study.status === "published"
                    ? "Reviewed case"
                    : "Unpublished draft — editor preview"}
                </span>
              </div>
              <div>
                <label>
                  Mode
                  <select
                    value={mode}
                    disabled={!!feedback}
                    onChange={(e) => open(study, e.target.value)}
                  >
                    <option value="learning">Learning</option>
                    <option
                      value="assessment"
                      disabled={!study.assessmentEligible}
                    >
                      Assessment
                      {!study.assessmentEligible ? " · review required" : ""}
                    </option>
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={timer}
                    onChange={(e) => setTimer(e.target.checked)}
                  />{" "}
                  Optional timer{" "}
                  {timer
                    ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`
                    : ""}
                </label>
                <button onClick={() => setTools((t) => !t)}>
                  {tools ? "Hide" : "Show"} history & tools
                </button>
              </div>
            </div>
            <div
              className={`edu-reading-room ${study.kind === "ordering" ? "ordering" : ""} ${tools ? "" : "collapsed"}`}
            >
              {tools ? (
                <aside className="edu-history">
                  <span className="edu-eyebrow">CLINICAL HISTORY</span>
                  <p>{study.vignette.text}</p>
                  <details>
                    <summary>Vignette provenance</summary>
                    <p>{study.vignette.provenance}</p>
                  </details>
                  <h3>Learning objectives</h3>
                  <ul>
                    {study.objectives.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  {study.kind === "ordering" ? (
                    <details>
                      <summary>Decision-changing information</summary>
                      <p>{study.additionalInfo}</p>
                    </details>
                  ) : null}
                  {profile === "student" && mode === "learning" ? (
                    <details>
                      <summary>Systematic review checklist</summary>
                      {[
                        "Image quality & supplied views",
                        "Visible anatomy",
                        "Focal and diffuse abnormalities",
                        "Relevant negatives you can assess",
                        "Limitations & prioritization",
                      ].map((x) => (
                        <label className="edu-check" key={x}>
                          <input type="checkbox" />
                          {x}
                        </label>
                      ))}
                    </details>
                  ) : null}
                  {mode === "learning" &&
                  !feedback &&
                  study.kind === "report" ? (
                    <>
                      <button
                        disabled={!ready || busy}
                        onClick={async () => {
                          try {
                            const r = await request(
                              `cases/${study.id}/${study.version}/hints?mode=learning`,
                            );
                            setHints(r.hints);
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        Reveal next hint
                      </button>
                      {hints.map((x) => (
                        <p className="edu-hint" key={x}>
                          {x}
                        </p>
                      ))}
                      {hints.length ? (
                        <small>
                          Assisted attempt · {hints.length} hints used
                        </small>
                      ) : null}
                    </>
                  ) : null}
                  <p className="edu-muted">
                    Assessment provides feedback only after submission.
                    Mandatory attribution stays available; cases with
                    answer-revealing credit need an eligibility review.
                  </p>
                </aside>
              ) : null}
              {study.kind === "report" ? (
                <Viewer
                  study={study}
                  annotations={feedback?.answer.annotations}
                />
              ) : null}
              <section className="edu-report">
                <div className="edu-editor-heading">
                  <h2>
                    {study.kind === "ordering"
                      ? "Your imaging decision"
                      : "Your report"}
                  </h2>
                  <span role="status">{saved}</span>
                </div>
                {study.kind === "report" ? (
                  <>
                    {field(
                      "technique",
                      "Technique",
                      profile === "student"
                        ? "Describe only supplied modality and views."
                        : "",
                    )}
                    {field("comparison", "Comparison")}
                    {field(
                      "findings",
                      "Findings",
                      profile === "student"
                        ? "Describe observations systematically; state uncertainty and limitations."
                        : "",
                    )}
                    {field("impression", "Impression")}
                    {field("communication", "Communication / recommendation")}
                  </>
                ) : (
                  <>
                    <label className="edu-field">
                      <span>Is imaging needed / next action?</span>
                      <select
                        disabled={!ready || !!feedback}
                        value={report.decision}
                        onChange={(e) =>
                          setReport((r) => ({ ...r, decision: e.target.value }))
                        }
                      >
                        <option value="">Choose an action</option>
                        {study.options?.map((o) => (
                          <option value={o.id} key={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="edu-field">
                      <span>Branch context</span>
                      <select
                        disabled={!ready || !!feedback}
                        value={report.branchCondition}
                        onChange={(e) =>
                          setReport((r) => ({
                            ...r,
                            branchCondition: e.target.value,
                          }))
                        }
                      >
                        <option value="">Initial vignette</option>
                        <option value="criteria-positive">
                          Clinical criteria positive after assessment
                        </option>
                        <option value="criteria-negative">
                          Clinical criteria negative after assessment
                        </option>
                      </select>
                    </label>
                    {field(
                      "additionalInformation",
                      "What additional information changes the decision?",
                    )}
                    {field("exam", "Examination")}
                    {field("contrast", "Contrast considerations")}
                    {field("urgency", "Urgency")}
                    {field("question", "Clinical question / requisition")}
                  </>
                )}
                <label className="edu-field">
                  <span>Confidence (optional, 0–100)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!ready || !!feedback}
                    value={report.confidence}
                    onChange={(e) =>
                      setReport((r) => ({ ...r, confidence: e.target.value }))
                    }
                  />
                </label>
                <button
                  className="edu-primary"
                  disabled={!ready || busy || !!feedback}
                  onClick={submit}
                >
                  {busy ? "Submitting…" : "Submit & compare →"}
                </button>
              </section>
            </div>
            {feedback ? (
              <section className="edu-feedback">
                <span className="edu-eyebrow">REFLECT & REVIEW</span>
                <h2>
                  {feedback.status === "published"
                    ? "An acceptable expert example"
                    : "Source-supported draft · clinician review pending"}
                </h2>
                <p className="edu-muted">
                  Self-assessment; no automated report grading. The example is
                  not the only correct wording.
                </p>
                <pre>{feedback.answer.referenceReport}</pre>
                {feedback.answer.branches ? (
                  <div className="edu-branches">
                    <h3>Decision branches</h3>
                    {feedback.answer.branches.map((b) => (
                      <article
                        key={`${b.id}:${b.requires}`}
                        className={
                          b.id === report.decision &&
                          (!b.requires || b.requires === report.branchCondition)
                            ? "selected"
                            : ""
                        }
                      >
                        <h4>
                          {b.label} {b.requires ? `· ${b.requires}` : ""}
                        </h4>
                        <p>{b.explanation}</p>
                        <p>
                          {b.exam} · {b.contrast} · {b.urgency}
                        </p>
                        <blockquote>{b.question}</blockquote>
                      </article>
                    ))}
                  </div>
                ) : null}
                <h3>Structured self-assessment</h3>
                <p>
                  Compare your wording and meaning with each rubric concept.
                  Record uncertainty explicitly.
                </p>
                {feedback.answer.rubric.map((r) => (
                  <div className="edu-rubric" key={r.id}>
                    <div>
                      <span className={`edu-pill ${r.importance}`}>
                        {r.importance}
                      </span>
                      <strong>{r.expectedConcept}</strong>
                      <small>
                        {r.anatomy} · {r.laterality}
                        {!r.assessable ? " · not assessable" : ""}
                      </small>
                    </div>
                    <select
                      aria-label={`Self-assessment: ${r.expectedConcept}`}
                      value={ratings[r.id] || ""}
                      onChange={(e) =>
                        setRatings((x) => ({ ...x, [r.id]: e.target.value }))
                      }
                    >
                      <option value="">Select</option>
                      <option value="identified">Correctly identified</option>
                      <option value="missed">Omitted / incorrect</option>
                      <option value="uncertain">
                        Uncertain — review needed
                      </option>
                      {!r.assessable ? (
                        <option value="not_assessable">
                          Not assessable from supplied images
                        </option>
                      ) : null}
                    </select>
                  </div>
                ))}
                {[
                  "unsupportedFindings",
                  "laterality",
                  "prioritization",
                  "uncertainty",
                  "urgentCommunication",
                ].map((k, i) => (
                  <label className="edu-check" key={k}>
                    <input
                      type="checkbox"
                      checked={!!concerns[k]}
                      onChange={(e) =>
                        setConcerns((x) => ({ ...x, [k]: e.target.checked }))
                      }
                    />
                    {
                      [
                        "Unsupported positive finding",
                        "Laterality / anatomical-location error",
                        "Impression prioritization needs work",
                        "Uncertainty not expressed appropriately",
                        "Urgent communication issue",
                      ][i]
                    }
                  </label>
                ))}
                <label className="edu-field">
                  <span>Reflection / recurring misses</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
                <button
                  onClick={async () => {
                    try {
                      const r = await request(
                        `attempts/${feedback.id}/assessment`,
                        "POST",
                        { ratings, concerns, notes },
                      );
                      setSummary(
                        `Self-rated score: ${r.score ?? "not assessable"}${r.score !== null ? "%" : ""}. Critical misses: ${r.criticalMisses.join(", ") || "none recorded"}. Review due ${new Date(r.dueAt).toLocaleDateString()}.`,
                      );
                      await refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Save reflection & schedule review
                </button>
                <p role="status">{summary}</p>
                <h3>Teaching points</h3>
                <p>{feedback.answer.teaching}</p>
                {feedback.answer.acceptableAlternates?.length ? (
                  <p>
                    Accepted alternatives:{" "}
                    {feedback.answer.acceptableAlternates.join("; ")}
                  </p>
                ) : null}
                <h3>References</h3>
                {feedback.clinicalReferences?.map((r) => (
                  <p key={r.url}>
                    <a href={r.url} rel="noreferrer" target="_blank">
                      {r.jurisdiction || "Source evidence"} ·{" "}
                      {r.version || "Clinical review required"}
                    </a>
                  </p>
                ))}
                <label className="edu-field">
                  <span>Questionable feedback or image issue</span>
                  <textarea
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                  />
                </label>
                <button
                  disabled={!flag.trim()}
                  onClick={async () => {
                    try {
                      await request(`attempts/${feedback.id}/flag`, "POST", {
                        comment: flag,
                      });
                      setFlag("");
                      setSummary("Issue recorded for editorial review.");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Flag for review
                </button>
                <button
                  onClick={() => {
                    const next = cases.find(
                      (c) => c.id !== study.id && c.kind === study.kind,
                    );
                    if (next) open(next);
                    else {
                      setStudy(null);
                      setSection("Review Queue");
                    }
                  }}
                >
                  Next case / review task →
                </button>
              </section>
            ) : null}
          </>
        ) : null}
        {me && !study && ["Review Queue", "Progress"].includes(section) ? (
          <>
            <ProgressSummary attempts={attempts} />
            <div className="edu-heading">
              <h1>{section}</h1>
              <p>
                Transparent self-assessment. Missed or uncertain concepts return
                in one day; other completed reviews return in seven days.
                Assisted attempts remain separate.
              </p>
            </div>
            {attempts.map((a) => (
              <article className="edu-progress-card" key={a.id}>
                <div>
                  <h3>
                    {a.case_id} · v{a.version}
                  </h3>
                  <p>
                    {a.mode} · {a.assisted ? "assisted" : "independent"} ·{" "}
                    {a.profile}
                  </p>
                  <p>
                    {a.assessment
                      ? `Self-rated ${a.assessment.score ?? "not assessable"}${a.assessment.score !== null ? "%" : ""} · critical misses: ${a.assessment.criticalMisses.join(", ") || "none recorded"}`
                      : "Reflection pending"}{" "}
                    · confidence {a.report.confidence ?? "not recorded"}
                  </p>
                  <small>
                    Review due {new Date(a.due_at).toLocaleDateString()} · No
                    competency or certification claim
                  </small>
                  {a.assessment?.items.map((i) => (
                    <p key={i.id}>
                      {i.objective || i.id}: {i.rating}
                    </p>
                  ))}
                </div>
                <button disabled={busy} onClick={() => revealAttempt(a)}>
                  Review attempt
                </button>
                <button
                  onClick={() => {
                    const c = cases.find(
                      (c) => c.id === a.case_id && c.status !== "retired",
                    );
                    if (c) open(c);
                    else
                      setError(
                        "This case is retired or unavailable for a new assignment.",
                      );
                  }}
                >
                  Repeat case
                </button>
              </article>
            ))}
            {!attempts.length ? (
              <p>
                Complete a case and save a reflection to build your review
                queue.
              </p>
            ) : null}
          </>
        ) : null}
        {me && section === "Editorial" && !study ? (
          <Editorial role={me.role} onError={setError} onUpdate={refresh} />
        ) : null}
      </main>
    </div>
  );
}
function Editorial({
  role,
  onError,
  onUpdate,
}: {
  role: string;
  onError: (s: string) => void;
  onUpdate: () => Promise<void>;
}) {
  const [inventory, setInventory] = useState<{
      cases: Case[];
      assets: Asset[];
      flags: Array<{ id: string; comment: string }>;
      reviews: Array<{
        id: string;
        reviewer: string;
        type: string;
        comment: string;
      }>;
    }>({ cases: [], assets: [], flags: [], reviews: [] }),
    [selected, setSelected] = useState<Case | null>(null),
    [text, setText] = useState(""),
    [comment, setComment] = useState(""),
    [title, setTitle] = useState(""),
    [busy, setBusy] = useState(false),
    [attest, setAttest] = useState(false),
    [checks, setChecks] = useState<Record<string, boolean>>({});
  const [newDraft, setNewDraft] = useState("");
  const load = () => request("editor/inventory").then(setInventory);
  useEffect(() => {
    load().catch((e) => onError(e.message));
  }, []);
  async function operation(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await load();
      await onUpdate();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="edu-editorial">
      <div className="edu-heading">
        <span className="edu-eyebrow">PROTECTED CONTENT OPERATIONS</span>
        <h1>Editorial workspace</h1>
        <p>
          Draft → clinical review → rights review → published → revised /
          retired. Reviewer identity and dates come from the authenticated
          server.
        </p>
      </div>
      <label className="edu-field">
        <span>Import a Commons File: identifier (PNG/JPEG only)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="File:…"
        />
      </label>
      <button
        disabled={busy || !title}
        onClick={() =>
          operation(() => request("editor/import", "POST", { title }))
        }
      >
        Import & validate authorized copy
      </button>
      <p>
        New assets remain in the inventory until an editor links them through a
        case draft. No public uploads. Archives and DICOM are rejected by this
        importer.
      </p>
      <details>
        <summary>Create an image-first case from imported assets</summary>
        <label className="edu-field">
          <span>
            Full case JSON (use an existing draft as a schema reference, unique
            neutral rr- ID, series asset IDs)
          </span>
          <textarea
            value={newDraft}
            onChange={(e) => setNewDraft(e.target.value)}
          />
        </label>
        <button
          disabled={busy || !newDraft}
          onClick={() =>
            operation(() =>
              request("editor/cases", "POST", JSON.parse(newDraft)),
            )
          }
        >
          Create unpublished reporting draft
        </button>
      </details>
      <div className="edu-editorial-grid">
        <div>
          {inventory.cases.map((c) => (
            <button
              className="edu-editor-row"
              key={`${c.id}:${c.version}`}
              onClick={() => {
                setSelected(c);
                setText(JSON.stringify(c, null, 2));
                setComment("");
                setAttest(false);
              }}
            >
              <strong>
                {c.id} · {c.title}
              </strong>
              <span>
                v{c.version} · {c.status}
              </span>
            </button>
          ))}
        </div>
        {selected ? (
          <div>
            <h2>
              {selected.id} · version {selected.version}
            </h2>
            <p>
              {selected.publicationProblems?.join(" · ") ||
                "Publication gates satisfied"}
            </p>
            <label className="edu-field">
              <span>
                Case, rubric, hints, annotations & clinical references (JSON)
              </span>
              <textarea
                className="edu-json"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={selected.status !== "draft"}
              />
            </label>
            <button
              disabled={busy || selected.status !== "draft"}
              onClick={() =>
                operation(async () => {
                  const r = await request(
                    `editor/cases/${selected.id}/${selected.version}`,
                    "PUT",
                    JSON.parse(text),
                  );
                  setSelected(r);
                })
              }
            >
              Save draft
            </button>
            <button
              disabled={busy}
              onClick={() =>
                operation(async () => {
                  const r = await request(
                    `editor/cases/${selected.id}/${selected.version}/revise`,
                    "POST",
                    {},
                  );
                  setSelected(r);
                  setText(JSON.stringify(r, null, 2));
                })
              }
            >
              Create new draft version
            </button>
            <label className="edu-field">
              <span>Reviewer comments / evidence</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            <label className="edu-check">
              <input
                type="checkbox"
                checked={attest}
                onChange={(e) => setAttest(e.target.checked)}
              />
              I am an authorized clinician and have personally verified the
              exact images, findings, rubric and reference report.
            </label>
            {(
              {
                draft: ["clinical_review"],
                clinical_review: ["draft", "rights_review"],
                rights_review: ["draft", "published"],
                published: ["retired"],
                retired: [],
              } as Record<string, string[]>
            )[selected.status]?.map((status) => (
              <button
                key={status}
                disabled={
                  busy ||
                  (["rights_review", "published"].includes(status) &&
                    !["reviewer", "administrator"].includes(role)) ||
                  (status === "retired" && role !== "administrator")
                }
                onClick={() =>
                  operation(async () => {
                    const r = await request(
                      `editor/cases/${selected.id}/${selected.version}/transition`,
                      "POST",
                      { status, comment, clinicalAttestation: attest },
                    );
                    setSelected(r);
                    setText(JSON.stringify(r, null, 2));
                  })
                }
              >
                Move to {status.replace("_", " ")}
              </button>
            ))}
          </div>
        ) : (
          <p>Select a draft to edit or review.</p>
        )}
      </div>
      <h2>Asset rights & privacy inspection</h2>
      {inventory.assets.map((a) => (
        <details key={a.id}>
          <summary>
            {a.id} · {a.license.name}
          </summary>
          <p>{a.attribution}</p>
          <a href={a.sourceUrl} rel="noreferrer" target="_blank">
            Source & licence evidence
          </a>
          <pre>
            {JSON.stringify(
              { rights: a.rights, privacyReview: a.privacyReview },
              null,
              2,
            )}
          </pre>
          {[
            "metadata",
            "burnedIn",
            "facialRisk",
            "orientation",
            "sequence",
            "resolution",
            "findingsCorrespondence",
            "rightsApproved",
          ].map((k) => (
            <label className="edu-check" key={k}>
              <input
                type="checkbox"
                checked={!!checks[`${a.id}:${k}`]}
                onChange={(e) =>
                  setChecks((x) => ({
                    ...x,
                    [`${a.id}:${k}`]: e.target.checked,
                  }))
                }
              />
              {k}
            </label>
          ))}
          <button
            disabled={busy || !["reviewer", "administrator"].includes(role)}
            onClick={() =>
              operation(() =>
                request(`editor/assets/${a.id}`, "PUT", {
                  ...Object.fromEntries(
                    Object.entries(checks)
                      .filter(([k]) => k.startsWith(a.id + ":"))
                      .map(([k, v]) => [k.split(":")[1], v]),
                  ),
                  comment,
                }),
              )
            }
          >
            Record actual inspection with reviewer comment above
          </button>
        </details>
      ))}
      <h2>Reported issues</h2>
      {inventory.flags.map((f) => (
        <p key={f.id}>{f.comment}</p>
      ))}
      <h2>Review history</h2>
      {inventory.reviews.map((r) => (
        <p key={r.id}>
          {r.type} · {r.reviewer} · {r.comment}
        </p>
      ))}
    </section>
  );
}

function ProgressSummary({ attempts }: { attempts: Attempt[] }) {
  const objectives = new Map<
    string,
    { identified: number; missed: number; uncertain: number; assisted: number }
  >();
  for (const a of attempts)
    for (const i of a.assessment?.items || []) {
      const key = i.objective || i.id;
      const r = objectives.get(key) || {
        identified: 0,
        missed: 0,
        uncertain: 0,
        assisted: 0,
      };
      if (i.rating === "identified") r.identified++;
      if (i.rating === "missed") r.missed++;
      if (i.rating === "uncertain") r.uncertain++;
      if (a.assisted) r.assisted++;
      objectives.set(key, r);
    }
  if (!objectives.size) return null;
  return (
    <section className="edu-objectives">
      <h2>Performance by learning objective</h2>
      <p className="edu-muted">
        Learner self-ratings; assisted exposures are shown separately. Repeated
        omissions identify topics for review.
      </p>
      <table>
        <thead>
          <tr>
            <th>Objective</th>
            <th>Identified</th>
            <th>Missed</th>
            <th>Uncertain</th>
            <th>Assisted exposures</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(objectives).map(([key, r]) => (
            <tr key={key}>
              <th>{key}</th>
              <td>{r.identified}</td>
              <td>{r.missed}</td>
              <td>{r.uncertain}</td>
              <td>{r.assisted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
