import { changeLog } from '../../data/changeLog';

export function ChangeLogPanel() {
  return (
    <section className="changelog-panel">
      <div className="section-heading">
        <span className="eyebrow">Change log</span>
        <h2>Recent prototype improvements</h2>
        <p>Visible development notes for workflow, safety, and clinical-content refinement.</p>
      </div>
      <div className="changelog-list">
        {changeLog.map((entry) => (
          <article className="changelog-entry" key={`${entry.version}-${entry.title}`}>
            <div>
              <span>{entry.version}</span>
              <h3>{entry.title}</h3>
              <p>{entry.summary}</p>
            </div>
            <span className="status-badge partial">{entry.category}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
