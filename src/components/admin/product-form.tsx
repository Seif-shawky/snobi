import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Archive, ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteAdminProduct, saveAdminProduct } from "@/lib/admin-products";
import {
  ADMIN_PRODUCT_STATUSES,
  productFormSchema,
  suggestSlug,
  toFieldErrors,
  type AdminProductStatus,
  type FieldErrors,
  type ProductFormInput,
} from "@/lib/admin-shared";
import { blankVariant, type ProductFormState, type VariantRow } from "./product-form-state";

const STATUS_HELP: Record<AdminProductStatus, string> = {
  draft: "Draft: hidden from the shop while you prepare it.",
  active: "Active: visible in the shop and can be ordered.",
  archived: "Archived: hidden from the shop, kept for your records and past orders.",
};

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="admin-error" role="alert">
      {message}
    </p>
  );
}

function errorProps(errors: FieldErrors, key: string, id: string) {
  return errors[key]
    ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` }
    : { "aria-invalid": undefined };
}

export function ProductForm({
  productId,
  initial,
}: {
  productId: string | null;
  initial: ProductFormState;
}) {
  const router = useRouter();
  const save = useServerFn(saveAdminProduct);
  const remove = useServerFn(deleteAdminProduct);
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(productId !== null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setVariant = (index: number, patch: Partial<VariantRow>) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  };

  const moveVariant = (index: number, delta: number) => {
    setForm((f) => {
      const next = [...f.variants];
      const target = index + delta;
      const a = next[index];
      const b = next[target];
      if (!a || !b) return f;
      next[index] = b;
      next[target] = a;
      return { ...f, variants: next };
    });
  };

  async function submit(override?: Partial<ProductFormState>) {
    const values = { ...form, ...override };
    const payload: ProductFormInput = {
      ...values,
      variants: values.variants.map(({ key: _key, ...v }) => v),
    };
    const parsed = productFormSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const result = await save({ data: { id: productId, product: payload } });
      if (!result.ok) {
        setErrors(result.fieldErrors);
        return;
      }
      if (override) setForm(values);
      toast.success(productId ? "Saved" : "Product created. Now add photos.");
      if (productId) {
        await router.invalidate();
      } else {
        await router.navigate({ to: "/admin/products/$id", params: { id: result.id } });
      }
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Saving failed. Try again." });
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  async function onDelete() {
    if (!productId) return;
    setBusy(true);
    try {
      await remove({ data: { id: productId } });
      toast.success("Product deleted");
      await router.navigate({ to: "/admin/products" });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Deleting failed. Try again." });
      setBusy(false);
    }
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={onSubmit} noValidate className="admin-form">
      {errorCount > 0 && (
        <div className="admin-alert" role="alert">
          {errors["form"] ?? "Please fix the highlighted fields below."}
        </div>
      )}

      <section className="admin-card" aria-labelledby="details-heading">
        <h2 id="details-heading" className="admin-subtitle">
          Details
        </h2>
        <div className="admin-grid-2">
          <Field id="nameEn" label="Name (English)" error={errors["nameEn"]}>
            <Input
              id="nameEn"
              value={form.nameEn}
              onChange={(e) => {
                const nameEn = e.target.value;
                set("nameEn", nameEn);
                if (!slugTouched) set("slug", suggestSlug(nameEn));
              }}
              {...errorProps(errors, "nameEn", "nameEn")}
            />
          </Field>
          <Field id="nameAr" label="Name (Arabic)" error={errors["nameAr"]}>
            <Input
              id="nameAr"
              dir="rtl"
              lang="ar"
              value={form.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              {...errorProps(errors, "nameAr", "nameAr")}
            />
          </Field>
        </div>
        <Field
          id="slug"
          label="Web address"
          hint={`Shop link: /product/${form.slug || "your-product"}`}
          error={errors["slug"]}
        >
          <Input
            id="slug"
            value={form.slug}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase());
            }}
            {...errorProps(errors, "slug", "slug")}
          />
        </Field>
        <div className="admin-grid-2">
          <Field id="descriptionEn" label="Description (English)" error={errors["descriptionEn"]}>
            <Textarea
              id="descriptionEn"
              rows={4}
              value={form.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
              {...errorProps(errors, "descriptionEn", "descriptionEn")}
            />
          </Field>
          <Field id="descriptionAr" label="Description (Arabic)" error={errors["descriptionAr"]}>
            <Textarea
              id="descriptionAr"
              dir="rtl"
              lang="ar"
              rows={4}
              value={form.descriptionAr}
              onChange={(e) => set("descriptionAr", e.target.value)}
              {...errorProps(errors, "descriptionAr", "descriptionAr")}
            />
          </Field>
        </div>
        <div className="admin-grid-3">
          <Field
            id="status"
            label="Status"
            hint={STATUS_HELP[form.status]}
            error={errors["status"]}
          >
            <select
              id="status"
              className="admin-select"
              value={form.status}
              onChange={(e) => set("status", e.target.value as AdminProductStatus)}
              {...errorProps(errors, "status", "status")}
            >
              {ADMIN_PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0]?.toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="phase"
            label="Phase"
            hint="Story phase of this drop (0 = launch)"
            error={errors["phase"]}
          >
            <Input
              id="phase"
              inputMode="numeric"
              value={form.phase}
              onChange={(e) => set("phase", e.target.value)}
              {...errorProps(errors, "phase", "phase")}
            />
          </Field>
          <Field
            id="sortOrder"
            label="Sort order"
            hint="Lower numbers show first"
            error={errors["sortOrder"]}
          >
            <Input
              id="sortOrder"
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              {...errorProps(errors, "sortOrder", "sortOrder")}
            />
          </Field>
        </div>
      </section>

      <section className="admin-card" aria-labelledby="sizes-heading">
        <h2 id="sizes-heading" className="admin-subtitle">
          Sizes, prices and stock
        </h2>
        <p className="admin-muted">
          Each size has its own price (in EGP) and stock. Turn a size off to hide it without
          deleting it.
        </p>
        {errors["variants"] && <FieldError id="variants-error" message={errors["variants"]} />}
        <ol className="admin-variants">
          {form.variants.map((v, i) => {
            const p = `variants.${i}`;
            const id = (field: string) => `v-${v.key}-${field}`;
            return (
              <li key={v.key} className="admin-variant">
                <div className="admin-variant-fields">
                  <Field id={id("size")} label="Size" error={errors[`${p}.size`]}>
                    <Input
                      id={id("size")}
                      value={v.size}
                      placeholder="M"
                      onChange={(e) => setVariant(i, { size: e.target.value })}
                      {...errorProps(errors, `${p}.size`, id("size"))}
                    />
                  </Field>
                  <Field id={id("price")} label="Price (EGP)" error={errors[`${p}.price`]}>
                    <Input
                      id={id("price")}
                      inputMode="decimal"
                      value={v.price}
                      placeholder="450"
                      onChange={(e) => setVariant(i, { price: e.target.value })}
                      {...errorProps(errors, `${p}.price`, id("price"))}
                    />
                  </Field>
                  <Field id={id("stock")} label="Stock" error={errors[`${p}.stock`]}>
                    <Input
                      id={id("stock")}
                      inputMode="numeric"
                      value={v.stock}
                      onChange={(e) => setVariant(i, { stock: e.target.value })}
                      {...errorProps(errors, `${p}.stock`, id("stock"))}
                    />
                  </Field>
                  <Field id={id("sku")} label="SKU (optional)" error={errors[`${p}.sku`]}>
                    <Input
                      id={id("sku")}
                      value={v.sku}
                      onChange={(e) => setVariant(i, { sku: e.target.value })}
                      {...errorProps(errors, `${p}.sku`, id("sku"))}
                    />
                  </Field>
                </div>
                <div className="admin-variant-actions">
                  <label className="admin-switch">
                    <Switch
                      checked={v.active}
                      onCheckedChange={(active) => setVariant(i, { active })}
                      aria-label={`Size ${v.size || i + 1} on sale`}
                    />
                    On sale
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveVariant(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move size ${v.size || i + 1} up`}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveVariant(i, 1)}
                    disabled={i === form.variants.length - 1}
                    aria-label={`Move size ${v.size || i + 1} down`}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      set(
                        "variants",
                        form.variants.filter((_, j) => j !== i),
                      )
                    }
                    aria-label={`Remove size ${v.size || i + 1}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
        <Button
          type="button"
          variant="outline"
          onClick={() => set("variants", [...form.variants, blankVariant()])}
        >
          <Plus aria-hidden /> Add size
        </Button>
      </section>

      <div className="admin-actions">
        <Button type="submit" variant="ink" disabled={busy}>
          {busy ? "Saving…" : productId ? "Save changes" : "Create product"}
        </Button>
        {productId && (
          <>
            {form.status !== "archived" && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void submit({ status: "archived" })}
              >
                <Archive aria-hidden /> Archive
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={busy}>
                  <Trash2 aria-hidden /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this product for good?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the product, all its sizes and photos. Past orders keep their
                    details. If you only want to hide it from the shop, choose Archive instead.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void onDelete()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="admin-field">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="admin-hint">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
