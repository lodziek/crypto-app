/**
 * Composition des deux sources. **Serveur uniquement.**
 *
 * C'est le seul endroit où CoinGecko et Binance se rencontrent, et le seul qui
 * produise des `Coin` appairés.
 */
import { fetchUsdtPrices } from './binance'
import { fetchMarkets } from './coingecko'
import { resolvePairs, type PairResolution } from './symbols'

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
