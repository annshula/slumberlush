import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — three cheap jobs on every page request:
 *
 *  1. Content-Security-Policy, built from the integrations actually configured
 *     (a host is allowed only when its NEXT_PUBLIC_* id is set).
 *  2. `bl_geo` cookie with the visitor's country (from Vercel's edge header),
 *     so the client consent gate knows whether opt-in is required without
 *     making any page dynamic.
 *  3. /account presence guard (the real authorisation happens server-side in
 *     `requireCustomer()`; a forged cookie fails there).
 *
 * On `script-src 'unsafe-inline'` (documented trade-off, blueprint §32):
 * Next.js inlines its RSC payload as per-page <script> tags; nonces would force
 * every page to render dynamically and give up static/ISR delivery. No
 * user-generated HTML is rendered anywhere, the only inline scripts are ours,
 * and every other directive stays strict.
 */

const SESSION_COOKIE = "_bl_session";
const PUBLIC_ACCOUNT_PATHS = new Set([
  "/account/login",
  "/account/authorize",
  "/account/callback",
  "/account/logout",
]);
const IS_DEV = process.env.NODE_ENV !== "production";

const on = (name: string) => Boolean(process.env[name]?.trim());
const GA = on("NEXT_PUBLIC_GA_MEASUREMENT_ID") || on("NEXT_PUBLIC_GTM_ID");
const GTM = on("NEXT_PUBLIC_GTM_ID");
const META = on("NEXT_PUBLIC_META_PIXEL_ID");
const TIKTOK = on("NEXT_PUBLIC_TIKTOK_PIXEL_ID");
const CLARITY = on("NEXT_PUBLIC_CLARITY_PROJECT_ID");

const join = (...parts: (string | false)[]) => parts.filter(Boolean).join(" ");

const CSP = [
  `default-src 'self'`,
  `script-src ${join(
    "'self' 'unsafe-inline'",
    IS_DEV && "'unsafe-eval'",
    GA && "https://www.googletagmanager.com",
    META && "https://connect.facebook.net",
    TIKTOK && "https://analytics.tiktok.com",
    CLARITY && "https://www.clarity.ms https://*.clarity.ms",
  )}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${join(
    "'self' data: blob: https://cdn.shopify.com https://judgeme.imgix.net https://*.judge.me",
    GA && "https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.google.com",
    META && "https://www.facebook.com",
    TIKTOK && "https://analytics.tiktok.com",
    CLARITY && "https://*.clarity.ms https://c.bing.com",
  )}`,
  `media-src 'self' https://cdn.shopify.com`,
  `font-src 'self'`,
  `connect-src ${join(
    "'self'",
    IS_DEV && "ws://localhost:* wss://localhost:*",
    GA && "https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.google.com",
    META && "https://www.facebook.com https://connect.facebook.net https://*.run.app https://*.on.aws",
    TIKTOK && "https://analytics.tiktok.com",
    CLARITY && "https://www.clarity.ms https://*.clarity.ms",
  )}`,
  `frame-src ${join("'self'", GTM && "https://www.googletagmanager.com", META && "https://www.facebook.com")}`,
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action ${join("'self'", META && "https://www.facebook.com")}`,
  `frame-ancestors 'none'`,
  `manifest-src 'self'`,
  ...(IS_DEV ? [] : ["upgrade-insecure-requests"]),
].join("; ");

export default function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  let response: NextResponse;
  if (pathname.startsWith("/account") && !PUBLIC_ACCOUNT_PATHS.has(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/account/login";
    url.search = `?returnTo=${encodeURIComponent(pathname + search)}`;
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  response.headers.set("Content-Security-Policy", CSP);

  const country = request.headers.get("x-vercel-ip-country");
  if (country && /^[A-Z]{2}$/.test(country) && request.cookies.get("bl_geo")?.value !== country) {
    response.cookies.set("bl_geo", country, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      secure: !IS_DEV,
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|txt|json|xml)$).*)",
  ],
};
