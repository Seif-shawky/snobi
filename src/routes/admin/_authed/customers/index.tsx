import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SnobiAvatar } from "@/components/snobi-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listAdminCustomers } from "@/lib/admin-customers";
import { customerVisibilityLabel } from "@/lib/admin-customer-rules";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/_authed/customers/")({
  head: () => ({ meta: [{ title: "Customers — Snobi admin" }] }),
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = search["q"];
    return typeof q === "string" && q.trim() ? { q: q.trim().slice(0, 100) } : {};
  },
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: ({ deps }) => listAdminCustomers({ data: { q: deps.q } }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const { customers, truncated } = Route.useLoaderData();
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [query, setQuery] = useState(q);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    void navigate({ search: term ? { q: term } : {} });
  }

  return (
    <div>
      <h1 className="admin-title">Customers</h1>
      <p className="admin-muted">
        Accounts, newest first. Open one to hide it from public lists, fix its name,{" "}
        <strong>reset a forgotten password</strong> or delete it.
      </p>
      <form className="admin-inline-form admin-customer-search" onSubmit={onSearch} role="search">
        <div className="admin-field">
          <Label htmlFor="customer-search">Search by mobile number or name</Label>
          <Input
            id="customer-search"
            type="search"
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">
          <Search aria-hidden /> Search
        </Button>
      </form>
      {customers.length === 0 ? (
        <p className="admin-muted">
          {q ? `No accounts match “${q}”.` : "Nobody has created an account yet."}
        </p>
      ) : (
        <ul className="admin-list">
          {customers.map((c) => (
            <li key={c.id}>
              <Link to="/admin/customers/$id" params={{ id: c.id }} className="admin-list-item">
                <SnobiAvatar imageUrl={c.imageUrl} alt="" className="admin-snobi-sm" />
                <span className="admin-list-main">
                  <span className="admin-list-title">{c.displayName}</span>
                  {c.title && <span className="admin-muted">{c.title}</span>}
                  <span className="admin-muted">
                    {c.phone} · {formatMoney(c.donatedCents, false)} donated
                  </span>
                </span>
                <Badge variant={c.isPublic && !c.hiddenByAdmin ? "outline" : "secondary"}>
                  {customerVisibilityLabel(c.isPublic, c.hiddenByAdmin)}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {truncated && (
        <p className="admin-muted admin-customer-more">
          Showing the newest {customers.length}. Search to find older accounts.
        </p>
      )}
    </div>
  );
}
