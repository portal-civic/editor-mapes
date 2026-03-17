import { useState } from 'react'
import IconPicker from './IconPicker'

// Parses the stored "fa:iconid" format. Returns the icon id string or null.
function parseFeatureIcon(value) {
  if (!value || typeof value !== 'string') return null
  const m = value.match(/^fa:(.+)$/)
  return m ? m[1] : null
}

function FeatureInspector({ feature, layer, onUpdate, onClose }) {
  const [draft, setDraft] = useState({
    name: feature.name ?? '',
    label: feature.label ?? '',
    description: feature.description ?? '',
    category: feature.category ?? '',
    subcategory: feature.subcategory ?? '',
    status: feature.status ?? '',
    icon: feature.icon ?? '',
    showInWeb: feature.showInWeb !== false,
    showInExport: feature.showInExport !== false,
  })

  const commitText = (field) => {
    if (draft[field] !== (feature[field] ?? '')) {
      onUpdate?.(layer.id, feature.id, { [field]: draft[field] })
    }
  }

  const commitBool = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
    onUpdate?.(layer.id, feature.id, { [field]: value })
  }

  const handleTextChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <h2>Element</h2>
        <button type="button" onClick={onClose} aria-label="Tancar inspector">
          \u00d7
        </button>
      </div>
      <div className="panel-content">
        <p className="layer-meta">{layer.name} \u00b7 {layer.geometryType}</p>
        <label>
          Nom
          <input
            type="text"
            value={draft.name}
            onChange={(e) => handleTextChange('name', e.target.value)}
            onBlur={() => commitText('name')}
          />
        </label>
        <label>
          Etiqueta (visible al mapa)
          <input
            type="text"
            value={draft.label}
            onChange={(e) => handleTextChange('label', e.target.value)}
            onBlur={() => commitText('label')}
          />
        </label>
        <label>
          Descripci\u00f3
          <textarea
            value={draft.description}
            onChange={(e) => handleTextChange('description', e.target.value)}
            onBlur={() => commitText('description')}
            rows={3}
          />
        </label>
        <label>
          Categoria
          <input
            type="text"
            value={draft.category}
            onChange={(e) => handleTextChange('category', e.target.value)}
            onBlur={() => commitText('category')}
          />
        </label>
        <label>
          Subcategoria
          <input
            type="text"
            value={draft.subcategory}
            onChange={(e) => handleTextChange('subcategory', e.target.value)}
            onBlur={() => commitText('subcategory')}
          />
        </label>
        <label>
          Estat
          <input
            type="text"
            value={draft.status}
            onChange={(e) => handleTextChange('status', e.target.value)}
            onBlur={() => commitText('status')}
          />
        </label>
        {layer.geometryType === 'point' ? (
          <div className="inspector-section">
            <p className="inspector-section-title">Icona pròpia</p>
            <p className="inspector-section-hint">
              Sobreescriu la icona de la capa per a aquest element.
            </p>
            <IconPicker
              selectedIconId={parseFeatureIcon(draft.icon)}
              onSelect={(iconId) => {
                const value = `fa:${iconId}`
                setDraft((prev) => ({ ...prev, icon: value }))
                onUpdate?.(layer.id, feature.id, { icon: value })
              }}
              onClear={() => {
                setDraft((prev) => ({ ...prev, icon: '' }))
                onUpdate?.(layer.id, feature.id, { icon: '' })
              }}
            />
          </div>
        ) : null}

        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={draft.showInWeb}
            onChange={(e) => commitBool('showInWeb', e.target.checked)}
          />
          <span>Mostrar al web</span>
        </label>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={draft.showInExport}
            onChange={(e) => commitBool('showInExport', e.target.checked)}
          />
          <span>Incloure a l\u0027exportaci\u00f3</span>
        </label>
      </div>
    </aside>
  )
}

export default FeatureInspector
