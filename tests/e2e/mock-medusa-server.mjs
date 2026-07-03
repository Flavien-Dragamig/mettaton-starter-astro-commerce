// Stub HTTP minimal du backend Medusa pour les tests E2E.
//
// Pourquoi ce serveur ? Le storefront tourne en mode `medusa` = SSR Node.
// Les appels à l'API Store Medusa (`/store/products`, `/store/carts/:id`,
// `/store/customers/me`) partent du PROCESSUS Astro (fetch côté serveur), pas
// du navigateur. `page.route` de Playwright n'intercepte que les requêtes du
// navigateur : il ne peut donc PAS mocker ces fetch SSR. On sert ici des
// fixtures figées sur `MEDUSA_BACKEND_URL` pour que le rendu serveur dispose
// des mêmes données que celles décrites dans les tests. Ce n'est pas un vrai
// backend Medusa (aucune base, aucune logique) : juste un double de test.
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_MEDUSA_PORT ?? 9000);

const product = {
	handle: 'tshirt-logo',
	title: 'T-shirt logo',
	thumbnail: '/assets/tshirt.jpg',
	description: 'T-shirt 100% coton bio.',
	variants: [{ id: 'variant_1' }],
};

const routes = [
	{ match: (p) => p.startsWith('/store/products'), body: { products: [product] } },
	{
		match: (p) => p.startsWith('/store/carts/cart_1'),
		body: { cart: { items: [{ title: 'T-shirt logo', quantity: 1, total: 1990 }], total: 1990 } },
	},
	{
		match: (p) => p.startsWith('/store/customers/me'),
		body: { customer: { groups: [{ name: 'B2B' }] } },
	},
];

const server = createServer((req, res) => {
	const { pathname } = new URL(req.url ?? '/', `http://localhost:${PORT}`);
	const route = routes.find((r) => r.match(pathname));
	res.setHeader('Content-Type', 'application/json');
	if (route) {
		res.statusCode = 200;
		res.end(JSON.stringify(route.body));
	} else {
		res.statusCode = 404;
		res.end(JSON.stringify({ message: `no stub for ${pathname}` }));
	}
});

server.listen(PORT, () => {
	console.log(`[mock-medusa] écoute sur http://127.0.0.1:${PORT}`);
});
