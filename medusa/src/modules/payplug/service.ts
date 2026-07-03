import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils";
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { buildCreatePaymentPayload, mapPayPlugStatusToMedusa } from "./payplug-client";
import type { PayPlugPayment } from "./types";

interface PayPlugOptions {
  secretKey?: string;
  fetchImpl?: typeof fetch;
}

const API_BASE = "https://api.payplug.com/v1";

/**
 * Module Payment Provider custom pour PayPlug (aucun plugin officiel Medusa
 * v2 n'existe, contrairement à Stripe). Écrit contre la doc API PayPlug
 * publique, testé en mocks HTTP uniquement - pas de clés sandbox disponibles
 * au moment de ce lot, validation live à faire avant tout client B2C réel
 * utilisant PayPlug.
 *
 * Le module est enregistré inconditionnellement dans medusa-config.ts (pas
 * de garde comme pour Stripe), donc `secretKey` peut être undefined tant
 * qu'un client n'a pas activé PayPlug : le constructeur ne doit jamais
 * lever, seul un appel HTTP réel doit échouer (401/403 côté PayPlug).
 */
export default class PayPlugPaymentProviderService extends AbstractPaymentProvider<PayPlugOptions> {
  static identifier = "payplug";

  protected readonly secretKey_: string | undefined;
  protected readonly fetch_: typeof fetch;

  constructor(container: unknown, options: PayPlugOptions) {
    super(container as never, options);
    this.secretKey_ = options.secretKey;
    this.fetch_ = options.fetchImpl ?? globalThis.fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this.fetch_(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${this.secretKey_}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PayPlug API error (${res.status}) sur ${path} : ${text}`);
    }
    return (await res.json()) as T;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const context = input.context as { return_url?: string; cancel_url?: string; notification_url?: string } | undefined;
    const payload = buildCreatePaymentPayload({
      amountCents: Math.round(new BigNumber(input.amount).numeric * 100),
      currency: input.currency_code.toUpperCase(),
      returnUrl: context?.return_url ?? "",
      cancelUrl: context?.cancel_url ?? "",
      notificationUrl: context?.notification_url ?? "",
    });
    const payment = await this.request<PayPlugPayment>("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { id: payment.id, data: payment as unknown as Record<string, unknown> };
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const id = (input.data as { id: string }).id;
    const payment = await this.request<PayPlugPayment>(`/payments/${id}`);
    return {
      data: payment as unknown as Record<string, unknown>,
      status: mapPayPlugStatusToMedusa(payment),
    };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const id = (input.data as { id: string }).id;
    const payment = await this.request<PayPlugPayment>(`/payments/${id}`);
    return { status: mapPayPlugStatusToMedusa(payment) };
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const id = (input.data as { id: string }).id;
    const payment = await this.request<PayPlugPayment>(`/payments/${id}`);
    return { data: payment as unknown as Record<string, unknown> };
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // PayPlug capture à l'autorisation par défaut (paiement immédiat) - pas de
    // capture différée dans ce lot. La donnée est déjà à jour côté PayPlug.
    return { data: input.data ?? {} };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data ?? {} };
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} };
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data ?? {} };
  }

  async refundPayment(input: RefundPaymentInput, refundAmount?: number): Promise<RefundPaymentOutput> {
    const id = (input.data as { id: string }).id;
    // PayPlug traite un champ `amount` absent comme "rembourser le solde
    // restant total" - un `refundAmount` fourni doit donc impérativement être
    // converti en centimes (même convention que buildCreatePaymentPayload) et
    // transmis, sous peine de transformer silencieusement un remboursement
    // partiel en remboursement total.
    const body =
      refundAmount === undefined ? {} : { amount: Math.round(refundAmount * 100) };
    await this.request(`/payments/${id}/refunds`, { method: "POST", body: JSON.stringify(body) });
    return { data: input.data ?? {} };
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    const data = payload.data as unknown as PayPlugPayment;
    const status = mapPayPlugStatusToMedusa(data);
    const action = status === "captured" ? "captured" : status === "error" ? "failed" : "not_supported";
    return {
      action,
      data: { session_id: data.id, amount: data.amount },
    };
  }
}
