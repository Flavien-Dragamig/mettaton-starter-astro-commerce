/**
 * Build du serveur backend TinaCMS self-host (Mettaton Lot 4a).
 *
 * Bundle `tina/backend/server.ts` en un seul fichier ESM exécutable par `node`
 * (pas de `tsx` au runtime). esbuild résout l'interop CJS/ESM à la compilation
 * (ex. `color-string`, importé en nommé par `tinacms`, casse sous l'ESM natif de Node).
 *
 * Deux frontières `next-auth` importées en **default** par `tinacms-authjs` (paquet ESM
 * qui suppose l'`esModuleInterop` d'un bundler) sont redirigées vers des shims
 * (`./shims/*.mjs`) qui réexposent la fonction comme default ESM propre. Les sous-chemins
 * importés en **nommé** (`next-auth/next`, `next-auth/react`) restent externes : l'ESM
 * natif les résout en CJS sans souci (cjs-module-lexer).
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

/** Redirige uniquement les specifiers EXACTS (pas les sous-chemins) vers les shims. */
const interopShims = {
  name: 'next-auth-interop-shims',
  setup(b) {
    b.onResolve({ filter: /^next-auth$/ }, () => ({
      path: resolve(here, 'shims/next-auth.mjs'),
    }));
    b.onResolve({ filter: /^next-auth\/providers\/credentials$/ }, () => ({
      path: resolve(here, 'shims/credentials.mjs'),
    }));
  },
};

await build({
  entryPoints: [resolve(here, 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: resolve(root, 'dist-backend/server.mjs'),
  // Sous-chemins next-auth importés en nommé : laissés externes (résolus en CJS au runtime).
  external: ['next-auth/next', 'next-auth/react'],
  plugins: [interopShims],
  // `require` pour les deps CJS bundlées + les `createRequire` des shims.
  banner: { js: "import{createRequire as __mtnCr}from'module';const require=__mtnCr(import.meta.url);" },
  logLevel: 'info',
});
