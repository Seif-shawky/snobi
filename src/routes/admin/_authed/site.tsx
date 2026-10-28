import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import roadside from "@/assets/snobi-phase-0-roadside.jpg";
import { getAdminSite, resetAdminHero, saveAdminHeroAlt, uploadAdminHero } from "@/lib/admin-site";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/admin-shared";
import { DEFAULT_HERO_ALT, MAX_ALT_LENGTH } from "@/lib/site-content";

export const Route = createFileRoute("/admin/_authed/site")({
  head: () => ({ meta: [{ title: "Site — Snobi admin" }] }),
  loader: () => getAdminSite(),
  component: AdminSite,
});

function AdminSite() {
  const site = Route.useLoaderData();
  const router = useRouter();
  const upload = useServerFn(uploadAdminHero);
  const saveAlt = useServerFn(saveAdminHeroAlt);
  const reset = useServerFn(resetAdminHero);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altEn, setAltEn] = useState(site.heroAltEn);
  const [altAr, setAltAr] = useState(site.heroAltAr);
  const custom = site.heroImageUrl !== null;

  async function refresh() {
    await router.invalidate();
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError("Only JPEG, PNG or WebP photos are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Photos must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await upload({ data });
      if (!result.ok) setError(result.error);
      else {
        setAltEn("");
        setAltAr("");
        toast.success("Homepage picture replaced. Now describe it below.");
      }
      await refresh();
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveAlt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveAlt({ data: { altEn, altAr } });
      toast.success("Descriptions saved");
      await refresh();
    } catch {
      setError("Saving the descriptions failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!window.confirm("Go back to the default Phase 0 drawing? The uploaded picture is deleted."))
      return;
    setBusy(true);
    setError(null);
    try {
      await reset();
      setAltEn("");
      setAltAr("");
      toast.success("Back to the default drawing");
      await refresh();
    } catch {
      setError("Reset failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="admin-title">Site</h1>
      <section className="admin-card" aria-labelledby="hero-heading">
        <h2 id="hero-heading" className="admin-subtitle">
          Homepage picture
        </h2>
        <p className="admin-muted">
          The big picture next to “Snobi is broke.” Change it when the story moves to a new phase.
          It is shown in a slightly wide frame (about 6:5), so the edges of very wide or tall
          pictures get cropped. JPEG, PNG or WebP, up to 5 MB.
        </p>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <figure className="admin-hero-preview">
          <img
            src={site.heroImageUrl ?? roadside}
            alt={custom ? site.heroAltEn || "Current homepage picture" : DEFAULT_HERO_ALT.en}
          />
          <figcaption className="admin-muted">
            {custom ? "Your uploaded picture" : "Default: the Phase 0 roadside drawing"}
          </figcaption>
        </figure>
        <div className="admin-actions">
          <input
            ref={fileInput}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            hidden
            onChange={(e) => void onFile(e)}
            aria-label="Choose a homepage picture"
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden />{" "}
            {busy ? "Working…" : custom ? "Replace picture" : "Upload picture"}
          </Button>
          {custom && (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void onReset()}>
              <RotateCcw aria-hidden /> Reset to default drawing
            </Button>
          )}
        </div>
      </section>
      {custom && (
        <form className="admin-card admin-form" onSubmit={(e) => void onSaveAlt(e)}>
          <h2 className="admin-subtitle">Picture description</h2>
          <p className="admin-muted">
            Read aloud to customers using screen readers. Say what is in the picture, e.g. “Snobi
            sitting on a pile of unsold shirts”.
          </p>
          <div className="admin-field">
            <Label htmlFor="hero-alt-en">Description (English)</Label>
            <Input
              id="hero-alt-en"
              value={altEn}
              maxLength={MAX_ALT_LENGTH}
              onChange={(e) => setAltEn(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <Label htmlFor="hero-alt-ar">Description (Arabic)</Label>
            <Input
              id="hero-alt-ar"
              dir="rtl"
              lang="ar"
              value={altAr}
              maxLength={MAX_ALT_LENGTH}
              onChange={(e) => setAltAr(e.target.value)}
            />
          </div>
          <div className="admin-actions">
            <Button type="submit" variant="ink" disabled={busy}>
              Save descriptions
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
