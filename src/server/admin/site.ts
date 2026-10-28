import { env } from "cloudflare:workers";
import { inArray } from "drizzle-orm";
import { HERO_KEY_PATTERN, SITE_SETTING_KEYS, resolveSiteContent } from "@/lib/site-content";
import { getDb } from "../db/client";
import { siteSettings } from "../db/schema";
import { readSiteSettings } from "../site";
import { requireAdmin } from "./auth";
import { readUploadedImage } from "./images";

export type HeroUploadResult = { ok: true } | { ok: false; error: string };

function upsertSettings(values: Record<string, string>) {
  const db = getDb();
  const now = Date.now();
  return Promise.all(
    Object.entries(values).map(([key, value]) =>
      db
        .insert(siteSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: now } }),
    ),
  );
}

async function deleteHeroObject(key: string | undefined) {
  if (key && HERO_KEY_PATTERN.test(key)) await env.IMAGES.delete(key);
}

export async function adminGetSite() {
  await requireAdmin();
  const settings = await readSiteSettings();
  const content = resolveSiteContent(settings);
  return {
    heroImageUrl: content.heroImageUrl,
    // Raw values so empty descriptions stay empty in the form.
    heroAltEn: settings[SITE_SETTING_KEYS.heroAltEn] ?? "",
    heroAltAr: settings[SITE_SETTING_KEYS.heroAltAr] ?? "",
  };
}

export async function adminUploadHero(form: FormData): Promise<HeroUploadResult> {
  await requireAdmin();
  const image = await readUploadedImage(form.get("file"));
  if (!image.ok) return image;

  const previous = (await readSiteSettings())[SITE_SETTING_KEYS.heroImage];
  const key = `site/hero/${crypto.randomUUID()}.${image.extension}`;
  await env.IMAGES.put(key, image.bytes, { httpMetadata: { contentType: image.type } });
  try {
    const db = getDb();
    const now = Date.now();
    // One batch: point at the new picture and drop descriptions that described the old one.
    await db.batch([
      db
        .insert(siteSettings)
        .values({ key: SITE_SETTING_KEYS.heroImage, value: key, updatedAt: now })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value: key, updatedAt: now } }),
      db
        .delete(siteSettings)
        .where(
          inArray(siteSettings.key, [SITE_SETTING_KEYS.heroAltEn, SITE_SETTING_KEYS.heroAltAr]),
        ),
    ]);
  } catch (error) {
    await env.IMAGES.delete(key);
    throw error;
  }
  if (previous !== key) await deleteHeroObject(previous);
  return { ok: true };
}

export async function adminSaveHeroAlt(altEn: string, altAr: string) {
  await requireAdmin();
  await upsertSettings({
    [SITE_SETTING_KEYS.heroAltEn]: altEn,
    [SITE_SETTING_KEYS.heroAltAr]: altAr,
  });
  return { ok: true as const };
}

export async function adminResetHero() {
  await requireAdmin();
  const previous = (await readSiteSettings())[SITE_SETTING_KEYS.heroImage];
  await getDb()
    .delete(siteSettings)
    .where(inArray(siteSettings.key, Object.values(SITE_SETTING_KEYS)));
  await deleteHeroObject(previous);
  return { ok: true as const };
}
