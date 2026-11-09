// Snobi's story moves in phases: each money goal he reaches unlocks the next phase and a new
// limited drop. Update this file when a phase ends (nav label, hero button, receipts).
export const CURRENT_PHASE = 0;

export function phaseLabel(phase: number, ar: boolean) {
  return ar ? `المرحلة ${phase.toLocaleString("ar-EG")}` : `PHASE ${phase}`;
}

// Lifetime donations (see src/lib/donations.ts, not pounds) Snobi needs to reach the next phase.
// 30,000 is roughly 30–40 shirts at launch prices: reachable without a following yet.
// The goal is public; the current total never is, only the bar's fill.
export const NEXT_PHASE_GOAL_DONATIONS = 30_000;

export function phaseProgressPercent(total: number, goal: number) {
  if (goal <= 0) return 100;
  return Math.min(100, Math.floor((total / goal) * 100));
}

export interface PhaseReceipt {
  phase: number;
  itemsEn: string[];
  itemsAr: string[];
  totalEn: string;
  totalAr: string;
}

// Fictional shopping lists on the receipts Snobi holds on the homepage: what he's doing with
// the money now, and a tease of the next phase. Keep items short; they sit on narrow slips.
export const CURRENT_RECEIPT: PhaseReceipt = {
  phase: CURRENT_PHASE,
  itemsEn: ["get some food", "buy a blanket", "more food. hungry"],
  itemsAr: ["يجيب أكل", "يشتري بطانية", "أكل تاني. جعان"],
  totalEn: "still broke",
  totalAr: "لسه مفلس",
};

export const NEXT_RECEIPT: PhaseReceipt = {
  phase: CURRENT_PHASE + 1,
  itemsEn: ["a phone (new)", "pants. no holes", "look stylish as hell"],
  itemsAr: ["موبايل (جديد)", "بنطلون مش مقطوع", "يبقى ستايل جامد"],
  totalEn: "not yet",
  totalAr: "لسه",
};
