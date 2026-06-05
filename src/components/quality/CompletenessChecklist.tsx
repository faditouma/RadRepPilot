import type { QualityScore } from '../../utils/qualityMetrics';
import { QualityMetricBadge } from './QualityMetricBadge';

export function CompletenessChecklist({ score }: { score: QualityScore }) {
  const missing = score.checks.filter((check) => !check.complete);
  return (
    <section className="completeness-checklist">
      <QualityMetricBadge score={score} />
      <div className="quality-check-grid">
        {score.checks.map((check) => (
          <span className={check.complete ? 'complete' : 'missing'} key={check.label}>
            {check.complete ? 'Complete' : 'Still needed'}: {check.complete ? check.completeLabel ?? check.label : check.missingLabel ?? check.label}
          </span>
        ))}
      </div>
      {missing.length ? <p>{missing.map((check) => check.missingLabel ?? check.label).join(' · ')}</p> : <p>Completeness checklist satisfied.</p>}
    </section>
  );
}
