import { describe, it, expect, vi } from "vitest";
import { syncOrderToPennylane } from "./pennylane";

describe("syncOrderToPennylane", () => {
  it("crée une facture Pennylane avec une échéance à 30 jours", async () => {
    const calls: [string, RequestInit][] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push([url, init]);
        return new Response(JSON.stringify({ id: "inv_1" }), { status: 201 });
      }),
    );
    vi.stubEnv("PENNYLANE_API_TOKEN", "test-token");

    await syncOrderToPennylane({
      id: "order_1",
      display_id: 1,
      customer: { email: "client@example.com", first_name: "Jean", last_name: "Dupont" },
      items: [{ title: "T-shirt logo", quantity: 2, unit_price: 2490 }],
      created_at: "2026-07-03T10:00:00.000Z",
    });

    expect(calls).toHaveLength(1);
    const [url, init] = calls[0]!;
    expect(url).toBe("https://app.pennylane.com/api/external/v2/customer_invoices");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    const body = JSON.parse(init.body as string);
    expect(body.deadline).toBe("2026-08-02");
    expect(body.invoice_lines[0].label).toBe("T-shirt logo");
    expect(body.invoice_lines[0].quantity).toBe(2);
  });

  it("ne lève pas d'exception si l'appel échoue (ne doit jamais bloquer le checkout)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("erreur", { status: 500 })));
    vi.stubEnv("PENNYLANE_API_TOKEN", "test-token");

    await expect(
      syncOrderToPennylane({
        id: "order_2",
        display_id: 2,
        customer: { email: "b@example.com", first_name: "B", last_name: "B" },
        items: [{ title: "Mug", quantity: 1, unit_price: 1490 }],
        created_at: "2026-07-03T10:00:00.000Z",
      }),
    ).resolves.toBeUndefined();
  });
});
