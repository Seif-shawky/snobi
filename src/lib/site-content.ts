// Pure, client-safe rules for owner-editable site content. No server imports, so it can be
// bundled for the browser and unit-tested.

export const SITE_SETTING_KEYS = {
  heroImage: "hero_image_key",
  heroAltEn: "hero_alt_en",
  heroAltAr: "hero_alt_ar",
} as const;

export const HERO_KEY_PATTERN = /^site\/hero\/[\w.-]+$/;
const PRODUCT_KEY_PATTERN = /^products\/[\w-]+\/[\w.-]+$/;

// Only these R2 keys are served publicly by /images/$.
export function isPublicImageKey(key: string): boolean {
  return PRODUCT_KEY_PATTERN.test(key) || HERO_KEY_PATTERN.test(key);
}

export const MAX_ALT_LENGTH = 200;

export const DEFAULT_HERO_ALT = {
  en: "Ink drawing of Snobi, a small black-and-white dog, sitting alone on a dusty roadside in Egypt with nothing but pebbles and dry leaves around him",
  ar: "رسمة بالحبر لسنوبي، كلب صغير أبيض وإسود، قاعد لوحده على جنب طريق مترب في مصر ومفيش حواليه غير زلط وورق شجر ناشف",
} as const;

// Used when the owner uploads a photo but leaves its description empty.
const GENERIC_HERO_ALT = {
  en: "Snobi, the broke hand-drawn dog",
  ar: "سنوبي، الكلب المرسوم المفلس",
} as const;

export interface SiteContent {
  // Null means: show the bundled Phase 0 drawing.
  heroImageUrl: string | null;
  heroAltEn: string;
  heroAltAr: string;
}

export function resolveSiteContent(settings: Record<string, string | undefined>): SiteContent {
  const key = settings[SITE_SETTING_KEYS.heroImage];
  if (!key || !HERO_KEY_PATTERN.test(key)) {
    return { heroImageUrl: null, heroAltEn: DEFAULT_HERO_ALT.en, heroAltAr: DEFAULT_HERO_ALT.ar };
  }
  return {
    heroImageUrl: `/images/${key}`,
    heroAltEn: settings[SITE_SETTING_KEYS.heroAltEn]?.trim() || GENERIC_HERO_ALT.en,
    heroAltAr: settings[SITE_SETTING_KEYS.heroAltAr]?.trim() || GENERIC_HERO_ALT.ar,
  };
}
