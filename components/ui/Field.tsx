"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef } from "react";

const baseClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-foreground placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint-strong";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

export function Input({
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const input = (
    <input
      {...props}
      className={`${baseClasses} ${error ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : ""} ${className ?? ""}`}
    />
  );
  // Only wrap in a div when there's an error to show — an unconditional
  // wrapper breaks callers that rely on the bare input sizing itself inside
  // a flex row (e.g. QuestionEditor's option rows use the default w-full).
  if (!error) return input;
  return (
    <div>
      {input}
      <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
    </div>
  );
}

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// Grows with content instead of clipping long text behind a fixed number of rows.
export function Textarea({ onChange, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [props.value]);

  return (
    <textarea
      ref={ref}
      onChange={(e) => {
        resize(e.target);
        onChange?.(e);
      }}
      className={`${baseClasses} resize-none overflow-hidden ${className ?? ""}`}
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseClasses} ${props.className ?? ""}`} />;
}
