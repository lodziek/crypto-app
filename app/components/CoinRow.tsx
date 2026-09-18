import Image from 'next/image'
import Link from 'next/link'
import type { Coin } from '../lib/types'
import { formatCompact, formatPercent, trendClass } from '../lib/format'
import LiveChange from './LiveChange'
import LivePrice from './LivePrice'
import Sparkline from './Sparkline'

export default function CoinRow({ coin }: { coin: Coin }) {
  return (
    <tr className="relative border-b border-rule/60 transition-colors hover:bg-raised">
      <td className="py-3 pl-4 pr-2 text-right text-xs text-muted tnum">{coin.rank}</td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          {coin.image ? (
            <Image src={coin.image} alt="" width={24} height={24} className="shrink-0" unoptimized />
          ) : (
            <div className="size-6 shrink-0 rounded-full bg-rule" />
          )}
          {/* Lien étiré : une seule cible par ligne pour le clavier et les
              lecteurs d'écran, mais toute la ligne reste cliquable. */}
          <Link
            href={`/coin/${coin.id}`}
            className="font-medium after:absolute after:inset-0 after:content-['']"
          >
            {coin.name}
          </Link>
          <span className="font-mono text-xs uppercase text-muted">{coin.symbol}</span>
        </div>
      </td>

      <td className="py-3 pr-4 text-right tnum">
        <LivePrice pair={coin.pair} price={coin.price} />
      </td>

      <td className={`hidden py-3 pr-4 text-right tnum sm:table-cell ${trendClass(coin.change.h1)}`}>
        {formatPercent(coin.change.h1)}
      </td>

      <td className="py-3 pr-4 text-right tnum">
        <LiveChange pair={coin.pair} change={coin.change.h24} />
      </td>

      <td className={`hidden py-3 pr-4 text-right tnum md:table-cell ${trendClass(coin.change.d7)}`}>
        {formatPercent(coin.change.d7)}
      </td>

      <td className="hidden py-3 pr-4 text-right tnum text-muted lg:table-cell">
        {formatCompact(coin.volume24h)}
      </td>

      <td className="hidden py-3 pr-4 text-right tnum md:table-cell">
        {formatCompact(coin.marketCap)}
      </td>

      <td className="hidden py-3 pr-4 lg:table-cell">
        <Sparkline values={coin.sparkline} change={coin.change.d7} />
      </td>
    </tr>
  )
}
