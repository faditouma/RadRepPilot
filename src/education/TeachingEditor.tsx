import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSupabaseSession } from "../components/auth/useSupabaseSession";
import { supabase } from "../lib/supabaseClient";
import type { TeachingStudy } from "./teaching";
import "./education.css";
const fieldNames = [
  "expected_findings",
  "acceptable_alternatives",
  "key_negatives",
  "critical_errors",
] as const;
type Lists = Record<(typeof fieldNames)[number], string>;
export function TeachingEditor() {
  const { caseId = "ct-002" } = useParams();
  const { session, isLoading } = useSupabaseSession();
  const [study, setStudy] = useState<TeachingStudy | null>(null),
    [role, setRole] = useState(""),
    [record, setRecord] = useState<any>(null),
    [reference, setReference] = useState<Record<string, string>>({
      technique: "",
      findings: "",
      impression: "",
    }),
    [lists, setLists] = useState<Lists>({
      expected_findings: "",
      acceptable_alternatives: "",
      key_negatives: "",
      critical_errors: "",
    }),
    [notes, setNotes] = useState(""),
    [comment, setComment] = useState(""),
    [message, setMessage] = useState("");
  const requestGeneration = useRef(0);
  useEffect(() => {
    requestGeneration.current++;
    setStudy(null);
    setRecord(null);
    setRole("");
    let active = true;
    fetch(`/imaging/${encodeURIComponent(caseId)}/catalog.json`)
      .then((r) => r.json())
      .then((s) => {
        if (active) setStudy(s);
      })
      .catch((e) => setMessage(e.message));
    return () => {
      active = false;
    };
  }, [caseId]);
  async function load() {
    if (!study || !session || !supabase) return;
    const generation = ++requestGeneration.current;
    const { data: membership, error: roleError } = await supabase
      .from("education_editor_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (generation !== requestGeneration.current) return;
    if (roleError) {
      setMessage(roleError.message);
      return;
    }
    setRole(membership?.role || "");
    if (!membership) return;
    const { data, error } = await supabase
      .from("education_teaching_cases")
      .select("*")
      .eq("case_id", study.id)
      .eq("case_version", study.version)
      .single();
    if (generation !== requestGeneration.current) return;
    if (error) setMessage(error.message);
    else {
      setRecord(data);
      setReference({ ...reference, ...data.reference_report });
      setLists(
        Object.fromEntries(
          fieldNames.map((k) => [
            k,
            data[k].map((i: any) => i.text).join("\n"),
          ]),
        ) as Lists,
      );
      setNotes(data.teaching_notes);
    }
  }
  useEffect(() => {
    load();
  }, [study, session?.user.id]);
  async function save() {
    const fields = {
      reference_report: reference,
      teaching_notes: notes,
      ...Object.fromEntries(
        fieldNames.map((k) => [
          k,
          lists[k]
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean)
            .map((text, i) => ({ id: `${k}-${i + 1}`, text })),
        ]),
      ),
    };
    const { error } = await supabase!.rpc("education_save_reference", {
      p_case: study!.id,
      p_version: study!.version,
      p_fields: fields,
    });
    setMessage(
      error
        ? error.message
        : "Private reference draft saved; clinical approval is not recorded.",
    );
    if (!error) await load();
  }
  async function review(action: string) {
    const { error } = await supabase!.rpc("education_review_case", {
      p_case: study!.id,
      p_version: study!.version,
      p_action: action,
      p_comment: comment,
    });
    setMessage(
      error
        ? error.message
        : "Review transition recorded by the signed-in account.",
    );
    if (!error) await load();
  }
  const frozen =
    record?.clinical_status === "approved" ||
    record?.clinical_status === "retired";
  return (
    <main className="edu-case-library">
      <nav>
        <Link to="/learn">Case library</Link>
        <Link to={`/learn/ct/${caseId}`}>Actual images / guided reporting</Link>
      </nav>
      <h1>Protected editorial reference · {study?.title || caseId}</h1>
      <p>
        Reference content is private, versioned and unavailable to learners
        before owned submission and approval. No automated grading is enabled.
      </p>
      {message ? <p role="status">{message}</p> : null}
      {!session && !isLoading ? (
        <p>
          <Link
            to="/login"
            state={{ from: { pathname: `/learn/editor/${caseId}` } }}
          >
            Sign in to RadRepPilot
          </Link>{" "}
          to check editorial access.
        </p>
      ) : null}
      {session && !role ? (
        <p>
          Author/reviewer permission must be assigned by an administrator.
          Learner profiles and user metadata do not grant editorial access.
        </p>
      ) : null}
      {record ? (
        <>
          <p>
            Role: {role} · clinical status: {record.clinical_status} · privacy:{" "}
            {record.privacy_status} · rights: {record.rights_status} · case
            version {record.case_version}
          </p>
          <details>
            <summary>Source-provided interpretation evidence</summary>
            <pre className="edu-source-record">
              {JSON.stringify(record.source_interpretation, null, 2)}
            </pre>
            <p>
              Source reader annotations are not a RadRepPilot reference report.
              Reader ratings are not diagnoses. Newly authored teaching fields
              below require clinical review.
            </p>
          </details>
          <fieldset disabled={frozen}>
            {["technique", "findings", "impression"].map((k) => (
              <label className="edu-field" key={k}>
                <span>Authored reference report · {k}</span>
                <textarea
                  value={reference[k] || ""}
                  onChange={(e) =>
                    setReference({ ...reference, [k]: e.target.value })
                  }
                />
              </label>
            ))}
            {fieldNames.map((k) => (
              <label className="edu-field" key={k}>
                <span>
                  {k.replace(/_/g, " ")} · one reviewed concept per line
                </span>
                <textarea
                  value={lists[k]}
                  onChange={(e) => setLists({ ...lists, [k]: e.target.value })}
                />
              </label>
            ))}
            <label className="edu-field">
              Authored teaching explanation
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <button onClick={save}>Save private reference draft</button>
          </fieldset>
          <label className="edu-field">
            Review comment / privacy inspection evidence
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              disabled={record.clinical_status !== "draft"}
              onClick={() => review("submit_review")}
            >
              Submit for clinical review
            </button>
            {role === "reviewer" ? (
              <>
                <button
                  disabled={frozen}
                  onClick={() => review("privacy_approve")}
                >
                  Record completed privacy inspection
                </button>
                <button
                  disabled={record.clinical_status !== "clinical_review"}
                  onClick={() => review("approve")}
                >
                  Approve clinical reference
                </button>
                <button onClick={() => review("return_draft")}>
                  Return to draft
                </button>
              </>
            ) : null}
            {role === "reviewer" || role === "administrator" ? (
              <button onClick={() => review("retire")}>Retire case</button>
            ) : null}
          </div>
          <p>
            Approval requires a diagnostic task, verified rights, completed
            privacy review, source evidence, expected findings and a reference
            report. The interventional demonstration cannot be approved for
            diagnostic assessment. Approved reference content is immutable.
          </p>
        </>
      ) : null}
    </main>
  );
}
