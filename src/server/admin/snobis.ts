import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { snobiImageUrl } from "@/lib/account-rules";
import { moveInOrder, readLayerPng, snobiNamesSchema } from "@/lib/admin-layers";
import { toFieldErrors, type FieldErrors } from "@/lib/admin-shared";
import { SNOBI_KEY_PATTERN } from "@/lib/site-content";
import { getDb } from "../db/client";
import { snobiOptions, users } from "../db/schema";
import { requireAdmin } from "./auth";
import { imagesBucket, PHOTO_STORAGE_MISSING } from "../images-bucket";

export type SnobiActionResult = { ok: true } | { ok: false; error: string };
export type SnobiFormResult = { ok: true } | { ok: false; fieldErrors: FieldErrors };

const LAST_ACTIVE =
  "This is the last active Snobi. Nobody could create an account without one, so add or restore another first.";
const GONE = "This Snobi no longer exists. Refresh the page.";

// Guards inside the statement, so two admin tabs can't each retire one of the last two.
const anotherActive = (id: string) =>
  sql`exists (select 1 from snobi_options o where o.active = 1 and o.id <> ${id})`;

async function nextSortOrder() {
  const [last] = await getDb()
    .select({ max: sql<number | null>`max(${snobiOptions.sortOrder})` })
    .from(snobiOptions);
  return (last?.max ?? 0) + 10;
}

export async function adminListSnobis() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: snobiOptions.id,
      nameEn: snobiOptions.nameEn,
      nameAr: snobiOptions.nameAr,
      imageKey: snobiOptions.imageKey,
      active: snobiOptions.active,
      accounts: sql<number>`(select count(*) from users u where u.snobi_option_id = "snobi_options"."id")`,
    })
    .from(snobiOptions)
    .orderBy(desc(snobiOptions.active), asc(snobiOptions.sortOrder), asc(snobiOptions.createdAt));
  return rows.map(({ imageKey, ...row }) => ({ ...row, imageUrl: snobiImageUrl(imageKey) }));
}

export async function adminAddSnobi(form: FormData): Promise<SnobiFormResult> {
  await requireAdmin();
  const names = snobiNamesSchema.safeParse({
    nameEn: form.get("nameEn"),
    nameAr: form.get("nameAr"),
  });
  const image = await readLayerPng(form.get("file"));
  if (!names.success || !image.ok) {
    return {
      ok: false,
      fieldErrors: {
        ...(names.success ? {} : toFieldErrors(names.error)),
        ...(image.ok ? {} : { file: image.error }),
      },
    };
  }
  const bucket = imagesBucket();
  if (!bucket) return { ok: false, fieldErrors: { form: PHOTO_STORAGE_MISSING } };

  const id = crypto.randomUUID();
  const imageKey = `site/snobis/${id}.png`;
  await bucket.put(imageKey, image.bytes, { httpMetadata: { contentType: "image/png" } });
  try {
    await getDb()
      .insert(snobiOptions)
      .values({ id, ...names.data, imageKey, sortOrder: await nextSortOrder() });
  } catch (error) {
    await bucket.delete(imageKey);
    throw error;
  }
  return { ok: true };
}

export async function adminRenameSnobi(id: string, nameEn: string, nameAr: string) {
  await requireAdmin();
  const updated = await getDb()
    .update(snobiOptions)
    .set({ nameEn, nameAr })
    .where(eq(snobiOptions.id, id))
    .returning({ id: snobiOptions.id });
  return updated.length ? ({ ok: true } as const) : ({ ok: false, error: GONE } as const);
}

// Only active options are reordered: those are the ones customers see in this order.
export async function adminMoveSnobi(id: string, delta: -1 | 1) {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select({ id: snobiOptions.id })
    .from(snobiOptions)
    .where(eq(snobiOptions.active, true))
    .orderBy(asc(snobiOptions.sortOrder), asc(snobiOptions.createdAt));
  const statements: BatchItem<"sqlite">[] = moveInOrder(
    rows.map((r) => r.id),
    id,
    delta,
  ).map((optionId, index) =>
    db
      .update(snobiOptions)
      .set({ sortOrder: (index + 1) * 10 })
      .where(eq(snobiOptions.id, optionId)),
  );
  if (statements.length) {
    await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  }
  return { ok: true as const };
}

export async function adminRetireSnobi(id: string): Promise<SnobiActionResult> {
  await requireAdmin();
  const db = getDb();
  const retired = await db
    .update(snobiOptions)
    .set({ active: false })
    .where(and(eq(snobiOptions.id, id), eq(snobiOptions.active, true), anotherActive(id)))
    .returning({ id: snobiOptions.id });
  if (retired.length) return { ok: true };
  const [option] = await db
    .select({ active: snobiOptions.active })
    .from(snobiOptions)
    .where(eq(snobiOptions.id, id));
  if (!option) return { ok: false, error: GONE };
  return option.active ? { ok: false, error: LAST_ACTIVE } : { ok: true };
}

export async function adminRestoreSnobi(id: string): Promise<SnobiActionResult> {
  await requireAdmin();
  const updated = await getDb()
    .update(snobiOptions)
    // Comes back at the end of the list customers see.
    .set({ active: true, sortOrder: await nextSortOrder() })
    .where(eq(snobiOptions.id, id))
    .returning({ id: snobiOptions.id });
  return updated.length ? { ok: true } : { ok: false, error: GONE };
}

export async function adminDeleteSnobi(id: string): Promise<SnobiActionResult> {
  await requireAdmin();
  const db = getDb();
  const [usage] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.snobiOptionId, id));
  const accounts = usage?.count ?? 0;
  if (accounts > 0) {
    return {
      ok: false,
      error: `${accounts} ${accounts === 1 ? "account uses" : "accounts use"} this Snobi, so it can't be deleted. Retire it instead: they keep it, and new customers stop seeing it.`,
    };
  }
  const [deleted] = await db
    .delete(snobiOptions)
    .where(
      and(
        eq(snobiOptions.id, id),
        sql`not exists (select 1 from users u where u.snobi_option_id = ${id})`,
        sql`(${snobiOptions.active} = 0 or ${anotherActive(id)})`,
      ),
    )
    .returning({ imageKey: snobiOptions.imageKey });
  if (!deleted) {
    const [option] = await db
      .select({ id: snobiOptions.id })
      .from(snobiOptions)
      .where(eq(snobiOptions.id, id));
    return option ? { ok: false, error: LAST_ACTIVE } : { ok: true };
  }
  // builtin: files ship with the site and aren't in R2.
  if (SNOBI_KEY_PATTERN.test(deleted.imageKey)) await imagesBucket()?.delete(deleted.imageKey);
  return { ok: true };
}
