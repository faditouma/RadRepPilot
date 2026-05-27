import type { QualityScore } from '../../utils/qualityMetrics';

export function QualityMetricBadge({ score, compact = false }: { score: QualityScore; compact?: boolean }) {
  const tone = score.percent >= 85 ? 'good' : score.percent >= 60 ? 'caution' : 'attention';
  return (
    <div className={`quality-metric-badge ${tone} ${compact ? 'compact' : ''}`}>
      <span>Prototype quality support</span>
      <strong>
        {score.label}: {score.complete}/{score.total}
      </strong>
      <div
        className="quality-progress-bar"
        role="progressbar"
        aria-label={`${score.label} ${score.percent}% complete`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score.percent}
      >
        <i style={{ width: `${score.percent}%` }} />
      </div>
      {!compact ? <em>{score.percent}% complete</em> : null}
    </div>
  );
}
