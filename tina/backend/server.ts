/**
 * Serveur backend TinaCMS self-host (Mettaton, Lot 4a).
 *
 * Process Node autonome (le site Astro est statique, sans runtime serveur) qui :
 *   - monte le handler `TinaNodeBackend` sous `/api/tina/*` (GraphQL + auth) ;
 *   - sert l'admin statique (`public/admin`) sous `/admin` ;
 *   - expose `/healthz` pour les healthchecks de l'hôte (Dokploy/Traefik).
 *
 * Conteneurisé par `Dockerfile.backend`, « un artefact, N sites » : toute la
 * configuration vient des variables d'environnement (cf. `.env.example`). Aucun
 * secret n'est cuit dans l'image (canon §7.4).
 */
import { resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { tinaBackendHandler } from './handler';

const port = Number(process.env.PORT || 4001);

// Origine autorisée pour l'admin SPA (même origine par défaut, surchargée si besoin).
const corsOrigin = process.env.TINA_PUBLIC_SITE_URL || true;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Healthcheck (avant l'auth) pour les sondes de l'hôte.
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'tina-backend' });
});

// Backend Tina : GraphQL + auth AuthJS. Toutes méthodes proxées au handler.
const tinaRoutes = (req: express.Request, res: express.Response, next: express.NextFunction) =>
  tinaBackendHandler(req, res, next);
app.get('/api/tina/*', tinaRoutes);
app.post('/api/tina/*', tinaRoutes);

// Admin statique généré par `tinacms build` (public/admin → servi sous /admin).
// Résolu depuis la racine d'exécution (WORKDIR /app du conteneur, racine du repo en dev) :
// robuste que l'on lance le source via tsx ou le bundle dist-backend/server.mjs.
const adminDir = process.env.TINA_ADMIN_DIR || resolve(process.cwd(), 'public/admin');
app.use('/admin', express.static(adminDir));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[tina-backend] à l'écoute sur :${port} (admin: /admin, api: /api/tina)`);
});
