import type { APIRoute } from 'astro';
import { medusaFetch } from '../../../lib/medusa-client';

// Route active uniquement en mode `medusa` (SSR à la demande, Palier 2).
// En mode `snipcart` (statique) elle est prerendered et inerte : aucun handler
// serveur n'est émis, le build statique reste vert sans backend Medusa.
export const prerender = import.meta.env.COMMERCE_MODE !== 'medusa';

export const POST: APIRoute = async ({ request, cookies }) => {
	const form = await request.formData();
	const modePaiement = form.get('mode_paiement') as string;
	const cartId = cookies.get('medusa_cart_id')?.value;
	const token = cookies.get('medusa_jwt')?.value;
	if (!cartId) return new Response('Panier introuvable', { status: 400 });

	// Le paiement CB (Stripe/PayPlug) suit le flux payment-collection natif
	// Medusa (hors scope du code de ce step - configuré côté admin Medusa,
	// cf. Task 11). Ici on ne gère explicitement que la branche facture différée.
	if (modePaiement === 'facture_differee') {
		await medusaFetch(`/store/carts/${cartId}`, {
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: JSON.stringify({ metadata: { payment_mode: 'facture_differee' } }),
		});
	}

	const completeRes = await medusaFetch(`/store/carts/${cartId}/complete`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
	const { order } = await completeRes.json();

	if (modePaiement === 'facture_differee') {
		// Déclenche la synchronisation Pennylane (Task 10) - appel serveur à
		// serveur, ne bloque jamais la confirmation de commande en cas d'échec.
		const { syncOrderToPennylane } = await import('../../../server/pennylane');
		await syncOrderToPennylane(order).catch(() => {
			// Échec loggé côté Pennylane client (Task 10) - commande déjà confirmée.
		});
	}

	cookies.delete('medusa_cart_id', { path: '/' });
	return new Response(null, { status: 302, headers: { Location: '/compte' } });
};
