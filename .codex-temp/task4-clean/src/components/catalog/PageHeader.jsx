import Link from "next/link";

export function PageHeader({ title, description, breadcrumbs = [] }) {
  return (
    <header className="section">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          {breadcrumbs.map((item, index) => (
            <span key={item.href}>
              {index > 0 && " / "}
              {index === breadcrumbs.length - 1 ? (
                <span>{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1 className="section-title">{title}</h1>
      {description && <p className="section-description">{description}</p>}
    </header>
  );
}
