import type { QuizQuestion } from "./types";

export type ParsedQuestionSet = { label: string; questions: QuizQuestion[] };
export type ParsedQuizMarkdown = { documentTitle?: string; sets: ParsedQuestionSet[] };

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function buildQuestion(text: string, options: { text: string; correct: boolean }[]): QuizQuestion {
  const correctIndexes = options
    .map((o, i) => (o.correct ? i : -1))
    .filter((i) => i >= 0);
  const isTrueFalse = options.length === 2 && options.every((o) => /^(true|false)$/i.test(o.text.trim()));
  const isMultiSelect = /\(select\s+(two|three|four|five|\d+)\)/i.test(text);

  return {
    id: uid(),
    type: isTrueFalse ? "true-false" : isMultiSelect ? "multi-select" : "multiple-choice",
    text,
    options: options.map((o) => o.text),
    // Falls back to option 0 if nothing was marked ✅, so a malformed block
    // still produces an editable question instead of one with no answer.
    correctIndexes: correctIndexes.length > 0 ? correctIndexes : [0],
    points: 1,
  };
}

// Parses the TA's "paste from a written quiz doc" markdown format into
// QuizQuestion[], grouped by "## SET ..." section so a single pasted
// document covering multiple sittings (like a two-set quiz) can seed either
// one. Expected per-question shape:
//   **1. Question text.** *
//   - ✅ Correct option
//   - Other option
// True/false is inferred from exactly two True/False options; multi-select
// from a "(Select TWO)"-style hint in the question text. Anything else
// (title lines, notes, the "✅ = correct answer" key, tables, blank lines)
// is ignored rather than rejected, so the source doc doesn't need cleanup
// before pasting.
export function parseQuizMarkdown(text: string): ParsedQuizMarkdown {
  const lines = text.split(/\r?\n/);
  const sets: ParsedQuestionSet[] = [];
  let current: ParsedQuestionSet | null = null;
  let pending: { text: string; options: { text: string; correct: boolean }[] } | null = null;
  let documentTitle: string | undefined;

  function flushQuestion() {
    if (!pending) return;
    if (pending.options.length > 0) {
      if (!current) {
        current = { label: "Questions", questions: [] };
        sets.push(current);
      }
      current.questions.push(buildQuestion(pending.text, pending.options));
    }
    pending = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const titleMatch = !documentTitle ? line.match(/^#\s+(.+)$/) : null;
    if (titleMatch) {
      documentTitle = titleMatch[1].trim();
      continue;
    }

    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushQuestion();
      current = { label: headingMatch[1].trim(), questions: [] };
      sets.push(current);
      continue;
    }

    const questionMatch = line.match(/^\*\*\d+\.\s*(.+?)\*\*\s*\*?\s*$/);
    if (questionMatch) {
      flushQuestion();
      pending = { text: questionMatch[1].trim(), options: [] };
      continue;
    }

    // A "---" horizontal rule between sections would otherwise be mistaken
    // for a one-character option ("-" prefix + a stray dash of text).
    if (/^-{3,}$/.test(line)) continue;

    const optionMatch = pending ? line.match(/^-\s*(✅\s*)?(.+)$/) : null;
    if (optionMatch) {
      pending!.options.push({ text: optionMatch[2].trim(), correct: Boolean(optionMatch[1]) });
      continue;
    }

    // Some docs put the "(Select TWO)" hint on its own line after the
    // options instead of inside the question text — fold it into the text
    // so buildQuestion's multi-select detection still catches it. Getting
    // this wrong silently produces an unscoreable question: multiple-choice
    // only ever lets a student pick one option, so a question with several
    // correct indexes could never be answered "correctly".
    const selectHintMatch = pending ? line.match(/^\*?\(select\s+(two|three|four|five|\d+)\)\*?$/i) : null;
    if (selectHintMatch) {
      pending!.text += ` (Select ${selectHintMatch[1].toUpperCase()})`;
      continue;
    }
  }
  flushQuestion();

  return { documentTitle, sets: sets.filter((s) => s.questions.length > 0) };
}
