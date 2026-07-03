/**
 * Handler du backend TinaCMS self-host (datalayer + auth).
 *
 * ⚠️ Vit HORS de `src/pages/` : un site Astro statique n'a pas de runtime serveur.
 *    Ce handler est monté par le **serveur backend dédié** (`tina/backend/server.ts`),
 *    conteneurisé (`Dockerfile.backend`) et hébergé séparément (Dokploy, Lot 4a).
 *    Le build statique Astro n'importe jamais ce fichier.
 *
 * Brique réutilisable « datalayer + auth » (canon §4), industrialisée une fois puis
 * répliquée sur N sites. Contrat figé : `docs/decisions/contrat-datalayer-auth-tina.md`.
 *
 * Sécurité (canon §6.3) : l'admin n'est JAMAIS exposé sans authentification.
 *   - Mode local  → LocalBackendAuthProvider() (auth servie par `tinacms dev`).
 *   - Mode prod   → AuthJsBackendAuthProvider() (AuthJS + secret NEXTAUTH_SECRET).
 *
 * Le `databaseClient` est généré par `tinacms build` (présence de `tina/database.ts`).
 */
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer';
import { TinaAuthJSOptions, AuthJsBackendAuthProvider } from 'tinacms-authjs';
// @ts-expect-error — généré au build (tina/__generated__ est gitignoré).
import databaseClient from '../__generated__/databaseClient';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

export const tinaBackendHandler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient,
          secret: process.env.NEXTAUTH_SECRET as string,
        }),
      }),
  databaseClient,
});

export default tinaBackendHandler;
