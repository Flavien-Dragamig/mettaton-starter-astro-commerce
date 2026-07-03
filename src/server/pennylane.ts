// STUB TEMPORAIRE (Task 9) — remplacé par la vraie implémentation en Task 10.
//
// Le checkout facture différée (`src/pages/api/checkout/valider.ts`) fait un
// `await import('../../../server/pennylane')`. Vite/Rollup résout ce chemin
// littéral au build (analyse statique pour le code-splitting) : sans ce module,
// `npm run build` en mode `medusa` échoue (« Could not resolve … »).
//
// Ce stub no-op débloque donc le build. Task 10 implémentera réellement la
// synchronisation de la commande vers Pennylane (création facture, etc.) en
// conservant cette signature.
export async function syncOrderToPennylane(_order: unknown): Promise<void> {}
