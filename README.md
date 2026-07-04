# Mettaton Starter — Astro Landing

Starter de landing page marketing (hero, features, CTA, footer) construit avec [Astro](https://astro.build). Léger, rapide, zéro JavaScript par défaut, prêt à personnaliser et déployer.

## Démarrage

```bash
npm install      # installe les dépendances
npm run dev      # serveur de dev sur http://localhost:4321
npm run build    # build de production dans dist/ (admin Tina inclus, voir ci-dessous)
npm run preview  # prévisualise le build
```

## Édition de contenu (TinaCMS)

Ce starter intègre **TinaCMS self-host** pour l'édition WYSIWYG du contenu.

### Modèle block-based

La landing n'a plus aucun texte en dur : tout vit dans la page singleton
`src/content/pages/home.json`. Son champ `blocks` est une **liste de blocs typés**
(discriminés par `_template`), éditables section par section dans l'admin :

| Bloc (`_template`) | Champs |
|---|---|
| `hero` | `eyebrow?`, `heading`, `subtitle?`, `actions[]` (`label`, `href`, `variant: primary\|ghost`) |
| `features` | `heading`, `lead?`, `items[]` (`icon?`, `title`, `body`) |
| `cta` | `heading`, `body?`, `action?` (`label`, `href`, `external?`) |

Hors blocs, le singleton porte aussi `seo` (`title`, `description`), `header`
(`brand`, `nav[]`) et `footer` (`text`, `nav[]`).

`src/pages/index.astro` lit ce singleton et délègue le rendu au dispatcher
`src/components/blocks/Blocks.astro`, qui associe chaque `_template` à son composant
(`src/components/blocks/<Type>.astro`). Pour ajouter un type de bloc : déclarer son
schéma dans `src/content.config.ts` **et** `tina/config.ts`, puis créer le composant et
l'enregistrer dans le dispatcher.

### Frontière de repo (à respecter)

| Zone | Périmètre | Édité par |
|---|---|---|
| `src/content/` | Contenu éditorial (blocs de la landing) | **Tina** + Claude Code |
| `src/components/`, `src/layouts/`, config (`astro.config.mjs`, `tina/config.ts`…) | Code, structure, templates | **Claude Code uniquement** |

Le schéma Tina (`tina/config.ts`) est le **miroir** de `src/content.config.ts` : toute évolution
de champ doit être répercutée dans les deux fichiers pour rester cohérent.

### Lancer l'éditeur en local

```bash
cp .env.example .env.local       # TINA_PUBLIC_IS_LOCAL=true par défaut
npm run dev:cms                  # lance `tinacms dev` + `astro dev`
```

Puis ouvrir l'admin sur **http://localhost:4321/admin** (login local requis — l'admin n'est
**jamais** exposé sans authentification). Les modifications sont écrites dans `src/content/pages/`
puis commitées dans Git (source de vérité du contenu).

### Backend de production

En local, l'auth + le datalayer sont servis par `tinacms dev` (filesystem + git, sans base de
données). En production, le backend Tina self-host (datalayer + AuthJS + git provider) est hébergé
séparément (**Docker / Dokploy — Lot 4**) ; son contrat figure dans `tina/backend/handler.ts` et
les variables d'environnement correspondantes dans `.env.example`.

## Boutique (commerce)

Le starter gère un catalogue produits (`src/content/products/`, édité via Tina — miroir
`tina/config.ts` / `src/content.config.ts`) et l'affiche sur `/boutique` (liste) et
`/boutique/[handle]` (fiche produit). Le mode commerce est choisi **à la build**, via
`COMMERCE_MODE` (`.env.example`) :

- **`snipcart`** (Palier 1, défaut) — pages statiques (`prerender = true`), lecture directe du
  catalogue Tina, aucun appel réseau au build. Le panier est délégué à **Snipcart**.
- **`medusa`** (Palier 2, SSR) — interroge l'API Store Medusa au lieu du catalogue Tina.

### Intégration Snipcart (Palier 1)

1. Créer un compte sur [snipcart.com](https://snipcart.com) puis récupérer la **clé publique**
   (Dashboard > Account > API Keys > Public key).
2. Renseigner `PUBLIC_SNIPCART_API_KEY` dans `.env.local` (voir `.env.example`).
3. Le composant `src/components/SnipcartScript.astro` injecte le script/CSS Snipcart sur
   `/boutique` et `/boutique/[handle]` — uniquement si la clé est définie (sinon rien ne se
   charge, y compris en dev sans clé).
4. Les boutons « Ajouter au panier » de `/boutique/[handle]` portent les attributs
   `data-item-*` attendus par Snipcart (id, prix, nom, description, URL), lus par le script une
   fois chargé.

Sans clé (`PUBLIC_SNIPCART_API_KEY` vide), le build et le rendu des pages boutique restent
fonctionnels — seul le script panier est absent, aucune régression.
