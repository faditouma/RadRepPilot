import type { QualityScore } from '../../utils/qualityMetrics';
import { useI18n } from '../../i18n/I18nContext';

function getCompletenessTone(score: QualityScore): string {
  if (score.percent >= 85) return 'Complete';
  if (score.percent >= 60) return 'Partially complete';
  return 'Needs key findings';
}

export function CompletenessMiniPanel({ score }: { score: QualityScore }) {
  const { clinicalText, text } = useI18n();
  const missing = score.checks.filter((check) => !check.complete).slice(0, 4);

  return (
    <section className="workflow-side-card completeness-mini-panel" aria-label={text('Report completeness')}>
      <div className="mini-panel-heading">
        <span className="eyebrow">{text('Report completeness')}</span>
        <strong>{text(getCompletenessTone(score))}</strong>
      </div>
      <div className="mini-progress-row">
        <div
          className="quality-progress-bar"
          role="progressbar"
          aria-label={`${text('Report completeness')} ${score.percent}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score.percent}
        >
          <i style={{ width: `${score.percent}%` }} />
        </div>
        <span>
          {score.complete}/{score.total}
        </span>
      </div>
      {missing.length ? (
        <div className="mini-missing-list">
          <span>{text('Still to address')}</span>
          <ul>
            {missing.map((check) => (
              <li key={check.label}>{clinicalText(check.missingLabel ?? check.label)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>{text('Core report elements are addressed.')}</p>
      )}
    </section>
  );
}
