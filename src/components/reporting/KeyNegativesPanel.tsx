import { useI18n } from '../../i18n/I18nContext';

interface KeyNegativesPanelProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function KeyNegativesPanel({ options, selected, onChange }: KeyNegativesPanelProps) {
  const { text } = useI18n();
  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <section className="workflow-card">
      <div className="section-heading">
        <span className="eyebrow">{text('Key negatives')}</span>
        <h3>{text('Common negatives to include')}</h3>
        <p>{text('Select only items verified by the user/radiologist.')}</p>
      </div>
      <div className="negative-chip-grid">
        {options.map((option) => (
          <label className={selected.includes(option) ? 'negative-chip active' : 'negative-chip'} key={option}>
            <input checked={selected.includes(option)} onChange={() => toggle(option)} type="checkbox" />
            <span>{text(option)}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
