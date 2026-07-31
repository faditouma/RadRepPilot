import { useI18n } from '../i18n/I18nContext';

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageShell({ eyebrow = 'RadRepPilot', title, description, children }: PageShellProps) {
  const { text } = useI18n();
  return (
    <main className="route-page">
      <section className="route-panel">
        <span className="eyebrow">{text(eyebrow)}</span>
        <h1>{text(title)}</h1>
        <p>{text(description)}</p>
        {children ? <div className="route-panel-body">{children}</div> : null}
      </section>
    </main>
  );
}
