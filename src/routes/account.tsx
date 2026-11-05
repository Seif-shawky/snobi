import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, Shirt } from "lucide-react";
import { useLanguage } from "@/components/snobi";
import { SnobiAvatar } from "@/components/snobi-avatar";
import { SnobiPicker, TitleField } from "@/components/snobi-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changePassword,
  communityKeys,
  currentUserKey,
  deleteAccount,
  logout,
  myAccountKey,
  myAccountQuery,
  setWorn,
  snobiOptionsQuery,
  updateProfile,
} from "@/lib/account";
import { accountErrorText, fieldErrors, type FieldErrors } from "@/lib/account-copy";
import {
  changePasswordSchema,
  deleteAccountSchema,
  profileSchema,
  type AccountOrder,
  type MyAccount,
  type OrderStatus,
  type WardrobeItem,
} from "@/lib/account-rules";
import { formatMoney } from "@/lib/money";
import {
  CURRENT_PHASE,
  NEXT_PHASE_GOAL_CENTS,
  phaseLabel,
  phaseProgressPercent,
} from "@/lib/phase";

export const Route = createFileRoute("/account")({
  // Logged out, getMyAccount redirects to /join. staleTime 0: statuses change behind our back.
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.fetchQuery({ ...myAccountQuery, staleTime: 0 }),
      context.queryClient.ensureQueryData(snobiOptionsQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Your Snobi" },
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: AccountPage,
});

function useRefreshAccount() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [myAccountKey, currentUserKey, ...communityKeys].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

// Logging out or deleting: leave the page first, so it doesn't refetch an account that's gone.
function useLeaveAccount() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    queryClient.setQueryData(currentUserKey, null);
    await navigate({ to: "/" });
    queryClient.removeQueries({ queryKey: myAccountKey });
    await Promise.all(communityKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };
}

function AccountPage() {
  const { ar } = useLanguage();
  const { data: account } = useSuspenseQuery(myAccountQuery);
  const { user } = account;
  return (
    <section className="account-page page-width">
      <div className="shop-breadcrumb">
        <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> / {ar ? "سنوبي بتاعك" : "YOUR SNOBI"}
      </div>
      <div className="account-hero">
        <SnobiAvatar
          imageUrl={user.snobiImageUrl}
          wornUrls={user.wornUrls}
          alt={ar ? `سنوبي بتاع ${user.displayName}` : `${user.displayName}’s Snobi`}
          className="account-avatar"
        />
        <div className="account-hero-copy">
          <h1>{user.displayName}</h1>
          {user.title && <p className="handwriting account-title">{user.title}</p>}
          <Donated ar={ar} cents={account.donatedCents} orders={account.orders} />
          <p className="account-visibility">
            {user.hiddenByAdmin ? (
              ar ? (
                "المحل خفى اسمك من القوايم العامة. لو عايز تفهم ليه، كلمنا."
              ) : (
                "The shop has hidden you from the public lists. Contact us if you’d like to know why."
              )
            ) : user.isPublic ? (
              <>
                {ar ? "إنت ظاهر في " : "You’re public on "}
                <Link to="/supporters">{ar ? "صفحة الداعمين" : "the supporters page"}</Link>
                {ar ? "." : "."}
              </>
            ) : ar ? (
              "إنت مخفي. محدش شايفك في الترتيب، بس فلوسك لسه بتتحسب لسنوبي."
            ) : (
              "You’re hidden. Nobody sees you on the leaderboard, but your money still counts for Snobi."
            )}
          </p>
        </div>
      </div>
      <Wardrobe ar={ar} items={account.wardrobe} />
      <Orders ar={ar} orders={account.orders} />
      <details className="account-edit">
        <summary>{ar ? "عدّل بياناتك" : "EDIT YOUR DETAILS"}</summary>
        <EditProfile ar={ar} account={account} />
        <EditPassword ar={ar} />
      </details>
      <AccountExit ar={ar} />
    </section>
  );
}

function Donated({ ar, cents, orders }: { ar: boolean; cents: number; orders: AccountOrder[] }) {
  const progress = phaseProgressPercent(cents, NEXT_PHASE_GOAL_CENTS);
  const nextPhase = phaseLabel(CURRENT_PHASE + 1, ar);
  const amount = formatMoney(cents, ar);
  const goal = formatMoney(NEXT_PHASE_GOAL_CENTS, ar);
  const waiting = orders.some((o) => o.status === "pending");
  return (
    <div className="account-donated">
      <strong>{ar ? `اتبرعت بـ${amount}` : `YOU’VE DONATED ${amount}`}</strong>
      <div
        className="phase-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={ar ? `نصيبك من هدف ${nextPhase}` : `Your share of the ${nextPhase} goal`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>
        {ar
          ? `${amount} بتوعك من ${goal} محتاجهم سنوبي عشان يوصل لـ${nextPhase}.`
          : `Your ${amount} of the ${goal} Snobi needs for ${nextPhase}.`}{" "}
        {waiting &&
          (ar ? "الطلبات بتتحسب بعد ما نأكدها." : "Orders count once we’ve confirmed them.")}
      </p>
    </div>
  );
}

function Wardrobe({ ar, items }: { ar: boolean; items: WardrobeItem[] }) {
  const refresh = useRefreshAccount();
  const setWornFn = useServerFn(setWorn);
  const mutation = useMutation({
    mutationFn: (data: { productId: string; worn: boolean }) => setWornFn({ data }),
    onSettled: () => refresh(),
  });
  return (
    <section className="account-section" aria-labelledby="wardrobe-title">
      <h2 id="wardrobe-title">{ar ? "الدولاب." : "THE WARDROBE."}</h2>
      {items.length === 0 ? (
        <div className="account-empty">
          <Shirt strokeWidth={1.3} aria-hidden="true" />
          <p>
            {ar
              ? "فاضي. الهدوم بتظهر هنا بعد ما توصلك، والهدوم اللي المحل خلّاها تتلبس بس."
              : "Empty. Items appear here after delivery, and only ones the shop made wearable."}
          </p>
        </div>
      ) : (
        <ul className="wardrobe-grid">
          {items.map((item) => (
            <li key={item.productId}>
              <button
                type="button"
                className="wardrobe-item"
                aria-pressed={item.worn}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ productId: item.productId, worn: !item.worn })}
              >
                <img src={item.overlayUrl} alt="" loading="lazy" />
                <span>{ar ? item.nameAr : item.nameEn}</span>
                <strong>{item.worn ? (ar ? "لابسه" : "WEARING") : ar ? "البسه" : "PUT ON"}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(mutation.isError || mutation.data?.ok === false) && (
        <p className="contact-error" role="alert">
          {ar ? "ماتغيرش. جرّب تاني." : "That didn’t change. Try again."}
        </p>
      )}
    </section>
  );
}

function statusLabel(status: OrderStatus, ar: boolean) {
  return {
    pending: ar ? "مستني التأكيد" : "AWAITING CONFIRMATION",
    confirmed: ar ? "اتأكد" : "CONFIRMED",
    shipped: ar ? "اتشحن" : "SHIPPED",
    delivered: ar ? "اتسلّم" : "DELIVERED",
    cancelled: ar ? "اتلغى" : "CANCELLED",
    returned: ar ? "اترجع" : "RETURNED",
  }[status];
}

function Orders({ ar, orders }: { ar: boolean; orders: AccountOrder[] }) {
  return (
    <section className="account-section" aria-labelledby="orders-title">
      <h2 id="orders-title">{ar ? "طلباتك." : "YOUR ORDERS."}</h2>
      {orders.length === 0 ? (
        <div className="account-empty">
          <p>
            {ar
              ? "لسه مفيش. سنوبي مش بيضغط عليك. قوي."
              : "None yet. Snobi isn’t pressuring you. Much."}
          </p>
          <Button variant="note" asChild>
            <Link to="/shop">
              {ar ? "شوف الهدوم" : "SEE THE CLOTHES"}
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="account-orders">
          {orders.map((order) => (
            <li key={order.reference}>
              <Link
                to="/order-confirmation"
                search={{ ref: order.reference, token: order.accessToken }}
              >
                <span dir="ltr">{order.reference}</span>
                <span>{statusLabel(order.status, ar)}</span>
                <span>{formatMoney(order.subtotalCents, ar)}</span>
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EditProfile({ ar, account }: { ar: boolean; account: MyAccount }) {
  const { user } = account;
  const refresh = useRefreshAccount();
  const updateFn = useServerFn(updateProfile);
  const { data: options } = useSuspenseQuery(snobiOptionsQuery);
  const [snobiOptionId, setSnobiOptionId] = useState(user.snobiOptionId);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [title, setTitle] = useState(user.title ?? "");
  const [isPublic, setIsPublic] = useState(user.isPublic);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateFn>[0]["data"]) => updateFn({ data }),
    onSuccess: async (result) => {
      if (result.ok) {
        setSaved(true);
        await refresh();
      } else {
        setErrors({
          [result.error === "snobi_unavailable" ? "snobiOptionId" : "form"]: result.error,
        });
      }
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    setSaved(false);
    const payload = { snobiOptionId, displayName, title, isPublic };
    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      const next = fieldErrors(parsed.error.issues);
      setErrors(next);
      const first = (["displayName", "title"] as const).find((f) => next[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#account-${first}`)?.focus();
      return;
    }
    setErrors({});
    mutation.mutate(payload);
  }

  return (
    <form ref={formRef} className="join-form" noValidate onSubmit={submit}>
      <SnobiPicker
        ar={ar}
        options={options}
        value={snobiOptionId}
        error={errors.snobiOptionId}
        onChange={setSnobiOptionId}
      />
      <div className="contact-fields">
        <div className="contact-field contact-wide">
          <label htmlFor="account-displayName">
            {ar ? "اسمك" : "Your name"} <span aria-hidden="true">*</span>
          </label>
          <Input
            id="account-displayName"
            value={displayName}
            maxLength={30}
            autoComplete="nickname"
            onChange={(e) => setDisplayName(e.target.value)}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? "account-displayName-error" : undefined}
          />
          {errors.displayName && (
            <p className="contact-error" id="account-displayName-error">
              {accountErrorText(errors.displayName, ar)}
            </p>
          )}
        </div>
        <TitleField ar={ar} value={title} error={errors.title} onChange={setTitle} />
      </div>
      <label className="join-public">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        <span>
          {ar
            ? "اعرض سنوبي بتاعي واسمي ولقبي والمبلغ اللي اتبرعت بيه في الترتيب العام. رقم موبايلي عمره ما يظهر."
            : "Show my Snobi, name, title and how much I’ve donated on the public leaderboard. My mobile number is never shown."}
        </span>
      </label>
      <div aria-live="polite">
        {saved && <p className="account-saved">{ar ? "اتحفظ." : "Saved."}</p>}
        {mutation.isError && (
          <p className="contact-error" role="alert">
            {accountErrorText("unknown", ar)}
          </p>
        )}
      </div>
      <Button variant="ink" type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {ar ? "احفظ" : "SAVE"}
      </Button>
    </form>
  );
}

function EditPassword({ ar }: { ar: boolean }) {
  const changeFn = useServerFn(changePassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => changeFn({ data }),
    onSuccess: (result) => {
      if (result.ok) {
        setSaved(true);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setErrors({ currentPassword: result.error });
      }
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    setSaved(false);
    const payload = { currentPassword, newPassword };
    const parsed = changePasswordSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    mutation.mutate(payload);
  }

  return (
    <form className="join-form account-password" noValidate onSubmit={submit}>
      <h3>{ar ? "غيّر الباسورد" : "CHANGE PASSWORD"}</h3>
      <div className="contact-fields">
        <div className="contact-field">
          <label htmlFor="account-currentPassword">
            {ar ? "الباسورد الحالي" : "Current password"}
          </label>
          <Input
            id="account-currentPassword"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            maxLength={128}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={errors.currentPassword ? "account-currentPassword-error" : undefined}
          />
          {errors.currentPassword && (
            <p className="contact-error" id="account-currentPassword-error">
              {errors.currentPassword === "bad_credentials"
                ? ar
                  ? "الباسورد الحالي غلط."
                  : "That’s not your current password."
                : accountErrorText(errors.currentPassword, ar)}
            </p>
          )}
        </div>
        <div className="contact-field">
          <label htmlFor="account-newPassword">{ar ? "الباسورد الجديد" : "New password"}</label>
          <Input
            id="account-newPassword"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={errors.newPassword ? "account-newPassword-error" : undefined}
          />
          {errors.newPassword && (
            <p className="contact-error" id="account-newPassword-error">
              {accountErrorText(errors.newPassword, ar)}
            </p>
          )}
        </div>
      </div>
      <div aria-live="polite">
        {saved && (
          <p className="account-saved">
            {ar
              ? "اتغير. أي جهاز تاني اتعمله خروج."
              : "Changed. Any other device has been logged out."}
          </p>
        )}
        {mutation.isError && (
          <p className="contact-error" role="alert">
            {accountErrorText("unknown", ar)}
          </p>
        )}
      </div>
      <Button variant="note" type="submit" disabled={mutation.isPending}>
        {ar ? "غيّر الباسورد" : "CHANGE PASSWORD"}
      </Button>
    </form>
  );
}

function AccountExit({ ar }: { ar: boolean }) {
  const leave = useLeaveAccount();
  const logoutFn = useServerFn(logout);
  const deleteFn = useServerFn(deleteAccount);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const logoutMutation = useMutation({ mutationFn: () => logoutFn(), onSuccess: () => leave() });
  const deleteMutation = useMutation({
    mutationFn: (data: { password: string }) => deleteFn({ data }),
    onSuccess: async (result) => {
      if (result.ok) await leave();
      else setError(result.error);
    },
  });

  function confirmDelete(event: FormEvent) {
    event.preventDefault();
    if (deleteMutation.isPending) return;
    const parsed = deleteAccountSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "password_required");
      return;
    }
    setError("");
    deleteMutation.mutate({ password });
  }

  return (
    <div className="account-exit">
      <Button
        variant="note"
        type="button"
        disabled={logoutMutation.isPending}
        onClick={() => logoutMutation.mutate()}
      >
        {ar ? "اخرج" : "LOG OUT"}
      </Button>
      {!confirming ? (
        <button type="button" className="join-switch" onClick={() => setConfirming(true)}>
          {ar ? "امسح حسابي" : "Delete my account"}
        </button>
      ) : (
        <form className="account-delete" noValidate onSubmit={confirmDelete}>
          <p>
            {ar
              ? "سنوبي بتاعك هيختفي للأبد. طلباتك هتفضل عند المحل عشان السجلات، ومن غير ما تتربط بحد. فلوسك لسه هتتحسب لسنوبي الأصلي."
              : "Your Snobi disappears for good. Your orders stay with the shop for its records, tied to nobody. Your money still counts for the original Snobi."}
          </p>
          <div className="contact-field">
            <label htmlFor="account-delete-password">
              {ar ? "اكتب الباسورد عشان تأكد" : "Enter your password to confirm"}
            </label>
            <Input
              id="account-delete-password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              maxLength={128}
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "account-delete-error" : undefined}
            />
            {error && (
              <p className="contact-error" id="account-delete-error">
                {error === "bad_credentials"
                  ? ar
                    ? "الباسورد غلط."
                    : "Wrong password."
                  : accountErrorText(error, ar)}
              </p>
            )}
          </div>
          <div className="account-delete-actions">
            <Button variant="ink" type="submit" disabled={deleteMutation.isPending}>
              {ar ? "امسح نهائي" : "DELETE FOR GOOD"}
            </Button>
            <button
              type="button"
              className="join-switch"
              onClick={() => {
                setConfirming(false);
                setPassword("");
                setError("");
              }}
            >
              {ar ? "لأ، خلاص" : "Never mind"}
            </button>
          </div>
        </form>
      )}
      {(logoutMutation.isError || deleteMutation.isError) && (
        <p className="contact-error" role="alert">
          {accountErrorText("unknown", ar)}
        </p>
      )}
    </div>
  );
}
