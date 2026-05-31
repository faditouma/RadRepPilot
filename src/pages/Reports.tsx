import { Link } from 'react-router-dom';
import { PageShell } from './PageShell';

export function Reports() {
  return (
    <PageShell
      eyebrow="Reports"
      title="Reports"
      description="Placeholder for a future report list, including saved drafts and finalized user reports."
    >
      <p>
        Report storage is not connected yet. Start a future report from <Link to="/reports/new">New Report</Link>.
      </p>
    </PageShell>
  );
}
