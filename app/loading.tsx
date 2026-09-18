import Header from './components/Header'

/** Squelette affiché pendant la revalidation. Les largeurs varient pour éviter
 *  l'effet de peigne d'un bloc unique répété. */
const WIDTHS = ['w-32', 'w-24', 'w-28', 'w-36', 'w-24', 'w-32', 'w-28', 'w-24']

export default function Loading() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="skeleton mb-6 h-6 w-40 rounded" />
        <div className="space-y-2">
          {WIDTHS.map((width, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-rule/40 py-3">
              <div className="skeleton size-6 shrink-0 rounded-full" />
              <div className={`skeleton h-4 rounded ${width}`} />
              <div className="skeleton ml-auto h-4 w-20 rounded" />
            </div>
          ))}
        </div>
        <p className="sr-only" role="status">
          Loading market data…
        </p>
      </main>
    </>
  )
}
