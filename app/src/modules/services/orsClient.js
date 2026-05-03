const ORS_BASE = 'https://api.openrouteservice.org/v2/isochrones'

export function getORSKey() {
  try { return localStorage.getItem('ors_api_key') ?? '' } catch { return '' }
}

export function setORSKey(key) {
  try {
    const trimmed = key?.trim() ?? ''
    if (trimmed) localStorage.setItem('ors_api_key', trimmed)
    else localStorage.removeItem('ors_api_key')
  } catch { /* storage not available */ }
}

export async function fetchIsochrone({ lng, lat, profile, seconds }) {
  const key = getORSKey()
  if (!key) throw Object.assign(new Error('NO_API_KEY'), { code: 'NO_API_KEY' })

  let res
  try {
    res = await fetch(`${ORS_BASE}/${profile}`, {
      method: 'POST',
      headers: { Authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: [[lng, lat]], range: [seconds] }),
    })
  } catch {
    throw Object.assign(new Error('NETWORK_ERROR'), { code: 'NETWORK_ERROR' })
  }

  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error('API_KEY_INVALID'), { code: 'API_KEY_INVALID' })
  }
  if (!res.ok) {
    throw Object.assign(new Error('API_ERROR'), { code: 'API_ERROR', status: res.status })
  }

  const data = await res.json()
  if (!Array.isArray(data?.features) || data.features.length === 0) {
    throw Object.assign(new Error('NO_DATA'), { code: 'NO_DATA' })
  }
  return data
}
