import type { Coin } from '../lib/types'
import CoinRow from './CoinRow'

/** Colonnes masquées progressivement : le prix et la variation 24 h sont les
 *  deux seules qui survivent au format téléphone. */
const COLUMNS = [
  { label: '#', align: 'right', hide: '' },
  { label: 'Coin', align: 'left', hide: '' },
  { label: 'Price', align: 'right', hide: '' },
  { label: '1h', align: 'right', hide: 'hidden sm:table-cell' },
  { label: '24h', align: 'right', hide: '' },
  { label: '7d', align: 'right', hide: 'hidden md:table-cell' },
  { label: 'Volume 24h', align: 'right', hide: 'hidden lg:table-cell' },
  { label: 'Market cap', align: 'right', hide: 'hidden md:table-cell' },
  { label: 'Last 7d', align: 'left', hide: 'hidden lg:table-cell' },
] as const

export default function MarketTable({ coins }: { coins: Coin[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Cryptocurrencies ranked by market capitalization, with price and recent change.
        </caption>
        <thead>
          <tr className="border-b border-rule text-xs uppercase tracking-wide text-muted">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                scope="col"
                className={`py-2 pr-4 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.hide} ${col.label === '#' ? 'pl-4' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <CoinRow key={coin.id} coin={coin} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
