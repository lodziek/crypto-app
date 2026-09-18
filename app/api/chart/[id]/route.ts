import { RANGES, isRangeKey } from '@/app/lib/binance'
import { CoinGeckoError, fetchMarketChart } from '@/app/lib/coingecko'
import { findCoin } from '@/app/lib/market'

/**
 * Repli graphique pour les coins sans paire Binance.
 *
 * Les coins appairés n'utilisent pas cette route : leur graphique vient
 * directement de Binance, qui ne demande ni clé ni proxy.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const range = new URL(request.url).searchParams.get('range') ?? '1M'

  if (!isRangeKey(range)) {
    return Response.json({ error: 'Unknown range.' }, { status: 400 })
  }

  try {
    // L'identifiant est vérifié présent dans le référentiel avant tout appel
    // sortant : sans ça, la route relaierait n'importe quel chemin vers CoinGecko.
    // L'appel est dans le try : il interroge lui-même CoinGecko et peut donc
    // échouer, ce qui ne veut pas dire que le coin est inconnu.
    const coin = await findCoin(id)
    if (!coin) {
      return Response.json({ error: 'Unknown coin.' }, { status: 404 })
    }

    const prices = await fetchMarketChart(coin.id, RANGES[range].days)
    return Response.json({ prices })
  } catch (error) {
    // Un quota atteint n'est pas une panne : le distinguer laisse au client et
    // aux intermédiaires la possibilité de réessayer plus tard plutôt que de
    // traiter la réponse comme une erreur définitive.
    const rateLimited = error instanceof CoinGeckoError && error.status === 429

    return Response.json(
      {
        error: rateLimited
          ? 'Rate limited by the market data provider. Try again shortly.'
          : 'Chart data unavailable.',
      },
      { status: rateLimited ? 429 : 502 },
    )
  }
}
