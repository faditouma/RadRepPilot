export function WhyThisMatters() {
  return (
    <section className="why-matters-panel">
      <div className="section-heading">
        <span className="eyebrow">Why RadRepPilot Matters</span>
        <h2>A workflow and communication artifact, not just a report generator</h2>
        <p>
          RadRepPilot is designed to make radiology thinking visible: requisition quality, structured reporting, clinical
          communication, safety, calculators, and follow-up responsibility.
        </p>
      </div>

      <div className="why-matters-grid">
        <article>
          <span>01</span>
          <h3>The workflow problem</h3>
          <p>
            Radiology quality begins before image interpretation. Vague requisitions, incomplete clinical questions, variable
            report structure, and inconsistent follow-up recommendations can reduce the usefulness and safety of imaging
            communication.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Better requisitions in</h3>
          <p>
            Primary care and referring clinicians often have limited time. RadRepPilot helps convert minimal clinical context into
            concise, radiology-useful requisition language.
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
            Radiology reporting workflows can prompt key findings, key negatives, complications, calculators, and follow-up
            recommendations while keeping all text editable.
          </p>
        </article>
        <article>
          <span>04</span>
          <h3>Safety and follow-up</h3>
          <p>
            Incidental findings are a major communication challenge. RadRepPilot embeds follow-up support directly into reporting
            workflows so recommendations are easier to generate consistently.
          </p>
        </article>
        <article>
          <span>05</span>
          <h3>Why Family Medicine matters</h3>
          <p>
            My Family Medicine background helps me understand the upstream problem: what referrers send, what radiologists need,
            and where communication can fail. RadRepPilot is designed to bridge that interface.
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
