interface BreadcrumbsProps {
  items: Array<{ label: string; onClick?: () => void }>;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav className="breadcrumb-row" aria-label="Workflow breadcrumb">
      {items.map((item, index) => (
        item.onClick ? (
          <button className="breadcrumb-pill clickable" onClick={item.onClick} type="button" key={`${item.label}-${index}`}>
            {item.label}
          </button>
        ) : (
          <span className="breadcrumb-pill" key={`${item.label}-${index}`}>
            {item.label}
          </span>
        )
      ))}
    </nav>
  );
}
