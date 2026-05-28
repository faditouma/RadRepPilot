export function WhyThisMatters() {
  return (
    <section className="why-matters-panel">
      <div className="section-heading">
        <span className="eyebrow">Why RadRepPilot Matters</span>
        <h2>A clinical handoff project, not just a report generator</h2>
        <p>
          RadRepPilot is built around a simple observation: imaging quality depends not only on image interpretation, but on
          the clarity of the question going in and the clarity of the next step coming out.
        </p>
      </div>

      <div className="why-matters-grid">
        <article>
          <span>01</span>
          <h3>The workflow problem</h3>
          <p>
            Radiology communication can break down at both ends of the exam. A vague requisition can leave the radiologist
            guessing what the referrer really needs, while a report without clear follow-up language can leave the GP unsure
            what should happen next.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Better requisitions in</h3>
          <p>
            Primary care clinicians often have very little time to write imaging requests. RadRepPilot helps turn short,
            incomplete context into a concise radiology-useful question without making it sound like a progress note.
          </p>
          <blockquote>
            Before: “Abdo pain, please assess.” After: “34M, known for Crohn’s disease, presenting with 3 days of RLQ pain and
            fever. Please assess for active ileitis, abscess, obstruction, appendicitis, or alternative acute pathology. Thank you.”
          </blockquote>
        </article>
        <article>
          <span>03</span>
          <h3>Better reports out</h3>
          <p>
            On the reporting side, the goal is not to interpret images. The goal is to help organize radiologist-entered
            findings into a report that addresses the clinical question, key negatives, complications, and relevant measurement
            or calculator language.
          </p>
        </article>
        <article>
          <span>04</span>
          <h3>Follow-up that closes the loop</h3>
          <p>
            Incidental findings are one of the places where communication can become unsafe. A GP may receive a report with an
            adrenal nodule, renal lesion, thyroid nodule, or pulmonary nodule and need a clear, practical next step. RadRepPilot
            keeps follow-up wording close to the reporting workflow so recommendations are easier to make explicit and verify.
          </p>
        </article>
        <article>
          <span>05</span>
          <h3>Why Family Medicine matters</h3>
          <p>
            In family medicine, I saw how vague imaging requests can make radiology communication harder. I also saw the other
            side of the handoff: reports can identify important incidental findings without always making the follow-up plan easy
            for a GP to operationalize. RadRepPilot is my attempt to bridge that interface in both directions.
          </p>
        </article>
        <article>
          <span>06</span>
          <h3>Prototype limitations</h3>
          <p>
            RadRepPilot does not interpret images. It does not diagnose. It organizes user-entered findings and draft language.
            All outputs require radiologist verification and local protocol adaptation.
          </p>
        </article>
      </div>
    </section>
  );
}
