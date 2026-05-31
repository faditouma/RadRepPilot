import { Link } from 'react-router-dom';
import { PageShell } from './PageShell';

export function Reports() {
  return (
    <PageShell
      eyebrow="Reports"
      title="Reports"
      description="Your saved reports will appear here as the database-backed reporting workspace is expanded."
    >
      <p>
        Report storage is being prepared for the next phase. You can start a new educational draft from{' '}
        <Link to="/reports/new">New Report</Link>. Do not enter patient-identifying information.
      </p>
    </PageShell>
  );
}
