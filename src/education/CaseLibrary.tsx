import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { TeachingStudy } from "./teaching";
import "./education.css";
export function CaseLibrary() {
  const [studies, setStudies] = useState<TeachingStudy[]>([]),
    [error, setError] = useState(""),
    [connected, setConnected] = useState(false),
    [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/imaging/cases.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error("Case listing unavailable");
        return r.json();
      })
      .then(async (d:TeachingStudy[]) => {
        const available=await Promise.all(d.map(async study=>{
          const result=await supabase?.rpc('education_case_status',{p_case:study.id,p_version:study.version});
          return result?.data?.clinical_status==='retired'?null:study;
        }));
        if(active)setStudies(available.filter((s):s is TeachingStudy=>s!==null));
      })
      .catch((e) => setError(e.message));
    supabase?.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setConnected(Boolean(data.session));
      if (data.session) {
        const { count, error } = await supabase!
          .from("education_ohif_attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.session.user.id);
        if (active && !error) setCount(count || 0);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <main className="edu-case-library">
      <header>
        <h1>RadRepPilot · Image-based learning</h1>
        <p>
          Protected teaching preview · no patient uploads · clinical drafts are
          not assessments.
        </p>
        <nav>
          <Link to="/learn">Dashboard / Report a Case</Link>
          <Link to="/workspace/modules">Reporting tools</Link>
          <Link to="/workspace/requisitions">
            Choose imaging / requisitions
          </Link>
          <Link to="/learn/editor/ct-002">Editorial review</Link>
          <Link to="/preferences">Profile and preferences</Link>
          <Link to="/account/security">Change password</Link>
          <Link to="/login" state={{ from: { pathname: "/learn" } }}>
            Account sign-in
          </Link>
        </nav>
        <p role="status">
          {connected
            ? `Account connected · ${count} account-synced attempts`
            : "Browser-local mode · sign in for private account sync"}
        </p>
      </header>
      {error ? <p role="alert">{error}</p> : null}
      <section className="edu-case-cards">
        {studies.map((s) => (
          <article key={s.id}>
            <span className="edu-pill">
              {s.purpose === "demonstration"
                ? "Imaging demonstration"
                : "Diagnostic teaching candidate · review pending"}
            </span>
            <h2>{s.title}</h2>
            <p>{s.completeness}</p>
            <p>
              Version {s.version} · {s.instanceCount} images · {s.licence.name}
            </p>
            <Link className="edu-primary" to={`/learn/ct/${s.id}`}>
              Open images and guided report
            </Link>
          </article>
        ))}
      </section>
      <p>
        Reference answers remain unavailable to learners until clinical and
        privacy review are recorded by an authorized reviewer. No automated
        grading is active.
      </p>
    </main>
  );
}
