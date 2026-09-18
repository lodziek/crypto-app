'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { RANGES, type Candle, type RangeKey } from '../lib/binance'
import { formatAxisPrice, formatPrice } from '../lib/format'

export type Series =
  | { kind: 'candles'; data: Candle[] }
  | { kind: 'line'; data: Array<[number, number]> }

type Props = {
  pair: string | null
  coinId: string
  initialRange: RangeKey
  initialSeries: Series
}

const HEIGHT = 340
const GRID_LINES = 4

// En dessous de cette largeur, le graphique passe en mode compact : gouttière
// réduite, libellés de prix abrégés et moitié moins de repères de date. Sur un
// téléphone, la gouttière pleine dévorait le quart de la surface utile et les
// dates se chevauchaient.
const COMPACT_BELOW = 520

/**
 * Toutes les dates sont formatées en UTC, explicitement.
 *
 * Le composant est rendu côté serveur puis hydraté : sans fuseau imposé, Node et
 * le navigateur produiraient des libellés différents et l'hydratation échouerait.
 * L'UTC est en plus le fuseau de référence des marchés.
 */
function makeDateFormatter(range: RangeKey) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    // Les minutes ne sont pas décoratives : sans elles, « Sep 11, 21 » se lit
    // comme une année plutôt que comme 21 h.
    ...(range === '7D' ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  })
}

type Point = { time: number; value: number; candle: Candle | null }

function toPoints(series: Series): Point[] {
  return series.kind === 'candles'
    ? series.data.map((c) => ({ time: c.time, value: c.close, candle: c }))
    : series.data.map(([time, value]) => ({ time, value, candle: null }))
}

export default function PriceChart({ pair, coinId, initialRange, initialSeries }: Props) {
  const [range, setRange] = useState<RangeKey>(initialRange)
  const [series, setSeries] = useState<Series>(initialSeries)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [cursor, setCursor] = useState<number | null>(null)

  // La largeur est mesurée plutôt que déduite d'un viewBox mis à l'échelle :
  // une mise à l'échelle déformerait aussi le texte des axes. Elle vaut 0 au
  // premier rendu, identique sur le serveur et le client, donc sans risque
  // d'hydratation ; le tracé apparaît à la mesure.
  const [width, setWidth] = useState(0)

  /**
   * Mesure à l'attachement du nœud, puis suivi des redimensionnements.
   *
   * La mesure directe n'est pas redondante avec l'observateur : ce dernier ne
   * livre son premier callback qu'au prochain rendu du navigateur, et un onglet
   * masqué ou en arrière-plan n'en produit aucun. Sans elle, le graphique peut
   * rester durablement vide — constaté en test, tracé réduit à « M0 0 L0 0… »
   * alors que le conteneur mesurait 1086 px.
   */
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    setWidth(node.getBoundingClientRect().width)

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  /**
   * Le chargement répond à un clic, il vit donc dans le gestionnaire et non dans
   * un effet — c'est ce que réclame `react-hooks/set-state-in-effect`, et c'est
   * aussi plus juste : rien ici ne synchronise le composant avec un système
   * extérieur, on réagit à une intention de l'utilisateur.
   *
   * Le compteur écarte les réponses hors délai : trois clics rapides peuvent
   * revenir dans le désordre, et la dernière plage demandée doit gagner.
   */
  const requestId = useRef(0)

  const selectRange = useCallback(
    async (next: RangeKey) => {
      // Recliquer la plage courante ne fait rien… sauf si elle a échoué : c'est
      // alors le seul geste naturel pour réessayer.
      if (next === range && !failed) return

      setRange(next)
      setFailed(false)
      setCursor(null)

      if (next === initialRange) {
        setSeries(initialSeries)
        return
      }

      const id = ++requestId.current
      setLoading(true)

      try {
        let loaded: Series

        if (pair) {
          // Binance est joignable directement : pas de clé, CORS ouvert. Inutile
          // de faire transiter ça par notre serveur.
          const { binance, limit } = RANGES[next]
          const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${binance}&limit=${limit}`
          const res = await fetch(url)
          if (!res.ok) throw new Error(String(res.status))
          const raw = (await res.json()) as unknown[][]
          const data: Candle[] = raw.map((k) => ({
            time: Number(k[0]),
            open: Number(k[1]),
            high: Number(k[2]),
            low: Number(k[3]),
            close: Number(k[4]),
          }))
          loaded = { kind: 'candles', data }
        } else {
          // CoinGecko, lui, exige la clé : le repli passe par notre route.
          const res = await fetch(`/api/chart/${encodeURIComponent(coinId)}?range=${next}`)
          if (!res.ok) throw new Error(String(res.status))
          const body = (await res.json()) as { prices: Array<[number, number]> }
          loaded = { kind: 'line', data: body.prices }
        }

        if (requestId.current === id) setSeries(loaded)
      } catch {
        if (requestId.current === id) setFailed(true)
      } finally {
        if (requestId.current === id) setLoading(false)
      }
    },
    [range, failed, initialRange, initialSeries, pair, coinId],
  )

  const points = useMemo(() => toPoints(series), [series])
  const format = useMemo(() => makeDateFormatter(range), [range])

  const compact = width > 0 && width < COMPACT_BELOW
  const pad = useMemo(
    () => ({ top: 12, right: 12, bottom: 28, left: compact ? 46 : 82 }),
    [compact],
  )
  const xLabelCount = compact ? 2 : 4

  const plot = useMemo(() => {
    const innerWidth = Math.max(0, width - pad.left - pad.right)
    const innerHeight = HEIGHT - pad.top - pad.bottom

    if (points.length < 2 || innerWidth <= 0) {
      return { innerWidth, innerHeight, min: 0, max: 0, x: () => 0, y: () => 0 }
    }

    const lows = points.map((p) => (p.candle ? p.candle.low : p.value))
    const highs = points.map((p) => (p.candle ? p.candle.high : p.value))
    const rawMin = Math.min(...lows)
    const rawMax = Math.max(...highs)

    // Un cours ne part pas de zéro : contrairement à un diagramme en barres, la
    // ligne de base d'une série de prix n'a pas de signification, et forcer le
    // zéro écraserait toute la variation dans un trait. On cadre sur la plage
    // observée, avec 6 % de marge.
    const margin = (rawMax - rawMin) * 0.06 || rawMax * 0.01 || 1
    const min = rawMin - margin
    const max = rawMax + margin
    const span = max - min || 1

    return {
      innerWidth,
      innerHeight,
      min,
      max,
      x: (i: number) => pad.left + (i / (points.length - 1)) * innerWidth,
      y: (v: number) => pad.top + (1 - (v - min) / span) * innerHeight,
    }
  }, [points, width, pad])

  const active = cursor !== null ? points[cursor] : null

  const handlePointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (points.length < 2 || plot.innerWidth <= 0) return

      const box = event.currentTarget.getBoundingClientRect()
      const ratio = (event.clientX - box.left - pad.left) / plot.innerWidth
      const index = Math.round(ratio * (points.length - 1))
      setCursor(Math.min(points.length - 1, Math.max(0, index)))
    },
    [points.length, plot.innerWidth, pad.left],
  )

  const handleKey = useCallback(
    (event: React.KeyboardEvent<SVGSVGElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()

      const step = event.key === 'ArrowLeft' ? -1 : 1
      setCursor((c) => {
        const next = (c ?? points.length - 1) + step
        return Math.min(points.length - 1, Math.max(0, next))
      })
    },
    [points.length],
  )

  const ticks = useMemo(() => {
    if (plot.max === plot.min) return []
    return Array.from({ length: GRID_LINES + 1 }, (_, i) => plot.min + ((plot.max - plot.min) * i) / GRID_LINES)
  }, [plot.min, plot.max])

  /** Quelques repères de date seulement : un par point serait illisible. */
  const xLabels = useMemo(() => {
    if (points.length < 2) return []

    return Array.from({ length: xLabelCount }, (_, i) => {
      const index = Math.round((i / (xLabelCount - 1)) * (points.length - 1))
      return { index, text: format.format(new Date(points[index].time)) }
    })
  }, [points, format, xLabelCount])

  const bodyWidth = points.length > 0 ? Math.max(1, (plot.innerWidth / points.length) * 0.62) : 1

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex gap-1" role="group" aria-label="Chart range">
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => void selectRange(key)}
              aria-pressed={range === key}
              className={`rounded px-2 py-1 font-mono text-xs transition-colors ${
                range === key ? 'bg-accent text-on-accent' : 'text-muted hover:bg-raised hover:text-ink'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <p className="font-mono text-xs text-muted">
          {series.kind === 'candles' ? `${pair} · OHLC` : 'Reference price'}
          {loading ? ' · loading…' : ''}
        </p>
      </div>

      <div ref={measureRef} className="relative">
        {failed ? (
          <div
            role="alert"
            className="flex items-center justify-center rounded border border-down/40 bg-down/5 text-sm text-down"
            style={{ height: HEIGHT }}
          >
            Chart data unavailable for this range.
          </div>
        ) : (
          <svg
            width={width || undefined}
            height={HEIGHT}
            className="block touch-none"
            tabIndex={0}
            role="group"
            aria-label={`${range} price chart. Use left and right arrow keys to read values.`}
            onPointerMove={handlePointer}
            onPointerLeave={() => setCursor(null)}
            onKeyDown={handleKey}
            onBlur={() => setCursor(null)}
          >
            {ticks.map((value) => (
              <g key={value}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={plot.y(value)}
                  y2={plot.y(value)}
                  stroke="rgb(var(--rule))"
                  strokeWidth={1}
                />
                <text
                  x={pad.left - 8}
                  y={plot.y(value)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-[rgb(var(--muted))] font-mono text-[10px]"
                >
                  {formatAxisPrice(value, compact)}
                </text>
              </g>
            ))}

            {xLabels.map(({ index, text }) => (
              <text
                key={index}
                x={plot.x(index)}
                y={HEIGHT - 8}
                textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                className="fill-[rgb(var(--muted))] font-mono text-[10px]"
              >
                {text}
              </text>
            ))}

            {series.kind === 'candles'
              ? points.map((point, i) => {
                  const c = point.candle
                  if (!c) return null
                  const rising = c.close >= c.open
                  const color = rising ? 'rgb(var(--up))' : 'rgb(var(--down))'
                  const top = plot.y(Math.max(c.open, c.close))
                  const bottom = plot.y(Math.min(c.open, c.close))

                  return (
                    <g key={c.time}>
                      <line
                        x1={plot.x(i)}
                        x2={plot.x(i)}
                        y1={plot.y(c.high)}
                        y2={plot.y(c.low)}
                        stroke={color}
                        strokeWidth={1}
                      />
                      <rect
                        x={plot.x(i) - bodyWidth / 2}
                        y={top}
                        width={bodyWidth}
                        /* Une bougie dont l'ouverture égale la clôture doit rester
                           visible : un rectangle de hauteur nulle disparaîtrait. */
                        height={Math.max(1, bottom - top)}
                        fill={color}
                      />
                    </g>
                  )
                })
              : (
                  <path
                    d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${plot.x(i)} ${plot.y(p.value)}`).join(' ')}
                    fill="none"
                    stroke="rgb(var(--accent))"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                  />
                )}

            {active && cursor !== null ? (
              <g aria-hidden>
                <line
                  x1={plot.x(cursor)}
                  x2={plot.x(cursor)}
                  y1={pad.top}
                  y2={HEIGHT - pad.bottom}
                  stroke="rgb(var(--ink))"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <circle cx={plot.x(cursor)} cy={plot.y(active.value)} r={3} fill="rgb(var(--ink))" />
              </g>
            ) : null}
          </svg>
        )}

        {active ? (
          <div
            className="pointer-events-none absolute top-2 rounded border border-rule bg-surface/95 px-3 py-2 text-xs shadow-lg"
            style={{
              // L'infobulle bascule d'un côté à l'autre pour ne pas sortir du cadre.
              left: plot.x(cursor ?? 0) > width / 2 ? undefined : Math.min(plot.x(cursor ?? 0) + 12, width - 150),
              right: plot.x(cursor ?? 0) > width / 2 ? Math.max(12, width - plot.x(cursor ?? 0) + 12) : undefined,
            }}
          >
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted">
              {format.format(new Date(active.time))} UTC
            </p>
            {active.candle ? (
              <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
                {(
                  [
                    ['O', active.candle.open],
                    ['H', active.candle.high],
                    ['L', active.candle.low],
                    ['C', active.candle.close],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd className="tnum text-right font-semibold">{formatPrice(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="tnum font-semibold">{formatPrice(active.value)}</p>
            )}
          </div>
        ) : null}
      </div>

      {/* L'infobulle enrichit, elle ne conditionne pas l'accès : les mêmes valeurs
          restent lisibles sans survol, et sans souris. */}
      <details className="mt-4">
        <summary className="cursor-pointer font-mono text-xs text-muted hover:text-ink">
          Data table
        </summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-bg text-left text-muted">
              <tr>
                <th scope="col" className="py-1 pr-4 font-medium">Time (UTC)</th>
                {series.kind === 'candles' ? (
                  <>
                    <th scope="col" className="py-1 pr-4 text-right font-medium">Open</th>
                    <th scope="col" className="py-1 pr-4 text-right font-medium">High</th>
                    <th scope="col" className="py-1 pr-4 text-right font-medium">Low</th>
                    <th scope="col" className="py-1 text-right font-medium">Close</th>
                  </>
                ) : (
                  <th scope="col" className="py-1 text-right font-medium">Price</th>
                )}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.time} className="border-t border-rule/50">
                  <td className="py-1 pr-4 text-muted">{format.format(new Date(point.time))}</td>
                  {point.candle ? (
                    <>
                      <td className="tnum py-1 pr-4 text-right">{formatPrice(point.candle.open)}</td>
                      <td className="tnum py-1 pr-4 text-right">{formatPrice(point.candle.high)}</td>
                      <td className="tnum py-1 pr-4 text-right">{formatPrice(point.candle.low)}</td>
                      <td className="tnum py-1 text-right">{formatPrice(point.candle.close)}</td>
                    </>
                  ) : (
                    <td className="tnum py-1 text-right">{formatPrice(point.value)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
