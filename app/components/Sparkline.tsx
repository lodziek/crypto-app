/**
 * Tendance 7 jours, une par ligne du tableau.
 *
 * Composant serveur pur : le tracé est calculé au rendu, aucun JavaScript n'est
 * envoyé au navigateur pour 250 lignes.
 */

// La série arrive déjà échantillonnée par la couche de données (voir
// SPARKLINE_POINTS dans lib/coingecko.ts) : ce composant ne fait que tracer.
const WIDTH = 96
const HEIGHT = 28
const PADDING = 2 // marge verticale, sinon les extrêmes sont rognés par le trait

// Amplitude minimale, en proportion du prix moyen.
//
// Sans ce plancher, la normalisation min/max étire n'importe quel écart sur
// toute la hauteur : un stablecoin qui varie de 0,05 % sur la semaine dessine
// une chute spectaculaire à côté d'un « 0.00% » en toute lettre. Le graphique
// contredit alors le chiffre de la même ligne. En dessous de 2 % d'amplitude
// réelle, on trace donc dans une fenêtre de 2 % : la courbe s'aplatit
// proportionnellement au lieu de mentir.
const MIN_SPAN_RATIO = 0.02

function toPath(values: number[]): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const mid = (min + max) / 2
  const usable = HEIGHT - PADDING * 2

  // La fenêtre est centrée sur la série et ne descend jamais sous le plancher,
  // ce qui évite aussi la division par zéro d'une série parfaitement plate.
  const span = Math.max(max - min, Math.abs(mid) * MIN_SPAN_RATIO)
  const floor = mid - span / 2

  return values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * WIDTH
      const ratio = span === 0 ? 0.5 : (value - floor) / span
      const y = PADDING + (1 - ratio) * usable
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

/**
 * `change` est la variation 7 j affichée dans la colonne voisine. La couleur en
 * dérive plutôt que de comparer le premier et le dernier point : les deux
 * sources se contrediraient tôt ou tard, et c'est le chiffre qui fait foi.
 */
export default function Sparkline({ values, change }: { values: number[]; change: number | null }) {
  // Moins de deux points ne fait pas une courbe : on réserve la place pour que
  // la colonne ne se décale pas d'une ligne à l'autre.
  if (values.length < 2) {
    return <div className="h-7 w-24" aria-hidden />
  }

  const tone = change === null || change === 0 ? 'text-muted' : change > 0 ? 'text-up' : 'text-down'

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      preserveAspectRatio="none"
      className={tone}
      /* La valeur chiffrée est déjà dans la colonne 7d de la même ligne :
         annoncer la courbe en plus ne ferait que doubler la lecture. */
      aria-hidden
    >
      <path
        d={toPath(values)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
