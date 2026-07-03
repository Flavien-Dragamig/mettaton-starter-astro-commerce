export interface ResolvedMedusaEnv {
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  cookieSecret: string;
  storeCors: string;
  adminCors: string;
  authCors: string;
  stripeApiKey?: string;
  stripeWebhookSecret?: string;
  payplugSecretKey?: string;
}

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "COOKIE_SECRET",
  "STORE_CORS",
  "ADMIN_CORS",
  "AUTH_CORS",
] as const;

/**
 * Résout et valide les variables d'environnement Medusa. Noms figés côté
 * portail (src/lib/medusa-provision.ts:buildMedusaEnv, repo Mettaton) - ne
 * pas renommer ces clés sans mettre à jour les deux côtés.
 */
export function resolveMedusaEnv(env: Record<string, string | undefined>): ResolvedMedusaEnv {
  for (const key of REQUIRED_KEYS) {
    if (!env[key]) {
      throw new Error(`Variable d'environnement Medusa requise manquante : ${key}`);
    }
  }

  return {
    databaseUrl: env.DATABASE_URL!,
    redisUrl: env.REDIS_URL!,
    jwtSecret: env.JWT_SECRET!,
    cookieSecret: env.COOKIE_SECRET!,
    storeCors: env.STORE_CORS!,
    adminCors: env.ADMIN_CORS!,
    authCors: env.AUTH_CORS!,
    stripeApiKey: env.STRIPE_API_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    payplugSecretKey: env.PAYPLUG_SECRET_KEY,
  };
}
