import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { listAdminDeliveryRates, saveAdminDeliveryRates } from "@/lib/admin-delivery";
import {
  adminDateFormat as dateFormat,
  centsToPoundsInput,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/admin-shared";
import { deliveryFormSchema, type DeliveryRowInput } from "@/lib/delivery-rules";
import { formatMoney, poundsToCents } from "@/lib/money";
import { GOVERNORATES } from "@/lib/order-schema";

export const Route = createFileRoute("/admin/_authed/delivery")({
  loader: () => listAdminDeliveryRates(),
  component: AdminDelivery,
});

type SavedRate = Awaited<ReturnType<typeof listAdminDeliveryRates>>[number];

function toRows(saved: SavedRate[]): DeliveryRowInput[] {
  const byGov = new Map(saved.map((r) => [r.governorate, r]));
  return GOVERNORATES.map((g) => {
    const r = byGov.get(g.value);
    return {
      governorate: g.value,
      active: r?.active ?? false,
      fee: r ? centsToPoundsInput(r.feeCents) : "",
      minDays: r?.minDays == null ? "" : String(r.minDays),
      maxDays: r?.maxDays == null ? "" : String(r.maxDays),
    };
  });
}

function AdminDelivery() {
  const saved = Route.useLoaderData();
  // Re-mount the form after a save so it starts from what's actually stored.
  const version = saved.map((r) => `${r.governorate}:${r.updatedAt}`).join("|");
  return <DeliveryForm key={version} saved={saved} />;
}

function DeliveryForm({ saved }: { saved: SavedRate[] }) {
  const router = useRouter();
  const save = useServerFn(saveAdminDeliveryRates);
  const initial = useMemo(() => toRows(saved), [saved]);
  const [rows, setRows] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkFee, setBulkFee] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const savedByGov = new Map(saved.map((r) => [r.governorate, r]));
  const lastUpdated = saved.reduce<number | null>((m, r) => Math.max(m ?? 0, r.updatedAt), null);
  const activeCount = rows.filter((r) => r.active).length;
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  const setRow = (index: number, patch: Partial<DeliveryRowInput>) => {
    setRows((all) => all.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(patch)) delete next[`rows.${index}.${key}`];
      return next;
    });
  };

  function toggleSelected(governorate: string, on: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(governorate);
      else next.delete(governorate);
      return next;
    });
  }

  function applyBulk() {
    if (selected.size === 0) {
      setBulkError("Tick at least one governorate first");
      return;
    }
    if (poundsToCents(bulkFee) === null) {
      setBulkError("Enter the fee in EGP, e.g. 60 or 60.50 (0 = free)");
      return;
    }
    setBulkError(null);
    rows.forEach((r, i) => {
      if (selected.has(r.governorate)) setRow(i, { fee: bulkFee.trim() });
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = deliveryFormSchema.safeParse({ rows });
    if (!parsed.success) {
      const next = toFieldErrors(parsed.error);
      setErrors(next);
      const first = Object.keys(next)[0];
      const match = first ? /^rows\.(\d+)\.(\w+)$/.exec(first) : null;
      if (match) document.getElementById(`d-${match[1]}-${match[2]}`)?.focus();
      toast.error("Some rows need fixing — see the red messages");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const result = await save({ data: { rows } });
      toast.success(
        result.changed === 0
          ? "Nothing changed"
          : `Saved ${result.changed} ${result.changed === 1 ? "governorate" : "governorates"}`,
      );
      await router.invalidate();
    } catch {
      toast.error("Couldn't save delivery fees. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="admin-title">Delivery fees</h1>
      <section className="admin-card admin-delivery-intro">
        <p>
          Set the delivery fee customers pay for each governorate. Customers see it when they choose
          their governorate at checkout, and it is saved on the order.
        </p>
        <ul>
          <li>
            Governorates switched <strong>off</strong> can't be selected at checkout. If every
            governorate is off, checkout is paused.
          </li>
          <li>A fee of 0 means free delivery.</li>
          <li>Delivery days are optional. Leave them empty and customers won't see an estimate.</li>
          <li>Delivery fees aren't refundable on returns (see the returns policy on /shipping).</li>
          <li>
            Changing a fee doesn't change orders already placed. Customers with checkout open are
            asked to confirm the new fee.
          </li>
        </ul>
        <p className="admin-muted">
          {activeCount} of {GOVERNORATES.length} governorates on ·{" "}
          {lastUpdated === null ? "Never saved" : `Last updated ${dateFormat.format(lastUpdated)}`}
        </p>
      </section>

      <form onSubmit={onSubmit} noValidate>
        <section className="admin-card" aria-labelledby="bulk-heading">
          <h2 id="bulk-heading" className="admin-subtitle">
            Same fee for several governorates
          </h2>
          <div className="admin-inline-form">
            <div className="admin-actions admin-delivery-select-actions">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelected(new Set(GOVERNORATES.map((g) => g.value)))}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                Select none
              </Button>
            </div>
            <div className="admin-field">
              <Label htmlFor="bulk-fee">Fee for {selected.size} selected (EGP)</Label>
              <Input
                id="bulk-fee"
                inputMode="decimal"
                value={bulkFee}
                placeholder="60"
                onChange={(e) => {
                  setBulkFee(e.target.value);
                  setBulkError(null);
                }}
                aria-invalid={bulkError ? true : undefined}
                aria-describedby={bulkError ? "bulk-fee-error" : undefined}
              />
            </div>
            <Button type="button" variant="outline" onClick={applyBulk}>
              Apply to selected
            </Button>
          </div>
          {bulkError && (
            <p id="bulk-fee-error" className="admin-error" role="alert">
              {bulkError}
            </p>
          )}
          <p className="admin-hint">This only fills in the fee. Click Save all to keep it.</p>
        </section>

        <div className="admin-delivery-head" aria-hidden="true">
          <span />
          <span>Governorate</span>
          <span>We deliver here</span>
          <span>Fee (EGP)</span>
          <span>Min days</span>
          <span>Max days</span>
        </div>
        <ol className="admin-delivery-rows">
          {rows.map((row, i) => {
            const g = GOVERNORATES[i];
            if (!g) return null;
            const id = (field: string) => `d-${i}-${field}`;
            const fieldError = (field: string) => errors[`rows.${i}.${field}`];
            const invalid = (field: string) =>
              fieldError(field)
                ? { "aria-invalid": true as const, "aria-describedby": `${id(field)}-error` }
                : {};
            const savedRow = savedByGov.get(row.governorate);
            const fee = poundsToCents(row.fee);
            return (
              <li
                key={row.governorate}
                className="admin-delivery-row"
                data-off={!row.active || undefined}
              >
                <Checkbox
                  checked={selected.has(row.governorate)}
                  onCheckedChange={(on) => toggleSelected(row.governorate, on === true)}
                  aria-label={`Select ${g.en}`}
                />
                <div className="admin-delivery-name">
                  <strong>{g.en}</strong>{" "}
                  <span dir="rtl" lang="ar">
                    {g.ar}
                  </span>
                  <span className="admin-muted">
                    {row.active
                      ? fee === null
                        ? "Needs a fee"
                        : fee === 0
                          ? "Free delivery"
                          : formatMoney(fee, false)
                      : "Not delivering"}
                    {savedRow && ` · updated ${dateFormat.format(savedRow.updatedAt)}`}
                  </span>
                </div>
                <label className="admin-switch">
                  <Switch
                    checked={row.active}
                    onCheckedChange={(active) => setRow(i, { active })}
                    aria-label={`We deliver to ${g.en}`}
                  />
                  <span className="admin-delivery-switch-label">{row.active ? "On" : "Off"}</span>
                </label>
                <div className="admin-delivery-fields">
                  <div className="admin-field">
                    <Label htmlFor={id("fee")} className="admin-delivery-label">
                      Fee (EGP)
                    </Label>
                    <Input
                      id={id("fee")}
                      inputMode="decimal"
                      value={row.fee}
                      placeholder={row.active ? "60" : "—"}
                      onChange={(e) => setRow(i, { fee: e.target.value })}
                      aria-label={`${g.en} fee in EGP`}
                      {...invalid("fee")}
                    />
                  </div>
                  <div className="admin-field">
                    <Label htmlFor={id("minDays")} className="admin-delivery-label">
                      Min days
                    </Label>
                    <Input
                      id={id("minDays")}
                      inputMode="numeric"
                      value={row.minDays}
                      onChange={(e) => setRow(i, { minDays: e.target.value })}
                      aria-label={`${g.en} minimum delivery days (optional)`}
                      {...invalid("minDays")}
                    />
                  </div>
                  <div className="admin-field">
                    <Label htmlFor={id("maxDays")} className="admin-delivery-label">
                      Max days
                    </Label>
                    <Input
                      id={id("maxDays")}
                      inputMode="numeric"
                      value={row.maxDays}
                      onChange={(e) => setRow(i, { maxDays: e.target.value })}
                      aria-label={`${g.en} maximum delivery days (optional)`}
                      {...invalid("maxDays")}
                    />
                  </div>
                </div>
                {(["fee", "minDays", "maxDays", "governorate"] as const).map((field) =>
                  fieldError(field) ? (
                    <p
                      key={field}
                      id={`${id(field)}-error`}
                      className="admin-error admin-delivery-error"
                    >
                      {fieldError(field)}
                    </p>
                  ) : null,
                )}
              </li>
            );
          })}
        </ol>
        <div className="admin-delivery-save">
          <Button type="submit" variant="ink" disabled={busy}>
            {busy ? "Saving…" : "Save all"}
          </Button>
          <span className="admin-muted" role="status">
            {dirty ? "You have unsaved changes" : "All changes saved"}
          </span>
        </div>
      </form>
    </div>
  );
}
