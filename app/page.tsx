import { pageMetadata } from './lib/site'

export const metadata = pageMetadata({ title: 'Market', path: '/' })

export default function MarketPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-mono text-2xl font-semibold tracking-tight">Crypto Console</h1>
      <p className="mt-2 text-muted">Socle en place — le référentiel arrive au lot 2.</p>
    </main>
  )
}
