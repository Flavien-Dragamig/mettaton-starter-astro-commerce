export function getMedusaClient(): { baseUrl: string; publishableKey: string } {
  const baseUrl = import.meta.env.MEDUSA_BACKEND_URL;
  const publishableKey = import.meta.env.MEDUSA_PUBLISHABLE_KEY;
  if (!baseUrl) throw new Error("MEDUSA_BACKEND_URL manquant");
  if (!publishableKey) throw new Error("MEDUSA_PUBLISHABLE_KEY manquant");
  return { baseUrl: baseUrl.replace(/\/+$/, ""), publishableKey };
}

export async function medusaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { baseUrl, publishableKey } = getMedusaClient();
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      "x-publishable-api-key": publishableKey,
      "Content-Type": "application/json",
    },
  });
}
