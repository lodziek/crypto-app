'use client'

import { formatPercent, trendClass } from '../lib/format'
import { useTick } from '../lib/useTick'

/**
 * Variation sur 24 h. Suit le même tick que le prix de la ligne : les deux
 * valeurs viennent du même message et ne peuvent donc pas se contredire.
 */
export default function LiveChange({
  pair,
  change,
}: {
  pair: string | null
  change: number | null
}) {
  const tick = useTick(pair)
  const current = tick?.changePct ?? change

  return <span className={trendClass(current)}>{formatPercent(current)}</span>
}
