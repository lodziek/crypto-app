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
