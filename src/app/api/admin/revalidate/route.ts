import { NextResponse } from "next/server";

import {
  isAuthorizedAdminRequest,
  unauthorizedResponse,
} from "@/lib/admin/auth";
import { CACHE_TAGS, purgePath, purgeTag } from "@/lib/catalog/tags";

/**
 * POST /api/admin/revalidate
 *
 * Manual cache purge — for when a webhook was missed, or after an on-disk
 * change that isn't webhook-driven (e.g. editing data/catalog.json by hand).
 * Mirrors the reference's route (app/api/admin/revalidate/route.ts), scoped to
 * the catalog.
 *
 * Body: { tags?: string[], paths?: string[], catalog?: boolean }
 * Protected by ADMIN_API_KEY (Bearer token).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ITEMS = 50;
const MAX_ITEM_LENGTH = 500;

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_ITEMS &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        item.length <= MAX_ITEM_LENGTH,
    )
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;

  if (record.tags !== undefined && !isStringArray(record.tags)) {
    return NextResponse.json(
      { error: "Invalid body: tags must be an array of non-empty strings" },
      { status: 400 },
    );
  }
  if (record.paths !== undefined && !isStringArray(record.paths)) {
    return NextResponse.json(
      { error: "Invalid body: paths must be an array of non-empty strings" },
      { status: 400 },
    );
  }
  if (
    record.paths !== undefined &&
    (record.paths as string[]).some((path) => !path.startsWith("/"))
  ) {
    return NextResponse.json(
      { error: "Invalid body: paths must start with '/'" },
      { status: 400 },
    );
  }
  if (record.catalog !== undefined && typeof record.catalog !== "boolean") {
    return NextResponse.json(
      { error: "Invalid body: catalog must be a boolean" },
      { status: 400 },
    );
  }

  const purged: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  if (record.catalog) {
    purgeTag(CACHE_TAGS.catalog);
    purged.tags.push(CACHE_TAGS.catalog);
  }

  for (const tag of (record.tags ?? []) as string[]) {
    purgeTag(tag);
    purged.tags.push(tag);
  }

  for (const path of (record.paths ?? []) as string[]) {
    purgePath(path);
    purged.paths.push(path);
  }

  return NextResponse.json(
    { ok: true, purged },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
