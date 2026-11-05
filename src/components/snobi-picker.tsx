import { Check } from "lucide-react";
import { SnobiAvatar } from "@/components/snobi-avatar";
import { Input } from "@/components/ui/input";
import { accountErrorText } from "@/lib/account-copy";
import { TITLE_SUGGESTIONS, type SnobiOption } from "@/lib/account-rules";

// A native radio group, so arrow keys and screen readers work without extra code.
export function SnobiPicker({
  ar,
  options,
  value,
  error,
  onChange,
}: {
  ar: boolean;
  options: SnobiOption[];
  value: string;
  error?: string | undefined;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset
      className="snobi-picker"
      id="account-snobiOptionId"
      aria-describedby={error ? "account-snobiOptionId-error" : undefined}
    >
      <legend>
        {ar ? "اختار سنوبي بتاعك" : "Pick your Snobi"} <span aria-hidden="true">*</span>
      </legend>
      <div className="snobi-picker-grid">
        {options.map((option) => (
          <label key={option.id} className="snobi-option">
            <input
              type="radio"
              name="snobiOptionId"
              value={option.id}
              checked={value === option.id}
              aria-invalid={Boolean(error)}
              onChange={() => onChange(option.id)}
            />
            <span className="snobi-option-card">
              <Check className="snobi-option-tick" aria-hidden="true" />
              <span className="snobi-option-art" aria-hidden="true">
                <SnobiAvatar imageUrl={option.imageUrl} alt="" className="snobi-option-avatar" />
              </span>
              <span className="snobi-option-name">{ar ? option.nameAr : option.nameEn}</span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="contact-error" id="account-snobiOptionId-error">
          {accountErrorText(error, ar)}
        </p>
      )}
    </fieldset>
  );
}

export function TitleField({
  ar,
  value,
  error,
  onChange,
}: {
  ar: boolean;
  value: string;
  error?: string | undefined;
  onChange: (title: string) => void;
}) {
  return (
    <div className="contact-field contact-wide">
      <label htmlFor="account-title">
        {ar ? "اللقب" : "Title"} <span>{ar ? "(اختياري)" : "(optional)"}</span>
      </label>
      <Input
        id="account-title"
        name="title"
        value={value}
        maxLength={40}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "account-title-error" : undefined}
      />
      <div
        className="title-chips"
        role="group"
        aria-label={ar ? "ألقاب مقترحة" : "Suggested titles"}
      >
        {TITLE_SUGGESTIONS[ar ? "ar" : "en"].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="title-chip"
            aria-pressed={value === suggestion}
            onClick={() => onChange(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      {error && (
        <p className="contact-error" id="account-title-error">
          {accountErrorText(error, ar)}
        </p>
      )}
    </div>
  );
}
