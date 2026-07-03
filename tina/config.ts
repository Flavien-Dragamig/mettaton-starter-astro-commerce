import { defineConfig } from 'tinacms';

/**
 * Configuration TinaCMS self-host — starter Astro Landing (Mettaton, Lot 1).
 *
 * Frontière de repo (canon §3) : Tina édite UNIQUEMENT `src/content/`.
 * Le code, les composants et les layouts (`src/components/`, `src/layouts/`, config)
 * restent édités par Claude Code. Ce schéma est le MIROIR de `src/content.config.ts`
 * (collection `pages`, modèle block-based) : tout changement de champ doit être
 * répercuté dans les deux fichiers.
 *
 * La landing est modélisée en page singleton `src/content/pages/home.json` dont le champ
 * `blocks` est une liste de blocs typés (templates `hero`, `features`, `cta`) éditables
 * section par section dans l'admin.
 *
 * Sécurité (canon §6.3) : l'admin (`/admin`) ne doit JAMAIS être exposé sans authentification.
 * Mode local : auth servie par `tinacms dev` (LocalBackendAuthProvider).
 * Prod : AuthJS via le backend self-host (contrat figé dans `tina/backend/handler.ts`, hébergé au Lot 4).
 */

// Branche/identifiants Git du backend Tina (renseignés au Lot 4 ; valeurs neutres en local).
const branch =
	process.env.GITHUB_BRANCH ||
	process.env.VERCEL_GIT_COMMIT_REF ||
	process.env.HEAD ||
	'main';

// En mode local, l'API GraphQL est servie par le serveur `tinacms dev`.
// En prod, le backend self-host (Lot 4) expose son URL via TINA_PUBLIC_CONTENT_API_URL.
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

// Champ « lien » réutilisé (nav header, actions de blocs, nav footer) — miroir du schéma Astro.
const linkFields = [
	{ type: 'string' as const, name: 'label', label: 'Libellé', required: true },
	{ type: 'string' as const, name: 'href', label: 'Lien (URL ou ancre)', required: true },
	{ type: 'boolean' as const, name: 'external', label: 'Lien externe (nouvel onglet)' },
];

export default defineConfig({
	branch,
	// ID + token : utilisés uniquement par le backend distant (Tina Cloud OU self-host). Vides en local.
	clientId: process.env.TINA_PUBLIC_CLIENT_ID || '',
	token: process.env.TINA_TOKEN || '',
	// En local on laisse Tina cibler le serveur de dev ; en prod on force l'URL du backend self-host.
	contentApiUrlOverride: isLocal
		? '/api/tina/gql'
		: process.env.TINA_PUBLIC_CONTENT_API_URL || '/api/tina/gql',

	build: {
		// L'admin statique est généré dans `public/admin` → servi sous `/admin` par Astro.
		publicFolder: 'public',
		outputFolder: 'admin',
	},

	media: {
		tina: {
			// Toutes les images vivent dans `public/assets` (chemins `/assets/...`),
			// éditables via Tina sans friction. Modèle unifié des starters (cf. ADR images).
			mediaRoot: 'assets',
			publicFolder: 'public',
		},
	},

	schema: {
		collections: [
			{
				name: 'pages',
				label: 'Pages',
				// Miroir du loader Astro : glob `src/content/pages/**/*.json`.
				path: 'src/content/pages',
				format: 'json',
				// Page singleton : pas de création/suppression depuis l'admin.
				ui: {
					allowedActions: { create: false, delete: false },
				},
				fields: [
					{
						type: 'object',
						name: 'seo',
						label: 'SEO',
						fields: [
							{ type: 'string', name: 'title', label: 'Titre (onglet)', required: true },
							{
								type: 'string',
								name: 'description',
								label: 'Description (meta)',
								required: true,
								ui: { component: 'textarea' },
							},
						],
					},
					{
						type: 'object',
						name: 'header',
						label: 'En-tête',
						fields: [
							{ type: 'string', name: 'brand', label: 'Marque', required: true },
							{
								type: 'object',
								name: 'nav',
								label: 'Navigation',
								list: true,
								ui: { itemProps: (item) => ({ label: item?.label }) },
								fields: linkFields,
							},
						],
					},
					{
						type: 'object',
						name: 'blocks',
						label: 'Sections (blocs)',
						list: true,
						// Le `_template` choisi est écrit dans le JSON → discriminant de l'union Astro.
						ui: {
							visualSelector: true,
							itemProps: (item) => ({ label: item?._template }),
						},
						templates: [
							{
								name: 'hero',
								label: 'Hero',
								fields: [
									{ type: 'string', name: 'eyebrow', label: 'Sur-titre' },
									{ type: 'string', name: 'heading', label: 'Titre', required: true },
									{
										type: 'string',
										name: 'subtitle',
										label: 'Sous-titre',
										ui: { component: 'textarea' },
									},
									{
										type: 'object',
										name: 'actions',
										label: 'Boutons',
										list: true,
										ui: { itemProps: (item) => ({ label: item?.label }) },
										fields: [
											{ type: 'string', name: 'label', label: 'Libellé', required: true },
											{ type: 'string', name: 'href', label: 'Lien', required: true },
											{
												type: 'string',
												name: 'variant',
												label: 'Style',
												options: ['primary', 'ghost'],
											},
										],
									},
								],
							},
							{
								name: 'features',
								label: 'Fonctionnalités',
								fields: [
									{ type: 'string', name: 'heading', label: 'Titre', required: true },
									{ type: 'string', name: 'lead', label: 'Accroche', ui: { component: 'textarea' } },
									{
										type: 'object',
										name: 'items',
										label: 'Cartes',
										list: true,
										ui: { itemProps: (item) => ({ label: item?.title }) },
										fields: [
											{ type: 'string', name: 'icon', label: 'Icône (emoji)' },
											{ type: 'string', name: 'title', label: 'Titre', required: true },
											{
												type: 'string',
												name: 'body',
												label: 'Texte',
												required: true,
												ui: { component: 'textarea' },
											},
										],
									},
								],
							},
							{
								name: 'cta',
								label: 'Appel à l’action',
								fields: [
									{ type: 'string', name: 'heading', label: 'Titre', required: true },
									{ type: 'string', name: 'body', label: 'Texte', ui: { component: 'textarea' } },
									{
										type: 'object',
										name: 'action',
										label: 'Bouton',
										fields: linkFields,
									},
								],
							},
						],
					},
					{
						type: 'object',
						name: 'footer',
						label: 'Pied de page',
						fields: [
							{
								type: 'string',
								name: 'text',
								label: 'Texte (après l’année)',
								required: true,
							},
							{
								type: 'object',
								name: 'nav',
								label: 'Navigation',
								list: true,
								ui: { itemProps: (item) => ({ label: item?.label }) },
								fields: linkFields,
							},
						],
					},
				],
			},
		],
	},
});
