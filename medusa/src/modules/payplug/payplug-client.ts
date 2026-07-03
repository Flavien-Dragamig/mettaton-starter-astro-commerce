import type { CreatePaymentInput, PayPlugPayment } from "./types";

/**
 * Construit le payload de création de paiement PayPlug (pur, pas d'I/O).
 * Réf. POST https://api.payplug.com/v1/payments.
 */
export function buildCreatePaymentPayload(input: CreatePaymentInput): Record<string, unknown> {
  return {
    amount: input.amountCents,
    currency: input.currency,
    hosted_payment: {
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
    },
    notification_url: input.notificationUrl,
  };
}

/**
 * Mappe le statut d'un paiement PayPlug vers le vocabulaire Medusa. Un
 * paiement remboursé après capture est mappé en "error" plutôt que
 * "captured" : le remboursement passe par le flux refundPayment dédié
 * de Medusa, pas par un statut de paiement "capturé avec réserve".
 */
export function mapPayPlugStatusToMedusa(
  payment: Pick<PayPlugPayment, "is_paid" | "is_refunded" | "failure">,
): "authorized" | "captured" | "error" | "pending" {
  if (payment.failure) return "error";
  if (payment.is_paid && payment.is_refunded) return "error";
  if (payment.is_paid) return "captured";
  return "pending";
}
