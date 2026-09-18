/**
 * Constantes du site et fabrique de métadonnées.
 *
 * Next fusionne `openGraph` superficiellement : une page qui redéfinit ses
 * métadonnées écrase le bloc du layout racine, image comprise. Toute page doit
 * donc passer par `pageMetadata()` plutôt que d'exporter un objet à la main.
 */
import type { Metadata } from 'next'

export const SITE_NAME = 'Crypto Console'
export const SITE_DESCRIPTION =
  'Live cryptocurrency market data — real-time prices, candlestick charts and market stats.'

// Repli sur l'URL de production : elle sert de base aux métadonnées et au
// sitemap, donc un domaine personnalisé se déclare par la variable, pas ici.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://crypto-app-lodziek.vercel.app'

type PageMeta = {
  title: string
  description?: string
  path?: string
}

export function pageMetadata({ title, description, path = '/' }: PageMeta): Metadata {
  const url = new URL(path, SITE_URL).toString()
  const desc = description ?? SITE_DESCRIPTION

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
  }
}
