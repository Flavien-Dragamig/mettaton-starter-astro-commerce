import { describe, it, expect, vi } from "vitest";
import { medusaFetch } from "./medusa-client";

describe("medusaFetch", () => {
  it("préfixe l'URL et injecte x-publishable-api-key", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push([url, init]);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
    );
    vi.stubEnv("MEDUSA_BACKEND_URL", "https://medusa.example.com");
    vi.stubEnv("MEDUSA_PUBLISHABLE_KEY", "pk_test_123");

    await medusaFetch("/store/products");

    expect(calls[0]![0]).toBe("https://medusa.example.com/store/products");
    expect((calls[0]![1]?.headers as Record<string, string>)["x-publishable-api-key"]).toBe("pk_test_123");
  });
});
