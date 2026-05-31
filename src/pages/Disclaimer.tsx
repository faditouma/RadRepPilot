import { PageShell } from './PageShell';

export function Disclaimer() {
  return (
    <PageShell
      eyebrow="Disclaimer"
      title="Prototype and Safety Disclaimer"
      description="RadRepPilot does not interpret images, diagnose, or replace radiologist review. Do not enter patient-identifying information."
    >
      <p>All generated wording is draft language only and requires clinician/radiologist verification and local protocol review.</p>
    </PageShell>
  );
}
