import type { APIRoute } from 'astro';
import { medusaFetch } from '../../../lib/medusa-client';

// Route active uniquement en mode `medusa` (SSR à la demande, Palier 2).
// En mode `snipcart` (statique) elle est prerendered et inerte : aucun handler
// serveur n'est émis, le build statique reste vert sans backend Medusa.
export const prerender = import.meta.env.COMMERCE_MODE !== 'medusa';

export const POST: APIRoute = async ({ request, cookies }) => {
	const { email, password, first_name, last_name } = await request.json();

	// Flux Medusa v2 en 2 temps : 1) création de l'identité auth, 2) création du customer.
	const authRes = await medusaFetch('/auth/customer/emailpass/register', {
		method: 'POST',
		body: JSON.stringify({ email, password }),
	});
	if (!authRes.ok) {
		return new Response(JSON.stringify({ error: "Échec de l'inscription" }), { status: 400 });
	}
	const { token } = await authRes.json();

	const customerRes = await medusaFetch('/store/customers', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: JSON.stringify({ email, first_name, last_name }),
	});
	if (!customerRes.ok) {
		return new Response(JSON.stringify({ error: 'Échec de la création du compte' }), { status: 400 });
	}

	cookies.set('medusa_jwt', token, { httpOnly: true, path: '/', sameSite: 'lax' });
	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
