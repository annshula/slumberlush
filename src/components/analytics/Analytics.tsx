"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { onIdle } from "@/lib/defer";

/**
 * All third-party measurement in one place, gated by consent.
 *
 *  - Visitors in regions that require opt-in (EEA, UK, CH — detected at the
 *    edge by middleware into the `bl_geo` cookie) see a consent banner; no
 *    pixel loads until they accept.
 *  - Elsewhere measurement is on by default; "Cookie settings" in the footer
 *    lets anyone opt out.
 *  - Everything loads `lazyOnload`, after the page is idle, so none of it
 *    competes with LCP or interaction.
 *  - Each provider is enabled only when its NEXT_PUBLIC_* id is set.
 */

const CONSENT_COOKIE = "bl_consent";
const OPT_IN_REGIONS = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]);

/** Ids are interpolated into inline loaders, so only plain id characters are accepted. */
const ID = /^[A-Za-z0-9-]{4,40}$/;
const clean = (v: string | undefined) => (v && ID.test(v.trim()) ? v.trim() : null);

const GA_ID = clean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
const GTM_ID = clean(process.env.NEXT_PUBLIC_GTM_ID);
const META_ID = clean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
const TIKTOK_ID = clean(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);
const CLARITY_ID = clean(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
const ANY = Boolean(GA_ID || GTM_ID || META_ID || TIKTOK_ID || CLARITY_ID);

type Consent = "granted" | "denied" | null;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeConsent(value: "granted" | "denied") {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
}

export function Analytics() {
  const [consent, setConsent] = useState<Consent>(null);
  const [needsBanner, setNeedsBanner] = useState(false);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const reopen = () => setNeedsBanner(true);
    window.addEventListener("bl:cookie-settings", reopen);
    if (!ANY) return () => window.removeEventListener("bl:cookie-settings", reopen);

    const stored = readCookie(CONSENT_COOKIE) as Consent;
    const geo = readCookie("bl_geo");
    if (stored === "granted" || stored === "denied") setConsent(stored);
    else if (geo && OPT_IN_REGIONS.has(geo)) setNeedsBanner(true);
    else setConsent("granted");
    const cancel = onIdle(() => setReady(true));
    return () => {
      window.removeEventListener("bl:cookie-settings", reopen);
      cancel();
    };
  }, []);

  // Client-side route changes → page views (the loaders send the first one).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (consent !== "granted") return;
    if (GA_ID) window.gtag?.("config", GA_ID, { page_path: pathname });
    window.fbq?.("track", "PageView");
    window.ttq?.page();
  }, [pathname, consent]);

  const decide = (value: "granted" | "denied") => {
    writeConsent(value);
    setNeedsBanner(false);
    if (value === "denied" && consent === "granted") {
      // Loaded scripts can't be unloaded; a reload applies the choice cleanly.
      location.reload();
      return;
    }
    setConsent(value);
  };

  const load = ANY && ready && consent === "granted";

  // Session replay is the heaviest script on the page and none of it matters
  // before the visitor can interact, so it's dynamically imported (code-split
  // out of the main bundle) and only started once every other gate (consent,
  // idle, id present) has already passed — same gating as every other
  // provider above, just via the SDK instead of a raw <Script> tag.
  useEffect(() => {
    if (!load || !CLARITY_ID) return;
    void import("@microsoft/clarity").then(({ default: Clarity }) => Clarity.init(CLARITY_ID));
  }, [load]);

  return (
    <>
      {load && GTM_ID && (
        <Script id="gtm" strategy="lazyOnload">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
      {load && GA_ID && (
        <>
          <Script id="ga-src" strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <Script id="ga-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {load && META_ID && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_ID}');fbq('track','PageView');`}
        </Script>
      )}
      {load && TIKTOK_ID && (
        <Script id="tiktok-pixel" strategy="lazyOnload">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK_ID}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
      {ANY && needsBanner && (
        <section
          aria-labelledby="consent-title"
          className="glass fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-media p-6 shadow-drift md:inset-x-auto md:right-6 md:bottom-6"
        >
          <h2 id="consent-title" className="font-serif text-heading-3">
            Cookies, briefly
          </h2>
          <p className="mt-2 text-body-sm text-ink-soft">
            We use essential cookies to run the store. With your permission we also use analytics and advertising
            cookies to understand what&apos;s working. You can change this any time under Cookie settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => decide("granted")}>
              Accept
            </button>
            <button type="button" className="btn-outline" onClick={() => decide("denied")}>
              Essential only
            </button>
          </div>
        </section>
      )}
    </>
  );
}
