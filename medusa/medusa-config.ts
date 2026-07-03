import { loadEnv, defineConfig } from "@medusajs/framework/utils";
import { resolveMedusaEnv } from "./src/lib/env";

loadEnv(process.env.NODE_ENV || "production", process.cwd());

const env = resolveMedusaEnv(process.env);

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: env.databaseUrl,
    redisUrl: env.redisUrl,
    http: {
      storeCors: env.storeCors,
      adminCors: env.adminCors,
      authCors: env.authCors,
      jwtSecret: env.jwtSecret,
      cookieSecret: env.cookieSecret,
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          ...(env.stripeApiKey
            ? [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: env.stripeApiKey,
                    webhookSecret: env.stripeWebhookSecret,
                  },
                },
              ]
            : []),
          {
            resolve: "./src/modules/payplug",
            id: "payplug",
            options: {
              secretKey: env.payplugSecretKey,
            },
          },
        ],
      },
    },
  ],
});
