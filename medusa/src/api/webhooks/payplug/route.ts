import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { parsePayPlugWebhookPayload } from "./handler";

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    parsePayPlugWebhookPayload(raw);
    // Le rapprochement paiement↔commande est délégué au module Payment
    // (getWebhookActionAndData, Task 8) via le pipeline webhook standard de
    // Medusa - cette route ne fait qu'accuser réception après validation.
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
