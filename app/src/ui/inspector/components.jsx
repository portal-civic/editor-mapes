// Reutilitzable UI primitives for the Inspector panel.
// All components are purely presentational (no logic).

export function InspectorSection({ children, className = '' }) {
  return (
    <div className={`ui-section${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

export function InspectorSectionHeader({ children }) {
  return <h3 className="ui-section-header">{children}</h3>
}

export function InspectorSectionBody({ children }) {
  return <div className="ui-section-body">{children}</div>
}

// Inline field row: label on the left, control fills the right.
// Uses <label> semantics when htmlFor is provided.
export function InspectorField({ label, htmlFor, children, hint }) {
  return (
    <label className="insp-field" htmlFor={htmlFor}>
      <span className="insp-field-label">{label}</span>
      {children}
      {hint ? <span className="insp-field-hint">{hint}</span> : null}
    </label>
  )
}

export function InspectorFieldLabel({ children }) {
  return <span className="insp-field-label">{children}</span>
}

// Horizontal row of items (buttons, badges, stats).
export function InspectorToolbar({ children, className = '' }) {
  return (
    <div className={`ui-toolbar${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

export function InspectorDivider() {
  return <hr className="ui-divider" aria-hidden="true" />
}

export function InspectorEmptyState({ children }) {
  return <p className="ui-empty-state">{children}</p>
}

export function InspectorBadge({ children, variant = 'default' }) {
  return (
    <span className={`ui-badge ui-badge--${variant}`}>{children}</span>
  )
}

export function InspectorStat({ label, value }) {
  return (
    <div className="ui-stat">
      <span className="ui-stat-value">{value}</span>
      <span className="ui-stat-label">{label}</span>
    </div>
  )
}

// Connected button group (shared borders).
export function InspectorButtonGroup({ children }) {
  return <div className="ui-btn-group">{children}</div>
}
