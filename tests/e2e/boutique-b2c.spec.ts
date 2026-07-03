import { test, expect } from '@playwright/test';

test('parcours B2C : catalogue → panier → paiement CB', async ({ page }) => {
	// Les données produit viennent du mock SSR (tests/e2e/mock-medusa-server.mjs) :
	// les appels /store/* partent du serveur Astro, pas du navigateur, donc
	// page.route ne peut pas les intercepter. Seule la navigation navigateur
	// /api/panier/ajouter ci-dessous est interceptable ici.
	await page.goto('/boutique');
	await expect(page.getByRole('heading', { name: 'T-shirt logo' })).toBeVisible();

	await page.route('**/api/panier/ajouter', (route) =>
		route.fulfill({ status: 302, headers: { Location: '/panier' } }),
	);
	await page.goto('/boutique/tshirt-logo');
	await page.getByRole('button', { name: 'Ajouter au panier' }).click();
});
