"use client";

import { useEffect, useState } from "react";

export function ShareLink({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — silently ignore
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{url}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 text-xs font-medium text-brand hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
