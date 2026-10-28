import type { QuoteLine } from "./cart-types";

// Bilingual explanation for a bag line that can't be ordered as-is; null when it's fine.
export function lineProblem(line: QuoteLine, ar: boolean): string | null {
  switch (line.status) {
    case "sold_out":
      return ar ? "المقاس ده خلص. شيله عشان تكمل." : "This size sold out. Remove it to continue.";
    case "unavailable":
      return ar
        ? "المنتج ده مبقاش متاح. شيله عشان تكمل."
        : "This item is no longer available. Remove it to continue.";
    case "insufficient":
      return ar
        ? `فاضل ${line.maxQuantity} بس. قلّل الكمية عشان تكمل.`
        : `Only ${line.maxQuantity} left. Lower the quantity to continue.`;
    default:
      return null;
  }
}
