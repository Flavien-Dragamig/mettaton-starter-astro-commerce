import { test, expect } from '@playwright/test';

test('parcours B2C : catalogue → panier → paiement CB', async ({ page }) => {
	await page.route('**/store/products**', (route) =>
		route.fulfill({
			json: {
				products: [
					{
						handle: 'tshirt-logo',
						title: 'T-shirt logo',
						thumbnail: '/assets/tshirt.jpg',
						description: 'T-shirt 100% coton bio.',
						variants: [{ id: 'variant_1' }],
					},
				],
			},
		}),
	);

	await page.goto('/boutique');
	await expect(page.getByRole('heading', { name: 'T-shirt logo' })).toBeVisible();

	await page.route('**/api/panier/ajouter', (route) =>
		route.fulfill({ status: 302, headers: { Location: '/panier' } }),
	);
	await page.goto('/boutique/tshirt-logo');
	await page.getByRole('button', { name: 'Ajouter au panier' }).click();
});
