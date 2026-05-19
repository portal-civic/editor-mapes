import { useState } from 'react'
import { formatMeasurement } from '../modules/geometry/measurements'

const TITLES = {
  area: 'Superfície',
  length: 'Longitud',
  point: 'Coordenades',
}

export default function MeasurementSection({ measurement, className = 'ssf-section' }) {
  const [copied, setCopied] = useState(false)
  const fmt = formatMeasurement(measurement)
  if (!fmt) return null

  const title = TITLES[measurement?.kind] ?? 'Mesura'

  if (fmt.invalid) {
    return (
      <div className={`${className} ssf-measure-section`}>
        <p className="ssf-section-title">{title}</p>
        <p className="ssf-measure-invalid">Geometria invàlida o no mesurable correctament</p>
      </div>
    )
  }

  const handleCopy = () => {
    if (!fmt.copyText) return
    navigator.clipboard.writeText(fmt.copyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className={`${className} ssf-measure-section`}>
      <p className="ssf-section-title">{title}</p>
      <div className="ssf-measure-row">
        <div className="ssf-measure-values">
          <span className="ssf-measure-primary">{fmt.primary}</span>
          {fmt.secondary && (
            <span className="ssf-measure-secondary">{fmt.secondary}</span>
          )}
        </div>
        <button
          type="button"
          className={`ssf-copy-btn${copied ? ' ssf-copy-btn--done' : ''}`}
          onClick={handleCopy}
          title="Copiar mesura"
        >
          {copied ? '✓' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
