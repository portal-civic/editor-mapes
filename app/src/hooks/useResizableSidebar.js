import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'editor.sidebar.width'
const MIN_WIDTH = 300
const MAX_WIDTH = 720
const DEFAULT_WIDTH = 360
const COMPACT_THRESHOLD = 345

const PRESETS = { compact: 320, default: 360, work: 500 }

function clamp(v) {
  return Math.min(Math.max(v, MIN_WIDTH), MAX_WIDTH)
}

function readStored() {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY))
    if (v >= MIN_WIDTH && v <= MAX_WIDTH) return v
  } catch {}
  return DEFAULT_WIDTH
}

export function useResizableSidebar() {
  const [width, _setWidth] = useState(readStored)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startW: 0 })

  const persist = useCallback((w) => {
    try { localStorage.setItem(STORAGE_KEY, String(w)) } catch {}
  }, [])

  const setWidth = useCallback((w) => {
    const c = clamp(w)
    _setWidth(c)
    persist(c)
  }, [persist])

  const setPreset = useCallback((name) => {
    setWidth(PRESETS[name] ?? DEFAULT_WIDTH)
  }, [setWidth])

  const onHandleMouseDown = useCallback((e) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startW: width }
    setIsDragging(true)
  }, [width])

  useEffect(() => {
    if (!isDragging) return

    const onMove = (e) => {
      // drag left (smaller clientX) = panel grows
      const delta = dragRef.current.startX - e.clientX
      _setWidth(clamp(dragRef.current.startW + delta))
    }

    const onUp = (e) => {
      const delta = dragRef.current.startX - e.clientX
      const final = clamp(dragRef.current.startW + delta)
      _setWidth(final)
      persist(final)
      setIsDragging(false)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [isDragging, persist])

  return {
    width,
    isDragging,
    isCompact: width < COMPACT_THRESHOLD,
    isExpanded: width > 440,
    setWidth,
    setPreset,
    onHandleMouseDown,
  }
}
