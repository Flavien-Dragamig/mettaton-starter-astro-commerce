import { test, expect } from '@playwright/test';

test('parcours B2B : login groupe B2B → option facture différée visible', async ({ page }) => {
	await page.context().addCookies([
		{ name: 'medusa_jwt', value: 'jwt-test', domain: 'localhost', path: '/' },
		{ name: 'medusa_cart_id', value: 'cart_1', domain: 'localhost', path: '/' },
	]);

	await page.route('**/store/customers/me', (route) =>
		route.fulfill({ json: { customer: { groups: [{ name: 'B2B' }] } } }),
	);
	await page.route('**/store/carts/cart_1', (route) =>
		route.fulfill({
			json: { cart: { items: [{ title: 'T-shirt logo', quantity: 1, total: 1990 }], total: 1990 } },
		}),
	);

	await page.goto('/panier');
	await page.getByRole('button', { name: 'Passer au paiement' }).click();
	await expect(page.getByLabel('Facture à 30 jours')).toBeVisible();
});
