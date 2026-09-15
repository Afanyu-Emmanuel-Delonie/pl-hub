"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { parseQuizMarkdown, type ParsedQuestionSet } from "@/lib/quizImport";
import type { QuizQuestion } from "@/lib/types";

// Lets a TA paste a whole written quiz (title, "## SET" sections, ✅-marked
// options) instead of building 13 questions one at a time in the editor
// below. A doc covering multiple sittings parses into multiple sets — pick
// which one to load; loading replaces the current question list.
export function QuizImportPanel({
  onImport,
  onTitleSuggestion,
  confirmReplace,
}: {
  onImport: (questions: QuizQuestion[]) => void;
  onTitleSuggestion?: (title: string) => void;
  // Called before an import that would discard already-written questions —
  // return false to cancel. Omit to always replace without asking (used on
  // the New quiz page, which usually still just has the one blank starter).
  confirmReplace?: (count: number) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sets, setSets] = useState<ParsedQuestionSet[] | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  function handleParse() {
    const result = parseQuizMarkdown(text);
    if (result.sets.length === 0) {
      setError("Couldn't find any questions in that text — check it matches the expected format.");
      setSets(null);
      return;
    }
    setError(null);
    setDocumentTitle(result.documentTitle);
    setSets(result.sets);
  }

  function applySet(set: ParsedQuestionSet) {
    if (confirmReplace && !confirmReplace(set.questions.length)) return;
    onImport(set.questions);
    if (onTitleSuggestion && documentTitle) {
      const multipleSets = (sets?.length ?? 0) > 1;
      onTitleSuggestion(multipleSets ? `${documentTitle} — ${set.label}` : documentTitle);
    }
    setOpen(false);
    setText("");
    setSets(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-brand hover:underline"
      >
        Paste questions from text
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Paste questions</p>
        <button
          type="button"
          onClick={() => { setOpen(false); setSets(null); setError(null); }}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          Close
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Paste a written quiz doc — numbered questions with ✅-marked correct options, optionally
        split into &quot;## SET&quot; sections for multiple sittings.
      </p>
      <Textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSets(null); setError(null); }}
        rows={8}
        placeholder="**1. Question text.** *&#10;- ✅ Correct option&#10;- Other option"
        className="font-mono text-xs"
      />
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" variant="secondary" onClick={handleParse} disabled={!text.trim()}>
          Parse
        </Button>
      </div>

      {sets && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-slate-500">
            Found {sets.length} set{sets.length !== 1 ? "s" : ""} — choose one to load:
          </p>
          {sets.map((set, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applySet(set)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand hover:bg-brand-tint"
            >
              <span className="text-slate-700">{set.label}</span>
              <span className="text-xs text-slate-400">{set.questions.length} questions</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
