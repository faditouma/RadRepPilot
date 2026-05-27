import type { WorkflowField, WorkflowValue } from '../../data/reportingWorkflowSchemas';

interface StructuredFieldRendererProps {
  field: WorkflowField;
  value: WorkflowValue | undefined;
  onChange: (value: string) => void;
}

export function StructuredFieldRenderer({ field, value, onChange }: StructuredFieldRendererProps) {
  const stringValue = Array.isArray(value) ? value.join(', ') : value ?? '';
  const className = `field ${field.wide || field.type === 'textarea' ? 'wide-field' : ''}`;

  if (field.type === 'textarea') {
    return (
      <label className={className}>
        {field.label}
        <textarea value={stringValue} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} />
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className={className}>
        {field.label}
        <select value={stringValue} onChange={(event) => onChange(event.target.value)}>
          {(field.options ?? []).map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className={className}>
      {field.label}
      <div className="measurement-input">
        <input
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          type={field.type === 'number' ? 'number' : 'text'}
          min={field.type === 'number' ? '0' : undefined}
          step={field.type === 'number' ? '0.1' : undefined}
        />
        {field.suffix ? <span>{field.suffix}</span> : null}
      </div>
    </label>
  );
}
