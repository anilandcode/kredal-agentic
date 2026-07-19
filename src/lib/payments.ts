/**
 * Pilot payment links. Each plan's checkout URL comes from a public env var
 * (Stripe payment links, no SDK or secret needed). Until a link is configured
 * the pricing CTA falls back to signup — so payments can be switched on from
 * the Vercel dashboard with zero code changes.
 */

export type PaidPlanKey = "diagnostic" | "pack" | "consultant";

const LINKS: Record<PaidPlanKey, string | undefined> = {
  diagnostic: process.env.NEXT_PUBLIC_STRIPE_LINK_DIAGNOSTIC,
  pack: process.env.NEXT_PUBLIC_STRIPE_LINK_PACK,
  consultant: process.env.NEXT_PUBLIC_STRIPE_LINK_CONSULTANT,
};

export function paymentLink(plan: PaidPlanKey): string | null {
  const url = LINKS[plan]?.trim();
  return url ? url : null;
}
