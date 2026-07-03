import type { APIRoute } from 'astro';
import { medusaFetch } from '../../../lib/medusa-client';

// Route active uniquement en mode `medusa` (SSR à la demande, Palier 2).
// En mode `snipcart` (statique) elle est prerendered et inerte : aucun handler
// serveur n'est émis, le build statique reste vert sans backend Medusa.
export const prerender = import.meta.env.COMMERCE_MODE !== 'medusa';

export const POST: APIRoute = async ({ request, cookies }) => {
	const { email, password } = await request.json();

	const res = await medusaFetch('/auth/customer/emailpass', {
		method: 'POST',
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		return new Response(JSON.stringify({ error: 'Identifiants invalides' }), { status: 401 });
	}
	const { token } = await res.json();

	cookies.set('medusa_jwt', token, { httpOnly: true, path: '/', sameSite: 'lax' });
	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
