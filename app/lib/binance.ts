/**
 * Accès REST à Binance. Aucune clé, aucun compte.
 *
 * Attention à l'hôte : `data-stream.binance.vision` est réservé au flux
 * WebSocket (voir lib/stream.ts), le REST passe par `api.binance.com`.
 */

const BASE = 'https://api.binance.com/api/v3'

// Les paires apparaissent et disparaissent au rythme des listings, soit
// rarement. Mais ce même appel sert de référence de prix au garde-fou
// d'appairage, qui n'a d'intérêt qu'avec des prix frais : on aligne donc sa
// fraîcheur sur celle du référentiel plutôt que de la pousser à 24 h.
const REVALIDATE = 60

export const QUOTE_ASSET = 'USDT'

type RawPrice = { symbol?: unknown; price?: unknown }

/**
 * Toutes les paires cotées en USDT et leur dernier prix.
 *
 * `ticker/price` pèse 157 Ko et rend les deux services d'un coup ; `exchangeInfo`
 * donnerait la même liste pour 6,9 Mo et sans les prix.
 */
export async function fetchUsdtPrices(): Promise<Map<string, number>> {
  const res = await fetch(`${BASE}/ticker/price`, { next: { revalidate: REVALIDATE } })

  if (!res.ok) {
    throw new Error(`Binance ${res.status} sur /ticker/price`)
  }

  const raw = (await res.json()) as RawPrice[]
  const prices = new Map<string, number>()

  for (const entry of raw) {
    if (typeof entry.symbol !== 'string' || !entry.symbol.endsWith(QUOTE_ASSET)) continue

    const price = Number(entry.price)
    if (Number.isFinite(price) && price > 0) prices.set(entry.symbol, price)
  }

  return prices
}

export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

/**
 * Plages proposées sur la page détail.
 *
 * `binance` et `days` décrivent la même fenêtre pour les deux sources : les
 * coins appairés reçoivent de vraies bougies, les autres une courbe CoinGecko
 * couvrant la même période, pour que passer d'un coin à l'autre ne change pas
 * l'échelle de temps sous les yeux du lecteur.
 */
export const RANGES = {
  '7D': { binance: '1h', limit: 168, days: 7 },
  '1M': { binance: '4h', limit: 180, days: 30 },
  '6M': { binance: '1d', limit: 180, days: 180 },
} as const

export type RangeKey = keyof typeof RANGES

export function isRangeKey(value: string): value is RangeKey {
  return value in RANGES
}

/** Une entrée de klines est un tableau positionnel : [ouverture, O, H, L, C, …]. */
type RawKline = unknown[]

export async function fetchKlines(pair: string, range: RangeKey): Promise<Candle[]> {
  const { binance, limit } = RANGES[range]
  const url = `${BASE}/klines?symbol=${encodeURIComponent(pair)}&interval=${binance}&limit=${limit}`

  const res = await fetch(url, { next: { revalidate: REVALIDATE } })
  if (!res.ok) throw new Error(`Binance ${res.status} sur /klines`)

  const raw = (await res.json()) as RawKline[]

  return raw
    .map((k) => ({
      time: Number(k[0]),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
    }))
    .filter((c) => Object.values(c).every((v) => Number.isFinite(v)))
}
