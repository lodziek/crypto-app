export default function EmptyState({ query }: { query: string }) {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-muted">No coin matches “{query}”</p>
      <p className="mt-2 text-xs text-muted">
        This app tracks the top 250 by market capitalization.
      </p>
    </div>
  )
}
