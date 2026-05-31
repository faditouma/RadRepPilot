interface PageShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageShell({ eyebrow = 'RadRepPilot', title, description, children }: PageShellProps) {
  return (
    <main className="route-page">
      <section className="route-panel">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children ? <div className="route-panel-body">{children}</div> : null}
      </section>
    </main>
  );
}
