import { describe, expect, it } from "vitest";
import {
  DEFAULT_HERO_ALT,
  SITE_SETTING_KEYS,
  isPublicImageKey,
  resolveSiteContent,
} from "@/lib/site-content";

describe("isPublicImageKey", () => {
  it("serves product photos and homepage pictures", () => {
    expect(isPublicImageKey("products/abc-123/f00d.jpg")).toBe(true);
    expect(isPublicImageKey("site/hero/7c9e6679-7425-40de-944b-e07fc1f90ae7.webp")).toBe(true);
  });

  it("rejects anything else in the bucket", () => {
    for (const key of [
      "",
      "site/hero/",
      "site/other/x.jpg",
      "site/hero/../secret.jpg",
      "site/hero/a/b.jpg",
      "products/x.jpg",
      "products/a/../b.jpg",
      "/products/a/b.jpg",
      "backups/db.sql",
    ]) {
      expect(isPublicImageKey(key), key).toBe(false);
    }
  });
});

describe("resolveSiteContent", () => {
  it("falls back to the bundled drawing with its own descriptions", () => {
    expect(resolveSiteContent({})).toEqual({
      heroImageUrl: null,
      heroAltEn: DEFAULT_HERO_ALT.en,
      heroAltAr: DEFAULT_HERO_ALT.ar,
    });
  });

  it("ignores leftover descriptions when there is no uploaded picture", () => {
    const content = resolveSiteContent({ [SITE_SETTING_KEYS.heroAltEn]: "old photo" });
    expect(content.heroImageUrl).toBeNull();
    expect(content.heroAltEn).toBe(DEFAULT_HERO_ALT.en);
  });

  it("ignores a stored key that is not a homepage picture", () => {
    expect(
      resolveSiteContent({ [SITE_SETTING_KEYS.heroImage]: "products/a/b.jpg" }).heroImageUrl,
    ).toBeNull();
  });

  it("uses the uploaded picture and its descriptions", () => {
    expect(
      resolveSiteContent({
        [SITE_SETTING_KEYS.heroImage]: "site/hero/abc.png",
        [SITE_SETTING_KEYS.heroAltEn]: " Snobi on a bench ",
        [SITE_SETTING_KEYS.heroAltAr]: "سنوبي على دكة",
      }),
    ).toEqual({
      heroImageUrl: "/images/site/hero/abc.png",
      heroAltEn: "Snobi on a bench",
      heroAltAr: "سنوبي على دكة",
    });
  });

  it("never leaves an uploaded picture without a description", () => {
    const content = resolveSiteContent({
      [SITE_SETTING_KEYS.heroImage]: "site/hero/abc.png",
      [SITE_SETTING_KEYS.heroAltEn]: "  ",
    });
    expect(content.heroAltEn).not.toBe("");
    expect(content.heroAltAr).not.toBe("");
    expect(content.heroAltEn).not.toBe(DEFAULT_HERO_ALT.en);
  });
});
