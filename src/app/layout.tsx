import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { sans, serif } from "./fonts";
import { Analytics } from "@/components/analytics/Analytics";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/layout/Footer";
import { LocalizationProvider } from "@/components/localization/LocalizationProvider";
import { AnnouncementBar, Header } from "@/components/layout/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBagCatalog } from "@/lib/commerce/bag";
import { graph, organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline.replace(/\.$/, "")}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const bagCatalog = await getBagCatalog();

  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:bg-paper focus:px-4 focus:py-3 focus:shadow-drift"
        >
          Skip to content
        </a>
        <LocalizationProvider>
          <CartProvider catalog={bagCatalog}>
            <AnnouncementBar />
            <Header />
            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </LocalizationProvider>
        <Analytics />
        <JsonLd data={graph(organizationSchema(), websiteSchema())} />
      </body>
    </html>
  );
}
