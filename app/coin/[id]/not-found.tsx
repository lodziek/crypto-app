import Link from 'next/link'
import Header from '../../components/Header'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="font-mono text-sm text-muted">404</p>
        <h1 className="mt-2 text-xl font-semibold">Coin not tracked</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          This app follows the top 250 coins by market capitalization. Anything outside that list
          has no page here.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded border border-rule px-3 py-2 font-mono text-xs hover:bg-raised"
        >
          Back to market
        </Link>
      </main>
    </>
  )
}
