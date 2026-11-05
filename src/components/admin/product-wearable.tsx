import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { SnobiAvatar } from "@/components/snobi-avatar";
import { Button } from "@/components/ui/button";
import { TEMPLATE_URL, readLayerPng } from "@/lib/admin-layers";
import { removeAdminWearable, uploadAdminWearable } from "@/lib/admin-products";

export function ProductWearable({
  productId,
  wearableKey,
}: {
  productId: string;
  wearableKey: string | null;
}) {
  const router = useRouter();
  const upload = useServerFn(uploadAdminWearable);
  const remove = useServerFn(removeAdminWearable);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    const checked = await readLayerPng(file);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.set("productId", productId);
      data.set("file", file);
      const result = await upload({ data });
      if (result.ok) toast.success("Saved. Check how it sits on the Snobi below.");
      else setError(result.error);
      await router.invalidate();
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!window.confirm("Remove this picture? Customers can no longer wear this item.")) return;
    setBusy(true);
    setError(null);
    try {
      await remove({ data: { productId } });
      toast.success("Removed");
      await router.invalidate();
    } catch {
      setError("Removing it failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby="wearable-heading">
      <h2 id="wearable-heading" className="admin-subtitle">
        How it looks on a customer’s Snobi
      </h2>
      <p className="admin-muted">
        Customers who received this item can choose to dress their Snobi in it. Upload only the item
        itself, on a transparent background: a square PNG up to 5 MB, drawn on the{" "}
        <a href={TEMPLATE_URL} download="snobi-template.png" className="admin-link">
          Snobi template
        </a>{" "}
        so it lines up. Leave this empty for items that can’t be worn.
      </p>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-wearable">
        <span className="admin-layer-canvas">
          <SnobiAvatar
            imageUrl={TEMPLATE_URL}
            wornUrls={wearableKey ? [`/images/${wearableKey}`] : []}
            alt={
              wearableKey
                ? "This item on the Snobi template"
                : "The Snobi template, wearing nothing"
            }
            className="admin-snobi-lg"
          />
        </span>
        <div className="admin-wearable-side">
          <p>{wearableKey ? "Customers can wear this item." : "Not wearable yet."}</p>
          <div className="admin-actions">
            <input
              ref={fileInput}
              type="file"
              accept="image/png"
              hidden
              onChange={(e) => void onFile(e)}
              aria-label="Choose a transparent PNG of this item"
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <Upload aria-hidden />
              {busy ? "Working…" : wearableKey ? "Replace picture" : "Upload picture"}
            </Button>
            {wearableKey && (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void onRemove()}>
                <Trash2 aria-hidden /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
