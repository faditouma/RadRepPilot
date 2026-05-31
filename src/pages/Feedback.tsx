import { PageShell } from './PageShell';

export function Feedback() {
  return (
    <PageShell
      eyebrow="Feedback"
      title="Help Improve RadRepPilot"
      description="RadRepPilot is being developed as a public-good educational project."
    >
      <p>
        Feedback from learners, residents, radiologists, referring clinicians, and educators is essential to improving the
        platform.
      </p>
      <p>
        Use this page to report bugs, suggest features, comment on usability, or share ideas for future reporting templates and
        educational tools.
      </p>
      <p>Please do not include patient-identifying information in feedback messages.</p>
    </PageShell>
  );
}
