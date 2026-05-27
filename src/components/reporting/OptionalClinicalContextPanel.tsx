import type { WorkflowSection, WorkflowValue } from '../../data/reportingWorkflowSchemas';
import { StructuredFieldRenderer } from './StructuredFieldRenderer';

interface OptionalClinicalContextPanelProps {
  sections: WorkflowSection[];
  values: Record<string, WorkflowValue>;
  open: boolean;
  onToggle: () => void;
  onChange: (fieldId: string, value: WorkflowValue) => void;
}

export function OptionalClinicalContextPanel({
  sections,
  values,
  open,
  onToggle,
  onChange,
}: OptionalClinicalContextPanelProps) {
  return (
    <section className="workflow-card optional-context-panel">
      <div className="optional-context-header">
        <div>
          <span className="eyebrow">Optional clinical context</span>
          <h3>Clinical context is optional and not included unless expanded.</h3>
        </div>
        <button className="secondary-button" onClick={onToggle} type="button">
          {open ? 'Hide clinical context' : 'Add clinical context'}
        </button>
      </div>

      {open ? (
        <div className="accordion-stack">
          {sections.map((section) => (
            <details className="workflow-card workflow-accordion nested-accordion" open key={section.id}>
              <summary>
                <span>{section.title}</span>
                {section.description ? <small>{section.description}</small> : null}
              </summary>
              <div className="workflow-form-grid">
                {section.fields.map((field) => (
                  <StructuredFieldRenderer
                    field={field}
                    value={values[field.id]}
                    onChange={(value) => onChange(field.id, value)}
                    key={field.id}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="inline-note compact-note">Clinical details can be added if they affect technique, comparison, or final wording.</div>
      )}
    </section>
  );
}
