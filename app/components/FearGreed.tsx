import type { FearGreed as Index } from '../lib/fearGreed'

/**
 * Jauge d'un rapport à une échelle bornée : une barre, pas un graphique.
 *
 * La couleur ne porte jamais seule l'information — le chiffre et sa
 * qualification textuelle disent la même chose.
 */
export default function FearGreed({ index }: { index: Index | null }) {
  if (!index) return null

  // Échelle divergente : la peur et l'avidité sont deux extrêmes de part et
  // d'autre d'un centre neutre, pas deux degrés d'une même grandeur.
  const tone = index.value < 45 ? 'bg-down' : index.value > 55 ? 'bg-up' : 'bg-muted'

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Fear &amp; Greed</p>
        <p className="tnum text-sm">
          {index.value}
          <span className="ml-2 text-muted">{index.label}</span>
        </p>
      </div>
      <div
        className="h-1.5 w-24 overflow-hidden rounded-full bg-rule"
        role="meter"
        aria-valuenow={index.value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fear and Greed index: ${index.value}, ${index.label}`}
      >
        <div className={`h-full ${tone}`} style={{ width: `${index.value}%` }} />
      </div>
    </div>
  )
}
