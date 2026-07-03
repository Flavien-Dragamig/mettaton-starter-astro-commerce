/**
 * Shim d'interop ESM → CJS pour `next-auth/providers/credentials` (Mettaton Lot 4a).
 *
 * Même cause que `./next-auth.mjs` : `tinacms-authjs` fait
 * `import CredentialsProvider from "next-auth/providers/credentials"` (CJS, `{ default: fn }`).
 * Sous l'ESM natif / interop node d'esbuild, le default vaut l'objet entier, pas la fonction.
 * Ce shim réexpose la fonction `CredentialsProvider` comme default ESM propre.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mod = require('next-auth/providers/credentials');

export default mod && mod.__esModule ? mod.default : mod.default ?? mod;
