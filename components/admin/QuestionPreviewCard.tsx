import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import type { QuizQuestion } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  "multiple-choice": "Multiple choice",
  "multi-select": "Multi-select",
  "true-false": "True / False",
  "short-answer": "Short answer",
};

// Read-only, correct-answers-highlighted rendering of a question — used both
// on the admin quiz detail page and to preview parsed questions before a
// bulk import is actually created.
export function QuestionPreviewCard({ question, index }: { question: QuizQuestion; index: number }) {
  return (
    <Card className="px-5 py-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-brand">
            {index + 1}
          </span>
          <p className="pt-0.5 text-sm font-medium text-foreground leading-relaxed">
            {question.text}
          </p>
        </div>
        <div className="ml-9 flex shrink-0 items-center gap-2 sm:ml-0">
          {question.isBonus && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Bonus · optional
            </span>
          )}
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-medium text-brand">
            {question.points} pt{question.points !== 1 ? "s" : ""}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {TYPE_LABELS[question.type] ?? question.type}
          </span>
        </div>
      </div>

      {question.codeBlock && (
        <div className="mb-3 ml-9">
          <CodeBlock code={question.codeBlock.value} label={question.codeBlock.language ?? "SQL"} />
        </div>
      )}

      {question.type !== "short-answer" && (
        <ul className="ml-9 space-y-1.5">
          {question.options.map((opt, i) => {
            const isCorrect = question.correctIndexes.includes(i);
            return (
              <li
                key={i}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "bg-slate-50 text-slate-600"
                }`}
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  isCorrect ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-slate-300 text-slate-400"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {isCorrect && (
                  <span className="ml-auto text-xs font-medium text-emerald-600">✓ Correct</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {question.type === "short-answer" && (
        <p className="ml-9 text-xs italic text-slate-400">Free-text answer.</p>
      )}
    </Card>
  );
}
