/**
 * Shim d'interop ESM → CJS pour `next-auth` (Mettaton Lot 4a).
 *
 * `tinacms-authjs` (paquet ESM) fait `import NextAuth from "next-auth"` en comptant
 * sur l'`esModuleInterop` d'un bundler (default = `module.exports.default`). Or `next-auth`
 * est CJS : sous l'ESM natif de Node (et l'interop « node » d'esbuild), le default vaut
 * tout `module.exports` (= `{ default: fn, ... }`), pas la fonction → « NextAuth is not a
 * function ». Ce shim charge le vrai paquet via `createRequire` et réexpose la fonction
 * comme default ESM propre. Réexporte aussi les nommés utiles. Le runtime charge ainsi
 * `next-auth` en CJS (interop correcte), exactement comme dans un hôte Next.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mod = require('next-auth');
const resolved = mod && mod.__esModule ? mod.default : mod.default ?? mod;

export default resolved;
export const getServerSession = mod.getServerSession;
export const unstable_getServerSession = mod.unstable_getServerSession;
