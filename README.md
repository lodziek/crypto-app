# Crypto Console

Suivi de marché crypto : liste des 250 premières capitalisations, prix en temps
réel et graphiques en bougies. Next.js (App Router) déployé sur Vercel.

## Commandes

```bash
npm run dev      # serveur de dev sur http://localhost:3000
npm run build    # build de production (à lancer avant tout commit non trivial)
npm run lint     # eslint (l'exécutable, pas `next lint` : retiré dans Next 16)
```

Node >= 20.9 requis (`engines` dans package.json).

## Variables d'environnement

Copier `.env.example` vers `.env.local`. Aucune variable n'est obligatoire pour
démarrer : sans `COINGECKO_API_KEY`, l'app bascule sur le quota public partagé
par IP, ce qui suffit en local mais provoque des 429 en production.

`COINGECKO_API_KEY` est un **secret** : jamais de préfixe `NEXT_PUBLIC_`, jamais
committée. Elle ne doit être lue que depuis `app/lib/coingecko.ts`, côté serveur.

## Sources de données

L'app croise deux sources, et la répartition n'est pas arbitraire.

| Rôle | Source | Clé |
| --- | --- | --- |
| Référentiel : noms, logos, capitalisation, offre, ATH, description, sparkline | CoinGecko | oui, côté serveur |
| Prix en direct | Binance `!miniTicker@arr` (WebSocket) | non |
| Graphiques en bougies | Binance `klines` | non |
| Indice Fear & Greed | alternative.me | non |

Trois points à connaître avant de toucher à cette répartition :

- **Binance ne couvre que 56 % des coins volatils du top 250.** Ni HYPE, ni LEO,
  ni CRO, ni OKB n'y ont de paire USDT — la plateforme ne liste pas les jetons
  de ses concurrentes. Le prix CoinGecko n'est donc pas un cas de repli
  exceptionnel, c'est le régime normal de près de la moitié des lignes. Une
  ligne sans tick est normale et ne doit jamais être présentée comme une erreur.
- **Le flux `!ticker@arr` ne renvoie rien** (testé, aucun message en 25 s).
  Utiliser `!miniTicker@arr`, qui fonctionne et n'envoie que les symboles ayant
  bougé. Il ne fournit pas de champ de variation : elle se calcule
  `(c - o) / o * 100`.
- **L'hôte est `data-stream.binance.vision`**, pas `stream.binance.com` : il est
  dédié aux données de marché, ne demande aucun compte, et se connecte cinq fois
  plus vite (1,4 s contre 7,2 s en mesure).

## Sécurité

- En-têtes et CSP dans `next.config.js`. Toute nouvelle origine appelée depuis
  le navigateur doit être déclarée dans `connect-src`, sinon elle est bloquée
  silencieusement.
- Les routes `/api/*` n'acceptent aucune URL arbitraire : l'identifiant est
  validé puis vérifié présent dans le référentiel, sinon on rouvre une surface
  SSRF.
- L'app est en lecture seule et n'utilise aucune Server Action.
