"use client";

import { useState } from "react";

export function CodeBlock({ code, label = "SQL" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — silently ignore
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-medium text-brand hover:underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-white px-4 py-3 text-xs leading-relaxed text-foreground">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
