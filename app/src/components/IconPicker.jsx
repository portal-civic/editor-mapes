/**
 * Reusable FA icon picker with search + optional clear button.
 *
 * Props:
 *   selectedIconId  — currently selected FA icon id, or null
 *   onSelect(id)    — called when the user clicks an icon button
 *   onClear()       — if provided, shows a "remove override" button when an icon is selected
 */
import { useMemo, useState } from 'react'
import { FA_ICON_CATALOG, FA_POPULAR_ICONS } from '../icons/faIconCatalog'
import { resolveFaIcon } from '../icons/faIconResolver'

const ICON_LIMIT = 120

export default function IconPicker({ selectedIconId, onSelect, onClear }) {
  const [search, setSearch] = useState('')

  const visibleIcons = useMemo(() => {
    const q = search.toLowerCase().trim()
    const source = q
      ? FA_ICON_CATALOG.filter(
          (ic) => ic.id.includes(q) || ic.label.toLowerCase().includes(q) || ic.tags.some((t) => t.includes(q)),
        )
      : FA_POPULAR_ICONS
    return source.slice(0, ICON_LIMIT)
  }, [search])

  const selectedEntry = selectedIconId ? FA_ICON_CATALOG.find((ic) => ic.id === selectedIconId) : null
  const selectedData = selectedIconId ? resolveFaIcon(selectedIconId) : null

  return (
    <div className="icon-picker">
      {/* Preview of the currently selected icon */}
      {selectedData && (
        <div className="icon-picker-preview">
          <svg
            viewBox={`0 0 ${selectedData.width} ${selectedData.height}`}
            width={18}
            height={18}
            aria-hidden="true"
          >
            <path d={selectedData.path} fill="currentColor" />
          </svg>
          <span className="icon-picker-preview-label">{selectedEntry?.label ?? selectedIconId}</span>
          {onClear && (
            <button type="button" className="icon-picker-clear" onClick={onClear} title="Treure icona pròpia">
              ×
            </button>
          )}
        </div>
      )}

      <input
        type="text"
        className="icon-picker-search"
        placeholder="Buscar icona (ex: hospital, bus, escola)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {visibleIcons.length === 0 ? (
        <p className="icon-picker-empty">Sense resultats</p>
      ) : (
        <div className="icon-picker-grid">
          {visibleIcons.map((ic) => {
            const iconData = resolveFaIcon(ic.id)
            if (!iconData) return null
            const isActive = selectedIconId === ic.id
            return (
              <button
                key={ic.id}
                type="button"
                title={ic.label}
                className={`icon-picker-btn${isActive ? ' icon-picker-btn--active' : ''}`}
                onClick={() => onSelect(ic.id)}
              >
                <svg
                  viewBox={`0 0 ${iconData.width} ${iconData.height}`}
                  width={14}
                  height={14}
                  aria-hidden="true"
                >
                  <path d={iconData.path} fill="currentColor" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
