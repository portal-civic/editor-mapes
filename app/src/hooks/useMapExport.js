import { useCallback } from 'react'

function waitNextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function waitForTiles(container) {
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

// ─── Tiles ────────────────────────────────────────────────────────────────────

function drawTiles(ctx, container, containerRect) {
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

// ─── Canvas vectorials (preferCanvas) ────────────────────────────────────────
//
// Amb preferCanvas={true} al MapContainer, Leaflet renderitza totes les capes
// vectorials (Polyline, Polygon, CircleMarker, GeoJSON) en elements <canvas>
// dins de cada pane. Aquests canvas ja contenen el contingut correctament
// posicionat: getBoundingClientRect() ens dóna la posició real incloent tots
// els translate3d del map-pane, cosa que fa el posicionament trivial.

function drawCanvasLayers(ctx, container, containerRect) {
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

// ─── Markers (divIcon SVG) ────────────────────────────────────────────────────
//
// Els markers estan als panes personalitzats (user-layer-XXX-pane),
// NO a .leaflet-marker-pane. Cal cercar a tots els panes.
//
// La posició del marker ve de style.transform: translate3d(x, y, 0)
// on x, y són relatius al map-pane (que pot estar desplaçat).
// Cal sumar l'offset del map-pane per obtenir coordenades relatives
// al contenidor del mapa.

function parseTranslate3d(transformStr) {
  const match = transformStr?.match(/translate3d\(\s*([-\d.]+)px,\s*([-\d.]+)px/)
  if (!match) return null
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
}

async function drawMarkerLayers(ctx, container) {
  // Offset del map-pane respecte al contenidor
  const mapPane = container.querySelector('.leaflet-map-pane')
  const mapPaneOffset = parseTranslate3d(mapPane?.style?.transform) || { x: 0, y: 0 }

  // Cercar markers a TOTS els panes (no només leaflet-marker-pane)
  const markerNodes = Array.from(
    container.querySelectorAll('.leaflet-pane .leaflet-marker-icon'),
  )

  for (const markerNode of markerNodes) {
    // Posició del marker: translate3d relatiu al map-pane + offset del map-pane
    const markerOffset = parseTranslate3d(markerNode.style?.transform)
    if (!markerOffset) continue

    const iconSize = markerNode._leaflet_pos
      ? null
      : (() => {
          // Llegir mida real del DOM
          const r = markerNode.getBoundingClientRect()
          return { w: r.width, h: r.height }
        })()

    const domRect = markerNode.getBoundingClientRect()
    const w = domRect.width
    const h = domRect.height
    if (w <= 0 || h <= 0) continue

    // Coordenada al canvas = offset map-pane + translate3d del marker - iconAnchor
    // L'iconAnchor ja s'aplica via margin-left/margin-top de Leaflet
    // getBoundingClientRect ja inclou tot → usem-lo directament
    const containerRect = container.getBoundingClientRect()
    const x = domRect.left - containerRect.left
    const y = domRect.top - containerRect.top

    // Marker com a <img>
    if (markerNode instanceof HTMLImageElement) {
      if (markerNode.complete && markerNode.naturalWidth > 0) {
        ctx.drawImage(markerNode, x, y, w, h)
      }
      continue
    }

    // divIcon amb <svg> intern
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

// ─── Download ─────────────────────────────────────────────────────────────────

function downloadBlob(blob, fileName) {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(downloadUrl)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useMapExport() {
  const exportMapAsPNG = useCallback(async ({ map, fileName = 'editor-mapes.png' }) => {
    if (!map) throw new Error('Leaflet map instance is required')

    await new Promise((resolve) => map.whenReady(resolve))

    map.invalidateSize({ animate: false, pan: false })
    const center = map.getCenter()
    const zoom = map.getZoom()
    map.setView(center, zoom, { animate: false })

    await waitNextFrame()
    await waitNextFrame()

    const mapContainer = map.getContainer()
    const containerRect = mapContainer.getBoundingClientRect()
    const width = Math.round(containerRect.width)
    const height = Math.round(containerRect.height)

    if (!width || !height) throw new Error('Map container has invalid size')

    await waitForTiles(mapContainer)
    await waitNextFrame()

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = width
    exportCanvas.height = height
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) throw new Error('Failed to acquire canvas context')

    drawTiles(ctx, mapContainer, containerRect)
    drawCanvasLayers(ctx, mapContainer, containerRect)
    await drawMarkerLayers(ctx, mapContainer)

    const pngBlob = await new Promise((resolve) =>
      exportCanvas.toBlob((blob) => resolve(blob), 'image/png'),
    )
    if (!pngBlob) throw new Error('Failed to create PNG blob')

    downloadBlob(pngBlob, fileName)
  }, [])

  return { exportMapAsPNG }
}
