import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OHIFViewer } from "./OHIFViewer";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseSession } from "../components/auth/useSupabaseSession";
import { ReportingWorkflowPage } from "../components/reporting/ReportingWorkflowPage";
import { HelperDrawer } from "../components/helpers/HelperDrawer";
import type { StoredWorkflowDraft } from "../lib/workflowDraftStorage";
import type { InsertTarget } from "../radrep/types";
import {
  caseSchema,
  draftPayload,
  freshDraft,
  type TeachingStudy,
} from "./teaching";
import { TeachingFeedback } from "./TeachingFeedback";
import "./education.css";
export function CTPreview() {
  const { caseId = "ct-001" } = useParams();
  const { session, isLoading } = useSupabaseSession();
  const userId = session?.user.id;
  const [study, setStudy] = useState<TeachingStudy | null>(null),
    [draft, setDraft] = useState<StoredWorkflowDraft | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Loading case…"),
    [submitted, setSubmitted] = useState(false),
    [attemptId, setAttemptId] = useState<string | null>(null),
    [helper, setHelper] = useState<string | null>(null),
    [mountRevision, setMountRevision] = useState(0),
    [clinicalStatus, setClinicalStatus] = useState("draft"),
    [confidence, setConfidence] = useState("");
  const schema = useMemo(caseSchema, []);
  const scope = study
    ? `${userId || "browser-local"}:${study.id}:v${study.version}`
    : "";
  const key = `radrep:guided-case:${scope}`;
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const loads = useRef(0);
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const n = ++loads.current;
    setReady(false);
    setStudy(null);
    setDraft(null);
    setSubmitted(false);
    setAttemptId(null);
    setHelper(null);
    setError("");
    fetch(`/imaging/${encodeURIComponent(caseId)}/catalog.json`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw Error("Case unavailable in this preview");
        const c = await r.json();
        if (c.id !== caseId) throw Error("Case/study mismatch");
        if (n === loads.current) setStudy(c);
      })
      .catch((e) => {
        if (n === loads.current) setError(e.message);
      });
    return () => {
      loads.current++;
    };
  }, [caseId]);
  useEffect(() => {
    if (!study || isLoading) return;
    const n = ++loads.current;
    let active = true;
    setReady(false);
    setSubmitted(false);
    setAttemptId(null);
    setConfidence("");
    setClinicalStatus("draft");
    supabase?.rpc('education_case_status',{p_case:study.id,p_version:study.version}).then(({data})=>{if(active && n===loads.current && data)setClinicalStatus(data.clinical_status);});
    let backup: StoredWorkflowDraft | null = null;
    try {
      backup = JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      setError(
        "Browser backup is unreadable; account draft will still be checked.",
      );
    }
    const restore = async () => {
      let next = backup || freshDraft(schema);
      if (userId && supabase) {
        const result = await supabase
          .from("education_ohif_drafts")
          .select("*")
          .eq("user_id", userId)
          .eq("case_id", study.id)
          .eq("case_version", study.version)
          .maybeSingle();
        if (!active || n !== loads.current) return;
        if (result.error) {
          setStatus("Account sync unavailable · browser-local backup");
          setError(result.error.message);
        } else if (result.data) {
          const row = result.data;
          next = {
            workflowId: row.workflow_id || schema.moduleId,
            moduleType: schema.moduleType,
            values: row.structured_answers,
            report: row.report,
            lastUpdatedAt: row.updated_at,
          };
          setStatus("Resumed account-synced structured draft");
        } else setStatus("Account connected · new draft");
        const { data } = await supabase.rpc("education_case_status", {
          p_case: study.id,
          p_version: study.version,
        });
        if (active && n === loads.current && data)
          setClinicalStatus(data.clinical_status);
      } else setStatus("Browser-local draft · not account synced");
      if (!active || n !== loads.current) return;
      setDraft(next);
      setConfidence(String(next.values.__confidence || ""));
      setMountRevision((r) => r + 1);
      setReady(true);
    };
    restore().catch((e) => {
      if (active) {
        setError(e.message);
        setDraft(backup || freshDraft(schema));
        setReady(true);
        setStatus("Browser-local fallback · account sync failed");
      }
    });
    return () => {
      active = false;
    };
  }, [study, scope, isLoading, schema]);
  const onDraftChange = useCallback((next: StoredWorkflowDraft) => {
    setDraft(next);
  }, []);
  async function save(next: StoredWorkflowDraft) {
    if (!study || !scope) return;
    const captured = scope;
    const snapshot = {
      ...next,
      values: { ...next.values, __confidence: confidence },
      lastUpdatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(snapshot));
    if (userId && supabase) {
      const payload = draftPayload(snapshot);
      const { error } = await supabase
        .from("education_ohif_drafts")
        .upsert(
          {
            user_id: userId,
            case_id: study.id,
            case_version: study.version,
            viewer_version: study.viewerVersion,
            ...payload,
            updated_at: snapshot.lastUpdatedAt,
          },
          { onConflict: "user_id,case_id,case_version" },
        );
      if (error)
        throw Error(
          `Browser backup saved; account sync failed: ${error.message}`,
        );
    }
    if (activeScope.current === captured)
      setStatus(
        userId
          ? "Account-synced draft · structured answers, generated report and edited report saved"
          : "Browser-local draft saved · not account synced",
      );
  }
  useEffect(() => {
    if (!ready || !draft || submitted) return;
    const timer = setTimeout(() => {
      pending.current = save(draft).catch((e) => setError(e.message));
    }, 800);
    return () => clearTimeout(timer);
  }, [draft, confidence, ready, scope, submitted]);
  async function submit() {
    if (!draft || !study || clinicalStatus === "retired") return;
    const captured = scope;
    try {
      await pending.current;
      await save(draft);
      const id = crypto.randomUUID(),
        snapshot = {
          ...draft,
          values: { ...draft.values, __confidence: confidence },
        },
        at = new Date().toISOString();
      if (userId && supabase) {
        const { error } = await supabase
          .from("education_ohif_attempts")
          .insert({
            id,
            user_id: userId,
            case_id: study.id,
            case_version: study.version,
            viewer_version: study.viewerVersion,
            ...draftPayload(snapshot),
            submitted_at: at,
            clinical_review_status: "unreviewed",
          });
        if (error)
          throw Error(
            `Account submission failed; draft retained: ${error.message}`,
          );
      } else
        localStorage.setItem(
          `${key}:attempt:${id}`,
          JSON.stringify({
            id,
            caseId: study.id,
            caseVersion: study.version,
            viewerVersion: study.viewerVersion,
            ...draftPayload(snapshot),
            submittedAt: at,
          }),
        );
      if (activeScope.current !== captured) return;
      setAttemptId(id);
      setSubmitted(true);
      setStatus(
        userId
          ? "Account-synced submitted attempt · immutable snapshot"
          : "Browser-local submitted attempt · not account synced",
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function insert(text: string, _label: string, target?: InsertTarget) {
    if (!draft) return;
    const field =
      target === "internalNotes" ? "internalNotes" : target || "findings";
    setDraft({
      ...draft,
      report: {
        ...draft.report,
        [field]: `${draft.report[field] || ""}\n${text}`.trim(),
      },
    });
    setMountRevision((n) => n + 1);
  }
  return (
    <main className="edu-ct-page edu-guided-page">
      <header className="edu-ct-header">
        <nav>
          <Link to="/learn">← Case library</Link>
          <Link to={`/learn/editor/${caseId}`}>
            Editorial reference / review
          </Link>
          <Link
            to="/login"
            state={{ from: { pathname: `/learn/ct/${caseId}` } }}
          >
            Account sign-in
          </Link>
        </nav>
        <h1>{study?.title || "Image-based guided reporting"}</h1>
        <p className="edu-pill">
          {study?.purpose === "demonstration"
            ? "Imaging demonstration · no diagnostic assessment"
            : `Clinical status: ${clinicalStatus} · guided learning draft`}
        </p>
        <p>
          Protected educational preview · no patient-identifying information.{" "}
          {userId
            ? "RadRepPilot account connected"
            : "Browser-local mode; sign in for private account sync."}
        </p>
      </header>
      {error ? (
        <p role="alert" className="edu-error">
          {error}
        </p>
      ) : null}
      {study ? (
        <>
          <section className="edu-case-history">
            <h2>Clinical history and task</h2>
            <p>{study.history}</p>
            <details>
              <summary>Study scope, source and licence</summary>
              <p>{study.completeness}</p>
              <p>{study.historyProvenance}</p>
              {study.attribution.citations.map((c, i) => (
                <p key={i}>
                  {c.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&")}
                </p>
              ))}
              <p>{study.attribution.idc_acknowledgment}</p>
              <a href={study.licence.url}>{study.licence.name}</a>
              <p>{study.modifications.join("; ")}</p>
            </details>
          </section>
          <div className="edu-guided-room">
            <OHIFViewer study={study} />
            <section className="edu-guided-tools">
              <h2>Guided reporting · existing RadRepPilot workflow</h2>
              <p role="status">{status}</p>
              <p>
                Enter observations from the supplied images. No normal findings,
                nodule descriptors, risk factors or guideline eligibility are
                preselected. Generated language is your draft, not an answer
                key.
              </p>
              <details>
                <summary>Supplementary guideline assistance</summary>
                <p>
                  The existing pulmonary-nodule helper is available through
                  Calculator/helper. Clinical exclusions and
                  incidental-versus-screening context are not established by
                  this source. Do not treat its prototype output as an approved
                  case recommendation.
                </p>
                <a
                  href="https://pubs.rsna.org/doi/10.1148/radiol.2017161659"
                  target="_blank"
                  rel="noreferrer"
                >
                  Fleischner Society 2017 · supplementary international guidance
                </a>
              </details>
              {ready && draft ? (
                <fieldset
                  disabled={submitted || clinicalStatus === "retired"}
                  className="edu-workflow-fieldset"
                >
                  <ReportingWorkflowPage
                    key={`${scope}:${mountRevision}`}
                    schema={schema}
                    initialDraft={draft}
                    caseScope={scope}
                    onDraftChange={onDraftChange}
                    onSaveDraft={(report, structured) => {
                      const next = {
                        ...(structured as StoredWorkflowDraft),
                        report,
                      };
                      setDraft(next);
                      save(next).catch((e) => setError(e.message));
                    }}
                    onInsertText={insert}
                    onOpenHelper={setHelper}
                  />
                  <label>
                    Confidence (optional, 0–100)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value)}
                    />
                  </label>
                  <div className="button-row">
                    <button
                      onClick={() =>
                        save(draft).catch((e) => setError(e.message))
                      }
                    >
                      Save case draft
                    </button>
                    <button className="edu-primary" onClick={submit}>
                      Submit case report
                    </button>
                  </div>
                </fieldset>
              ) : (
                <p role="status">Resuming case-scoped draft…</p>
              )}
              {clinicalStatus === "retired" ? (
                <p role="alert">
                  This case is retired and cannot receive new attempts.
                </p>
              ) : null}
            </section>
          </div>
          {submitted && draft && study && attemptId ? (
            <TeachingFeedback
              attemptId={attemptId}
              accountSynced={Boolean(userId)}
              draft={draft}
              study={study}
            />
          ) : null}
        </>
      ) : null}
      {helper ? (
        <HelperDrawer
          helperId={helper}
          onClose={() => setHelper(null)}
          onInsertText={insert}
        />
      ) : null}
    </main>
  );
}
