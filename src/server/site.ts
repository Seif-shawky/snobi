import { inArray } from "drizzle-orm";
import { SITE_SETTING_KEYS, resolveSiteContent, type SiteContent } from "@/lib/site-content";
import { getDb } from "./db/client";
import { siteSettings } from "./db/schema";

export async function readSiteSettings(): Promise<Record<string, string>> {
  const rows = await getDb()
    .select({ key: siteSettings.key, value: siteSettings.value })
    .from(siteSettings)
    .where(inArray(siteSettings.key, Object.values(SITE_SETTING_KEYS)));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function loadSiteContent(): Promise<SiteContent> {
  return resolveSiteContent(await readSiteSettings());
}
