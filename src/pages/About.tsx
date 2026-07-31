import { PageShell } from './PageShell';
import { useI18n } from '../i18n/I18nContext';

export function About() {
  const { text } = useI18n();
  return (
    <PageShell
      eyebrow="About"
      title="About RadRepPilot"
      description="RadRepPilot is a free educational platform designed to help medical learners, residents, and clinicians practise structured radiology reporting."
    >
      <p>
        {text('The platform provides a focused workspace for organizing findings, drafting impressions, refining requisition language, and developing consistent reporting habits.')}
      </p>
      <p>
        {text('The goal is to support clear, concise, and clinically useful communication between imaging providers and referring clinicians. RadRepPilot is intended for learning, workflow practice, and report-writing support. It is not a diagnostic tool and does not replace image interpretation by a qualified radiologist.')}
      </p>
      <p>
        {text('Future versions will include user accounts, saved reports, customizable reporting preferences, and a feedback pathway for users to suggest improvements.')}
      </p>
    </PageShell>
  );
}
