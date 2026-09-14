"use client";

import { Input, Textarea } from "@/components/ui/Field";
import { Code2, X } from "lucide-react";
import type { QuizQuestion, QuizQuestionType } from "@/lib/types";

const TYPE_LABELS: Record<QuizQuestionType, string> = {
  "multiple-choice": "Multiple choice",
  "multi-select": "Multi-select",
  "true-false": "True / False",
  "short-answer": "Short answer",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function emptyQuestion(): QuizQuestion {
  return {
    id: uid(),
    type: "multiple-choice",
    text: "",
    options: ["", ""],
    correctIndexes: [0],
    points: 1,
  };
}

export function QuestionEditor({
  index,
  question,
  onChange,
  onRemove,
  removable,
}: {
  index: number;
  question: QuizQuestion;
  onChange: (q: QuizQuestion) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  function setType(type: QuizQuestionType) {
    const base = { ...question, type };
    if (type === "true-false") {
      onChange({ ...base, options: ["True", "False"], correctIndexes: [0] });
    } else if (type === "short-answer") {
      onChange({ ...base, options: [], correctIndexes: [] });
    } else if (type === "multiple-choice") {
      onChange({ ...base, options: question.options.length >= 2 ? question.options : ["", ""], correctIndexes: [0] });
    } else {
      onChange({ ...base, correctIndexes: [] });
    }
  }

  function updateOption(i: number, value: string) {
    const options = question.options.map((o, idx) => (idx === i ? value : o));
    onChange({ ...question, options });
  }

  function addOption() {
    if (question.options.length >= 6) return;
    onChange({ ...question, options: [...question.options, ""] });
  }

  function removeOption(i: number) {
    if (question.options.length <= 2) return;
    const options = question.options.filter((_, idx) => idx !== i);
    const correctIndexes = question.correctIndexes
      .filter((ci) => ci !== i)
      .map((ci) => (ci > i ? ci - 1 : ci));
    onChange({ ...question, options, correctIndexes: correctIndexes.length ? correctIndexes : [0] });
  }

  function toggleCorrect(i: number) {
    if (question.type === "multi-select") {
      const already = question.correctIndexes.includes(i);
      const next = already
        ? question.correctIndexes.filter((ci) => ci !== i)
        : [...question.correctIndexes, i];
      onChange({ ...question, correctIndexes: next.length ? next : [i] });
    } else {
      onChange({ ...question, correctIndexes: [i] });
    }
  }

  const showOptions = question.type !== "short-answer";
  const isFixed = question.type === "true-false";

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Q{index + 1}
        </span>
        <div className="flex items-center gap-2">
          {/* Bonus toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={!!question.isBonus}
              onChange={(e) => onChange({ ...question, isBonus: e.target.checked })}
              className="h-3.5 w-3.5 accent-amber-500"
            />
            Bonus
          </label>
          {/* Points */}
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Points
            <input
              type="number"
              min={1}
              value={question.points}
              onChange={(e) =>
                onChange({ ...question, points: Math.max(1, Number(e.target.value) || 1) })
              }
              className="w-12 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center text-xs font-medium text-slate-600 focus:border-brand focus:outline-none"
            />
          </label>
          {/* Type selector */}
          <select
            value={question.type}
            onChange={(e) => setType(e.target.value as QuizQuestionType)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none"
          >
            {(Object.keys(TYPE_LABELS) as QuizQuestionType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          {removable && (
            <button type="button" onClick={onRemove} className="text-slate-300 hover:text-rose-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {/* Question text */}
        <Textarea
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          rows={2}
          placeholder="Question text..."
          required
        />
        {question.isBonus && (
          <p className="text-xs font-medium text-amber-600">
            Bonus question — always shown last, optional, and scored as extra credit.
          </p>
        )}

        {/* Optional code block toggle */}
        {!question.codeBlock ? (
          <button
            type="button"
            onClick={() => onChange({ ...question, codeBlock: { value: "", language: "SQL" } })}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-brand transition-colors"
          >
            <Code2 className="h-3.5 w-3.5" /> Add code block
          </button>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={question.codeBlock.language ?? "SQL"}
                  onChange={(e) =>
                    onChange({ ...question, codeBlock: { ...question.codeBlock!, language: e.target.value } })
                  }
                  className="w-20 py-0.5 text-xs"
                  placeholder="SQL"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...question, codeBlock: undefined })}
                className="text-slate-300 hover:text-rose-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <Textarea
              value={question.codeBlock.value}
              onChange={(e) =>
                onChange({ ...question, codeBlock: { ...question.codeBlock!, value: e.target.value } })
              }
              rows={5}
              placeholder="SELECT * FROM ..."
              className="font-mono text-xs"
            />
          </div>
        )}

        {/* Options */}
        {showOptions && (
          <div className="space-y-2">
            {question.type === "multi-select" && (
              <p className="text-xs text-slate-400">Check all correct answers — highlighted green.</p>
            )}
            {question.type === "multiple-choice" && (
              <p className="text-xs text-slate-400">Select the correct answer — highlighted green.</p>
            )}
            {question.options.map((opt, i) => {
              const isCorrect = question.correctIndexes.includes(i);
              const inputType = question.type === "multi-select" ? "checkbox" : "radio";
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                    isCorrect
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type={inputType}
                    name={`correct-${question.id}`}
                    checked={isCorrect}
                    onChange={() => toggleCorrect(i)}
                    className="h-4 w-4 shrink-0 accent-[#003262]"
                  />
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    disabled={isFixed}
                    required={!isFixed}
                    className={`border-0 p-0 shadow-none focus:ring-0 ${
                      isFixed ? "bg-transparent text-slate-500" : "bg-transparent"
                    } ${
                      isCorrect ? "font-medium text-emerald-700" : ""
                    }`}
                  />
                  {isCorrect && (
                    <span className="ml-auto shrink-0 text-xs font-medium text-emerald-600">✓</span>
                  )}
                  {!isFixed && question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
            {!isFixed && question.options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-1 text-xs font-medium text-brand hover:underline"
              >
                + Add option
              </button>
            )}
          </div>
        )}

        {question.type === "short-answer" && (
          <p className="text-xs text-slate-400 italic">Students type a free-text answer.</p>
        )}
      </div>
    </div>
  );
}
