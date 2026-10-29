import { useEffect, useRef, useState, type ReactNode } from "react";
import lookLeft from "@/assets/snobi-receipts-look-left.png";
import lookRight from "@/assets/snobi-receipts-look-right.png";
import { CURRENT_RECEIPT, NEXT_RECEIPT, phaseLabel, type PhaseReceipt } from "@/lib/phase";

// Snobi holding two receipts: this phase's spending (left) and a tease of the next (right).
// His head turns towards the cursor or the last touch.
export function ReceiptSnobi({ ar }: { ar: boolean }) {
  const artRef = useRef<HTMLDivElement>(null);
  const [facing, setFacing] = useState<"left" | "right">("left");

  useEffect(() => {
    const follow = (clientX: number) => {
      const rect = artRef.current?.getBoundingClientRect();
      if (!rect) return;
      setFacing(clientX < rect.left + rect.width / 2 ? "left" : "right");
    };
    const onPointer = (event: PointerEvent) => follow(event.clientX);
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) follow(touch.clientX);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  const next = (
    <>
      {phaseLabel(NEXT_RECEIPT.phase, ar)}
      <span className="receipt-soon">?</span>
    </>
  );

  return (
    <div className="receipts">
      <div
        ref={artRef}
        className="receipts-art"
        role="img"
        aria-label={
          ar
            ? `سنوبي ماسك وصلين: ${phaseLabel(CURRENT_RECEIPT.phase, true)} و${phaseLabel(NEXT_RECEIPT.phase, true)}`
            : `Snobi holding two receipts: ${phaseLabel(CURRENT_RECEIPT.phase, false)} and ${phaseLabel(NEXT_RECEIPT.phase, false)}`
        }
      >
        <img src={lookLeft} alt="" className={facing === "left" ? "" : "receipts-hidden"} />
        <img src={lookRight} alt="" className={facing === "right" ? "" : "receipts-hidden"} />
        <SlipText
          className="receipt-slip receipt-slip-current"
          title={phaseLabel(CURRENT_RECEIPT.phase, ar)}
          receipt={CURRENT_RECEIPT}
          ar={ar}
        />
        <SlipText
          className="receipt-slip receipt-slip-next"
          title={next}
          receipt={NEXT_RECEIPT}
          ar={ar}
        />
      </div>
      {/* On narrow screens the slips only fit the titles, so the lists are written below. */}
      <div className="receipts-lists">
        <SlipText
          className="receipt-list"
          title={phaseLabel(CURRENT_RECEIPT.phase, ar)}
          receipt={CURRENT_RECEIPT}
          ar={ar}
        />
        <SlipText className="receipt-list" title={next} receipt={NEXT_RECEIPT} ar={ar} />
      </div>
      <p className="expense-disclaimer">
        {ar
          ? "مصاريف كلب خيالي. مش حسابات البيزنس الحقيقية."
          : "Fictional dog expenses. Not business accounting."}
      </p>
    </div>
  );
}

function SlipText({
  className,
  title,
  receipt,
  ar,
}: {
  className: string;
  title: ReactNode;
  receipt: PhaseReceipt;
  ar: boolean;
}) {
  return (
    <div className={className} dir={ar ? "rtl" : "ltr"}>
      <p className="receipt-title">{title}</p>
      <ul className="handwriting">
        {(ar ? receipt.itemsAr : receipt.itemsEn).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
