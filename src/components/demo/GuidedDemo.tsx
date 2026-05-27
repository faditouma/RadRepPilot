import { useMemo, useState } from 'react';
import { demoCases } from '../../data/demoCases';
import { CopyButton } from '../radrep/RadRepComponents';

interface GuidedDemoProps {
  open: boolean;
  onClose: () => void;
  onOpenWorkflow: (workflowId: string) => void;
}

export function GuidedDemo({ open, onClose, onOpenWorkflow }: GuidedDemoProps) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const demoCase = demoCases[caseIndex];
  const step = demoCase.steps[stepIndex];
  const totalSteps = demoCases.reduce((sum, item) => sum + item.steps.length, 0);
  const absoluteStep = useMemo(() => demoCases.slice(0, caseIndex).reduce((sum, item) => sum + item.steps.length, 0) + stepIndex + 1, [caseIndex, stepIndex]);

  if (!open) return null;

  const goNext = () => {
    if (stepIndex < demoCase.steps.length - 1) {
      setStepIndex((index) => index + 1);
      return;
    }
    if (caseIndex < demoCases.length - 1) {
      setCaseIndex((index) => index + 1);
      setStepIndex(0);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((index) => index - 1);
      return;
    }
    if (caseIndex > 0) {
      const previousCase = demoCases[caseIndex - 1];
      setCaseIndex((index) => index - 1);
      setStepIndex(previousCase.steps.length - 1);
    }
  };

  const workflowId = step.workflowId ?? demoCase.workflowId;

  return (
    <div className="demo-overlay" role="dialog" aria-modal="true" aria-label="RadRepPilot guided demo">
      <section className="guided-demo">
        <div className="demo-header">
          <div>
            <span className="eyebrow">3-minute guided demo</span>
            <h2>{demoCase.title}</h2>
            <p>{demoCase.scenario}</p>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Exit demo
          </button>
        </div>

        <div className="demo-progress" aria-label={`Demo progress ${absoluteStep} of ${totalSteps}`}>
          <span style={{ width: `${(absoluteStep / totalSteps) * 100}%` }} />
        </div>

        <div className="demo-case-tabs">
          {demoCases.map((item, index) => (
            <button className={index === caseIndex ? 'active' : ''} onClick={() => { setCaseIndex(index); setStepIndex(0); }} type="button" key={item.id}>
              Case {index + 1}
            </button>
          ))}
        </div>

        <article className="demo-step-card">
          <span className="eyebrow">{step.eyebrow}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          {step.bullets?.length ? (
            <ul className="demo-bullet-list">
              {step.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {step.output ? <blockquote>{step.output}</blockquote> : null}
          <div className="why-callout">
            <strong>Why this matters</strong>
            <p>{step.whyItMatters}</p>
          </div>
        </article>

        <div className="demo-actions">
          <button className="secondary-button" onClick={goBack} disabled={caseIndex === 0 && stepIndex === 0} type="button">
            Back
          </button>
          <button className="primary-button" onClick={goNext} disabled={caseIndex === demoCases.length - 1 && stepIndex === demoCase.steps.length - 1} type="button">
            Next
          </button>
          {workflowId ? (
            <button className="secondary-button" onClick={() => onOpenWorkflow(workflowId)} type="button">
              Open this workflow
            </button>
          ) : null}
          <CopyButton text={step.output ?? demoCase.copyText} label="Copy sample output" />
        </div>
      </section>
    </div>
  );
}
