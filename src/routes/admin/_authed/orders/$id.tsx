import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminOrder, setAdminOrderShipping, transitionAdminOrder } from "@/lib/admin-orders";
import {
  ORDER_TRANSITIONS,
  adminDateFormat as dateFormat,
  centsToPoundsInput,
  whatsappUrl,
  type AdminOrderStatus,
} from "@/lib/admin-shared";
import { formatMoney, poundsToCents } from "@/lib/money";

export const Route = createFileRoute("/admin/_authed/orders/$id")({
  loader: async ({ params }) => {
    const data = await getAdminOrder({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <div>
      <h1 className="admin-title">Order not found</h1>
      <Link to="/admin/orders">Back to orders</Link>
    </div>
  ),
  component: AdminOrder,
});

const ACTION_LABELS: Record<AdminOrderStatus, string> = {
  pending: "Mark pending",
  confirmed: "Mark confirmed (called the customer)",
  shipped: "Mark shipped",
  delivered: "Mark delivered (cash collected)",
  cancelled: "Cancel order",
};

function AdminOrder() {
  const { order, items } = Route.useLoaderData();
  const router = useRouter();
  const transition = useServerFn(transitionAdminOrder);
  const setShipping = useServerFn(setAdminOrderShipping);
  const [fee, setFee] = useState(
    order.shippingCents === null ? "" : centsToPoundsInput(order.shippingCents),
  );
  const [feeError, setFeeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const wa = whatsappUrl(order.phone);
  const editable = order.status !== "delivered" && order.status !== "cancelled";
  const total = order.subtotalCents + (order.shippingCents ?? 0);

  async function move(to: AdminOrderStatus) {
    setBusy(true);
    try {
      const result = await transition({ data: { id: order.id, from: order.status, to } });
      if (result.ok) toast.success(`Order ${to}`);
      else toast.error(result.error);
      await router.invalidate();
    } catch {
      toast.error("Couldn't update the order. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveFee(event: FormEvent) {
    event.preventDefault();
    const cents = fee.trim() === "" ? null : poundsToCents(fee);
    if (fee.trim() !== "" && cents === null) {
      setFeeError("Enter the fee in EGP, e.g. 60 or 60.50 (leave empty if not agreed yet)");
      return;
    }
    setFeeError(null);
    setBusy(true);
    try {
      const result = await setShipping({ data: { id: order.id, shippingCents: cents } });
      if (result.ok) toast.success("Delivery fee saved");
      else setFeeError(result.error);
      await router.invalidate();
    } catch {
      setFeeError("Couldn't save the fee. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="admin-heading-row">
        <h1 className="admin-title">Order {order.reference}</h1>
        <Badge variant={order.status === "pending" ? "default" : "outline"}>{order.status}</Badge>
      </div>
      <p className="admin-muted">Placed {dateFormat.format(order.createdAt)} · Cash on delivery</p>

      <section className="admin-card" aria-labelledby="customer-heading">
        <h2 id="customer-heading" className="admin-subtitle">
          Customer
        </h2>
        <p className="admin-list-title">{order.customerName}</p>
        <div className="admin-actions">
          <Button asChild variant="outline">
            <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}>
              <Phone aria-hidden /> Call {order.phone}
            </a>
          </Button>
          {wa && (
            <Button asChild variant="outline">
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden /> WhatsApp
              </a>
            </Button>
          )}
        </div>
        {order.email && <p>{order.email}</p>}
        <address className="admin-address">
          {order.addressLine}
          <br />
          {order.city}, {order.governorate}
        </address>
        {order.notes && (
          <p className="admin-notes">
            <strong>Customer note:</strong> {order.notes}
          </p>
        )}
      </section>

      <section className="admin-card" aria-labelledby="items-heading">
        <h2 id="items-heading" className="admin-subtitle">
          Items
        </h2>
        <ul className="admin-items">
          {items.map((item) => (
            <li key={item.id}>
              <span>
                {item.productNameEn}{" "}
                <span dir="rtl" lang="ar">
                  ({item.productNameAr})
                </span>{" "}
                · Size {item.size} × {item.quantity}
              </span>
              <span>{formatMoney(item.unitPriceCents * item.quantity, false)}</span>
            </li>
          ))}
        </ul>
        <dl className="admin-totals">
          <dt>Subtotal</dt>
          <dd>{formatMoney(order.subtotalCents, false)}</dd>
          <dt>Delivery</dt>
          <dd>
            {order.shippingCents === null ? "Not set yet" : formatMoney(order.shippingCents, false)}
          </dd>
          <dt>To collect</dt>
          <dd>
            <strong>{formatMoney(total, false)}</strong>
            {order.shippingCents === null && " + delivery"}
          </dd>
        </dl>
        {editable && (
          <form onSubmit={onSaveFee} noValidate className="admin-inline-form">
            <div className="admin-field">
              <Label htmlFor="fee">Delivery fee (EGP)</Label>
              <Input
                id="fee"
                inputMode="decimal"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                aria-invalid={feeError ? true : undefined}
                aria-describedby={feeError ? "fee-error" : undefined}
              />
              {feeError && (
                <p id="fee-error" className="admin-error" role="alert">
                  {feeError}
                </p>
              )}
            </div>
            <Button type="submit" variant="outline" disabled={busy}>
              Save fee
            </Button>
          </form>
        )}
      </section>

      {ORDER_TRANSITIONS[order.status].length > 0 && (
        <section className="admin-card" aria-labelledby="status-heading">
          <h2 id="status-heading" className="admin-subtitle">
            Next step
          </h2>
          <div className="admin-actions">
            {ORDER_TRANSITIONS[order.status].map((to) =>
              to === "cancelled" ? (
                <AlertDialog key={to}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={busy}>
                      {ACTION_LABELS[to]}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel order {order.reference}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The items go back into stock. This can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep order</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void move(to)}>
                        Cancel order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  key={to}
                  type="button"
                  variant="ink"
                  disabled={busy}
                  onClick={() => void move(to)}
                >
                  {ACTION_LABELS[to]}
                </Button>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
