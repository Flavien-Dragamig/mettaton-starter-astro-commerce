/**
 * Forme (partielle, champs utilisés seulement) de la réponse de l'API PayPlug
 * pour une ressource Payment. Réf. https://docs.payplug.com/api/payment.html
 * (à re-vérifier contre la doc à jour au moment de la validation live - non
 * testé en réel dans ce lot, pas de clés sandbox disponibles).
 */
export interface PayPlugPayment {
  id: string;
  is_paid: boolean;
  is_refunded: boolean;
  amount: number;
  currency: string;
  failure: { code: string; message: string } | null;
  hosted_payment?: {
    payment_url: string;
  };
}

export interface CreatePaymentInput {
  amountCents: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  notificationUrl: string;
}
