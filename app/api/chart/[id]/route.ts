import { RANGES, isRangeKey } from '@/app/lib/binance'
import { fetchMarketChart } from '@/app/lib/coingecko'
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

  // L'identifiant est vérifié présent dans le référentiel avant tout appel
  // sortant : sans ça, la route relaierait n'importe quel chemin vers CoinGecko.
  const coin = await findCoin(id)
  if (!coin) {
    return Response.json({ error: 'Unknown coin.' }, { status: 404 })
  }

  try {
    const prices = await fetchMarketChart(coin.id, RANGES[range].days)
    return Response.json({ prices })
  } catch {
    return Response.json({ error: 'Chart data unavailable.' }, { status: 502 })
  }
}
