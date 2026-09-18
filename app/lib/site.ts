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

// Repli sur l'URL de production : elle sert de base aux métadonnées, donc un
// domaine personnalisé se déclare par la variable, pas ici.
const FALLBACK_SITE_URL = 'https://crypto-app-lodziek.vercel.app'

/**
 * Attention au cas « déclarée mais vide ».
 *
 * `process.env.X ?? repli` ne rattrape que `undefined` : une variable présente
 * avec une valeur vide — un `NEXT_PUBLIC_SITE_URL=` dans un .env, ou un champ
 * laissé blanc dans l'interface Vercel — vaut la chaîne vide, traverse le `??`,
 * et fait lever `new URL('')` à l'évaluation du layout racine. Toutes les pages
 * répondent alors 500, y compris en production.
 *
 * Une valeur invalide, elle, n'est pas remplacée en silence : mieux vaut un
 * message explicite au build qu'un site qui publie des métadonnées fausses.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!configured) return FALLBACK_SITE_URL

  try {
    return new URL(configured).origin
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL n'est pas une URL valide : « ${configured} ». ` +
        'Attendu une origine complète, par exemple https://exemple.vercel.app',
    )
  }
}

export const SITE_URL = resolveSiteUrl()

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
