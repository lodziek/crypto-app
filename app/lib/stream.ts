'use client'

/**
 * Flux de prix Binance, partagé par toute la page.
 *
 * Une seule connexion WebSocket dessert les ~125 lignes appairées : chaque
 * composant s'abonne à sa paire, le module se charge du reste.
 *
 * Deux choix dictés par la mesure plutôt que par la documentation :
 *
 * - `!miniTicker@arr` et non `!ticker@arr`. Le second ne renvoie jamais rien
 *   (testé, aucun message en 25 s) alors qu'il est le flux « complet » annoncé.
 *   Le premier fonctionne et n'envoie que les symboles ayant bougé.
 * - L'hôte `data-stream.binance.vision`, dédié aux données de marché, se
 *   connecte en 1,4 s contre 7,2 s pour `stream.binance.com`.
 */

const STREAM_URL = 'wss://data-stream.binance.vision/ws/!miniTicker@arr'

/**
 * Cadence maximale de rafraîchissement de l'interface.
 *
 * Le flux délivre environ 71 tickers par seconde. Un `setState` par message
 * déclencherait une tempête de rendus pour un résultat que l'œil ne distingue
 * pas : les ticks sont accumulés puis appliqués au plus quatre fois par seconde.
 */
const FLUSH_INTERVAL = 250

/** Reconnexion : 1 s, 2 s, 4 s… plafonnées à 30 s. */
const BACKOFF_BASE = 1000
const BACKOFF_MAX = 30_000

/** Délai avant fermeture quand plus personne n'écoute — évite de couper la
 *  connexion pendant une simple navigation entre deux pages. */
const IDLE_CLOSE_DELAY = 5000

export type Tick = {
  pair: string
  price: number
  /** miniTicker ne fournit pas de champ de variation : elle se calcule. */
  changePct: number
  high: number
  low: number
  at: number
}

type Listener = (tick: Tick) => void

const listeners = new Map<string, Set<Listener>>()
const pending = new Map<string, Tick>()

let socket: WebSocket | null = null
let attempt = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let flushScheduled = false
let lastFlush = 0

function flush() {
  for (const [pair, tick] of pending) {
    const subscribers = listeners.get(pair)
    if (!subscribers) continue
    for (const listener of subscribers) listener(tick)
  }
  pending.clear()
}

function scheduleFlush() {
  if (flushScheduled) return
  flushScheduled = true

  const wait = Math.max(0, FLUSH_INTERVAL - (performance.now() - lastFlush))

  setTimeout(() => {
    // Le rAF aligne l'application des ticks sur le prochain rendu du navigateur
    // et suspend tout naturellement quand l'onglet passe à l'arrière-plan.
    requestAnimationFrame(() => {
      flushScheduled = false
      lastFlush = performance.now()
      flush()
    })
  }, wait)
}

type RawMiniTicker = { s?: unknown; c?: unknown; o?: unknown; h?: unknown; l?: unknown }

function handleMessage(event: MessageEvent) {
  let payload: unknown

  try {
    payload = JSON.parse(event.data as string)
  } catch {
    return
  }

  if (!Array.isArray(payload)) return

  let matched = false

  for (const raw of payload as RawMiniTicker[]) {
    const pair = typeof raw.s === 'string' ? raw.s : null
    // Le flux couvre tout Binance, soit près de 3 700 paires. On ne garde que
    // celles réellement affichées.
    if (!pair || !listeners.has(pair)) continue

    const price = Number(raw.c)
    const open = Number(raw.o)
    if (!Number.isFinite(price) || !Number.isFinite(open) || open === 0) continue

    pending.set(pair, {
      pair,
      price,
      changePct: ((price - open) / open) * 100,
      high: Number(raw.h),
      low: Number(raw.l),
      at: Date.now(),
    })
    matched = true
  }

  if (matched) scheduleFlush()
}

function connect() {
  if (socket || listeners.size === 0) return
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return

  let ws: WebSocket

  try {
    ws = new WebSocket(STREAM_URL)
  } catch {
    // Le temps réel est un bonus : son échec ne doit jamais casser la page, qui
    // reste utilisable avec les prix de référence.
    scheduleReconnect()
    return
  }

  socket = ws

  ws.onopen = () => {
    attempt = 0
  }

  ws.onmessage = handleMessage

  ws.onclose = () => {
    if (socket === ws) socket = null
    if (listeners.size > 0) scheduleReconnect()
  }

  ws.onerror = () => {
    // `onclose` suit systématiquement `onerror` : la reconnexion est pilotée là.
    ws.close()
  }
}

function scheduleReconnect() {
  if (reconnectTimer || listeners.size === 0) return

  const delay = Math.min(BACKOFF_BASE * 2 ** attempt, BACKOFF_MAX)
  attempt++

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, delay)
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (socket) {
    const ws = socket
    socket = null
    ws.onclose = null
    ws.onerror = null
    ws.close()
  }

  pending.clear()
  attempt = 0
}

export function subscribe(pair: string, listener: Listener): () => void {
  let subscribers = listeners.get(pair)

  if (!subscribers) {
    subscribers = new Set()
    listeners.set(pair, subscribers)
  }

  subscribers.add(listener)

  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }

  connect()

  return () => {
    subscribers.delete(listener)

    // On ne supprime que si l'ensemble enregistré est toujours celui capturé à
    // l'abonnement : un désabonnement tardif effacerait sinon l'ensemble créé
    // entre-temps par un nouvel abonné, et la paire cesserait d'être servie sans
    // la moindre erreur.
    if (subscribers.size === 0 && listeners.get(pair) === subscribers) {
      listeners.delete(pair)
    }

    if (listeners.size === 0 && !idleTimer) {
      idleTimer = setTimeout(() => {
        idleTimer = null
        if (listeners.size === 0) disconnect()
      }, IDLE_CLOSE_DELAY)
    }
  }
}
