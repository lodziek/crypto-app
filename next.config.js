/** @type {import('next').NextConfig} */

// Origines externes contactées par le navigateur. Toute nouvelle source de
// données doit être déclarée ici, sinon la CSP la bloque silencieusement.
const BINANCE_REST = 'https://api.binance.com'
const BINANCE_STREAM = 'https://data-stream.binance.vision'
const BINANCE_SOCKET = 'wss://data-stream.binance.vision'
const FEAR_GREED = 'https://api.alternative.me'

const csp = [
    "default-src 'self'",
    // 'unsafe-inline' reste nécessaire tant qu'aucun middleware n'injecte de nonce.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://coin-images.coingecko.com https://assets.coingecko.com",
    `connect-src 'self' ${BINANCE_REST} ${BINANCE_STREAM} ${BINANCE_SOCKET} ${FEAR_GREED}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
].join('; ')

const nextConfig = {
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
                    { key: 'Content-Security-Policy', value: csp },
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

module.exports = nextConfig
