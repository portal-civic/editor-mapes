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

  if (tileNodes.length === 0) {
    return
  }

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

function getRelativeRect(element, containerRect) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left - containerRect.left,
    y: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height,
  }
}

function drawTiles(ctx, container, containerRect) {
  const tileNodes = container.querySelectorAll('.leaflet-tile-pane img.leaflet-tile')
  tileNodes.forEach((tileNode) => {
    if (!(tileNode instanceof HTMLImageElement)) {
      return
    }
    if (!tileNode.complete || tileNode.naturalWidth <= 0) {
      return
    }

    const { x, y, width, height } = getRelativeRect(tileNode, containerRect)
    if (width <= 0 || height <= 0) {
      return
    }

    ctx.drawImage(tileNode, x, y, width, height)
  })
}

function drawCanvasLayers(ctx, container, containerRect) {
  const canvasNodes = container.querySelectorAll(
    '.leaflet-overlay-pane canvas, .leaflet-marker-pane canvas',
  )

  canvasNodes.forEach((canvasNode) => {
    if (!(canvasNode instanceof HTMLCanvasElement)) {
      return
    }
    const { x, y, width, height } = getRelativeRect(canvasNode, containerRect)
    if (width <= 0 || height <= 0) {
      return
    }
    ctx.drawImage(canvasNode, x, y, width, height)
  })
}

async function drawSVGLayers(ctx, container, containerRect) {
  const svgNodes = Array.from(container.querySelectorAll('.leaflet-overlay-pane svg'))

  for (const svgNode of svgNodes) {
    if (!(svgNode instanceof SVGElement)) {
      continue
    }

    const { x, y, width, height } = getRelativeRect(svgNode, containerRect)
    if (width <= 0 || height <= 0) {
      continue
    }

    const svgMarkup = new XMLSerializer().serializeToString(svgNode)
    const svgBlob = new Blob([svgMarkup], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const svgUrl = URL.createObjectURL(svgBlob)

    try {
      const svgImage = await loadImage(svgUrl)
      ctx.drawImage(svgImage, x, y, width, height)
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  }
}

async function drawMarkerLayers(ctx, container, containerRect) {
  const markerNodes = Array.from(
    container.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon'),
  )

  for (const markerNode of markerNodes) {
    const { x, y, width, height } = getRelativeRect(markerNode, containerRect)
    if (width <= 0 || height <= 0) {
      continue
    }

    if (markerNode instanceof HTMLImageElement) {
      if (markerNode.complete && markerNode.naturalWidth > 0) {
        ctx.drawImage(markerNode, x, y, width, height)
      }
      continue
    }

    const markerMarkup = new XMLSerializer().serializeToString(markerNode)
    const markerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${markerMarkup}</foreignObject></svg>`
    const markerBlob = new Blob([markerSVG], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const markerUrl = URL.createObjectURL(markerBlob)

    try {
      const markerImage = await loadImage(markerUrl)
      ctx.drawImage(markerImage, x, y, width, height)
    } catch {
      // Ignore marker conversion failures and continue.
    } finally {
      URL.revokeObjectURL(markerUrl)
    }
  }
}

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

export default function useMapExport() {
  const exportMapAsPNG = useCallback(async ({ map, fileName = 'editor-mapes.png' }) => {
    if (!map) {
      throw new Error('Leaflet map instance is required')
    }

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

    if (!width || !height) {
      throw new Error('Map container has invalid size')
    }

    await waitForTiles(mapContainer)
    await waitNextFrame()

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = width
    exportCanvas.height = height
    const ctx = exportCanvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to acquire canvas context')
    }

    drawTiles(ctx, mapContainer, containerRect)
    drawCanvasLayers(ctx, mapContainer, containerRect)
    await drawSVGLayers(ctx, mapContainer, containerRect)
    await drawMarkerLayers(ctx, mapContainer, containerRect)

    const pngBlob = await new Promise((resolve) =>
      exportCanvas.toBlob((blob) => resolve(blob), 'image/png'),
    )

    if (!pngBlob) {
      throw new Error('Failed to create PNG blob')
    }

    downloadBlob(pngBlob, fileName)
  }, [])

  return { exportMapAsPNG }
}
