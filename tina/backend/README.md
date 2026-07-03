# Backend TinaCMS self-host

Recette du backend (datalayer + auth) hébergeable en conteneur — Mettaton Lot 4a.
Le site Astro est **statique** ; l'édition Tina passe par ce backend Node séparé.

## Pièces

| Fichier | Rôle |
|---|---|
| `tina/database.ts` | Datalayer : `createLocalDatabase()` (local) / `createDatabase()` + `memory-level` + GitHubProvider (prod). |
| `tina/backend/handler.ts` | Handler `TinaNodeBackend` (auth locale ou AuthJS selon `TINA_PUBLIC_IS_LOCAL`). |
| `tina/backend/server.ts` | Serveur Express : `/api/tina/*` (GraphQL+auth), `/admin` (SPA), `/healthz`. |
| `tina/backend/build.mjs` | Bundle esbuild du serveur → `dist-backend/server.mjs` (résout l'interop CJS/ESM). |
| `tina/backend/shims/` | Shims d'interop ESM→CJS pour les imports `default` de `next-auth` (cf. ci-dessous). |
| `Dockerfile.backend` | Image « un artefact, N sites », paramétrée par env. Aucun secret cuit. |
| `docker-compose.yml` | Dev local du backend hors Dokploy. |

## Datalayer = `memory-level`

Git est la **source de vérité** du contenu ; le datalayer n'est qu'un index reconstruit
depuis Git au démarrage. Store en mémoire (pur JS) → zéro DB, zéro sidecar. Le store
`classic-level` (LevelDB disque) n'est **pas** utilisable : module natif non bundlable par
la CLI Tina. Bascule possible vers `mongodb-level`/`redis-level` si une instance grossit.

## Build = codegen seul (`--skip-indexing`)

`tina:build` génère uniquement le client + les types + l'admin SPA (`public/admin`). On **n'indexe
pas** le contenu au build : `tinacms build` démarre sinon un datalayer (port 9000) puis indexe le
contenu (dès que `tina/database.ts` existe), ce qui bloque (leader + lecture `.git`) et serait de
toute façon perdu — memory-level est éphémère. L'index est reconstruit au **runtime** depuis Git
(`database.indexContent`) quand le backend démarre (étape branchée à l'intégration d'un site réel).

> Sur l'hôte de dev, si le port 9000 est déjà pris, ajouter `--datalayer-port <libre>` au script.

## Runtime = bundle esbuild (`backend:bundle`), pas `tsx`

Le serveur n'est **pas** lancé par `tsx` au runtime mais via un **bundle esbuild** unique
(`dist-backend/server.mjs`, exécuté par `node`). Raison : `tinacms` et `tinacms-authjs`
(paquets ESM) supposent un bundler avec `esModuleInterop` ; lancés crus, ils cassent sous
l'ESM natif de Node — `color-string` (importé en nommé par `tinacms`, CJS sans exports
nommés détectables) puis les imports `default` de `next-auth` (`NextAuth`, `CredentialsProvider`),
où le default d'un CJS vaut tout `module.exports`, pas la fonction.

esbuild résout `color-string` en le bundlant. Les **2 frontières `default` de `next-auth`**
sont redirigées par `build.mjs` vers `shims/next-auth.mjs` et `shims/credentials.mjs`, qui
rechargent le vrai paquet via `createRequire` et réexposent la fonction comme default ESM
propre. Les sous-chemins importés en **nommé** (`next-auth/next`, `next-auth/react`) restent
externes (résolus en CJS au runtime, sans souci). Boot vérifié : `/healthz` 200, `/admin` 200,
`/api/tina/gql` 401 (non authentifié → admin jamais exposé sans auth, canon §6.3).

## Dev local

```bash
cp .env.example .env.local   # renseigner NEXTAUTH_SECRET + GITHUB_* d'un repo de test
docker compose up --build
# Admin : http://localhost:4001/admin   API : http://localhost:4001/api/tina
```

## Variables (prod)

Injectées par le gestionnaire de secrets de l'hôte (Dokploy), jamais via l'UI portail
(canon §7.4) : `TINA_PUBLIC_IS_LOCAL=false`, `NEXTAUTH_SECRET`, `GITHUB_OWNER`,
`GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_PERSONAL_ACCESS_TOKEN` (portée 1 repo),
`TINA_PUBLIC_SITE_URL`, `PORT`. Cf. `.env.example`.

Provisioning automatisé : portail Mettaton (`provisionTinaBackend` / wizard onglet « Contenu »).
