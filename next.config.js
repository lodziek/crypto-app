const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

/** @type {import('next').NextConfig} */

// Origines externes contactées par le navigateur. Toute nouvelle source de
// données doit être déclarée ici, sinon la CSP la bloque silencieusement.
const BINANCE_REST = 'https://api.binance.com'
const BINANCE_STREAM = 'https://data-stream.binance.vision'
const BINANCE_SOCKET = 'wss://data-stream.binance.vision'
const FEAR_GREED = 'https://api.alternative.me'

/**
 * Le développement a besoin de deux tolérances que la production ne doit jamais
 * recevoir : eval() pour les outils de débogage de React, et la WebSocket locale
 * du Fast Refresh. Elles sont accordées par phase plutôt qu'en lisant
 * NODE_ENV — sa valeur n'est pas garantie au moment où ce module est chargé.
 */
function contentSecurityPolicy(isDev) {
    const scriptSrc = ["'self'", "'unsafe-inline'"]
    const connectSrc = ["'self'", BINANCE_REST, BINANCE_STREAM, BINANCE_SOCKET, FEAR_GREED]

    if (isDev) {
        scriptSrc.push("'unsafe-eval'")
        connectSrc.push('ws://localhost:*')
    }

    return [
        "default-src 'self'",
        // 'unsafe-inline' reste nécessaire tant qu'aucun middleware n'injecte de nonce.
        `script-src ${scriptSrc.join(' ')}`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://coin-images.coingecko.com https://assets.coingecko.com",
        `connect-src ${connectSrc.join(' ')}`,
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
    ].join('; ')
}

module.exports = (phase) => {
    const isDev = phase === PHASE_DEVELOPMENT_SERVER

    return {
        reactStrictMode: true,
        // Aucune Server Action ici : l'app est en lecture seule. Next n'offre pas
        // d'option pour les désactiver — elles n'existent que si un `'use server'`
        // est écrit quelque part. La règle tient donc par convention : toute
        // mutation passerait par un Route Handler, jamais par une action.
        images: {
            remotePatterns: [
                { protocol: 'https', hostname: 'coin-images.coingecko.com' },
                { protocol: 'https', hostname: 'assets.coingecko.com' },
            ],
        },
        async headers() {
            return [
                {
                    source: '/:path*',
                    headers: [
                        { key: 'Content-Security-Policy', value: contentSecurityPolicy(isDev) },
                        { key: 'X-Content-Type-Options', value: 'nosniff' },
                        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                        { key: 'X-Frame-Options', value: 'DENY' },
                        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
                        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    ],
                },
            ]
        },
    }
}
