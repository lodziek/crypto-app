/**
 * Formatage des nombres. Tout passe par `Intl`, avec l'anglais forcé : les
 * libellés du site sont en anglais, une locale déduite du navigateur ferait
 * cohabiter « $1,234.50 » et « 1 234,50 $ » sur la même ligne.
 */
const LOCALE = 'en-US'

/**
 * Un prix crypto s'étale de 80 000 $ à 0,000001 $. Un nombre fixe de décimales
 * afficherait « $0.00 » pour une bonne part du marché, d'où l'échelle adaptative.
 */
export function formatPrice(value: number): string {
  const abs = Math.abs(value)
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : abs >= 0.0001 ? 6 : 8

  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** Capitalisations et volumes : « $1.63T » plutôt que quinze chiffres. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

/** `null` devient un tiret cadratin : la donnée manque, elle ne vaut pas zéro. */
export function formatPercent(value: number | null): string {
  if (value === null) return '—'

  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }).format(value / 100)
}

export function formatSupply(value: number, symbol: string): string {
  const n = new Intl.NumberFormat(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)

  return `${n} ${symbol.toUpperCase()}`
}

/** Classe de couleur commune à toutes les valeurs signées du site. */
export function trendClass(value: number | null): string {
  if (value === null) return 'text-muted'
  if (value > 0) return 'text-up'
  if (value < 0) return 'text-down'
  return 'text-muted'
}
