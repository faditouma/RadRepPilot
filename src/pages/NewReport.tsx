import { PageShell } from './PageShell';

export function NewReport() {
  return (
    <PageShell
      eyebrow="Reports"
      title="New Report"
      description="Start an educational report-writing draft using your saved preferences."
    >
      <p>
        Database-backed report creation will be added in a later phase. For now, use the prototype reporting workflows from the
        home workspace and avoid entering patient-identifying information.
      </p>
    </PageShell>
  );
}
