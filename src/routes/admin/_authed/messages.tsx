import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteAdminMessage,
  listAdminMessages,
  replyMailto,
  setAdminMessageRead,
} from "@/lib/admin-messages";
import { adminDateFormat } from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/_authed/messages")({
  head: () => ({ meta: [{ title: "Messages — Snobi admin" }] }),
  loader: () => listAdminMessages(),
  component: AdminMessages,
});

function AdminMessages() {
  const messages = Route.useLoaderData();
  const router = useRouter();
  const setRead = useServerFn(setAdminMessageRead);
  const remove = useServerFn(deleteAdminMessage);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unread = messages.filter((m) => m.readAt === null).length;

  async function run(action: () => Promise<unknown>, failure: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await router.invalidate();
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string, isUnread: boolean) {
    const opening = open !== id;
    setOpen(opening ? id : null);
    if (opening && isUnread) {
      void run(() => setRead({ data: { id, read: true } }), "Couldn’t mark it as read.");
    }
  }

  return (
    <div>
      <h1 className="admin-title">Messages</h1>
      <p className="admin-muted">
        From the contact form, newest first. {unread > 0 ? `${unread} unread.` : "All read."} Reply
        opens your email app; delete messages you no longer need.
      </p>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {messages.length === 0 ? (
        <p className="admin-muted">No messages yet.</p>
      ) : (
        <ul className="admin-list admin-messages">
          {messages.map((m) => {
            const isUnread = m.readAt === null;
            const expanded = open === m.id;
            return (
              <li key={m.id} className="admin-message" data-unread={isUnread || undefined}>
                <button
                  type="button"
                  className="admin-message-head"
                  aria-expanded={expanded}
                  aria-controls={`message-${m.id}`}
                  onClick={() => toggle(m.id, isUnread)}
                >
                  <span className="admin-list-main">
                    <span className="admin-list-title">
                      {isUnread && <span className="admin-unread-dot" aria-hidden />}
                      {m.name}
                      {isUnread && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className="admin-muted">
                      {adminDateFormat.format(m.createdAt)} · {m.email}
                      {m.orderReference ? ` · ${m.orderReference}` : ""}
                    </span>
                    {!expanded && <span className="admin-message-preview">{m.message}</span>}
                  </span>
                  {isUnread ? <Badge>new</Badge> : <Badge variant="outline">read</Badge>}
                </button>
                {expanded && (
                  <div id={`message-${m.id}`} className="admin-message-body">
                    <p>{m.message}</p>
                    <div className="admin-actions">
                      <Button variant="ink" asChild>
                        <a href={replyMailto(m.email, m.name, m.orderReference)}>
                          <Reply aria-hidden /> Reply by email
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => setRead({ data: { id: m.id, read: isUnread } }),
                            "Couldn’t update the message.",
                          )
                        }
                      >
                        {isUnread ? <MailOpen aria-hidden /> : <Mail aria-hidden />}
                        {isUnread ? "Mark as read" : "Mark as unread"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm(`Delete the message from ${m.name}?`)) return;
                          void run(
                            () => remove({ data: { id: m.id } }),
                            "Couldn’t delete the message.",
                          );
                        }}
                      >
                        <Trash2 aria-hidden /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
