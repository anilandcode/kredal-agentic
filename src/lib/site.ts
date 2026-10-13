/**
 * Canonical site URL for metadata, sitemap, and robots. On Vercel,
 * NEXT_PUBLIC_SITE_URL should be set to the production URL (or custom domain
 * later); VERCEL_PROJECT_PRODUCTION_URL is Vercel's built-in fallback.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
