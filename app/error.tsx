'use client'

/**
 * Filet de sécurité pour ce que les `catch` ciblés n'attrapent pas. Les pannes
 * d'API sont déjà traitées dans la page ; ceci couvre le reste, pour qu'aucun
 * chemin ne mène à une page blanche.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="font-mono text-sm font-semibold text-down">Something broke</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        The page failed to render. This is usually temporary.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded border border-rule px-3 py-2 font-mono text-xs hover:bg-raised"
      >
        Try again
      </button>
    </main>
  )
}
