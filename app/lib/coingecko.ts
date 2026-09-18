/**
 * Accès CoinGecko. **Serveur uniquement** : ce module lit la clé API, il ne doit
 * jamais être importé depuis un composant client.
 */
import type { CoinBase, PriceChange } from './types'

// Le plan Demo impose api.coingecko.com et l'en-tête `x-cg-demo-api-key`.
// pro-api.coingecko.com est réservé aux abonnements payants et répond 401 à une
// clé Demo : c'était précisément le bug qui vidait la page détail de l'ancienne
// version. Ne pas « corriger » cette constante vers pro-api sans un abonnement.
const BASE = 'https://api.coingecko.com/api/v3'

// Une minute de fraîcheur suffit pour de la capitalisation et du rang, et tient
// largement dans le quota Demo (30 appels/min) quel que soit le trafic : le
// cache de données Next mutualise l'appel entre tous les visiteurs.
const REVALIDATE = 60

export const MARKETS_COUNT = 250

/**
 * CoinGecko renvoie 168 points de sparkline par coin (un par heure sur 7 jours).
 * Conservés tels quels, les 250 séries pèsent près d'un mégaoctet, transporté
 * deux fois : dans le HTML rendu et dans le payload RSC qui le réhydrate. À la
 * largeur où la courbe s'affiche (96 px), trois points sur quatre tombent sur le
 * même pixel. On échantillonne donc ici, une fois, plutôt qu'au rendu.
 */
const SPARKLINE_POINTS = 40

function downsample(values: number[], target: number): number[] {
  if (values.length <= target) return values

  const step = (values.length - 1) / (target - 1)
  return Array.from({ length: target }, (_, i) => values[Math.round(i * step)])
}

/** Sans clé l'API répond quand même, mais sur le quota public partagé par IP. */
function authHeaders(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY
  return key ? { 'x-cg-demo-api-key': key } : {}
}

export class CoinGeckoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'CoinGeckoError'
  }
}

async function request<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: REVALIDATE },
  })

  if (!res.ok) {
    // 429 est le cas courant sans clé : on le distingue pour que l'interface
    // puisse dire « quota atteint » plutôt qu'« erreur ».
    throw new CoinGeckoError(`CoinGecko ${res.status} sur ${path}`, res.status)
  }

  return res.json() as Promise<T>
}

/** `null` plutôt que 0 : un zéro afficherait « 0,00 % » là où la donnée manque. */
function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

type RawMarket = Record<string, unknown> & {
  sparkline_in_7d?: { price?: unknown }
}

function toCoin(raw: RawMarket): CoinBase | null {
  const id = typeof raw.id === 'string' ? raw.id : null
  const price = num(raw.current_price)
  // Un coin sans identifiant ou sans prix n'est pas affichable : on l'écarte
  // plutôt que de laisser des `undefined` filtrer jusqu'au rendu.
  if (!id || price === null) return null

  const change: PriceChange = {
    h1: num(raw.price_change_percentage_1h_in_currency),
    h24: num(raw.price_change_percentage_24h_in_currency),
    d7: num(raw.price_change_percentage_7d_in_currency),
    d30: num(raw.price_change_percentage_30d_in_currency),
    y1: num(raw.price_change_percentage_1y_in_currency),
  }

  const spark = raw.sparkline_in_7d?.price
  const points = Array.isArray(spark) ? spark.filter((p): p is number => typeof p === 'number') : []
  const sparkline = downsample(points, SPARKLINE_POINTS)

  return {
    id,
    symbol: typeof raw.symbol === 'string' ? raw.symbol : '',
    name: typeof raw.name === 'string' ? raw.name : id,
    image: typeof raw.image === 'string' ? raw.image : '',
    rank: num(raw.market_cap_rank) ?? 0,
    price,
    marketCap: num(raw.market_cap) ?? 0,
    volume24h: num(raw.total_volume) ?? 0,
    circulatingSupply: num(raw.circulating_supply) ?? 0,
    ath: num(raw.ath) ?? 0,
    athDate: typeof raw.ath_date === 'string' ? raw.ath_date : '',
    change,
    sparkline,
  }
}

/**
 * Le référentiel complet en un seul appel. Les paramètres comptent : sans
 * `sparkline` ni `price_change_percentage`, CoinGecko renvoie une réponse amputée
 * et il faut un second appel par coin — l'erreur de conception de l'ancienne app.
 */
export async function fetchMarkets(): Promise<CoinBase[]> {
  const raw = await request<RawMarket[]>('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: String(MARKETS_COUNT),
    page: '1',
    sparkline: 'true',
    price_change_percentage: '1h,24h,7d,30d,1y',
  })

  return raw.map(toCoin).filter((c): c is CoinBase => c !== null)
}
