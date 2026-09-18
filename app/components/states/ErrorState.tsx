/**
 * Panne visible. L'ancienne version affichait une page vide quand l'API
 * échouait, ce qui rendait la panne indistinguable d'un marché sans données.
 */
export default function ErrorState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div
      role="alert"
      className="rounded border border-down/40 bg-down/5 px-4 py-6 text-center"
    >
      <p className="font-mono text-sm font-semibold text-down">{title}</p>
      {detail ? <p className="mt-2 text-sm text-muted">{detail}</p> : null}
    </div>
  )
}
