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

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseClasses} ${props.className ?? ""}`} />;
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
