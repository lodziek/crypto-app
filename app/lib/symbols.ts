/**
 * Appairage CoinGecko → Binance.
 *
 * Binance ne couvre que 56 % des coins volatils du top 250 : elle ne liste pas
 * les jetons de ses concurrentes (LEO, OKB, CRO, WBT), ni la plupart des actifs
 * tokenisés. Une ligne sans paire est donc le régime normal de près de la
 * moitié du tableau, pas une anomalie à signaler à l'utilisateur.
 */
import { QUOTE_ASSET } from './binance'
import type { Coin, CoinBase } from './types'

/**
 * Écart maximal toléré entre le prix Binance et le prix de référence CoinGecko.
 *
 * L'appairage se fait sur le symbole, et rien ne garantit que le jeton « SOL »
 * de Binance soit celui de CoinGecko : deux projets peuvent partager un ticker.
 * Un mauvais appairage afficherait un prix faux sans que rien n'ait l'air cassé,
 * ce qui est bien pire qu'une ligne qui ne bouge pas. Au-delà de 5 % d'écart, on
 * refuse la paire.
 *
 * La marge absorbe aussi le décalage USDT/USD, de l'ordre de 0,1 %.
 */
const MAX_DEVIATION = 0.05

/**
 * Appairages forcés, par identifiant CoinGecko.
 *
 * `null` interdit explicitement une paire que la déduction par symbole
 * trouverait à tort. Table vide volontairement : le garde-fou d'écart suffit
 * aujourd'hui, et il a l'avantage d'être réversible. Un `null` figé sur monero,
 * par exemple, continuerait de bloquer la paire le jour où Binance la relisterait
 * correctement.
 *
 * Ce que le garde-fou attrape en pratique, observé sur le top 250 :
 *
 *   monero           XMRUSDT   560 $ contre 118 $ — paire délistée, prix figé
 *   lighter          LITUSDT   4,90 $ contre 0,74 $ — LIT chez Binance, c'est Litentry
 *   artificial-inu-3 AIUSDT    — AI chez Binance, c'est Sleepless AI
 *   frax             FRAXUSDT  0,99 $ contre 0,28 $ — actif différent, même ticker
 *
 * Cette table reste là pour ce que l'écart de prix ne peut pas voir : deux
 * projets partageant un ticker *et* un ordre de grandeur de prix.
 */
const OVERRIDES: Record<string, string | null> = {}

export type PairResolution = {
  /** Coins enrichis de leur paire Binance, `null` quand il n'y en a pas. */
  coins: Coin[]
  /** Comptes de contrôle, consommés par les tests et la page de diagnostic. */
  stats: {
    total: number
    paired: number
    unlisted: number
    rejected: Array<{ id: string; pair: string; deviation: number }>
  }
}

function candidateFor(coin: CoinBase): string | null {
  if (coin.id in OVERRIDES) return OVERRIDES[coin.id]
  if (!coin.symbol) return null

  return `${coin.symbol.toUpperCase()}${QUOTE_ASSET}`
}

export function resolvePairs(coins: CoinBase[], prices: Map<string, number>): PairResolution {
  const rejected: PairResolution['stats']['rejected'] = []
  let paired = 0
  let unlisted = 0

  const resolved = coins.map((coin) => {
    const candidate = candidateFor(coin)
    const binancePrice = candidate ? prices.get(candidate) : undefined

    if (!candidate || binancePrice === undefined) {
      unlisted++
      return { ...coin, pair: null }
    }

    const deviation = Math.abs(binancePrice - coin.price) / coin.price

    if (deviation > MAX_DEVIATION) {
      rejected.push({ id: coin.id, pair: candidate, deviation })
      return { ...coin, pair: null }
    }

    paired++
    return { ...coin, pair: candidate }
  })

  return {
    coins: resolved,
    stats: { total: coins.length, paired, unlisted, rejected },
  }
}
