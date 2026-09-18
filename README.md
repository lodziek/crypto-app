# Crypto Console

Suivi de marché crypto : les 250 premières capitalisations, prix en temps réel et
graphiques en bougies. Next.js (App Router) déployé sur Vercel.

## Commandes

```bash
npm run dev      # serveur de dev sur http://localhost:3000
npm run build    # build de production (à lancer avant tout commit non trivial)
npm run lint     # eslint (l'exécutable, pas `next lint` : retiré dans Next 16)
```

Node >= 20.9 requis (`engines` dans package.json).

## Variables d'environnement

Copier `.env.example` vers `.env.local`. Aucune n'est obligatoire pour démarrer :
sans `COINGECKO_API_KEY`, l'app bascule sur le quota public partagé par IP, ce
qui suffit en local mais provoque des 429 en production.

Les valeurs de production vivent déjà dans Vercel. Pour travailler en local, on
les rapatrie plutôt que d'en créer de nouvelles :

```bash
npx vercel link && npx vercel env pull .env.local
```

`COINGECKO_API_KEY` est un **secret** : jamais de préfixe `NEXT_PUBLIC_`, jamais
committée. Elle n'est lue que par `app/lib/coingecko.ts`, côté serveur.

`NEXT_PUBLIC_SITE_URL` sert de base aux métadonnées et aux images OG. Un domaine
personnalisé se déclare par cette variable, pas en modifiant `app/lib/site.ts`.

## Sources de données

L'app croise deux sources, et la répartition n'est pas arbitraire.

| Rôle | Source | Clé |
| --- | --- | --- |
| Référentiel : noms, logos, capitalisation, offre, ATH, description, sparkline | CoinGecko | oui, côté serveur |
| Prix en direct | Binance `!miniTicker@arr` (WebSocket) | non |
| Graphiques en bougies | Binance `klines` | non |
| Indice Fear & Greed | alternative.me (côté serveur) | non |

Cinq points à connaître avant de toucher à cette répartition.

- **Le plan Demo impose `api.coingecko.com` et l'en-tête `x-cg-demo-api-key`.**
  `pro-api.coingecko.com` est réservé aux abonnements payants et répond 401 à
  une clé Demo. C'était le bug d'origine : la page détail n'affichait rien.
- **Binance ne couvre que 56 % des coins volatils du top 250.** Ni HYPE, ni LEO,
  ni CRO, ni OKB n'y ont de paire USDT — la plateforme ne liste pas les jetons
  de ses concurrentes. Le prix CoinGecko n'est donc pas un repli exceptionnel,
  c'est le régime normal de près de la moitié des lignes. Une ligne sans tick
  est normale et ne doit jamais être présentée comme une erreur.
- **L'appairage se contrôle par le prix, pas seulement par le symbole.** Deux
  projets peuvent partager un ticker, et une paire délistée continue de renvoyer
  son dernier prix comme si de rien n'était. `resolvePairs` rejette tout écart de
  plus de 5 % avec le prix CoinGecko : c'est ce qui évite d'afficher Monero à
  118 $ au lieu de 560 $, via un `XMRUSDT` gelé depuis son délistage.
- **Le flux `!ticker@arr` ne renvoie rien** (testé, aucun message en 25 s), alors
  qu'il est le flux « complet » annoncé. Utiliser `!miniTicker@arr`, qui n'envoie
  que les symboles ayant bougé. Il ne fournit pas de variation : elle se calcule
  `(c - o) / o * 100`.
- **L'hôte du flux est `data-stream.binance.vision`**, pas `stream.binance.com` :
  dédié aux données de marché, aucun compte requis, et cinq fois plus rapide à
  la connexion (1,4 s contre 7,2 s en mesure).

## Architecture

```
app/
├── page.tsx              Marché — composant serveur, revalidation 60 s
├── coin/[id]/page.tsx    Détail — SSR + generateMetadata (lien partageable)
├── api/markets           Référentiel pour les rafraîchissements client
├── api/chart/[id]        Repli graphique, coins sans paire Binance
├── components/           MarketTable (client), CoinRow, PriceChart, Sparkline…
└── lib/
    ├── coingecko.ts      Serveur uniquement : lit la clé API
    ├── binance.ts        REST public : paires, prix, klines
    ├── symbols.ts        Appairage + garde-fou d'écart de prix
    ├── market.ts         Composition des deux sources
    ├── stream.ts         WebSocket partagé, tampon et reconnexion
    └── format.ts         Intl, notations compactes
```

Deux règles structurantes :

- **Le typage impose l'appairage.** `fetchMarkets` renvoie des `CoinBase` ;
  seul `resolvePairs` produit des `Coin`. Oublier l'étape est une erreur de
  compilation, pas un `pair` silencieusement absent.
- **Les mêmes données ne se contredisent jamais.** Le prix et la variation 24 h
  dérivent du même tick ; la couleur d'une sparkline dérive du chiffre affiché à
  côté d'elle, pas des extrémités de sa série.

## Temps réel

Une seule connexion WebSocket dessert toutes les lignes appairées. Le flux
délivre environ 71 tickers par seconde : les ticks sont accumulés dans une `Map`
et appliqués au plus quatre fois par seconde, alignés sur `requestAnimationFrame`
— ce qui suspend aussi les mises à jour quand l'onglet passe à l'arrière-plan.
Un `setState` par message déclencherait une tempête de rendus pour un résultat
que l'œil ne distingue pas.

Le tri du tableau s'appuie sur les valeurs de référence et non sur les prix en
direct : trier sur une valeur qui tique replacerait les lignes plusieurs fois par
seconde et rendrait impossible de viser une ligne.

## Sécurité

- En-têtes et CSP dans `next.config.js`. Toute nouvelle origine appelée depuis le
  navigateur doit être déclarée dans `connect-src`, sinon elle est bloquée
  silencieusement. Les tolérances de développement (`unsafe-eval` pour React, la
  WebSocket HMR) sont accordées **par phase** et n'existent pas en production.
- Les routes dynamiques vérifient l'identifiant **contre le référentiel** avant
  tout appel sortant. Valider la forme de la chaîne ne suffirait pas :
  `bitcoin` et `../../admin` passent le même filtre de caractères.
- La description CoinGecko est réduite à du texte brut côté serveur. Aucun
  `dangerouslySetInnerHTML`, donc aucun sanitiseur dans le bundle client.
- L'app est en lecture seule et n'utilise aucune Server Action.

## Conventions

- Commentaires et messages de commit en **français** ; contenu du site et
  libellés d'interface en **anglais**.
- Les commentaires expliquent le *pourquoi* (un piège, une limite mesurée), pas
  le *quoi*.
- Indentation 4 espaces dans `next.config.js`, 2 espaces dans `app/`. Pas de
  point-virgule en fin de ligne.

## Pièges connus

- **Tailwind 3 tree-shake le contenu de ses `@layer`, `base` compris.** Les
  jetons de thème vivent donc en CSS brute dans `app/globals.css` : placé dans
  `@layer base`, le bloc `:root.light` était purgé faute de composant écrivant
  « light », et le thème clair disparaissait sans erreur ni avertissement.
- **`ResizeObserver` ne livre rien tant que le navigateur ne peint pas.** Le
  graphique mesure donc sa largeur à l'attachement du nœud, l'observateur ne
  servant qu'au redimensionnement — sinon le tracé peut rester « M0 0 L0 0… »
  dans un conteneur pourtant large.
- **Les dates du graphique sont formatées en UTC explicitement.** Sans fuseau
  imposé, Node et le navigateur produisent des libellés différents et
  l'hydratation échoue.
- **Les liens du tableau sont en `prefetch={false}`.** Sinon chaque ligne visible
  déclenche un rendu serveur de la page détail, donc un appel CoinGecko, pour des
  pages que personne n'ouvrira.
