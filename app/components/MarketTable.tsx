'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import type { Coin } from '../lib/types'
import CoinRow from './CoinRow'
import EmptyState from './states/EmptyState'

type SortKey = 'rank' | 'name' | 'price' | 'h1' | 'h24' | 'd7' | 'volume24h' | 'marketCap'

type Column = {
  key: SortKey
  label: string
  align: 'left' | 'right'
  hide: string
}

const COLUMNS: Column[] = [
  { key: 'rank', label: '#', align: 'right', hide: '' },
  { key: 'name', label: 'Coin', align: 'left', hide: '' },
  { key: 'price', label: 'Price', align: 'right', hide: '' },
  { key: 'h1', label: '1h', align: 'right', hide: 'hidden sm:table-cell' },
  { key: 'h24', label: '24h', align: 'right', hide: '' },
  { key: 'd7', label: '7d', align: 'right', hide: 'hidden md:table-cell' },
  { key: 'volume24h', label: 'Volume 24h', align: 'right', hide: 'hidden lg:table-cell' },
  { key: 'marketCap', label: 'Market cap', align: 'right', hide: 'hidden md:table-cell' },
]

function valueOf(coin: Coin, key: SortKey): number | string | null {
  switch (key) {
    case 'name':
      return coin.name.toLowerCase()
    case 'h1':
      return coin.change.h1
    case 'h24':
      return coin.change.h24
    case 'd7':
      return coin.change.d7
    default:
      return coin[key]
  }
}

function compare(a: Coin, b: Coin, key: SortKey, ascending: boolean): number {
  const left = valueOf(a, key)
  const right = valueOf(b, key)

  // Les valeurs absentes finissent toujours en bas, quel que soit le sens : une
  // variation inconnue n'est ni la plus forte ni la plus faible.
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1

  const order = typeof left === 'string' ? left.localeCompare(right as string) : left - (right as number)
  return ascending ? order : -order
}

export default function MarketTable({ coins }: { coins: Coin[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({
    key: 'rank',
    ascending: true,
  })

  // Le filtrage de 250 lignes reste fluide, mais le différer laisse la frappe
  // prioritaire : le champ ne bégaie pas sur un appareil lent.
  const deferredQuery = useDeferredValue(query)

  const visible = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()

    const filtered = needle
      ? coins.filter(
          (c) => c.name.toLowerCase().includes(needle) || c.symbol.toLowerCase().includes(needle),
        )
      : coins

    /*
     * Le tri s'appuie sur les valeurs de référence, pas sur les prix en direct.
     *
     * C'est délibéré : trier sur une valeur qui tique replacerait les lignes
     * plusieurs fois par seconde, et viserait une ligne deviendrait impossible.
     * L'ordre ne bouge donc qu'à la revalidation, toutes les 60 secondes.
     */
    return [...filtered].sort((a, b) => compare(a, b, sort.key, sort.ascending))
  }, [coins, deferredQuery, sort])

  const toggleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, ascending: !current.ascending }
        : // Un rang se lit du plus petit au plus grand, une grandeur du plus
          // grand au plus petit : c'est ce que le lecteur attend au premier clic.
          { key, ascending: key === 'rank' || key === 'name' },
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="market-search" className="sr-only">
          Search by name or symbol
        </label>
        <input
          id="market-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or symbol…"
          className="w-full max-w-xs rounded border border-rule bg-surface px-3 py-1.5 text-sm placeholder:text-muted focus:border-accent"
        />
        <p aria-live="polite" className="font-mono text-xs text-muted">
          {visible.length} / {coins.length}
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState query={deferredQuery.trim()} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Cryptocurrencies ranked by market capitalization, with price and recent change. Rows
              traded on Binance update in real time and are marked with a dot next to the price.
            </caption>
            <thead>
              <tr className="border-b border-rule text-xs uppercase tracking-wide text-muted">
                {COLUMNS.map((col) => {
                  const active = sort.key === col.key

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? (sort.ascending ? 'ascending' : 'descending') : 'none'}
                      className={`py-2 pr-4 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.hide} ${col.key === 'rank' ? 'pl-4' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 uppercase transition-colors hover:text-ink ${active ? 'text-ink' : ''}`}
                      >
                        {col.label}
                        <span aria-hidden className={active ? 'opacity-100' : 'opacity-0'}>
                          {sort.ascending ? '↑' : '↓'}
                        </span>
                      </button>
                    </th>
                  )
                })}
                <th scope="col" className="hidden py-2 pr-4 text-left font-medium lg:table-cell">
                  Last 7d
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((coin) => (
                <CoinRow key={coin.id} coin={coin} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
