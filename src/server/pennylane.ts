interface MedusaOrderItem {
  title: string;
  quantity: number;
  unit_price: number; // en centimes
}

interface MedusaOrder {
  id: string;
  display_id: number;
  customer: { email: string; first_name: string; last_name: string };
  items: MedusaOrderItem[];
  created_at: string;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Synchronise une commande Medusa payée en facture différée (30 jours) vers
 * Pennylane. Ne lève JAMAIS d'exception - un échec ne doit pas bloquer la
 * confirmation de commande côté checkout (cf. spec, gestion d'erreurs).
 */
export async function syncOrderToPennylane(order: MedusaOrder): Promise<void> {
  try {
    const token = import.meta.env.PENNYLANE_API_TOKEN;
    if (!token) throw new Error("PENNYLANE_API_TOKEN manquant");

    const res = await fetch("https://app.pennylane.com/api/external/v2/customer_invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: order.created_at.slice(0, 10),
        deadline: addDays(order.created_at, 30),
        draft: false,
        invoice_lines: order.items.map((item) => ({
          label: item.title,
          quantity: item.quantity,
          unit: "unit",
          raw_currency_unit_price: (item.unit_price / 100).toFixed(2),
          vat_rate: "FR_200",
        })),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Pennylane customer_invoices failed (order ${order.display_id}): ${res.status} ${text}`);
    }
  } catch (err) {
    console.error(`syncOrderToPennylane failed (order ${order.display_id}):`, err);
  }
}
