// Snobi's story moves in phases: each money goal he reaches unlocks the next phase and a new
// limited drop. Update this file when a phase ends (nav label, hero button, receipts).
export const CURRENT_PHASE = 0;

export function phaseLabel(phase: number, ar: boolean) {
  return ar ? `المرحلة ${phase.toLocaleString("ar-EG")}` : `PHASE ${phase}`;
}

export interface PhaseReceipt {
  phase: number;
  itemsEn: string[];
  itemsAr: string[];
}

// Fictional shopping lists on the receipts Snobi holds on the homepage: what he's doing with
// the money now, and a tease of the next phase. Keep items short; they sit on narrow slips.
export const CURRENT_RECEIPT: PhaseReceipt = {
  phase: CURRENT_PHASE,
  itemsEn: ["get some food", "buy a blanket", "more food. hungry"],
  itemsAr: ["يجيب أكل", "يشتري بطانية", "أكل تاني. جعان"],
};

export const NEXT_RECEIPT: PhaseReceipt = {
  phase: CURRENT_PHASE + 1,
  itemsEn: ["a phone (new)", "pants. no holes", "look stylish as hell"],
  itemsAr: ["موبايل (جديد)", "بنطلون مش مقطوع", "يبقى ستايل جامد"],
};
