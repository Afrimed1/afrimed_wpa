/** Cache mémoire court pour lectures cliniques (dossier, consultations, listes). */

type CacheEntry<T> = { data: T; expiresAt: number }

const DEFAULT_TTL_MS = 60_000
const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): T {
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
  if (store.size > 120) {
    const now = Date.now()
    for (const [k, value] of store) {
      if (value.expiresAt <= now) store.delete(k)
    }
  }
  return data
}

export function cacheInvalidatePrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

export function cacheInvalidateKeys(...keys: string[]) {
  for (const key of keys) store.delete(key)
}

export function clearClinicalCache() {
  store.clear()
}

export const ClinicalCacheKeys = {
  patient: (id: string) => `patient:${id}`,
  consultation: (id: string, bootstrap = false) =>
    `consultation:${id}:${bootstrap ? 'boot' : 'plain'}`,
  consultations: (opts: string) => `consultations:${opts}`,
  patientsSearch: (opts: string) => `patients:${opts}`,
  doctorDashboard: () => 'doctor-dashboard',
}
