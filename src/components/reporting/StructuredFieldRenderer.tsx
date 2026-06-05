import type { WorkflowField, WorkflowValue } from '../../data/reportingWorkflowSchemas';

interface StructuredFieldRendererProps {
  field: WorkflowField;
  value: WorkflowValue | undefined;
  onChange: (value: WorkflowValue) => void;
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

  if (field.type === 'checkbox-group') {
    const selected = Array.isArray(value) ? value : [];

    const toggle = (optionValue: string) => {
      onChange(selected.includes(optionValue) ? selected.filter((item) => item !== optionValue) : [...selected, optionValue]);
    };

    return (
      <fieldset className={className}>
        <legend>{field.label}</legend>
        <div className="negative-chip-grid compact-checkbox-grid">
          {(field.options ?? []).map((option) => (
            <label className={selected.includes(option.value) ? 'negative-chip active' : 'negative-chip'} key={option.value}>
              <input checked={selected.includes(option.value)} onChange={() => toggle(option.value)} type="checkbox" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
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
