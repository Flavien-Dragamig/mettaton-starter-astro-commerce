import { defineConfig } from 'vitest/config';

// Les specs Playwright (tests/e2e/*.spec.ts, cf. playwright.config.ts) utilisent
// une API de test différente (@playwright/test) - Vitest ne doit pas tenter de
// les collecter, sinon `npm test` échoue en essayant de les parser.
export default defineConfig({
	test: {
		exclude: ['tests/e2e/**', 'node_modules/**'],
	},
});
