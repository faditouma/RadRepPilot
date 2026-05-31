import { PageShell } from './PageShell';

export function About() {
  return (
    <PageShell
      eyebrow="About"
      title="About RadRepPilot"
      description="RadRepPilot is a free educational platform designed to help medical learners, residents, and clinicians practise structured radiology reporting."
    >
      <p>
        The platform provides a focused workspace for organizing findings, drafting impressions, refining requisition language,
        and developing consistent reporting habits.
      </p>
      <p>
        The goal is to support clear, concise, and clinically useful communication between imaging providers and referring
        clinicians. RadRepPilot is intended for learning, workflow practice, and report-writing support. It is not a diagnostic
        tool and does not replace image interpretation by a qualified radiologist.
      </p>
      <p>
        Future versions will include user accounts, saved reports, customizable reporting preferences, and a feedback pathway
        for users to suggest improvements.
      </p>
    </PageShell>
  );
}
