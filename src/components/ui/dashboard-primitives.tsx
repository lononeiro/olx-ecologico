import type { ReactNode } from "react";

export function PageSection({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-section-header">
      <div>
        {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
        <h2 className="page-section-title">{title}</h2>
        {description ? <p className="page-section-description">{description}</p> : null}
      </div>
      {action ? <div className="page-section-action">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  description,
  accent = "green",
  icon,
}: {
  label: string;
  value: number | string;
  description?: string;
  accent?: "green" | "blue" | "amber" | "slate";
  icon?: ReactNode;
}) {
  return (
    <div className={`metric-card metric-card-${accent}`}>
      <div className="metric-card-header">
        <div>
          <p className="metric-card-label">{label}</p>
          <p className="metric-card-value">{value}</p>
        </div>
        {icon ? <div className="metric-card-icon">{icon}</div> : null}
      </div>
      {description ? <p className="metric-card-description">{description}</p> : null}
    </div>
  );
}

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`surface-card ${className}`.trim()}>{children}</section>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state surface-card">
      <div className="empty-state-icon">
        {icon ?? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="1.6">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M8 12h8" />
          </svg>
        )}
      </div>
      <div>
        <p className="empty-state-title">{title}</p>
        <p className="empty-state-copy">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function InfoField({
  label,
  value,
  full,
  muted,
  mono,
}: {
  label: string;
  value: string;
  full?: boolean;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`info-field ${full ? "info-field-full" : ""} ${muted ? "info-field-muted" : ""}`.trim()}>
      <p className="info-field-label">{label}</p>
      <p className={`info-field-value ${mono ? "info-field-mono" : ""}`.trim()}>{value}</p>
    </div>
  );
}

export function StatusBanner({
  title,
  description,
  tone = "green",
}: {
  title: string;
  description: string;
  tone?: "green" | "blue" | "amber" | "red" | "slate";
}) {
  return (
    <div className={`status-banner status-banner-${tone}`}>
      <p className="status-banner-kicker">Situacao Atual</p>
      <p className="status-banner-title">{title}</p>
      <p className="status-banner-copy">{description}</p>
    </div>
  );
}
