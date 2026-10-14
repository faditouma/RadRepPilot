import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OHIFViewer, type DICOMStudy } from "./OHIFViewer";
import { supabase } from "../lib/supabaseClient";
import "./education.css";
interface Catalog extends DICOMStudy {
  title: string;
  history: string;
  historyProvenance: string;
  clinicalReview: null;
  assessmentEligible: false;
  series: Array<{ SeriesDescription: string; count: number }>;
  licence: { name: string; url: string };
  attribution: { citations: string[]; idc_acknowledgment: string };
  modifications: string[];
}
const empty = {
  technique: "",
  comparison: "",
  findings: "",
  impression: "",
  communication: "",
  confidence: "",
};
type Report = typeof empty;
export function CTPreview() {
  const { caseId = "ct-001" } = useParams();
  const [study, setStudy] = useState<Catalog | null>(null),
    [report, setReport] = useState<Report>(empty),
    [status, setStatus] = useState("Loading…"),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [submitted, setSubmitted] = useState(false),
    [userId, setUserId] = useState<string | null>(null),
    [attempts, setAttempts] = useState<
      Array<{ id: string; submittedAt: string }>
    >([]);
  const generation = useRef(0),
    draftLoad = useRef(0);
  const key = study
    ? `radrep:dicom-draft:${userId || "protected-editor-browser"}:${study.id}:v${study.version}`
    : "";
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const n = ++generation.current;
    ++draftLoad.current;
    setReady(false);
    setStudy(null);
    setReport(empty);
    setSubmitted(false);
    setError("");
    fetch(`/imaging/${encodeURIComponent(caseId)}/catalog.json`)
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            "Curated study is unavailable in this deployment. Use the protected OHIF preview build.",
          );
        const c = await r.json();
        if (c.id !== caseId) throw new Error("Study/case mismatch");
        if (n === generation.current) setStudy(c);
      })
      .catch((e) => setError(e.message));
    return () => {
      generation.current++;
    };
  }, [caseId]);
  useEffect(() => {
    let active = true;
    supabase?.auth.getSession().then(({ data }) => {
      if (active) setUserId(data.session?.user.id || null);
    });
    const sub = supabase?.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user.id || null);
    });
    return () => {
      active = false;
      sub?.data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!study || !key) return;
    const n = ++draftLoad.current;
    setReady(false);
    try {
      const saved = localStorage.getItem(key);
      setReport(saved ? { ...empty, ...JSON.parse(saved) } : empty);
      setAttempts(JSON.parse(localStorage.getItem(key + ":attempts") || "[]"));
    } catch {
      setReport(empty);
      setAttempts([]);
      setError(
        "Browser backup could not be read. Your account draft can still be resumed.",
      );
    }
    setSubmitted(false);
    if (userId && supabase) {
      supabase
        .from("education_ohif_drafts")
        .select("report")
        .eq("user_id", userId)
        .eq("case_id", study.id)
        .eq("case_version", study.version)
        .maybeSingle()
        .then(({ data, error }) => {
          if (n !== draftLoad.current) return;
          if (error)
            setError(
              "Remote draft sync is unavailable; this browser keeps a local backup.",
            );
          else if (data?.report) setReport({ ...empty, ...data.report });
          setStatus(data ? "Resumed account draft" : "Ready · account sync");
          setReady(true);
        });
    } else {
      setStatus("Ready · protected editorial preview, browser-local draft");
      setReady(true);
    }
  }, [study, key, userId]);
  async function save(r: Report) {
    if (!study || !key) return;
    localStorage.setItem(key, JSON.stringify(r));
    if (userId && supabase) {
      const { error } = await supabase
        .from("education_ohif_drafts")
        .upsert(
          {
            user_id: userId,
            case_id: study.id,
            case_version: study.version,
            viewer_version: study.viewerVersion,
            report: r,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,case_id,case_version" },
        );
      if (error)
        throw new Error("Account sync failed; browser backup retained.");
    }
    setStatus(
      userId
        ? "Saved to your account and browser backup"
        : "Saved in this browser · not synced to an account",
    );
  }
  useEffect(() => {
    if (!ready || submitted || !key) return;
    const timer = setTimeout(() => {
      pending.current = save(report).catch((e) => setError(e.message));
    }, 600);
    return () => clearTimeout(timer);
  }, [report, key, ready, submitted]);
  async function submit() {
    if (!study || (!report.findings.trim() && !report.impression.trim()))
      return;
    try {
      await pending.current;
      await save(report);
      const id = crypto.randomUUID(),
        submittedAt = new Date().toISOString();
      if (userId && supabase) {
        const { error } = await supabase
          .from("education_ohif_attempts")
          .insert({
            id,
            user_id: userId,
            case_id: study.id,
            case_version: study.version,
            viewer_version: study.viewerVersion,
            report,
            submitted_at: submittedAt,
            clinical_review_status: "unreviewed",
          });
        if (error)
          throw new Error(
            "Submission could not be saved to your account. Your draft remains intact.",
          );
      }
      const list = [{ id, submittedAt }, ...attempts];
      localStorage.setItem(key + ":attempts", JSON.stringify(list));
      localStorage.setItem(
        key + ":attempt:" + id,
        JSON.stringify({
          id,
          submittedAt,
          caseId: study.id,
          caseVersion: study.version,
          viewerVersion: study.viewerVersion,
          report,
        }),
      );
      setAttempts(list);
      setSubmitted(true);
      setStatus(
        userId
          ? "Submitted to your account"
          : "Submitted in this protected editor browser · not account synced",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main className="edu-ct-page">
      <header className="edu-ct-header">
        <Link to="/learn">RadRepPilot / learning workspace</Link>
        <h1>{study?.title || "DICOM reporting workspace"}</h1>
        <span className="edu-pill">
          Protected editorial preview · clinically unreviewed · assessment
          disabled
        </span>
        <p>
          Educational simulator. Do not enter identifying patient information.
          The deployed preview and imaging files require Vercel preview access.
        </p>
      </header>
      {error ? (
        <div className="edu-error" role="alert">
          {error}
        </div>
      ) : null}
      {study ? (
        <>
          <div className="edu-ct-room">
            <aside className="edu-history">
              <span className="edu-eyebrow">Clinical history</span>
              <p>{study.history}</p>
              <details>
                <summary>History provenance</summary>
                <p>{study.historyProvenance}</p>
              </details>
              <h3>Study contents</h3>
              {study.series.map((s) => (
                <p key={s.SeriesDescription}>
                  {s.SeriesDescription}: {s.count} images
                </p>
              ))}
              <details>
                <summary>Source attribution and licence</summary>
                {study.attribution.citations.map((s, i) => (
                  <p key={i}>
                    {s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&")}
                  </p>
                ))}
                <p>{study.attribution.idc_acknowledgment}</p>
                <a href={study.licence.url} target="_blank" rel="noreferrer">
                  {study.licence.name}
                </a>
                <p>{study.modifications.join("; ")}</p>
              </details>
              <p className="edu-muted">
                No clinician-reviewed findings, diagnosis or reference report
                exist for this case yet. Collection labels are not teaching
                answers.
              </p>
            </aside>
            <OHIFViewer study={study} />
            <section className="edu-report">
              <h2>Your report</h2>
              <p role="status">{status}</p>
              {(
                [
                  "technique",
                  "comparison",
                  "findings",
                  "impression",
                  "communication",
                ] as const
              ).map((k) => (
                <label className="edu-field" key={k}>
                  <span>
                    {k === "communication"
                      ? "Communication / recommendation"
                      : k.charAt(0).toUpperCase() + k.slice(1)}
                  </span>
                  <textarea
                    aria-label={k.charAt(0).toUpperCase() + k.slice(1)}
                    rows={k === "findings" ? 6 : 3}
                    value={report[k]}
                    disabled={!ready || submitted}
                    onChange={(e) =>
                      setReport((r) => ({ ...r, [k]: e.target.value }))
                    }
                  />
                </label>
              ))}
              <label className="edu-field">
                <span>Confidence (optional, 0–100)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={report.confidence}
                  disabled={!ready || submitted}
                  onChange={(e) =>
                    setReport((r) => ({ ...r, confidence: e.target.value }))
                  }
                />
              </label>
              <button
                disabled={!ready || submitted}
                onClick={() => save(report).catch((e) => setError(e.message))}
              >
                Save draft now
              </button>
              <button
                className="edu-primary"
                disabled={
                  !ready ||
                  submitted ||
                  (!report.findings.trim() && !report.impression.trim())
                }
                onClick={submit}
              >
                Submit report
              </button>
              {!userId ? (
                <p className="edu-muted">
                  Drafts and submissions are saved in this browser for the
                  protected editorial preview.{" "}
                  <Link to="/login">Sign in to RadRepPilot</Link> for private
                  account sync.
                </p>
              ) : null}
            </section>
          </div>
          {submitted ? (
            <section className="edu-feedback">
              <h2>
                Report submitted against case {study.id}, version{" "}
                {study.version}
              </h2>
              <p>
                Your report was saved with OHIF version {study.viewerVersion}.
                No clinical grading or expert answer is available while this
                case is unreviewed. Submission does not approve or publish the
                case.
              </p>
              <button onClick={() => setSubmitted(false)}>
                Start another editorial attempt
              </button>
            </section>
          ) : null}
        </>
      ) : (
        <p role="status">Loading permitted study manifest…</p>
      )}
    </main>
  );
}
