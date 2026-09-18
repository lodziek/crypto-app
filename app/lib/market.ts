/**
 * Composition des deux sources. **Serveur uniquement.**
 *
 * C'est le seul endroit où CoinGecko et Binance se rencontrent, et le seul qui
 * produise des `Coin` appairés.
 */
import { fetchUsdtPrices } from './binance'
import { fetchMarkets } from './coingecko'
import { resolvePairs, type PairResolution } from './symbols'
import type { Coin } from './types'

export async function fetchMarket(): Promise<PairResolution> {
  // Les deux appels sont indépendants : les enchaîner doublerait la latence.
  const [coins, prices] = await Promise.all([
    fetchMarkets(),
    // Binance n'est qu'une couche d'enrichissement. Si elle tombe, le marché
    // s'affiche avec les prix CoinGecko et sans temps réel — c'est exactement la
    // dégradation qu'on veut, et surtout pas une page en erreur. Une panne
    // CoinGecko, elle, remonte : sans référentiel il n'y a rien à montrer.
    fetchUsdtPrices().catch(() => new Map<string, number>()),
  ])

  return resolvePairs(coins, prices)
}

/**
 * Recherche d'un coin par identifiant, dans le référentiel déjà en cache.
 *
 * C'est aussi le garde-fou SSRF des routes dynamiques : un identifiant qui n'est
 * pas dans le top 250 ne part jamais vers une API tierce. Valider la forme de la
 * chaîne ne suffirait pas — `bitcoin` et `../../admin` passent le même filtre de
 * caractères, seule l'appartenance à une liste connue tranche.
 */
export async function findCoin(id: string): Promise<Coin | null> {
  // Ce filtre n'est qu'un court-circuit bon marché : c'est l'appartenance au
  // référentiel, plus bas, qui ferme réellement la surface SSRF. La borne est
  // donc large — les identifiants de fonds tokenisés frôlent déjà 60 caractères
  // (« superstate-short-duration-us-government-securities-fund-ustb »), et un
  // plafond trop serré rendrait injoignable la page d'un coin parfaitement légitime.
  if (!/^[a-z0-9][a-z0-9-]{0,127}$/.test(id)) return null

  const { coins } = await fetchMarket()
  return coins.find((c) => c.id === id) ?? null
}
