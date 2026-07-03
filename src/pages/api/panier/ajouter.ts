import type { APIRoute } from 'astro';
import { medusaFetch } from '../../../lib/medusa-client';

// Route active uniquement en mode `medusa` (SSR à la demande, Palier 2).
// En mode `snipcart` (statique) elle est prerendered et inerte : aucun handler
// serveur n'est émis, le build statique reste vert sans backend Medusa.
export const prerender = import.meta.env.COMMERCE_MODE !== 'medusa';

export const POST: APIRoute = async ({ request, cookies }) => {
	const form = await request.formData();
	const variantId = form.get('variant_id') as string;
	const token = cookies.get('medusa_jwt')?.value;
	let cartId = cookies.get('medusa_cart_id')?.value;

	if (!cartId) {
		const regionRes = await medusaFetch('/store/regions');
		const { regions } = await regionRes.json();
		const cartRes = await medusaFetch('/store/carts', {
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: JSON.stringify({ region_id: regions[0].id }),
		});
		const { cart } = await cartRes.json();
		cartId = cart.id;
		cookies.set('medusa_cart_id', cartId, { httpOnly: true, path: '/', sameSite: 'lax' });
	}

	await medusaFetch(`/store/carts/${cartId}/line-items`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: JSON.stringify({ variant_id: variantId, quantity: 1 }),
	});

	return new Response(null, { status: 302, headers: { Location: '/panier' } });
};
