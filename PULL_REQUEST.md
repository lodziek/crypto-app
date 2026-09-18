# Refonte : de Create React App à Next.js, avec prix en temps réel

## Le problème

La page détail ne recevait **aucune donnée**. `src/routes/Coin/index.js` appelait
`pro-api.coingecko.com` avec l'en-tête `X-CoinGecko-Api-Key`, alors que la clé du
projet est une clé **Demo** :

| Appel | Résultat |
| --- | --- |
| `pro-api.coingecko.com` + `X-CoinGecko-Api-Key` | **HTTP 401** `API Key Missing` |
| `api.coingecko.com` + `x-cg-demo-api-key` | HTTP 200 |

`pro-api` est réservé aux abonnements payants. La page affichait donc une coquille
vide, indistinguable d'une panne — d'autant qu'aucun état d'erreur n'existait, les
deux `.catch` se contentant d'un `console.log`.

Trois autres défauts sont corrigés au passage :

- **La clé API était publiée en clair** dans un dépôt public et dans le bundle JS.
  Elle a été révoquée ; la nouvelle vit dans les variables Vercel et ne quitte
  jamais le serveur.
- **`/coin/bitcoin` renvoyait un 404** sur GitHub Pages : `BrowserRouter` sur un
  hébergeur statique, sans rendu serveur ni fallback SPA. Aucun lien n'était
  partageable.
- **Le tableau des variations 1h→1an** testait `price_change_percentage_24h_in_currency`
  avant de lire quatre autres champs. Sur le top 250 actuel, **47 coins n'ont
  aucun historique d'un an** : le garde passait, la lecture plantait.

## Ce que fait cette PR

Refonte complète sur **Next.js 16 + React 19 + TypeScript**, la même pile que le
portfolio, avec une architecture à deux sources.

| Rôle | Source | Clé |
| --- | --- | --- |
| Référentiel : noms, logos, capitalisation, offre, ATH, description, sparkline | CoinGecko | oui, côté serveur |
| Prix en direct | Binance `!miniTicker@arr` (WebSocket) | non |
| Graphiques en bougies | Binance `klines` | non |
| Indice Fear & Greed | alternative.me (côté serveur) | non |

Un seul appel à `/coins/markets`, avec les paramètres que l'ancienne version
omettait (`sparkline`, `price_change_percentage`), renvoie 32 champs par coin. Le
second appel par coin — celui qui répondait 401 — disparaît.

### Nouveautés

- Prix qui bougent en direct, avec flash de hausse ou de baisse
- Vrais graphiques en bougies OHLC, avec crosshair, infobulle et navigation clavier
- Tri sur toutes les colonnes, recherche instantanée
- Pages détail rendues serveur, avec métadonnées et OG par coin
- Indice Fear & Greed
- Thème clair et sombre, responsive jusqu'à 375 px

## Le point qui mérite une relecture attentive

**Binance ne couvre que 56 % des coins volatils du top 250.** Ni HYPE (#11), ni
LEO (#19), ni CRO (#36), ni OKB (#41) n'y ont de paire USDT : la plateforme ne
liste pas les jetons de ses concurrentes.

Conséquence assumée : **près de la moitié des lignes n'affichent pas de prix en
direct**, et rien dans l'interface ne les présente comme défectueuses — pas de
pastille, pas d'icône d'avertissement. Une ligne immobile est le régime normal,
pas une erreur.

L'appairage se fait par symbole, ce qui ne suffit pas. `resolvePairs` rejette
toute paire dont le prix s'écarte de plus de 5 % de la référence CoinGecko. Sur le
top 250, le garde-fou écarte quatre appairages, tous fondés :

| Coin | CoinGecko | Binance | Volume 24 h | Cause |
| --- | --- | --- | --- | --- |
| Monero | **560,21 $** | **118,70 $** | 575 k$ | paire délistée, prix figé |
| lighter (LIT) | 4,90 $ | 0,74 $ | 800 k$ | `LITUSDT` = Litentry |
| artificial-inu (AI) | — | 0,018 $ | 573 k$ | `AIUSDT` = Sleepless AI |
| frax | 0,99 $ | 0,28 $ | 146 k$ | actif différent, même ticker |

Sans ce contrôle, Monero s'afficherait à **118 $ au lieu de 560 $** — un prix
plausible, faux, que rien n'aurait signalé.

## Mesures

```
appairage    125 appairés · 121 non cotés · 4 rejetés (250)
temps réel   76 lignes en direct à l'affichage → 108 après 30 s
cadence UI   2,2 lots de mutations/s (plafond 4/s)
poids page   1,06 Mo brut → 110 Ko gzippés
sparklines   168 → 40 points, échantillonnés dans la couche de données
contrastes   tous > 4,5:1 sur les deux thèmes
```

## Vérifications

```
✓ npm run build          / statique (revalidation 1 min), 3 routes dynamiques
✓ npm run lint           aucune sortie
✓ /coin/bitcoin          200 (bougies Binance)
✓ /coin/hyperliquid      200 (courbe CoinGecko, sans paire)
✓ /coin/nexistepas       404
✓ /coin/..%2f..%2fadmin  404
✓ CSP production         sans 'unsafe-eval' (présent en dev uniquement)
✓ Binance injoignable    page servie en 200 avec les 250 coins
✓ CoinGecko injoignable  « Market data unavailable », pas de 500
✓ quota CoinGecko épuisé /api/chart répond 429, pas 502
```

## Sécurité

- `COINGECKO_API_KEY` est lue uniquement par `app/lib/coingecko.ts`, côté serveur.
- Les routes dynamiques vérifient l'identifiant **contre le référentiel** avant
  tout appel sortant : `..%2f..%2fadmin` passe le filtre de caractères, seule
  l'appartenance à une liste connue le rejette.
- `dangerouslySetInnerHTML` et DOMPurify disparaissent : la description est
  réduite à du texte brut côté serveur, échappé par React par construction.
- Les tolérances de développement de la CSP (`unsafe-eval`, WebSocket HMR) sont
  accordées par phase et absentes de la production.

## Après la fusion

La branche `gh-pages` a déjà été supprimée : l'ancien déploiement ne sert plus la
version cassée. Il reste à mettre **Settings → Pages → Source** sur `None` pour
une 404 propre plutôt qu'une branche fantôme, et à renseigner
`NEXT_PUBLIC_SITE_URL` dans Vercel une fois le domaine connu.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
