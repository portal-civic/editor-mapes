import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, Polygon, Polyline, TileLayer } from 'react-leaflet'

const FALLBACK_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

function getDashArray(dashStyle) {
  if (dashStyle === 'dashed') {
    return '10,8'
  }

  if (dashStyle === 'dotted') {
    return '2,8'
  }

  return undefined
}

function ExportMapSnapshot({
  width,
  height,
  mapCenter,
  mapZoom,
  selectedBasemap,
  pointFeatures = [],
  lineFeatures = [],
  polygonFeatures = [],
  visibleLayerOrder = [],
  selectedMunicipalityGeometry = null,
  onReady,
}) {
  const tileUrl = selectedBasemap?.url || FALLBACK_TILE_URL
  const maxZoom = selectedBasemap?.maxZoom || 19
  const [isMapReady, setIsMapReady] = useState(false)
  const [didTileLayerLoad, setDidTileLayerLoad] = useState(false)
  const [isViewSynced, setIsViewSynced] = useState(false)
  const mapRef = useRef(null)
  const snapshotRef = useRef(null)

  const layerOrderIndex = useMemo(
    () =>
      new Map(visibleLayerOrder.map((layerId, index) => [layerId, index])),
    [visibleLayerOrder],
  )
  const sortByLayerOrder = (a, b) =>
    (layerOrderIndex.get(a.layerId) ?? Number.MAX_SAFE_INTEGER) -
    (layerOrderIndex.get(b.layerId) ?? Number.MAX_SAFE_INTEGER)
  const orderedLineFeatures = useMemo(
    () => [...lineFeatures].sort(sortByLayerOrder),
    [lineFeatures, layerOrderIndex],
  )
  const orderedPolygonFeatures = useMemo(
    () => [...polygonFeatures].sort(sortByLayerOrder),
    [polygonFeatures, layerOrderIndex],
  )
  const orderedPointFeatures = useMemo(
    () => [...pointFeatures].sort(sortByLayerOrder),
    [pointFeatures, layerOrderIndex],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!isMapReady || !map) {
      return
    }

    let isCancelled = false
    let firstRafId = null
    let secondRafId = null
    setIsViewSynced(false)

    const completeSync = () => {
      firstRafId = requestAnimationFrame(() => {
        secondRafId = requestAnimationFrame(() => {
          if (!isCancelled) {
            setIsViewSynced(true)
          }
        })
      })
    }

    const handleMoveEnd = () => {
      map.off('moveend', handleMoveEnd)
      completeSync()
    }

    map.invalidateSize({ animate: false, pan: false })
    map.on('moveend', handleMoveEnd)
    map.setView(mapCenter, mapZoom, { animate: false })

    const fallbackTimeoutId = window.setTimeout(() => {
      map.off('moveend', handleMoveEnd)
      completeSync()
    }, 250)

    return () => {
      isCancelled = true
      map.off('moveend', handleMoveEnd)
      window.clearTimeout(fallbackTimeoutId)
      if (firstRafId) {
        cancelAnimationFrame(firstRafId)
      }
      if (secondRafId) {
        cancelAnimationFrame(secondRafId)
      }
    }
  }, [isMapReady, mapCenter, mapZoom])

  useEffect(() => {
    if (!isMapReady || !isViewSynced || !didTileLayerLoad) {
      return
    }

    let isCancelled = false
    let rafId = null

    const waitForRenderedTiles = () => {
      const tileNodes = snapshotRef.current?.querySelectorAll('.leaflet-tile')
      const hasTiles = tileNodes && tileNodes.length > 0
      const areTilesComplete =
        hasTiles &&
        Array.from(tileNodes).every(
          (tileNode) => tileNode.complete && tileNode.naturalWidth > 0,
        )

      if (!areTilesComplete) {
        rafId = requestAnimationFrame(waitForRenderedTiles)
        return
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isCancelled) {
            onReady?.()
          }
        })
      })
    }

    rafId = requestAnimationFrame(waitForRenderedTiles)

    return () => {
      isCancelled = true
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [didTileLayerLoad, isMapReady, isViewSynced, onReady])

  return (
    <div
      ref={snapshotRef}
      className="export-map-snapshot"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="map-canvas"
        zoomControl={false}
        attributionControl={false}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        tap={false}
        whenReady={(event) => {
          mapRef.current = event.target
          setIsMapReady(true)
        }}
      >
        <TileLayer
          url={tileUrl}
          maxZoom={maxZoom}
          crossOrigin="anonymous"
          eventHandlers={{
            loading: () => setDidTileLayerLoad(false),
            load: () => setDidTileLayerLoad(true),
          }}
        />

        {selectedMunicipalityGeometry ? (
          <GeoJSON
            data={selectedMunicipalityGeometry}
            style={{
              color: '#3b82f6',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
            }}
            interactive={false}
          />
        ) : null}

        {orderedLineFeatures.map((lineFeature) => (
          <Polyline
            key={`${lineFeature.layerId}-${lineFeature.id}`}
            positions={lineFeature.latlngs}
            pathOptions={{
              color: lineFeature.style?.color || '#ea8b1f',
              weight: lineFeature.style?.width || 3,
              opacity: lineFeature.style?.opacity ?? 1,
              dashArray: getDashArray(lineFeature.style?.dashStyle),
            }}
            interactive={false}
          />
        ))}

        {orderedPolygonFeatures.map((polygonFeature) => (
          <Polygon
            key={`${polygonFeature.layerId}-${polygonFeature.id}`}
            positions={polygonFeature.latlngs}
            pathOptions={{
              color: polygonFeature.style?.strokeColor || '#2f7de1',
              stroke: (polygonFeature.style?.strokeWidth ?? 2) > 0,
              weight: polygonFeature.style?.strokeWidth ?? 2,
              opacity: polygonFeature.style?.strokeOpacity ?? 1,
              dashArray: getDashArray(polygonFeature.style?.dashStyle),
              fillColor: polygonFeature.style?.fillColor || '#2f7de1',
              fill: true,
              fillOpacity: polygonFeature.style?.fillOpacity ?? 0.18,
            }}
            interactive={false}
          />
        ))}

        {orderedPointFeatures.map((point) => (
          <CircleMarker
            key={`${point.layerId}-${point.id}`}
            center={point.coordinates}
            radius={Math.max(1, Number(point.style?.radius) || 7)}
            pathOptions={{
              color: point.style?.strokeColor || '#d4335b',
              weight: Number.isFinite(Number(point.style?.strokeWidth))
                ? Number(point.style.strokeWidth)
                : 2,
              opacity: Number.isFinite(Number(point.style?.strokeOpacity))
                ? Number(point.style.strokeOpacity)
                : 1,
              fillColor: point.style?.fillColor || '#d4335b',
              fillOpacity: Number.isFinite(Number(point.style?.fillOpacity))
                ? Number(point.style.fillOpacity)
                : 0.9,
            }}
            interactive={false}
          />
        ))}
      </MapContainer>
    </div>
  )
}

export default ExportMapSnapshot
