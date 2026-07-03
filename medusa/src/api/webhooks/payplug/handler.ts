export interface PayPlugWebhookPayload {
  id: string;
  is_paid: boolean;
  is_refunded: boolean;
  failure: unknown;
}

/**
 * Parse et valide minimalement le corps brut d'un webhook PayPlug. PayPlug
 * ne documente pas de signature HMAC vérifiable publiquement au moment de
 * l'écriture (à reconfirmer contre la doc à jour lors de la validation
 * live) - validation limitée à la présence des champs attendus.
 */
export function parsePayPlugWebhookPayload(raw: string): PayPlugWebhookPayload {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Payload webhook PayPlug : JSON invalide");
  }
  const obj = json as Record<string, unknown>;
  if (typeof obj.id !== "string") {
    throw new Error("Payload webhook PayPlug : champ id manquant ou invalide");
  }
  return {
    id: obj.id,
    is_paid: Boolean(obj.is_paid),
    is_refunded: Boolean(obj.is_refunded),
    failure: obj.failure ?? null,
  };
}
