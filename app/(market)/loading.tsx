import Header from '../components/Header'

/**
 * Ce fichier vit dans le groupe (market) et non à la racine, volontairement.
 *
 * Un loading.tsx racine place toutes les routes derrière une frontière Suspense :
 * la réponse se met à streamer, l'en-tête HTTP 200 part avant le rendu, et un
 * notFound() levé ensuite ne peut plus changer le statut. /coin/inexistant
 * répondait ainsi 200 avec le contenu « Coin not tracked » — un soft 404,
 * indexable par les moteurs. Le groupe confine le squelette à la page marché,
 * la seule qu'il concerne.
 *
 * Squelette affiché pendant la revalidation. Les largeurs varient pour éviter
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
