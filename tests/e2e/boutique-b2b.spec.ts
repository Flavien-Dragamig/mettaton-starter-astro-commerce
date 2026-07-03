import { test, expect } from '@playwright/test';

test('parcours B2B : login groupe B2B → option facture différée visible', async ({ page }) => {
	await page.context().addCookies([
		{ name: 'medusa_jwt', value: 'jwt-test', domain: 'localhost', path: '/' },
		{ name: 'medusa_cart_id', value: 'cart_1', domain: 'localhost', path: '/' },
	]);

	// Le customer B2B et le panier cart_1 viennent du mock SSR
	// (tests/e2e/mock-medusa-server.mjs) : ces appels /store/* partent du serveur
	// Astro, pas du navigateur, donc page.route ne peut pas les intercepter.
	await page.goto('/panier');
	await page.getByRole('button', { name: 'Passer au paiement' }).click();
	await expect(page.getByLabel('Facture à 30 jours')).toBeVisible();
});
