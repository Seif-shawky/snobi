// Statuses whose item totals count towards Snobi's public donations total. A cancelled or returned
// order stops counting automatically, and delivery fees are never included.
export const DONATION_STATUSES = ["confirmed", "shipped", "delivered"] as const;

export const LEADERBOARD_SIZE = 5;
export const FEED_SIZE = 10;
export const FEED_REFRESH_MS = 20_000;

const pluralAr = (n: number, one: string, two: string, few: string, many: string) => {
  if (n === 1) return `من ${one}`;
  if (n === 2) return `من ${two}`;
  return `من ${n.toLocaleString("ar-EG")} ${n <= 10 ? few : many}`;
};

// Depends on the clock, so only render it after hydration.
export function relativeTime(at: number, now: number, ar: boolean) {
  const minutes = Math.floor(Math.max(0, now - at) / 60_000);
  if (minutes < 1) return ar ? "دلوقتي" : "just now";
  if (minutes < 60) {
    return ar ? pluralAr(minutes, "دقيقة", "دقيقتين", "دقايق", "دقيقة") : `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return ar
      ? pluralAr(hours, "ساعة", "ساعتين", "ساعات", "ساعة")
      : `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.floor(hours / 24);
  return ar
    ? pluralAr(days, "يوم", "يومين", "أيام", "يوم")
    : `${days} ${days === 1 ? "day" : "days"} ago`;
}
