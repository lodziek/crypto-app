'use client'

import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../lib/format'
import { useTick } from '../lib/useTick'

type Flash = { id: number; direction: 'up' | 'down' | null }

/**
 * Prix d'une ligne, mis à jour en direct quand la paire existe chez Binance.
 *
 * Les 121 coins non cotés affichent simplement le prix de référence, sans
 * pastille ni animation : une ligne qui ne bouge pas est le régime normal de
 * près de la moitié du tableau, pas une erreur à signaler.
 */
export default function LivePrice({ pair, price }: { pair: string | null; price: number }) {
  const tick = useTick(pair)
  const current = tick?.price ?? price

  const previous = useRef(current)
  const [flash, setFlash] = useState<Flash>({ id: 0, direction: null })

  useEffect(() => {
    if (current === previous.current) return

    const direction = current > previous.current ? 'up' : 'down'
    previous.current = current
    // L'identifiant force le remontage du span : sans lui, deux hausses
    // consécutives ne rejoueraient pas l'animation, la classe ne changeant pas.
    setFlash((f) => ({ id: f.id + 1, direction }))
  }, [current])

  const animation =
    flash.direction === 'up'
      ? 'motion-safe:animate-flash-up'
      : flash.direction === 'down'
        ? 'motion-safe:animate-flash-down'
        : ''

  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      {tick ? (
        <span
          className="size-1.5 shrink-0 rounded-full bg-accent motion-safe:animate-pulse-dot"
          aria-hidden
        />
      ) : null}
      <span key={flash.id} className={`inline-block rounded px-1 ${animation}`}>
        {formatPrice(current)}
      </span>
    </span>
  )
}
