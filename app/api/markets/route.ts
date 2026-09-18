import { fetchMarkets, CoinGeckoError } from '@/app/lib/coingecko'

/**
 * Référentiel pour le client.
 *
 * La page rend déjà la liste côté serveur ; cette route sert les
 * rafraîchissements de ce que le flux temps réel ne fournit pas — rang,
 * capitalisation, sparkline. Dans les deux cas la clé reste sur le serveur.
 *
 * Le handler n'est pas mis en cache lui-même : c'est le `revalidate` posé sur le
 * `fetch` en amont qui garantit au plus un appel CoinGecko par minute, quel que
 * soit le nombre de visiteurs.
 */
export async function GET() {
  try {
    const coins = await fetchMarkets()
    return Response.json({ coins, at: Date.now() })
  } catch (error) {
    const status = error instanceof CoinGeckoError && error.status === 429 ? 429 : 502
    const message =
      status === 429
        ? 'Rate limited by the market data provider. Try again shortly.'
        : 'Market data is temporarily unavailable.'

    return Response.json({ error: message }, { status })
  }
}
