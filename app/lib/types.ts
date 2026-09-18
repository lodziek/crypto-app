/**
 * Formes de données de l'app. Deux types distincts, qui ne se mélangent jamais :
 * `Coin` est le référentiel (CoinGecko, serveur, rafraîchi toutes les 60 s),
 * `Tick` sera le temps réel (Binance, client, jamais persisté).
 */

/** Variations en pourcentage. `null` quand l'historique n'existe pas. */
export type PriceChange = {
  h1: number | null
  h24: number | null
  d7: number | null
  d30: number | null
  y1: number | null
}

export type Coin = {
  id: string // 'bitcoin' — clé de routage et identifiant CoinGecko
  symbol: string // 'btc'
  name: string
  image: string
  rank: number
  price: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  ath: number
  athDate: string
  change: PriceChange
  sparkline: number[] // 168 points, un par heure sur 7 jours
}
