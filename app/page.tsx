import FearGreed from './components/FearGreed'
import Header from './components/Header'
import MarketTable from './components/MarketTable'
import ErrorState from './components/states/ErrorState'
import { CoinGeckoError } from './lib/coingecko'
import { fetchFearGreed } from './lib/fearGreed'
import { fetchMarket } from './lib/market'
import { pageMetadata } from './lib/site'

export const metadata = pageMetadata({ title: 'Market', path: '/' })

// Le `revalidate` du fetch suffirait, mais l'afficher au niveau de la page rend
// la fraîcheur lisible sans ouvrir la couche de données.
export const revalidate = 60

export default async function MarketPage() {
  let coins
  let failure: string | null = null

  // L'indice ne conditionne rien : il part en parallèle du marché et s'efface
  // seul s'il échoue (fetchFearGreed renvoie null plutôt que de lever).
  const indexPromise = fetchFearGreed()

  try {
    coins = (await fetchMarket()).coins
  } catch (error) {
    failure =
      error instanceof CoinGeckoError && error.status === 429
        ? 'Rate limited by the market data provider — this usually clears within a minute.'
        : 'Could not reach the market data provider.'
  }

  const index = await indexPromise

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-mono text-xs uppercase tracking-wide text-muted">Market</h1>
          <FearGreed index={index} />
        </div>

        {failure ? (
          <ErrorState title="Market data unavailable" detail={failure} />
        ) : (
          <MarketTable coins={coins ?? []} />
        )}
      </main>
    </>
  )
}
