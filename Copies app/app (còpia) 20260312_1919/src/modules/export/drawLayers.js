import { loadImage } from './utils'

export async function waitForTiles(container) {
  const tileNodes = Array.from(
    container.querySelectorAll('.leaflet-tile-pane img.leaflet-tile'),
  )
  if (tileNodes.length === 0) return
  await Promise.all(
    tileNodes.map(
      (tileNode) =>
        new Promise((resolve) => {
          if (tileNode.complete && tileNode.naturalWidth > 0) {
            resolve()
            return
          }
          const handleDone = () => {
            tileNode.removeEventListener('load', handleDone)
            tileNode.removeEventListener('error', handleDone)
            resolve()
          }
          tileNode.addEventListener('load', handleDone)
          tileNode.addEventListener('error', handleDone)
        }),
    ),
  )
}

export function drawTiles(ctx, container, containerRect) {
  const tileNodes = container.querySelectorAll('.leaflet-tile-pane img.leaflet-tile')
  tileNodes.forEach((tileNode) => {
    if (!(tileNode instanceof HTMLImageElement)) return
    if (!tileNode.complete || tileNode.naturalWidth <= 0) return
    const rect = tileNode.getBoundingClientRect()
    const x = rect.left - containerRect.left
    const y = rect.top - containerRect.top
    const w = rect.width
    const h = rect.height
    if (w <= 0 || h <= 0) return
    ctx.drawImage(tileNode, x, y, w, h)
  })
}

// Amb preferCanvas={true} al MapContainer, Leaflet renderitza totes les capes
// vectorials (Polyline, Polygon, CircleMarker, GeoJSON) en elements <canvas>
// dins de cada pane. Aquests canvas ja contenen el contingut correctament
// posicionat: getBoundingClientRect() ens dóna la posició real incloent tots
// els translate3d del map-pane, cosa que fa el posicionament trivial.
export function drawCanvasLayers(ctx, container, containerRect) {
  const paneNodes = Array.from(container.querySelectorAll('.leaflet-pane'))

  const panesWithCanvas = paneNodes
    .map((pane) => {
      const canvas = pane.querySelector(':scope > canvas')
      if (!canvas) return null
      const zIndex = parseInt(window.getComputedStyle(pane).zIndex, 10) || 0
      return { canvas, zIndex }
    })
    .filter(Boolean)
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const { canvas } of panesWithCanvas) {
    const canvasRect = canvas.getBoundingClientRect()
    if (canvasRect.width <= 0 || canvasRect.height <= 0) continue
    const x = canvasRect.left - containerRect.left
    const y = canvasRect.top - containerRect.top
    ctx.drawImage(canvas, x, y, canvasRect.width, canvasRect.height)
  }
}

function parseTranslate3d(transformStr) {
  const match = transformStr?.match(/translate3d\(\s*([-\d.]+)px,\s*([-\d.]+)px/)
  if (!match) return null
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
}

// Els markers estan als panes personalitzats (user-layer-XXX-pane),
// NO a .leaflet-marker-pane. Cal cercar a tots els panes.
export async function drawMarkerLayers(ctx, container) {
  const mapPane = container.querySelector('.leaflet-map-pane')
  const mapPaneOffset = parseTranslate3d(mapPane?.style?.transform) || { x: 0, y: 0 }

  const markerNodes = Array.from(
    container.querySelectorAll('.leaflet-pane .leaflet-marker-icon'),
  )

  for (const markerNode of markerNodes) {
    const markerOffset = parseTranslate3d(markerNode.style?.transform)
    if (!markerOffset) continue

    const domRect = markerNode.getBoundingClientRect()
    const w = domRect.width
    const h = domRect.height
    if (w <= 0 || h <= 0) continue

    const containerRect = container.getBoundingClientRect()
    const x = domRect.left - containerRect.left
    const y = domRect.top - containerRect.top

    if (markerNode instanceof HTMLImageElement) {
      if (markerNode.complete && markerNode.naturalWidth > 0) {
        ctx.drawImage(markerNode, x, y, w, h)
      }
      continue
    }

    const innerSVG = markerNode.querySelector('svg')
    if (innerSVG) {
      const clonedSVG = innerSVG.cloneNode(true)
      clonedSVG.setAttribute('width', String(w))
      clonedSVG.setAttribute('height', String(h))
      const svgMarkup = new XMLSerializer().serializeToString(clonedSVG)
      const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
      try {
        const img = await loadImage(svgUrl)
        ctx.drawImage(img, x, y, w, h)
      } catch {
        // Ignorar errors individuals
      } finally {
        URL.revokeObjectURL(svgUrl)
      }
      continue
    }

    // divIcon HTML pur → foreignObject com a fallback
    const markup = new XMLSerializer().serializeToString(markerNode)
    const fallbackSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`
    const fallbackBlob = new Blob([fallbackSVG], { type: 'image/svg+xml;charset=utf-8' })
    const fallbackUrl = URL.createObjectURL(fallbackBlob)
    try {
      const img = await loadImage(fallbackUrl)
      ctx.drawImage(img, x, y, w, h)
    } catch {
      // Ignorar errors individuals
    } finally {
      URL.revokeObjectURL(fallbackUrl)
    }
  }
}
