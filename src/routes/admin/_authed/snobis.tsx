import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Download, Pencil, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { SnobiAvatar } from "@/components/snobi-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEMPLATE_URL, readLayerPng } from "@/lib/admin-layers";
import type { FieldErrors } from "@/lib/admin-shared";
import {
  addAdminSnobi,
  deleteAdminSnobi,
  listAdminSnobis,
  moveAdminSnobi,
  renameAdminSnobi,
  restoreAdminSnobi,
  retireAdminSnobi,
} from "@/lib/admin-snobis";

export const Route = createFileRoute("/admin/_authed/snobis")({
  head: () => ({ meta: [{ title: "Snobis — Snobi admin" }] }),
  loader: () => listAdminSnobis(),
  component: AdminSnobis,
});

type Option = Awaited<ReturnType<typeof listAdminSnobis>>[number];

function AdminSnobis() {
  const options = Route.useLoaderData();
  const active = options.filter((o) => o.active);
  const retired = options.filter((o) => !o.active);
  return (
    <div>
      <h1 className="admin-title">Snobis</h1>
      <p className="admin-muted admin-snobi-intro">
        The Snobis customers choose from when they create an account.
      </p>
      <Instructions />
      <AddSnobi />
      <h2 className="admin-subtitle admin-snobi-group">Offered to customers ({active.length})</h2>
      <p className="admin-muted">Customers see them in this order.</p>
      <ul className="admin-snobi-grid">
        {active.map((option, index) => (
          <SnobiCard
            key={option.id}
            option={option}
            canMoveUp={index > 0}
            canMoveDown={index < active.length - 1}
          />
        ))}
      </ul>
      {retired.length > 0 && (
        <>
          <h2 className="admin-subtitle admin-snobi-group">Retired ({retired.length})</h2>
          <p className="admin-muted">
            New customers can’t pick these. Accounts that already have one keep it.
          </p>
          <ul className="admin-snobi-grid">
            {retired.map((option) => (
              <SnobiCard key={option.id} option={option} canMoveUp={false} canMoveDown={false} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Instructions() {
  return (
    <section className="admin-card" aria-labelledby="snobi-rules-heading">
      <h2 id="snobi-rules-heading" className="admin-subtitle">
        Before you draw one
      </h2>
      <p className="admin-snobi-rule">
        <strong>The rule: it must never look like the original Snobi.</strong> Add a hat, a
        moustache or something similar, so there’s only one real Snobi.
      </p>
      <ul className="admin-snobi-howto">
        <li>Draw it on top of the template, keeping the same pose and the same position.</li>
        <li>
          Items customers receive are placed on top of their Snobi, and only line up if it matches
          the template.
        </li>
        <li>Save it as a PNG with a transparent background: square, up to 5 MB.</li>
      </ul>
      <div className="admin-actions">
        <Button variant="outline" asChild>
          <a href={TEMPLATE_URL} download="snobi-template.png">
            <Download aria-hidden /> Download the template
          </a>
        </Button>
      </div>
    </section>
  );
}

function AddSnobi() {
  const router = useRouter();
  const add = useServerFn(addAdminSnobi);
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) return;
    const checked = await readLayerPng(chosen);
    setFile(checked.ok ? chosen : null);
    setErrors(({ file: _old, ...rest }) => (checked.ok ? rest : { ...rest, file: checked.error }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const data = new FormData();
    data.set("nameEn", nameEn);
    data.set("nameAr", nameAr);
    if (file) data.set("file", file);
    setBusy(true);
    setErrors({});
    try {
      const result = await add({ data });
      if (result.ok) {
        setFile(null);
        setNameEn("");
        setNameAr("");
        toast.success("Snobi added. Customers can pick it now.");
        await router.invalidate();
      } else {
        setErrors(result.fieldErrors);
      }
    } catch {
      setErrors({ form: "Upload failed. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card admin-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <h2 className="admin-subtitle">Add a Snobi</h2>
      {errors["form"] && (
        <p className="admin-error" role="alert">
          {errors["form"]}
        </p>
      )}
      <div className="admin-field">
        <div className="admin-actions">
          <input
            ref={fileInput}
            type="file"
            accept="image/png"
            hidden
            onChange={(e) => void onFile(e)}
            aria-label="Choose a transparent square PNG"
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden /> {file ? "Choose a different PNG" : "Choose PNG"}
          </Button>
          {file && <span className="admin-muted">{file.name}</span>}
        </div>
        {errors["file"] && (
          <p className="admin-error" role="alert">
            {errors["file"]}
          </p>
        )}
      </div>
      {previewUrl && (
        <div className="admin-snobi-compare">
          <figure>
            <span className="admin-layer-canvas">
              <SnobiAvatar imageUrl={previewUrl} alt="Your picture" className="admin-snobi-lg" />
            </span>
            <figcaption className="admin-muted">Your picture on its own</figcaption>
          </figure>
          <figure>
            <span className="admin-layer-canvas">
              <SnobiAvatar
                imageUrl={TEMPLATE_URL}
                wornUrls={[previewUrl]}
                alt="Your picture over the template"
                className="admin-snobi-lg"
              />
            </span>
            <figcaption className="admin-muted">
              Over the template. Doubled lines mean it’s out of position.
            </figcaption>
          </figure>
        </div>
      )}
      <div className="admin-grid-2">
        <div className="admin-field">
          <Label htmlFor="snobi-name-en">Name (English)</Label>
          <Input
            id="snobi-name-en"
            value={nameEn}
            maxLength={40}
            placeholder="The Tarboush"
            onChange={(e) => setNameEn(e.target.value)}
            aria-invalid={errors["nameEn"] ? true : undefined}
            aria-describedby={errors["nameEn"] ? "snobi-name-en-error" : undefined}
          />
          {errors["nameEn"] && (
            <p id="snobi-name-en-error" className="admin-error" role="alert">
              {errors["nameEn"]}
            </p>
          )}
        </div>
        <div className="admin-field">
          <Label htmlFor="snobi-name-ar">Name (Arabic)</Label>
          <Input
            id="snobi-name-ar"
            dir="rtl"
            lang="ar"
            value={nameAr}
            maxLength={40}
            placeholder="أبو طربوش"
            onChange={(e) => setNameAr(e.target.value)}
            aria-invalid={errors["nameAr"] ? true : undefined}
            aria-describedby={errors["nameAr"] ? "snobi-name-ar-error" : undefined}
          />
          {errors["nameAr"] && (
            <p id="snobi-name-ar-error" className="admin-error" role="alert">
              {errors["nameAr"]}
            </p>
          )}
        </div>
      </div>
      <div className="admin-actions">
        <Button type="submit" variant="ink" disabled={busy}>
          {busy ? "Saving…" : "Add Snobi"}
        </Button>
      </div>
    </form>
  );
}

function SnobiCard({
  option,
  canMoveUp,
  canMoveDown,
}: {
  option: Option;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const router = useRouter();
  const move = useServerFn(moveAdminSnobi);
  const retire = useServerFn(retireAdminSnobi);
  const restore = useServerFn(restoreAdminSnobi);
  const remove = useServerFn(deleteAdminSnobi);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const inUse = option.accounts > 0;
  const usage = `${option.accounts} ${option.accounts === 1 ? "account" : "accounts"}`;

  async function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok) toast.error(result.error);
      await router.invalidate();
    } catch {
      toast.error("That didn’t work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const onRetire = () => void run(() => retire({ data: { id: option.id } }));

  return (
    <li className="admin-snobi-card" data-retired={option.active ? undefined : true}>
      <div className="admin-snobi-head">
        <span className="admin-layer-canvas">
          <SnobiAvatar imageUrl={option.imageUrl} alt="" className="admin-snobi-md" />
        </span>
        <div className="admin-list-main">
          <span className="admin-list-title">{option.nameEn}</span>
          <span dir="rtl" lang="ar" className="admin-snobi-ar">
            {option.nameAr}
          </span>
          <span className="admin-muted">{usage}</span>
          <span>
            <Badge variant={option.active ? "outline" : "secondary"}>
              {option.active ? "Active" : "Retired"}
            </Badge>
          </span>
        </div>
      </div>
      {editing ? (
        <RenameForm option={option} onDone={() => setEditing(false)} />
      ) : (
        <div className="admin-snobi-actions">
          {option.active && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy || !canMoveUp}
                onClick={() => void run(() => move({ data: { id: option.id, delta: -1 } }))}
                aria-label={`Move ${option.nameEn} earlier`}
              >
                <ArrowUp aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy || !canMoveDown}
                onClick={() => void run(() => move({ data: { id: option.id, delta: 1 } }))}
                aria-label={`Move ${option.nameEn} later`}
              >
                <ArrowDown aria-hidden />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden /> Edit names
          </Button>
          {option.active ? (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onRetire}>
              Retire
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void run(() => restore({ data: { id: option.id } }))}
            >
              Restore
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" disabled={busy}>
                <Trash2 aria-hidden /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              {inUse ? (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{option.nameEn} is in use</AlertDialogTitle>
                    <AlertDialogDescription>
                      {usage} {option.accounts === 1 ? "uses" : "use"} this Snobi, so it can’t be
                      deleted.{" "}
                      {option.active
                        ? "Retire it instead: they keep it, and new customers stop seeing it."
                        : "It’s already retired, so new customers don’t see it."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                    {option.active && (
                      <AlertDialogAction onClick={onRetire}>Retire it</AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </>
              ) : (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {option.nameEn}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      No account uses it. The picture is deleted too, and this can’t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void run(() => remove({ data: { id: option.id } }))}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </>
              )}
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </li>
  );
}

function RenameForm({ option, onDone }: { option: Option; onDone: () => void }) {
  const router = useRouter();
  const rename = useServerFn(renameAdminSnobi);
  const [nameEn, setNameEn] = useState(option.nameEn);
  const [nameAr, setNameAr] = useState(option.nameAr);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      setError("Both names are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await rename({ data: { id: option.id, nameEn, nameAr } });
      if (result.ok) {
        await router.invalidate();
        onDone();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Saving failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-snobi-rename" onSubmit={(e) => void onSubmit(e)} noValidate>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-field">
        <Label htmlFor={`name-en-${option.id}`}>Name (English)</Label>
        <Input
          id={`name-en-${option.id}`}
          value={nameEn}
          maxLength={40}
          onChange={(e) => setNameEn(e.target.value)}
        />
      </div>
      <div className="admin-field">
        <Label htmlFor={`name-ar-${option.id}`}>Name (Arabic)</Label>
        <Input
          id={`name-ar-${option.id}`}
          dir="rtl"
          lang="ar"
          value={nameAr}
          maxLength={40}
          onChange={(e) => setNameAr(e.target.value)}
        />
      </div>
      <div className="admin-actions">
        <Button type="submit" variant="ink" size="sm" disabled={busy}>
          Save names
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
