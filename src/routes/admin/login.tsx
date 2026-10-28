import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLoginFn, getAdminStatusFn } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/login")({
  loader: async () => {
    const status = await getAdminStatusFn();
    if (status.state === "ok") throw redirect({ to: "/admin" });
    return status;
  },
  component: AdminLogin,
});

function AdminLogin() {
  const status = Route.useLoaderData();
  const router = useRouter();
  const login = useServerFn(adminLoginFn);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError("Enter the password");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await login({ data: { password } });
      if (result.ok) {
        await router.navigate({ to: "/admin" });
      } else {
        setError(result.error);
        setPassword("");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page admin-login">
      <div className="admin-card">
        <h1 className="admin-title">
          <LockKeyhole aria-hidden /> Snobi admin
        </h1>
        {status.state === "misconfigured" ? (
          <div className="admin-alert" role="alert">
            <strong>Admin isn't set up yet.</strong>
            <p>{status.message}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="admin-form">
            <div className="admin-field">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "admin-password-error" : undefined}
                autoFocus
              />
              {error && (
                <p id="admin-password-error" className="admin-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" variant="ink" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
