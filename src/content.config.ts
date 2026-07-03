import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Collection `pages` — modèle block-based de la landing.
 *
 * Frontière de repo (canon §3) : Tina + Claude Code éditent `src/content/` ;
 * les composants/layouts/config restent édités par Claude Code.
 *
 * Ce schéma est le MIROIR de `tina/config.ts` (collection `pages`, templates de blocs) :
 * tout changement de champ doit être répercuté dans les deux fichiers.
 *
 * La page `home` est un singleton (`src/content/pages/home.json`) dont le champ `blocks`
 * est une liste de blocs typés (union discriminée par `_template`). `index.astro` lit ce
 * contenu et délègue le rendu au dispatcher `src/components/blocks/Blocks.astro`.
 */

// Lien réutilisable (nav header, actions de blocs, nav footer).
const link = z.object({
	label: z.string(),
	href: z.string(),
	external: z.boolean().optional(),
});

// ── Blocs typés (discriminés par `_template`, clé écrite par Tina) ───────────
const heroBlock = z.object({
	_template: z.literal('hero'),
	eyebrow: z.string().optional(),
	heading: z.string(),
	subtitle: z.string().optional(),
	actions: z
		.array(
			z.object({
				label: z.string(),
				href: z.string(),
				variant: z.enum(['primary', 'ghost']).optional(),
			}),
		)
		.optional(),
});

const featuresBlock = z.object({
	_template: z.literal('features'),
	heading: z.string(),
	lead: z.string().optional(),
	items: z.array(
		z.object({
			icon: z.string().optional(),
			title: z.string(),
			body: z.string(),
		}),
	),
});

const ctaBlock = z.object({
	_template: z.literal('cta'),
	heading: z.string(),
	body: z.string().optional(),
	action: link.optional(),
});

const block = z.discriminatedUnion('_template', [heroBlock, featuresBlock, ctaBlock]);

const pages = defineCollection({
	// Singleton(s) JSON dans `src/content/pages/`.
	loader: glob({ base: './src/content/pages', pattern: '**/*.json' }),
	schema: z.object({
		seo: z.object({
			title: z.string(),
			description: z.string(),
		}),
		header: z.object({
			brand: z.string(),
			nav: z.array(link),
		}),
		blocks: z.array(block),
		footer: z.object({
			text: z.string(),
			nav: z.array(link),
		}),
	}),
});

export const collections = { pages };
