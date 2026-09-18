/**
 * Indice Fear & Greed (alternative.me). Sans clé, sans compte.
 *
 * Appelé côté serveur : le navigateur n'a donc pas à joindre cette origine, ce
 * qui évite d'ouvrir une entrée de plus dans la CSP.
 */
export type FearGreed = {
  value: number
  label: string
}

export async function fetchFearGreed(): Promise<FearGreed | null> {
  try {
    // L'indice est recalculé une fois par jour : une heure de cache suffit
    // largement, et c'est autant d'appels épargnés.
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null

    const body = (await res.json()) as { data?: Array<{ value?: unknown; value_classification?: unknown }> }
    const entry = body.data?.[0]
    const value = Number(entry?.value)

    if (!Number.isFinite(value)) return null

    return {
      value,
      label: typeof entry?.value_classification === 'string' ? entry.value_classification : '—',
    }
  } catch {
    // Widget d'appoint : son absence ne justifie pas de faire échouer la page.
    return null
  }
}
