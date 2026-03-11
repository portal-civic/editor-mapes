import { useCallback } from 'react'
import { exportMapAsPNG } from '../modules/export'

export default function useMapExport() {
  const exportMapAsPNG_cb = useCallback(exportMapAsPNG, [])
  return { exportMapAsPNG: exportMapAsPNG_cb }
}
