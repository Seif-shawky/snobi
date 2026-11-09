import { NEXT_PHASE_GOAL_DONATIONS, phaseProgressPercent } from "@/lib/phase";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { snobiImageUrl, type PublicSnobi } from "@/lib/account-rules";
import { DONATION_STATUSES, FEED_SIZE, LEADERBOARD_SIZE } from "@/lib/community-rules";
import { getDb } from "./db/client";
import { orderItems, orders, products, snobiOptions, userWornItems, users } from "./db/schema";

const counted = inArray(orders.status, [...DONATION_STATUSES]);

// Layers for what each user chose to wear, limited to items delivered to them and not returned.
export async function loadWornUrls(userIds: string[]) {
  const worn = new Map<string, string[]>();
  if (userIds.length === 0) return worn;
  const rows = await getDb()
    .selectDistinct({
      userId: userWornItems.userId,
      wearableKey: products.wearableKey,
      wornAt: userWornItems.createdAt,
    })
    .from(userWornItems)
    .innerJoin(products, eq(products.id, userWornItems.productId))
    .innerJoin(orderItems, eq(orderItems.productId, userWornItems.productId))
    .innerJoin(
      orders,
      and(
        eq(orders.id, orderItems.orderId),
        eq(orders.userId, userWornItems.userId),
        eq(orders.status, "delivered"),
      ),
    )
    .where(inArray(userWornItems.userId, userIds))
    .orderBy(userWornItems.createdAt);
  for (const row of rows) {
    if (!row.wearableKey) continue;
    worn.set(row.userId, [...(worn.get(row.userId) ?? []), `/images/${row.wearableKey}`]);
  }
  return worn;
}

const snobiColumns = {
  userId: users.id,
  displayName: users.displayName,
  title: users.title,
  imageKey: snobiOptions.imageKey,
};

type SnobiRow = { userId: string; displayName: string; title: string | null; imageKey: string };

function toPublicSnobi(row: SnobiRow, worn: Map<string, string[]>): PublicSnobi {
  return {
    displayName: row.displayName,
    title: row.title,
    imageUrl: snobiImageUrl(row.imageKey),
    wornUrls: worn.get(row.userId) ?? [],
  };
}

// Donations are points (src/lib/donations.ts), so they're public; pounds never leave the server.
export interface LeaderboardEntry extends PublicSnobi {
  donations: number;
}

export interface FeedEntry extends PublicSnobi {
  donations: number;
  at: number;
}

// Only the percentage leaves the server, so the current total can't be read from the page.
export async function loadDonationProgress() {
  const [row] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${orders.donations}), 0)` })
    .from(orders)
    .where(counted);
  return { percent: phaseProgressPercent(row?.total ?? 0, NEXT_PHASE_GOAL_DONATIONS) };
}

// Every public account with a counted order, biggest helper first. Ties go to whoever got there
// first.
async function loadRanked(limit: number): Promise<LeaderboardEntry[]> {
  const total = sql<number>`sum(${orders.donations})`;
  const rows = await getDb()
    .select({ ...snobiColumns, donations: total })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(snobiOptions, eq(snobiOptions.id, users.snobiOptionId))
    .where(and(counted, eq(users.isPublic, true), eq(users.hiddenByAdmin, false)))
    .groupBy(users.id)
    .orderBy(desc(total), sql`min(coalesce(${orders.confirmedAt}, ${orders.createdAt}))`)
    .limit(limit);
  const worn = await loadWornUrls(rows.map((r) => r.userId));
  return rows.map((row) => ({ ...toPublicSnobi(row, worn), donations: row.donations }));
}

export const loadLeaderboard = () => loadRanked(LEADERBOARD_SIZE);

// Everyone else on the board, as a simple wall of Snobis.
export async function loadHelpers(): Promise<PublicSnobi[]> {
  const ranked = await loadRanked(500);
  return ranked.map(({ donations: _donations, ...snobi }) => snobi);
}

export async function loadDonationFeed(): Promise<FeedEntry[]> {
  const at = sql<number>`coalesce(${orders.confirmedAt}, ${orders.createdAt})`;
  const rows = await getDb()
    .select({ ...snobiColumns, donations: orders.donations, at })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(snobiOptions, eq(snobiOptions.id, users.snobiOptionId))
    .where(and(counted, eq(users.isPublic, true), eq(users.hiddenByAdmin, false)))
    .orderBy(desc(at))
    .limit(FEED_SIZE);
  const worn = await loadWornUrls([...new Set(rows.map((r) => r.userId))]);
  return rows.map((row) => ({
    ...toPublicSnobi(row, worn),
    donations: row.donations,
    at: row.at,
  }));
}
