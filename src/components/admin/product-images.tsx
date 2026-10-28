import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAdminImage, updateAdminImages, uploadAdminImage } from "@/lib/admin-products";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/admin-shared";

interface ImageRow {
  id: string;
  r2Key: string;
  altEn: string;
  altAr: string;
}

export function ProductImages({ productId, images }: { productId: string; images: ImageRow[] }) {
  const router = useRouter();
  const upload = useServerFn(uploadAdminImage);
  const update = useServerFn(updateAdminImages);
  const remove = useServerFn(deleteAdminImage);
  const [rows, setRows] = useState(images);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const problems: string[] = [];
    for (const file of files) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        problems.push(`${file.name}: only JPEG, PNG or WebP photos are allowed`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        problems.push(`${file.name}: photos must be 5 MB or smaller`);
        continue;
      }
      const data = new FormData();
      data.set("productId", productId);
      data.set("file", file);
      try {
        const result = await upload({ data });
        if (!result.ok) problems.push(`${file.name}: ${result.error}`);
      } catch {
        problems.push(`${file.name}: upload failed, try again`);
      }
    }
    if (problems.length) setError(problems.join(" · "));
    setBusy(false);
    await router.invalidate();
  }

  function move(index: number, delta: number) {
    setRows((current) => {
      const next = [...current];
      const a = next[index];
      const b = next[index + delta];
      if (!a || !b) return current;
      next[index] = b;
      next[index + delta] = a;
      return next;
    });
    setDirty(true);
  }

  function setAlt(index: number, patch: Partial<ImageRow>) {
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setDirty(true);
  }

  async function saveOrder() {
    setBusy(true);
    setError(null);
    try {
      await update({
        data: {
          productId,
          images: rows.map(({ id, altEn, altAr }) => ({ id, altEn, altAr })),
        },
      });
      toast.success("Photos saved");
      setDirty(false);
      await router.invalidate();
    } catch {
      setError("Saving photos failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this photo?")) return;
    setBusy(true);
    try {
      await remove({ data: { id } });
      await router.invalidate();
    } catch {
      setError("Deleting the photo failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby="photos-heading">
      <h2 id="photos-heading" className="admin-subtitle">
        Photos
      </h2>
      <p className="admin-muted">
        The first photo is the cover in the shop. JPEG, PNG or WebP, up to 5 MB each. Describe each
        photo for customers using screen readers.
      </p>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <ol className="admin-images">
          {rows.map((img, i) => (
            <li key={img.id} className="admin-image">
              <img src={`/images/${img.r2Key}`} alt={img.altEn} />
              {i === 0 && <span className="admin-cover-tag">Cover</span>}
              <div className="admin-field">
                <Label htmlFor={`alt-en-${img.id}`}>Description (English)</Label>
                <Input
                  id={`alt-en-${img.id}`}
                  value={img.altEn}
                  onChange={(e) => setAlt(i, { altEn: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <Label htmlFor={`alt-ar-${img.id}`}>Description (Arabic)</Label>
                <Input
                  id={`alt-ar-${img.id}`}
                  dir="rtl"
                  lang="ar"
                  value={img.altAr}
                  onChange={(e) => setAlt(i, { altAr: e.target.value })}
                />
              </div>
              <div className="admin-image-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy || i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Move photo ${i + 1} earlier`}
                >
                  <ArrowLeft aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy || i === rows.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move photo ${i + 1} later`}
                >
                  <ArrowRight aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  onClick={() => void onDelete(img.id)}
                  aria-label={`Delete photo ${i + 1}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="admin-actions">
        <input
          ref={fileInput}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => void onFiles(e)}
          aria-label="Choose photos"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          <Upload aria-hidden /> {busy ? "Working…" : "Upload photos"}
        </Button>
        {dirty && (
          <Button type="button" variant="ink" disabled={busy} onClick={() => void saveOrder()}>
            Save photo order and descriptions
          </Button>
        )}
      </div>
    </section>
  );
}
