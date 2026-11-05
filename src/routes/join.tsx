import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/snobi";
import { SnobiPicker, TitleField } from "@/components/snobi-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  currentUserKey,
  currentUserQuery,
  login,
  register,
  snobiOptionsQuery,
} from "@/lib/account";
import {
  accountErrorText,
  fieldErrors,
  type ErrorField,
  type FieldErrors,
} from "@/lib/account-copy";
import {
  joinRedirectTarget,
  loginSchema,
  registerSchema,
  type AccountResult,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/account-rules";

export const Route = createFileRoute("/join")({
  validateSearch: (search: { redirect?: unknown }): { redirect?: "checkout" } =>
    search.redirect === "checkout" ? { redirect: "checkout" } : {},
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient
      .fetchQuery({ ...currentUserQuery, staleTime: 0 })
      .catch(() => null);
    if (user) throw redirect({ to: joinRedirectTarget(search.redirect) });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(snobiOptionsQuery),
  head: () => ({
    meta: [
      { title: "Create Your Own Snobi" },
      {
        name: "description",
        content: "Pick a Snobi, give yourself a ridiculous title and see how much you’ve donated.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinPage,
});

const CREATE_ORDER: ErrorField[] = ["snobiOptionId", "displayName", "title", "phone", "password"];
const LOGIN_ORDER: ErrorField[] = ["phone", "password"];

function JoinPage() {
  const { ar } = useLanguage();
  const { redirect: target } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"create" | "login">("create");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  async function finish(result: AccountResult, order: ErrorField[]) {
    if (!result.ok) {
      const field =
        result.error === "phone_taken"
          ? "phone"
          : result.error === "snobi_unavailable"
            ? "snobiOptionId"
            : "form";
      showErrors({ [field]: result.error }, order);
      if (result.error === "snobi_unavailable") {
        await queryClient.invalidateQueries({ queryKey: snobiOptionsQuery.queryKey });
      }
      return;
    }
    await queryClient.invalidateQueries({ queryKey: currentUserKey });
    await navigate({ to: joinRedirectTarget(target), replace: true });
  }

  function showErrors(next: FieldErrors, order: ErrorField[]) {
    setErrors(next);
    const first = order.find((f) => next[f]);
    if (!first) return;
    // The Snobi picker is a group of radios: focus goes to the first one.
    formRef.current
      ?.querySelector<HTMLElement>(
        first === "snobiOptionId" ? "input[type=radio]" : `#account-${first}`,
      )
      ?.focus();
  }

  function switchMode(next: "create" | "login") {
    setMode(next);
    setErrors({});
  }

  const shared = { ar, phone, password, errors, formRef, setPhone, setPassword };

  return (
    <section className="join-page page-width">
      <div className="join-heading">
        <span className="section-kicker">
          {mode === "create"
            ? ar
              ? "مجاني. سنوبي هو اللي مفلس، مش إنت."
              : "FREE. HE’S THE BROKE ONE, NOT YOU."
            : ar
              ? "إنت تاني؟"
              : "YOU AGAIN?"}
        </span>
        <h1>
          {mode === "create"
            ? ar
              ? "اعمل سنوبي بتاعك."
              : "CREATE YOUR OWN SNOBI."
            : ar
              ? "ادخل."
              : "LOG IN."}
        </h1>
        <p>
          {mode === "create" ? (
            <>
              {ar ? "عندك سنوبي بالفعل؟ " : "Already have a Snobi? "}
              <button type="button" className="join-switch" onClick={() => switchMode("login")}>
                {ar ? "سجّل دخول" : "Log in"}
              </button>
            </>
          ) : (
            <>
              {ar ? "لسه معندكش سنوبي؟ " : "No Snobi yet? "}
              <button type="button" className="join-switch" onClick={() => switchMode("create")}>
                {ar ? "اعمل واحد" : "Create one"}
              </button>
            </>
          )}
        </p>
        {target === "checkout" && (
          <p className="join-bag-note">
            {ar
              ? "شنطتك محفوظة. هنرجّعك على إتمام الطلب."
              : "Your bag is saved. We’ll take you back to checkout."}
          </p>
        )}
      </div>
      {mode === "create" ? (
        <CreateForm
          {...shared}
          order={CREATE_ORDER}
          showErrors={showErrors}
          setErrors={setErrors}
          finish={finish}
          onLogIn={() => switchMode("login")}
        />
      ) : (
        <LoginForm
          {...shared}
          order={LOGIN_ORDER}
          showErrors={showErrors}
          setErrors={setErrors}
          finish={finish}
        />
      )}
    </section>
  );
}

interface FormProps {
  ar: boolean;
  phone: string;
  password: string;
  errors: FieldErrors;
  formRef: React.RefObject<HTMLFormElement | null>;
  setPhone: (value: string) => void;
  setPassword: (value: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  order: ErrorField[];
  showErrors: (errors: FieldErrors, order: ErrorField[]) => void;
  finish: (result: AccountResult, order: ErrorField[]) => Promise<void>;
}

function Field({
  id,
  label,
  error,
  ar,
  note,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  ar: boolean;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="contact-field contact-wide">
      <label htmlFor={`account-${id}`}>
        {label} <span aria-hidden="true">*</span>
      </label>
      {children}
      {note && (
        <p className="contact-field-note" id={`account-${id}-note`}>
          {note}
        </p>
      )}
      {error && (
        <p className="contact-error" id={`account-${id}-error`}>
          {accountErrorText(error, ar)}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error: string | undefined, note: boolean) {
  const ids = [error && `account-${id}-error`, note && `account-${id}-note`].filter(Boolean);
  return ids.join(" ") || undefined;
}

function FormProblem({ ar, code }: { ar: boolean; code: string | undefined }) {
  return (
    <div aria-live="assertive">
      {code && (
        <div className="contact-feedback" role="alert">
          <strong>{accountErrorText(code, ar)}</strong>
        </div>
      )}
    </div>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button variant="ink" type="submit" className="join-submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {children}
      {!pending && <ArrowUpRight aria-hidden="true" />}
    </Button>
  );
}

function CreateForm({
  ar,
  phone,
  password,
  errors,
  formRef,
  setPhone,
  setPassword,
  setErrors,
  order,
  showErrors,
  finish,
  onLogIn,
}: FormProps & { onLogIn: () => void }) {
  const { data: options } = useSuspenseQuery(snobiOptionsQuery);
  const [snobiOptionId, setSnobiOptionId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const mutation = useMutation({
    mutationFn: (data: RegisterPayload) => register({ data }),
    onSuccess: (result) => finish(result, order),
  });
  const clear = (field: ErrorField) => setErrors((e) => ({ ...e, [field]: "", form: "" }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    const payload = { snobiOptionId, displayName, title, phone, password, isPublic };
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      showErrors(fieldErrors(parsed.error.issues), order);
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
        onChange={(id) => {
          setSnobiOptionId(id);
          clear("snobiOptionId");
        }}
      />
      <div className="contact-fields">
        <Field
          id="displayName"
          label={ar ? "اسمك" : "Your name"}
          error={errors.displayName}
          ar={ar}
          note={ar ? "اللي هيظهر. اسم الدلع ينفع." : "The one people see. A nickname is fine."}
        >
          <Input
            id="account-displayName"
            value={displayName}
            maxLength={30}
            autoComplete="nickname"
            onChange={(e) => {
              setDisplayName(e.target.value);
              clear("displayName");
            }}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={describedBy("displayName", errors.displayName, true)}
          />
        </Field>
        <TitleField
          ar={ar}
          value={title}
          error={errors.title}
          onChange={(value) => {
            setTitle(value);
            clear("title");
          }}
        />
        <Field
          id="phone"
          label={ar ? "رقم الموبايل" : "Mobile number"}
          error={errors.phone}
          ar={ar}
          note={
            ar ? "للدخول بس. عمره ما بيظهر لحد." : "Only for logging in. Nobody else ever sees it."
          }
        >
          <Input
            id="account-phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            maxLength={20}
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clear("phone");
            }}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone", errors.phone, true)}
          />
          {errors.phone === "phone_taken" && (
            <button type="button" className="join-switch join-switch-field" onClick={onLogIn}>
              {ar ? "سجّل دخول بدل كده" : "Log in instead"}
            </button>
          )}
        </Field>
        <Field
          id="password"
          label={ar ? "الباسورد" : "Password"}
          error={errors.password}
          ar={ar}
          note={ar ? "٨ حروف على الأقل." : "At least 8 characters."}
        >
          <Input
            id="account-password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            maxLength={128}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clear("password");
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password", errors.password, true)}
          />
        </Field>
      </div>
      <label className="join-public">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        <span>
          {ar
            ? "اعرض سنوبي بتاعي واسمي ولقبي والمبلغ اللي اتبرعت بيه في الترتيب العام. رقم موبايلي عمره ما يظهر."
            : "Show my Snobi, name, title and how much I’ve donated on the public leaderboard. My mobile number is never shown."}
        </span>
      </label>
      <FormProblem ar={ar} code={errors.form} />
      {mutation.isError && <FormProblem ar={ar} code="unknown" />}
      <SubmitButton pending={mutation.isPending}>
        {ar ? "اعمل سنوبي بتاعي" : "CREATE MY SNOBI"}
      </SubmitButton>
      <p className="join-fine">
        {ar ? "بالتسجيل إنت موافق على " : "By creating one you agree to the "}
        <Link to="/terms">{ar ? "الشروط" : "terms"}</Link>
        {ar ? " و" : " and "}
        <Link to="/privacy">{ar ? "الخصوصية" : "privacy policy"}</Link>
        {ar ? "." : "."}
      </p>
    </form>
  );
}

function LoginForm({
  ar,
  phone,
  password,
  errors,
  formRef,
  setPhone,
  setPassword,
  setErrors,
  order,
  showErrors,
  finish,
}: FormProps) {
  const mutation = useMutation({
    mutationFn: (data: LoginPayload) => login({ data }),
    onSuccess: (result) => finish(result, order),
  });
  const clear = (field: ErrorField) => setErrors((e) => ({ ...e, [field]: "", form: "" }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    const payload = { phone, password };
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      showErrors(fieldErrors(parsed.error.issues), order);
      return;
    }
    setErrors({});
    mutation.mutate(payload);
  }

  return (
    <form ref={formRef} className="join-form join-form-login" noValidate onSubmit={submit}>
      <div className="contact-fields">
        <Field
          id="phone"
          label={ar ? "رقم الموبايل" : "Mobile number"}
          error={errors.phone}
          ar={ar}
        >
          <Input
            id="account-phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="username"
            maxLength={20}
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clear("phone");
            }}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone", errors.phone, false)}
          />
        </Field>
        <Field id="password" label={ar ? "الباسورد" : "Password"} error={errors.password} ar={ar}>
          <Input
            id="account-password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            maxLength={128}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clear("password");
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password", errors.password, false)}
          />
        </Field>
      </div>
      <FormProblem ar={ar} code={errors.form} />
      {mutation.isError && <FormProblem ar={ar} code="unknown" />}
      <SubmitButton pending={mutation.isPending}>{ar ? "ادخل" : "LOG IN"}</SubmitButton>
      <p className="join-fine">
        {ar ? "نسيت الباسورد؟ " : "Forgot your password? "}
        <Link to="/contact">{ar ? "ابعتلنا وهنرجّعهولك" : "Message us and we’ll reset it"}</Link>.
      </p>
    </form>
  );
}
