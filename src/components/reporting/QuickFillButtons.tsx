import type { WorkflowQuickFill } from '../../data/reportingWorkflowSchemas';
import { useI18n } from '../../i18n/I18nContext';

interface QuickFillButtonsProps {
  quickFills: WorkflowQuickFill[];
  onApply: (quickFill: WorkflowQuickFill) => void;
  activeQuickFillId?: string;
}

export function QuickFillButtons({ quickFills, onApply, activeQuickFillId }: QuickFillButtonsProps) {
  const { text } = useI18n();
  const normal = quickFills.find((quickFill) => quickFill.intent === 'normal') ?? quickFills[0];
  const positive = quickFills.find((quickFill) => quickFill.intent === 'positive') ?? quickFills.find((quickFill) => quickFill.intent === 'complicated');

  return (
    <section className="workflow-quickfill-panel">
      <div className="section-heading">
        <span className="eyebrow">{text('Quick start')}</span>
        <h3>{text('Start from a common scenario')}</h3>
      </div>
      <div className="button-row">
        {normal ? (
          <button className="secondary-button" onClick={() => onApply(normal)} type="button">
            {text('Start with normal template')}
          </button>
        ) : null}
        {positive ? (
          <button className="primary-button" onClick={() => onApply(positive)} type="button">
            {text('Start with positive template')}
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
            <strong>{text(quickFill.label)}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
