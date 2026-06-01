import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { formatReportDate, loadSavedReportSummaries, type SavedReportSummary } from '../lib/savedReports';
import { PageShell } from './PageShell';

export function Reports() {
  const [reports, setReports] = useState<SavedReportSummary[]>([]);

  useEffect(() => {
    setReports(loadSavedReportSummaries());
  }, []);

  return (
    <PageShell
      eyebrow="Reports"
      title="Reports"
      description="Review your saved anonymized educational report drafts."
    >
      {reports.length > 0 ? (
        <section className="settings-section">
          <h2>Saved reports</h2>
          <div className="recent-report-list">
            {reports.map((report) => (
              <article className="recent-report-row" key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <span>
                    {report.modality} · {report.bodyRegion}
                  </span>
                </div>
                <time dateTime={report.createdAt}>{formatReportDate(report.createdAt)}</time>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="settings-section report-empty-card">
          <h2>No saved reports yet.</h2>
          <p>Create your first anonymized practice draft to start building your report library.</p>
          <Link className="dashboard-card-link" to="/reports/new">
            New report
          </Link>
        </section>
      )}
    </PageShell>
  );
}
