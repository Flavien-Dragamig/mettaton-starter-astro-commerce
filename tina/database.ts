/**
 * Datalayer + git provider du backend TinaCMS self-host (Mettaton, Lot 4a).
 *
 * Frontière de brique (cf. docs/decisions/contrat-datalayer-auth-tina.md) :
 *   - Mode local  → `createLocalDatabase()` : store mémoire + bridge filesystem,
 *                   servi par `tinacms dev`. Aucune DB, aucun secret.
 *   - Mode prod   → `createDatabase(...)` : index KV en mémoire + git provider
 *                   GitHub. Source de vérité du contenu = Git ; le datalayer n'est
 *                   qu'un index reconstruit depuis Git au démarrage du backend.
 *
 * Décision Q1 révisée (Lot 4a) : store **`memory-level`** (pur JS, en mémoire).
 *   Le store « filesystem embarqué » initialement visé (`classic-level`/LevelDB) est
 *   un module natif que la CLI Tina ne peut pas bundler (échec `__dirname` à
 *   l'indexation). Les adapters Tina supportés sont pur-JS (`memory-level`,
 *   `mongodb-level`, `redis-level`). Git étant la source de vérité, l'index est
 *   reconstructible : pas de persistance requise en v1. Bascule d'1 ligne vers
 *   Mongo/Redis possible si une instance grossit.
 *
 * Sécurité (canon §7.4) : tous les secrets (token git, NEXTAUTH_SECRET) sont
 * injectés par variables d'environnement (gestionnaire de secrets Dokploy), jamais
 * cuits dans l'image ni affichés dans une UI.
 */
import { createDatabase, createLocalDatabase } from '@tinacms/datalayer';
import { GitHubProvider } from 'tinacms-gitprovider-github';
import { MemoryLevel } from 'memory-level';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

// Branche éditée par le backend (commits Tina). Aligné sur tina/config.ts.
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main';

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new GitHubProvider({
        branch,
        owner: process.env.GITHUB_OWNER as string,
        repo: process.env.GITHUB_REPO as string,
        token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN as string,
      }),
      // memory-level : index KV en mémoire (pur JS), reconstruit depuis Git au boot.
      databaseAdapter: new MemoryLevel<string, Record<string, any>>(),
    });
