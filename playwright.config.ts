import { defineConfig, devices } from '@playwright/test';

// Tests E2E de la boutique Medusa (Palier 2). Le storefront tourne en mode
// `medusa` (SSR Node), donc les appels à l'API Store Medusa partent du process
// serveur : Playwright `page.route` (navigateur) ne peut pas les intercepter.
// On démarre donc un stub HTTP (tests/e2e/mock-medusa-server.mjs) sur lequel on
// pointe MEDUSA_BACKEND_URL. Aucun vrai backend Medusa n'est requis.
const PORT = 4321;
const MOCK_PORT = 9000;

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 30_000,
	fullyParallel: false,
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
	webServer: [
		{
			command: `node tests/e2e/mock-medusa-server.mjs`,
			url: `http://127.0.0.1:${MOCK_PORT}/store/products`,
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
			env: { MOCK_MEDUSA_PORT: String(MOCK_PORT) },
		},
		{
			command: 'npm run dev -- --host 127.0.0.1',
			url: `http://localhost:${PORT}`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				COMMERCE_MODE: 'medusa',
				MEDUSA_BACKEND_URL: `http://127.0.0.1:${MOCK_PORT}`,
				MEDUSA_PUBLISHABLE_KEY: 'pk_test',
			},
		},
	],
});
