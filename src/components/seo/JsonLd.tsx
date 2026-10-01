/**
 * Renders a JSON-LD block. `<` is escaped so no string inside the data can
 * close the script element (all data is our own, but defence in depth).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
