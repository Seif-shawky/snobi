import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eye, EyeOff, KeyRound, MessageCircle, Phone, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
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
import {
  deleteAdminCustomer,
  getAdminCustomer,
  resetAdminCustomerPassword,
  setAdminCustomerHidden,
  updateAdminCustomer,
} from "@/lib/admin-customers";
import { adminDateFormat, whatsappUrl, type FieldErrors } from "@/lib/admin-shared";
import { customerVisibilityLabel } from "@/lib/admin-customer-rules";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/_authed/customers/$id")({
  head: () => ({ meta: [{ title: "Customer — Snobi admin" }] }),
  loader: async ({ params }) => {
    const data = await getAdminCustomer({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <div>
      <h1 className="admin-title">Customer not found</h1>
      <Link to="/admin/customers">Back to customers</Link>
    </div>
  ),
  component: AdminCustomer,
});

function AdminCustomer() {
  const { customer, orders } = Route.useLoaderData();
  const wa = whatsappUrl(customer.phone);
  return (
    <div>
      <Link to="/admin/customers" className="admin-link">
        ← All customers
      </Link>
      <div className="admin-customer-head">
        <SnobiAvatar
          imageUrl={customer.imageUrl}
          alt={`${customer.displayName}’s Snobi`}
          className="admin-snobi-md"
        />
        <div className="admin-list-main">
          <h1 className="admin-title">{customer.displayName}</h1>
          {customer.title && <p className="admin-muted">{customer.title}</p>}
          <p className="admin-muted">
            Joined {adminDateFormat.format(customer.createdAt)} ·{" "}
            {formatMoney(customer.donatedCents, false)} donated
          </p>
        </div>
      </div>
      <div className="admin-actions admin-customer-contact">
        <Button asChild variant="outline">
          <a href={`tel:${customer.phone}`}>
            <Phone aria-hidden /> Call {customer.phone}
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

      <PasswordReset customerId={customer.id} name={customer.displayName} phone={customer.phone} />
      <PublicVisibility
        customerId={customer.id}
        isPublic={customer.isPublic}
        hiddenByAdmin={customer.hiddenByAdmin}
      />
      <NameAndTitle
        key={`${customer.displayName}|${customer.title ?? ""}`}
        customerId={customer.id}
        displayName={customer.displayName}
        title={customer.title}
      />

      <section className="admin-card" aria-labelledby="customer-orders-heading">
        <h2 id="customer-orders-heading" className="admin-subtitle">
          Orders ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="admin-muted">No orders on this account yet.</p>
        ) : (
          <ul className="admin-list">
            {orders.map((o) => (
              <li key={o.id}>
                <Link to="/admin/orders/$id" params={{ id: o.id }} className="admin-list-item">
                  <span className="admin-list-main">
                    <span className="admin-list-title">{o.reference}</span>
                    <span className="admin-muted">
                      {adminDateFormat.format(o.createdAt)} · {formatMoney(o.subtotalCents, false)}{" "}
                      items
                    </span>
                  </span>
                  <Badge variant="outline">{o.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeleteCustomer
        customerId={customer.id}
        name={customer.displayName}
        orderCount={orders.length}
      />
    </div>
  );
}

function PasswordReset({
  customerId,
  name,
  phone,
}: {
  customerId: string;
  name: string;
  phone: string;
}) {
  const router = useRouter();
  const reset = useServerFn(resetAdminCustomerPassword);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onReset() {
    setBusy(true);
    setError(null);
    setTempPassword(null);
    try {
      const result = await reset({ data: { id: customerId } });
      if (result.ok) setTempPassword(result.tempPassword);
      else setError(result.error);
      await router.invalidate();
    } catch {
      setError("Resetting the password failed. Nothing changed, so try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Couldn’t copy. Select the password and copy it by hand.");
    }
  }

  return (
    <section className="admin-card" aria-labelledby="reset-heading">
      <h2 id="reset-heading" className="admin-subtitle">
        Forgot their password?
      </h2>
      <p className="admin-muted">
        Make sure it’s really them (ask them to message you from {phone}). Reset it here and send
        them the temporary password that appears. Their old password stops working, and they’re
        logged out on every device.
      </p>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {tempPassword && (
        <div className="admin-temp-password" role="status">
          <p>
            <strong>Temporary password for {phone}</strong>
          </p>
          <div className="admin-temp-password-row">
            <code>{tempPassword}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onCopy(tempPassword)}
            >
              <Copy aria-hidden /> Copy
            </Button>
          </div>
          <p>
            Send this now: it’s shown only once and can’t be seen again. They log in with their
            mobile number and this password, and can then change it in their account. If you lose
            it, just reset again.
          </p>
        </div>
      )}
      <div className="admin-actions">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ink" disabled={busy}>
              <KeyRound aria-hidden /> {busy ? "Working…" : "Reset password"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the password for {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Their current password stops working right away and they’re logged out everywhere.
                You’ll get a temporary password to send them.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep current password</AlertDialogCancel>
              <AlertDialogAction onClick={() => void onReset()}>Reset password</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}

function PublicVisibility({
  customerId,
  isPublic,
  hiddenByAdmin,
}: {
  customerId: string;
  isPublic: boolean;
  hiddenByAdmin: boolean;
}) {
  const router = useRouter();
  const setHidden = useServerFn(setAdminCustomerHidden);
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    setBusy(true);
    try {
      const result = await setHidden({ data: { id: customerId, hidden: !hiddenByAdmin } });
      if (result.ok) toast.success(hiddenByAdmin ? "No longer hidden by you" : "Hidden");
      else toast.error(result.error);
      await router.invalidate();
    } catch {
      toast.error("Couldn’t update this. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby="public-heading">
      <div className="admin-heading-row">
        <h2 id="public-heading" className="admin-subtitle">
          Public lists
        </h2>
        <Badge variant={isPublic && !hiddenByAdmin ? "outline" : "secondary"}>
          {customerVisibilityLabel(isPublic, hiddenByAdmin)}
        </Badge>
      </div>
      <p className="admin-muted">
        {hiddenByAdmin
          ? "You hid them, and they can’t undo it. They don’t appear on the leaderboard, live feed or helpers list. The money still counts in the donations total."
          : isPublic
            ? "Their Snobi, name, title and amounts show on the leaderboard, live feed and helpers list. Hide them for rude names or removal requests."
            : "They chose to stay off the public lists. The money still counts in the donations total."}
      </p>
      <div className="admin-actions">
        <Button type="button" variant="outline" disabled={busy} onClick={() => void onToggle()}>
          {hiddenByAdmin ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
          {hiddenByAdmin ? "Stop hiding" : "Hide from public lists"}
        </Button>
      </div>
    </section>
  );
}

function NameAndTitle({
  customerId,
  displayName,
  title,
}: {
  customerId: string;
  displayName: string;
  title: string | null;
}) {
  const router = useRouter();
  const update = useServerFn(updateAdminCustomer);
  const [name, setName] = useState(displayName);
  const [newTitle, setNewTitle] = useState(title ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const result = await update({
        data: { id: customerId, displayName: name, title: newTitle },
      });
      if (result.ok) {
        toast.success("Saved");
        await router.invalidate();
      } else {
        setErrors(result.fieldErrors);
      }
    } catch {
      setErrors({ form: "Saving failed. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card admin-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <h2 className="admin-subtitle">Name and title</h2>
      <p className="admin-muted">Fix anything rude or a removal request. This is what’s public.</p>
      {errors["form"] && (
        <p className="admin-error" role="alert">
          {errors["form"]}
        </p>
      )}
      <div className="admin-grid-2">
        <div className="admin-field">
          <Label htmlFor="customer-name">Name</Label>
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors["displayName"] ? true : undefined}
            aria-describedby={errors["displayName"] ? "customer-name-error" : undefined}
          />
          {errors["displayName"] && (
            <p id="customer-name-error" className="admin-error" role="alert">
              {errors["displayName"]}
            </p>
          )}
        </div>
        <div className="admin-field">
          <Label htmlFor="customer-title">Title (optional)</Label>
          <Input
            id="customer-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            aria-invalid={errors["title"] ? true : undefined}
            aria-describedby={errors["title"] ? "customer-title-error" : undefined}
          />
          {errors["title"] && (
            <p id="customer-title-error" className="admin-error" role="alert">
              {errors["title"]}
            </p>
          )}
        </div>
      </div>
      <div className="admin-actions">
        <Button type="submit" variant="ink" disabled={busy}>
          Save name and title
        </Button>
      </div>
    </form>
  );
}

function DeleteCustomer({
  customerId,
  name,
  orderCount,
}: {
  customerId: string;
  name: string;
  orderCount: number;
}) {
  const router = useRouter();
  const remove = useServerFn(deleteAdminCustomer);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    setBusy(true);
    try {
      const result = await remove({ data: { id: customerId } });
      if (result.ok) {
        toast.success("Account deleted");
        await router.navigate({ to: "/admin/customers" });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn’t delete the account. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby="delete-customer-heading">
      <h2 id="delete-customer-heading" className="admin-subtitle">
        Delete account
      </h2>
      <p className="admin-muted">
        Removes their login, Snobi and public profile. Their orders stay, as guest orders.
      </p>
      <div className="admin-actions">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={busy}>
              <Trash2 aria-hidden /> Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {name}’s account?</AlertDialogTitle>
              <AlertDialogDescription>
                They can’t log in anymore and this can’t be undone.{" "}
                {orderCount > 0
                  ? `Their ${orderCount === 1 ? "order stays" : `${orderCount} orders stay`} on your list without an account.`
                  : "They have no orders."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep account</AlertDialogCancel>
              <AlertDialogAction onClick={() => void onDelete()}>Delete account</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
