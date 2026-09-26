// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Pas de télémétrie Astro (données d'usage envoyées à Astro), quel que soit
// l'hébergeur qui build le site : Astro lit cette variable après avoir chargé
// ce fichier (build, dev, sync, preview).
process.env.ASTRO_TELEMETRY_DISABLED ??= '1';

// Mode commerce lu à la build (pas de bascule runtime — documenté dans le README).
// "snipcart" (Palier 1) => site statique. "medusa" (Palier 2) => SSR Node.
const commerceMode = process.env.COMMERCE_MODE ?? 'snipcart';

// https://astro.build/config
export default defineConfig({
	output: commerceMode === 'medusa' ? 'server' : 'static',
	adapter: commerceMode === 'medusa' ? node({ mode: 'standalone' }) : undefined,
});
