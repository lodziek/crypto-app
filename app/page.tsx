import Header from './components/Header'
import MarketTable from './components/MarketTable'
import ErrorState from './components/states/ErrorState'
import { CoinGeckoError, fetchMarkets } from './lib/coingecko'
import { pageMetadata } from './lib/site'

export const metadata = pageMetadata({ title: 'Market', path: '/' })

// Le `revalidate` du fetch suffirait, mais l'afficher au niveau de la page rend
// la fraîcheur lisible sans ouvrir la couche de données.
export const revalidate = 60

export default async function MarketPage() {
  let coins
  let failure: string | null = null

  try {
    coins = await fetchMarkets()
  } catch (error) {
    failure =
      error instanceof CoinGeckoError && error.status === 429
        ? 'Rate limited by the market data provider — this usually clears within a minute.'
        : 'Could not reach the market data provider.'
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {failure ? (
          <ErrorState title="Market data unavailable" detail={failure} />
        ) : (
          <MarketTable coins={coins ?? []} />
        )}
      </main>
    </>
  )
}
