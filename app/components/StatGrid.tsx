import { formatCompact, formatPercent, formatPrice, formatSupply, trendClass } from '../lib/format'
import type { Coin } from '../lib/types'

/** Les chiffres de référence, ceux que le graphique ne montre pas. */
export default function StatGrid({ coin }: { coin: Coin }) {
  const stats: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Market cap', value: formatCompact(coin.marketCap) },
    { label: 'Volume 24h', value: formatCompact(coin.volume24h) },
    { label: 'Circulating supply', value: formatSupply(coin.circulatingSupply, coin.symbol) },
    { label: 'All-time high', value: formatPrice(coin.ath) },
    { label: '1h', value: formatPercent(coin.change.h1), tone: trendClass(coin.change.h1) },
    { label: '24h', value: formatPercent(coin.change.h24), tone: trendClass(coin.change.h24) },
    { label: '7d', value: formatPercent(coin.change.d7), tone: trendClass(coin.change.d7) },
    { label: '30d', value: formatPercent(coin.change.d30), tone: trendClass(coin.change.d30) },
    { label: '1y', value: formatPercent(coin.change.y1), tone: trendClass(coin.change.y1) },
  ]

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">{stat.label}</dt>
          <dd className={`tnum mt-0.5 text-sm ${stat.tone ?? ''}`}>{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
