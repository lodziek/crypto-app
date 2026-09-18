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

/**
 * Un coin tel que CoinGecko le renvoie, avant appairage Binance. Ce type n'est
 * manipulé qu'entre `fetchMarkets` et `resolvePairs` : partout ailleurs on
 * attend un `Coin`, ce qui rend l'étape d'appairage impossible à oublier.
 */
export type CoinBase = {
  id: string // 'bitcoin' — clé de routage et identifiant CoinGecko
  symbol: string // 'btc'
  name: string
  image: string
  /**
   * `null` quand CoinGecko ne classe pas le coin — le champ l'est pour 28 des
   * 750 coins des rangs 251-1000. Le coercer à 0 l'afficherait « 0 » et le
   * trierait avant Bitcoin, la même erreur que renvoyer 0 pour une variation
   * absente.
   */
  rank: number | null
  price: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  ath: number
  athDate: string
  change: PriceChange
  sparkline: number[] // échantillonnée à 40 points par la couche de données
}

export type Coin = CoinBase & {
  /**
   * Paire Binance correspondante, ou `null` quand le coin n'y est pas coté.
   * Renseignée par `resolvePairs` (lib/symbols.ts), pas par CoinGecko.
   */
  pair: string | null
}
