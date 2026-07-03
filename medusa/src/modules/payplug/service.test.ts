import { describe, it, expect, vi, beforeEach } from "vitest";
import PayPlugPaymentProviderService from "./service";

function makeService(fetchImpl: typeof fetch) {
  return new PayPlugPaymentProviderService(
    { logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } } as never,
    { secretKey: "sk_test_fake", fetchImpl },
  );
}

describe("PayPlugPaymentProviderService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("initiatePayment appelle POST /v1/payments avec le bon Authorization et retourne id+data", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pay_123", is_paid: false, is_refunded: false, failure: null }),
    });
    const service = makeService(fetchImpl as never);

    const result = await service.initiatePayment({
      amount: { numeric: 49.99 } as never,
      currency_code: "eur",
      context: {},
    } as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.payplug.com/v1/payments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk_test_fake" }),
      }),
    );
    expect(result.id).toBe("pay_123");
  });

  it("getPaymentStatus interroge GET /v1/payments/{id} et mappe le statut", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pay_123", is_paid: true, is_refunded: false, failure: null }),
    });
    const service = makeService(fetchImpl as never);

    const status = await service.getPaymentStatus({ data: { id: "pay_123" } } as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.payplug.com/v1/payments/pay_123",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer sk_test_fake" }) }),
    );
    expect(status).toEqual({ status: "captured" });
  });

  it("refundPayment appelle POST /v1/payments/{id}/refunds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "re_123" }),
    });
    const service = makeService(fetchImpl as never);

    await service.refundPayment({ data: { id: "pay_123" } } as never, 49.99);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.payplug.com/v1/payments/pay_123/refunds",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("refundPayment inclut amount en centimes dans le body quand refundAmount est fourni (remboursement partiel)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "re_123" }),
    });
    const service = makeService(fetchImpl as never);

    await service.refundPayment({ data: { id: "pay_123" } } as never, 49.99);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.payplug.com/v1/payments/pay_123/refunds",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ amount: 4999 }) }),
    );
  });

  it("refundPayment envoie un body vide quand refundAmount est absent (remboursement total, comportement inchangé)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "re_123" }),
    });
    const service = makeService(fetchImpl as never);

    await service.refundPayment({ data: { id: "pay_123" } } as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.payplug.com/v1/payments/pay_123/refunds",
      expect.objectContaining({ method: "POST", body: JSON.stringify({}) }),
    );
  });

  it("lève une erreur explicite si la réponse PayPlug n'est pas ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 402, text: async () => "carte refusée" });
    const service = makeService(fetchImpl as never);

    await expect(
      service.initiatePayment({ amount: { numeric: 10 } as never, currency_code: "eur", context: {} } as never),
    ).rejects.toThrow(/PayPlug/);
  });
});
