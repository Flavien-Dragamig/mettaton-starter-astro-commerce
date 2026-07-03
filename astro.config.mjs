// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Mode commerce lu à la build (pas de bascule runtime — documenté dans le README).
// "snipcart" (Palier 1) => site statique. "medusa" (Palier 2) => SSR Node.
const commerceMode = process.env.COMMERCE_MODE ?? 'snipcart';

// https://astro.build/config
export default defineConfig({
	output: commerceMode === 'medusa' ? 'server' : 'static',
	adapter: commerceMode === 'medusa' ? node({ mode: 'standalone' }) : undefined,
});
