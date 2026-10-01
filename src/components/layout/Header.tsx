import Link from "next/link";

import {
  BagButton,
  DesktopNav,
  HeaderShell,
  MobileMenu,
  type MegaCategory,
  type MegaData,
} from "@/components/layout/HeaderClient";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";
import { collections, type CollectionContent } from "@/content/collections";
import { primaryNav } from "@/content/navigation";
import { getProducts, storeCurrency } from "@/lib/catalog";
import { buildProductView } from "@/lib/commerce/product-view";
import { formatMoney } from "@/lib/money";
import { site } from "@/lib/site";

/**
 * The site-wide announcement bar. Server-rendered once in the root layout;
 * hidden on the home page by CSS so the nav and hero read as one surface.
 */
export function AnnouncementBar() {
  return (
    <div data-announcement className="night-sky text-moon-100">
      <p className="container-page flex h-(--announce-h) items-center justify-center gap-5 text-center text-[0.8rem] tracking-[0.04em]">
        <span className="flex items-center gap-2">
          <Icon name="moon" className="size-3.5 text-honey-300" />
          {site.freeShippingThreshold
            ? `Free shipping over $${site.freeShippingThreshold}`
            : "Tracked delivery on every order"}
        </span>
        <span className="hidden items-center gap-2 sm:flex">
          <Icon name="moon" className="size-3.5 text-honey-300" />
          Sleep on it — {site.returnWindowDays}-day returns
        </span>
        <span className="hidden items-center gap-2 lg:flex">
          <Icon name="moon" className="size-3.5 text-honey-300" />
          Gift-wrapped on request
        </span>
      </p>
    </div>
  );
}

/** Sleep and Comfort mega-menu content: categories with live counts + a featured product. */
async function getMegaData(): Promise<MegaData> {
  const [products, currency] = await Promise.all([getProducts(), storeCurrency()]);
  const views = products.map((p) => ({ p, view: buildProductView(p.record, p.content, currency) }));

  const toCategory = (c: CollectionContent): MegaCategory => {
    const inCategory = views.filter(({ p }) =>
      (c.categories as string[]).includes(p.content.category.slug),
    );
    return {
      label: c.title,
      tagline: c.tagline,
      href: `/collections/${c.slug}`,
      count: inCategory.length,
      icon: c.icon,
      image: inCategory[0]?.view.cardImage?.url ?? null,
    };
  };

  const featured = (handle: string) => {
    const v = views.find(({ view }) => view.handle === handle)?.view;
    return v && v.cardImage
      ? {
          name: v.name,
          href: v.href,
          image: v.cardImage.url,
          price: `From ${formatMoney(v.fromPrice, v.currency)}`,
        }
      : null;
  };

  return {
    sleep: collections.filter((c) => c.group === "sleep").map(toCategory),
    comfort: collections.filter((c) => c.group === "comfort").map(toCategory),
    featuredSleep: featured("cloud-dreamer-blanket"),
    featuredComfort: featured("dreamday-plush-robe"),
    browseAllHref: "/collections/all",
  };
}

/**
 * Header. Over the home hero it is transparent and blends into the hero (no
 * line, border or shadow); once the page scrolls, and on every other page,
 * it becomes the floating porcelain bar — see HeaderShell.
 */
export async function Header() {
  const mega = await getMegaData();
  return (
    <header className="sticky top-0 z-30 lg:pt-3">
      <HeaderShell>
        <div className="flex h-full items-center self-stretch">
          <div className="flex items-center lg:hidden">
            <MobileMenu groups={primaryNav} />
            <Link
              href="/search"
              className="hidden size-11 place-items-center rounded-xl hover:bg-ink/5 sm:grid lg:hidden"
              aria-label="Search"
            >
              <Icon name="search" />
            </Link>
          </div>
          <DesktopNav groups={primaryNav} mega={mega} />
        </div>

        <Link
          href="/"
          className="justify-self-center"
          aria-label={`${site.name} — home`}
        >
          <Wordmark priority className="h-7 sm:h-8 lg:h-10" />
        </Link>

        <div className="flex items-center justify-end gap-1">
          <Link
            href="/search"
            className="hidden size-11 place-items-center rounded-xl hover:bg-ink/5 lg:grid"
            aria-label="Search"
          >
            <Icon name="search" />
          </Link>
          <Link
            href="/account"
            prefetch={false}
            className="hidden size-11 place-items-center rounded-xl hover:bg-ink/5 lg:grid"
            aria-label="Account"
          >
            <Icon name="user" />
          </Link>
          <BagButton />
        </div>
      </HeaderShell>
    </header>
  );
}
