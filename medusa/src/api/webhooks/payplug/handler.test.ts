import { describe, it, expect } from "vitest";
import { parsePayPlugWebhookPayload } from "./handler";

describe("parsePayPlugWebhookPayload", () => {
  it("parse un payload PayPlug valide", () => {
    const raw = JSON.stringify({ id: "pay_123", is_paid: true, is_refunded: false, failure: null });

    const parsed = parsePayPlugWebhookPayload(raw);

    expect(parsed).toEqual({ id: "pay_123", is_paid: true, is_refunded: false, failure: null });
  });

  it("lève une erreur explicite si le payload n'est pas du JSON valide", () => {
    expect(() => parsePayPlugWebhookPayload("{invalide")).toThrow(/JSON/);
  });

  it("lève une erreur explicite si le champ id est absent", () => {
    expect(() => parsePayPlugWebhookPayload(JSON.stringify({ is_paid: true }))).toThrow(/id/);
  });
});
