// Re-export the CashAppStore class and singleton from the original location.
// The class body is too large (~6000 lines) to duplicate; it remains in
// lib/cash-app-store.ts which now serves as the canonical store module.
// All new code should import from this barrel (`@/lib/cash-app`) instead.
export { cashAppStore } from "../cash-app-store";
