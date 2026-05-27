import { sampleOutputs } from '../../data/sampleOutputs';
import { scoreFollowUpSafety } from '../../utils/qualityMetrics';
import { QualityMetricBadge } from '../quality/QualityMetricBadge';
import { CopyButton } from '../radrep/RadRepComponents';

interface SampleOutputsGalleryProps {
  onOpenWorkflow: (workflowId: string) => void;
}

export function SampleOutputsGallery({ onOpenWorkflow }: SampleOutputsGalleryProps) {
  return (
    <section className="sample-gallery">
      <div className="section-heading">
        <span className="eyebrow">Example Reports & Requisitions</span>
        <h2>Sample outputs reviewers can understand without filling forms</h2>
        <p>Each example is prototype-only, editable, and requires radiologist verification before clinical use.</p>
      </div>
      <div className="sample-gallery-grid">
        {sampleOutputs.map((sample) => {
          const followUpScore = sample.id.includes('follow-up') ? scoreFollowUpSafety(sample.output) : undefined;
          return (
            <article className="sample-output-card" key={sample.id}>
              <div className="card-topline">
                <span>{sample.clinicalScenario}</span>
                <span className="content-status-badge small">{sample.contentStatus}</span>
              </div>
              <h3>{sample.title}</h3>
              <pre>{sample.output}</pre>
              {followUpScore ? <QualityMetricBadge score={followUpScore} compact /> : null}
              <div className="contribution-list">
                {sample.contributions.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="button-row">
                <CopyButton text={sample.output} label="Copy" />
                {sample.workflowId ? (
                  <button className="secondary-button" onClick={() => onOpenWorkflow(sample.workflowId!)} type="button">
                    Open related workflow
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
