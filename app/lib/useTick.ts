'use client'

import { useEffect, useState } from 'react'
import { subscribe, type Tick } from './stream'

/**
 * Dernier tick reçu pour une paire, ou `null` tant qu'il n'y en a pas.
 *
 * L'état part volontairement à `null` : le premier rendu client doit être
 * identique au HTML du serveur, sinon l'hydratation échoue. La valeur de repli
 * (le prix CoinGecko) reste donc affichée jusqu'au premier tick.
 */
export function useTick(pair: string | null): Tick | null {
  const [tick, setTick] = useState<Tick | null>(null)

  useEffect(() => {
    if (!pair) return
    return subscribe(pair, setTick)
  }, [pair])

  return tick
}
