import { PageShell } from './PageShell';
import { useI18n } from '../i18n/I18nContext';

export function Feedback() {
  const { text } = useI18n();
  return (
    <PageShell
      eyebrow="Feedback"
      title="Help Improve RadRepPilot"
      description="Feedback from learners, residents, radiologists, referring clinicians, and educators helps improve the platform."
    >
      <p>
        {text('RadRepPilot is being developed as a public-good educational project. Feedback from learners, residents, radiologists, referring clinicians, and educators is essential to improving the platform.')}
      </p>
      <p>
        {text('Use this page to report bugs, suggest features, comment on usability, or share ideas for future reporting templates and educational tools.')}
      </p>
      <p>
        {text('Feedback can also be sent directly to')} <a href="mailto:radreppilot@gmail.com">radreppilot@gmail.com</a>.
      </p>
      <p>{text('Please do not include patient-identifying information in feedback messages.')}</p>
    </PageShell>
  );
}
