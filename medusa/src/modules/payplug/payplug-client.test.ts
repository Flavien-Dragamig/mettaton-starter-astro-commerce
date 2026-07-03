import { describe, it, expect } from "vitest";
import { buildCreatePaymentPayload, mapPayPlugStatusToMedusa } from "./payplug-client";

describe("buildCreatePaymentPayload", () => {
  it("construit le payload PayPlug attendu (montant en centimes, EUR)", () => {
    const payload = buildCreatePaymentPayload({
      amountCents: 4999,
      currency: "EUR",
      returnUrl: "https://boutique.example.com/checkout/retour",
      cancelUrl: "https://boutique.example.com/checkout/annule",
      notificationUrl: "https://medusa.boutique.example.com/webhooks/payplug",
    });

    expect(payload).toEqual({
      amount: 4999,
      currency: "EUR",
      hosted_payment: {
        return_url: "https://boutique.example.com/checkout/retour",
        cancel_url: "https://boutique.example.com/checkout/annule",
      },
      notification_url: "https://medusa.boutique.example.com/webhooks/payplug",
    });
  });
});

describe("mapPayPlugStatusToMedusa", () => {
  it("mappe un paiement payé et non remboursé en 'captured'", () => {
    const status = mapPayPlugStatusToMedusa({ is_paid: true, is_refunded: false, failure: null });
    expect(status).toBe("captured");
  });

  it("mappe un paiement payé puis remboursé en 'error' (remboursement = hors flux standard)", () => {
    const status = mapPayPlugStatusToMedusa({ is_paid: true, is_refunded: true, failure: null });
    expect(status).toBe("error");
  });

  it("mappe un échec explicite en 'error'", () => {
    const status = mapPayPlugStatusToMedusa({
      is_paid: false,
      is_refunded: false,
      failure: { code: "card_declined", message: "Carte refusée" },
    });
    expect(status).toBe("error");
  });

  it("mappe un paiement non payé sans échec en 'pending'", () => {
    const status = mapPayPlugStatusToMedusa({ is_paid: false, is_refunded: false, failure: null });
    expect(status).toBe("pending");
  });
});
