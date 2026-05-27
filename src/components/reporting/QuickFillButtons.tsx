import type { WorkflowQuickFill } from '../../data/reportingWorkflowSchemas';

interface QuickFillButtonsProps {
  quickFills: WorkflowQuickFill[];
  onApply: (quickFill: WorkflowQuickFill) => void;
  activeQuickFillId?: string;
}

export function QuickFillButtons({ quickFills, onApply, activeQuickFillId }: QuickFillButtonsProps) {
  const normal = quickFills.find((quickFill) => quickFill.intent === 'normal') ?? quickFills[0];
  const positive = quickFills.find((quickFill) => quickFill.intent === 'positive') ?? quickFills.find((quickFill) => quickFill.intent === 'complicated');

  return (
    <section className="workflow-quickfill-panel">
      <div className="section-heading">
        <span className="eyebrow">Quick start</span>
        <h3>Start from a common scenario</h3>
      </div>
      <div className="button-row">
        {normal ? (
          <button className="secondary-button" onClick={() => onApply(normal)} type="button">
            Start with normal template
          </button>
        ) : null}
        {positive ? (
          <button className="primary-button" onClick={() => onApply(positive)} type="button">
            Start with positive template
          </button>
        ) : null}
      </div>
      <div className="quickfill-grid">
        {quickFills.map((quickFill) => (
          <button
            className={`quickfill-card ${activeQuickFillId === quickFill.id ? 'active' : ''}`}
            onClick={() => onApply(quickFill)}
            type="button"
            key={quickFill.id}
          >
            <strong>{quickFill.label}</strong>
            <span>{quickFill.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
