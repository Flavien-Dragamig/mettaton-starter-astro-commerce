import { describe, it, expect } from "vitest";
import { resolveMedusaEnv } from "./env";

const REQUIRED = {
  DATABASE_URL: "postgres://medusa:pass@host:5432/medusa",
  REDIS_URL: "redis://host:6379",
  JWT_SECRET: "jwt-secret",
  COOKIE_SECRET: "cookie-secret",
  STORE_CORS: "https://boutique.example.com",
  ADMIN_CORS: "https://medusa.boutique.example.com",
  AUTH_CORS: "https://medusa.boutique.example.com",
};

describe("resolveMedusaEnv", () => {
  it("résout les variables requises", () => {
    const resolved = resolveMedusaEnv(REQUIRED);

    expect(resolved.databaseUrl).toBe(REQUIRED.DATABASE_URL);
    expect(resolved.redisUrl).toBe(REQUIRED.REDIS_URL);
    expect(resolved.jwtSecret).toBe(REQUIRED.JWT_SECRET);
    expect(resolved.cookieSecret).toBe(REQUIRED.COOKIE_SECRET);
    expect(resolved.storeCors).toBe(REQUIRED.STORE_CORS);
    expect(resolved.adminCors).toBe(REQUIRED.ADMIN_CORS);
    expect(resolved.authCors).toBe(REQUIRED.AUTH_CORS);
  });

  it("laisse les clés de paiement undefined si absentes", () => {
    const resolved = resolveMedusaEnv(REQUIRED);

    expect(resolved.stripeApiKey).toBeUndefined();
    expect(resolved.stripeWebhookSecret).toBeUndefined();
    expect(resolved.payplugSecretKey).toBeUndefined();
  });

  it("résout les clés de paiement si présentes", () => {
    const resolved = resolveMedusaEnv({
      ...REQUIRED,
      STRIPE_API_KEY: "sk_test_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_abc",
      PAYPLUG_SECRET_KEY: "sk_payplug_abc",
    });

    expect(resolved.stripeApiKey).toBe("sk_test_abc");
    expect(resolved.stripeWebhookSecret).toBe("whsec_abc");
    expect(resolved.payplugSecretKey).toBe("sk_payplug_abc");
  });

  it("lève une erreur explicite si une variable requise manque", () => {
    const { DATABASE_URL, ...withoutDb } = REQUIRED;
    void DATABASE_URL;

    expect(() => resolveMedusaEnv(withoutDb)).toThrow(/DATABASE_URL/);
  });
});
