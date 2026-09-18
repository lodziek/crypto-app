import Link from 'next/link'
import { SITE_NAME } from '../lib/site'

export default function Header() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-baseline gap-3 px-4 py-5">
        <Link href="/" className="font-mono text-lg font-semibold tracking-tight">
          Crypto<span className="text-accent">Console</span>
        </Link>
        <span className="sr-only">{SITE_NAME}</span>
        <p className="text-xs text-muted">Top 250 by market cap</p>
      </div>
    </header>
  )
}
