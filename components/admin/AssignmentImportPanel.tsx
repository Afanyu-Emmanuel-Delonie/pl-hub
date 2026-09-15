"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { parseAssignmentMarkdown, type ParsedAssignmentMarkdown } from "@/lib/assignmentImport";

// Lets a TA paste a whole written assignment (title, "## Instructions" bullet
// list, "## Content" with paragraphs / ```code``` blocks / "### Question"
// sections) instead of building it block-by-block below. Deadlines and
// groups aren't part of the pasted format — those stay TA-set fields on the
// surrounding form after import.
export function AssignmentImportPanel({
  onImport,
  confirmReplace,
}: {
  onImport: (parsed: ParsedAssignmentMarkdown) => void;
  // Called before an import that would discard already-written content —
  // return false to cancel. Omit to always replace without asking.
  confirmReplace?: (blockCount: number) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedAssignmentMarkdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleParse() {
    const result = parseAssignmentMarkdown(text);
    if (result.blocks.length === 0 && result.instructions.length === 0) {
      setError("Couldn't find any instructions or content in that text — check it matches the expected format.");
      setParsed(null);
      return;
    }
    setError(null);
    setParsed(result);
  }

  function apply() {
    if (!parsed) return;
    if (confirmReplace && !confirmReplace(parsed.blocks.length)) return;
    onImport(parsed);
    setOpen(false);
    setText("");
    setParsed(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-brand hover:underline"
      >
        Paste assignment from text
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Paste assignment</p>
        <button
          type="button"
          onClick={() => { setOpen(false); setParsed(null); setError(null); }}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          Close
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Paste a written assignment doc — a &quot;# Title&quot;, an optional &quot;Max score: N&quot;
        line, a &quot;## Instructions&quot; bullet list, and a &quot;## Content&quot; section with
        paragraphs, fenced ```code``` blocks, and &quot;### Question&quot; headings followed by a
        numbered list.
      </p>
      <Textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setParsed(null); setError(null); }}
        rows={8}
        placeholder={"# Assignment title\n\n## Instructions\n- Name your repo...\n\n## Content\nScenario text...\n\n### Question 1\n1. Sub-question..."}
        className="font-mono text-xs"
      />
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" variant="secondary" onClick={handleParse} disabled={!text.trim()}>
          Parse
        </Button>
      </div>

      {parsed && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <div className="text-xs text-slate-500">
            {parsed.title && <p>Title: <span className="font-medium text-slate-700">{parsed.title}</span></p>}
            {parsed.maxScore !== undefined && <p>Max score: <span className="font-medium text-slate-700">{parsed.maxScore}</span></p>}
            <p>{parsed.instructions.length} instruction point{parsed.instructions.length !== 1 ? "s" : ""}</p>
            <p>{parsed.blocks.length} content block{parsed.blocks.length !== 1 ? "s" : ""}</p>
          </div>
          <Button type="button" size="sm" onClick={apply}>
            Use this
          </Button>
        </div>
      )}
    </div>
  );
}
