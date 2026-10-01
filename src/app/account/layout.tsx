import type { ReactNode } from "react";

import { AccountNav } from "@/components/account/AccountNav";
import { isSignedIn } from "@/lib/shopify/guard";

/** Account shell: nav rail beside content for signed-in customers. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  if (!(await isSignedIn())) return <>{children}</>;

  return (
    <section className="min-h-[70vh] bg-ivory pt-10 pb-20 md:pb-28">
      <div className="container-page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
