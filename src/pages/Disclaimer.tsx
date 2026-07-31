import { PageShell } from './PageShell';
import { useI18n } from '../i18n/I18nContext';

export function Disclaimer() {
  const { text } = useI18n();
  return (
    <PageShell
      eyebrow="Disclaimer"
      title="Educational and Safety Disclaimer"
      description="RadRepPilot is provided for educational and report-writing practice only."
    >
      <p>
        {text('It does not interpret medical images, establish diagnoses, recommend management, or replace clinical judgment, local protocols, or radiologist review.')}
      </p>
      <p>
        {text('Users must not enter patient-identifying information, including names, dates of birth, medical record numbers, health insurance numbers, addresses, or any other information that could identify a patient.')}
      </p>
      <p>
        {text('Any generated or drafted wording should be reviewed and adapted by an appropriate clinician before use. RadRepPilot is intended to support learning and communication, not to provide clinical decision-making or patient-specific medical advice.')}
      </p>
    </PageShell>
  );
}
