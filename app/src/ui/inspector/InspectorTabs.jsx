const TABS = [
  { id: 'propietats', label: 'Propietats' },
  { id: 'estil', label: 'Estil' },
  { id: 'dades', label: 'Dades' },
  { id: 'filtres', label: 'Filtres' },
  { id: 'analisi', label: 'Anàlisi' },
]

export default function InspectorTabs({ activeTab, onTabChange, badges = {} }) {
  return (
    <nav className="insp-tabs" role="tablist" aria-label="Inspector">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={`insp-tab${activeTab === tab.id ? ' insp-tab--active' : ''}`}
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {badges[tab.id] ? (
            <span className="insp-tab-badge" aria-hidden="true">{badges[tab.id]}</span>
          ) : null}
        </button>
      ))}
    </nav>
  )
}
