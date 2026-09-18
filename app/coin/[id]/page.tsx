import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '../../components/Header'
import LiveChange from '../../components/LiveChange'
import LivePrice from '../../components/LivePrice'
import PriceChart, { type Series } from '../../components/PriceChart'
import StatGrid from '../../components/StatGrid'
import { RANGES, fetchKlines, type RangeKey } from '../../lib/binance'
import { fetchCoinDetail, fetchMarketChart } from '../../lib/coingecko'
import { findCoin } from '../../lib/market'
import { pageMetadata } from '../../lib/site'

export const revalidate = 60

const DEFAULT_RANGE: RangeKey = '1M'

type Params = { params: Promise<{ id: string }> }

/**
 * Métadonnées par coin : c'est ce qui rend le lien réellement partageable.
 * L'ancienne version renvoyait un 404 sur /coin/bitcoin, faute de rendu serveur.
 */
export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const coin = await findCoin(id)

  if (!coin) return pageMetadata({ title: 'Coin not tracked', path: `/coin/${id}` })

  return pageMetadata({
    title: `${coin.name} (${coin.symbol.toUpperCase()})`,
    description: `${coin.name} price, market capitalization and trading data. Ranked #${coin.rank} by market cap.`,
    path: `/coin/${coin.id}`,
  })
}

/** Le graphique initial est rendu côté serveur pour éviter un cadre vide au chargement. */
async function initialSeries(pair: string | null, id: string): Promise<Series> {
  if (pair) {
    try {
      return { kind: 'candles', data: await fetchKlines(pair, DEFAULT_RANGE) }
    } catch {
      // Binance indisponible : on retombe sur la courbe CoinGecko plutôt que de
      // présenter un graphique en erreur.
    }
  }

  try {
    return { kind: 'line', data: await fetchMarketChart(id, RANGES[DEFAULT_RANGE].days) }
  } catch {
    return { kind: 'line', data: [] }
  }
}

export default async function CoinPage({ params }: Params) {
  const { id } = await params
  const coin = await findCoin(id)

  if (!coin) notFound()

  const [detail, series] = await Promise.all([
    fetchCoinDetail(coin.id).catch(() => ({ description: '', homepage: null })),
    initialSeries(coin.pair, coin.id),
  ])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/" className="font-mono text-xs text-muted hover:text-ink">
          ← Market
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {coin.image ? (
            <Image src={coin.image} alt="" width={40} height={40} unoptimized />
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{coin.name}</h1>
          <span className="font-mono text-sm uppercase text-muted">{coin.symbol}</span>
          <span className="rounded border border-rule px-2 py-0.5 font-mono text-[11px] text-muted">
            Rank #{coin.rank}
          </span>
          {coin.pair ? null : (
            <span className="rounded border border-rule px-2 py-0.5 font-mono text-[11px] text-muted">
              Not on Binance — reference price
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-4">
          <p className="tnum text-3xl font-semibold">
            <LivePrice pair={coin.pair} price={coin.price} />
          </p>
          <p className="tnum text-sm">
            <LiveChange pair={coin.pair} change={coin.change.h24} />
            <span className="ml-1 text-muted">24h</span>
          </p>
        </div>

        <section className="mt-8 rounded border border-rule bg-surface/40 p-4">
          <h2 className="sr-only">Price chart</h2>
          <PriceChart
            pair={coin.pair}
            coinId={coin.id}
            initialRange={DEFAULT_RANGE}
            initialSeries={series}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wide text-muted">Statistics</h2>
          <StatGrid coin={coin} />
        </section>

        {detail.description ? (
          <section className="mt-10 max-w-3xl">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-muted">
              About {coin.name}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {detail.description}
            </p>
            {detail.homepage ? (
              <a
                href={detail.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-mono text-xs text-accent hover:underline"
              >
                {detail.homepage} ↗
              </a>
            ) : null}
          </section>
        ) : null}
      </main>
    </>
  )
}
