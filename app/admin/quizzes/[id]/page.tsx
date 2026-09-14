"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { QUIZZES, QUIZ_RESPONSES, setQuizClosedGroups } from "@/lib/mock-data";
import { isQuizClosedForGroup, isQuizOpen, quizGroups } from "@/lib/quizzes";
import { formatDate, formatDeadline, isPast } from "@/lib/format";
import type { QuizQuestion } from "@/lib/types";

type Tab = "questions" | "responses";

const TYPE_LABELS: Record<string, string> = {
  "multiple-choice": "Multiple choice",
  "multi-select": "Multi-select",
  "true-false": "True / False",
  "short-answer": "Short answer",
};

function QuestionCard({ question, index }: { question: QuizQuestion; index: number }) {
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
        <span className="ml-9 shrink-0 self-start rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 sm:ml-0">
          {TYPE_LABELS[question.type] ?? question.type}
        </span>
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

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("questions");
  const [, forceUpdate] = useState(0);

  const quiz = useMemo(() => QUIZZES.find((q) => q.id === params.id), [params.id]);
  const results = useMemo(
    () =>
      QUIZ_RESPONSES.filter((r) => r.quizId === params.id).sort(
        (a, b) => b.score / b.maxScore - a.score / a.maxScore
      ),
    [params.id]
  );

  if (!quiz) {
    return (
      <div>
        <Link href="/admin/quizzes" className="text-sm text-brand hover:underline">
          ← Back to quizzes
        </Link>
        <p className="mt-4 text-sm text-slate-500">Quiz not found.</p>
      </div>
    );
  }

  const isClosed = !isQuizOpen(quiz);
  const groups = quizGroups(quiz);

  const average =
    results.length > 0
      ? Math.round(
          (results.reduce((sum, r) => sum + r.score / r.maxScore, 0) / results.length) * 100
        )
      : 0;

  function toggleGroup(group: string) {
    const closedGroups = quiz!.closedGroups.includes(group)
      ? quiz!.closedGroups.filter((g) => g !== group)
      : [...quiz!.closedGroups, group];
    setQuizClosedGroups(quiz!.id, closedGroups);
    forceUpdate((n) => n + 1);
  }

  return (
    <div>
      <Link href="/admin/quizzes" className="text-sm text-brand hover:underline">
        ← Back to quizzes
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{quiz.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Due {formatDeadline(quiz.deadline)}</span>
            <span>·</span>
            <span>{quiz.groups.length === 0 ? "All groups" : quiz.groups.join(", ")}</span>
            <span>·</span>
            <span>{quiz.questions.length} questions</span>
            <Badge variant={isClosed ? "neutral" : "brand"} dot>
              {isClosed ? "Closed" : "Open"}
            </Badge>
          </div>
        </div>
        <Link href={`/admin/quizzes/${quiz.id}/edit`} className="self-start">
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Responses" value={String(results.length)} />
        <StatCard label="Average score" value={results.length > 0 ? `${average}%` : "—"} />
        <StatCard
          label="Top score"
          value={results.length > 0 ? `${results[0].score}/${results[0].maxScore}` : "—"}
        />
      </div>

      {/* Groups */}
      <Card className="mb-6 px-5 py-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Groups
        </h2>
        <p className="mb-3 mt-1 text-xs text-slate-400">
          Click a group to close or reopen its access early.
        </p>
        <ul className="space-y-1">
          {groups.map((g) => {
            const pastDeadline = isPast(quiz.deadline);
            const closed = isQuizClosedForGroup(quiz, g);
            const closedEarly = quiz.closedGroups.includes(g) && !pastDeadline;
            return (
              <li key={g}>
                <button
                  type="button"
                  disabled={pastDeadline}
                  onClick={() => toggleGroup(g)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    pastDeadline ? "cursor-default" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-slate-600">{g}</span>
                  <span className="flex items-center gap-3">
                    {closedEarly && <Badge variant="warning">Closed early</Badge>}
                    <Badge variant={closed ? "neutral" : "brand"}>
                      {closed ? "Closed" : "Open"}
                    </Badge>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(["questions", "responses"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-foreground"
            }`}
          >
            {t}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
              tab === t ? "bg-brand-tint text-brand" : "bg-slate-100 text-slate-500"
            }`}>
              {t === "questions" ? quiz.questions.length : results.length}
            </span>
          </button>
        ))}
      </div>

      {/* Questions tab */}
      {tab === "questions" && (
        <div className="space-y-4">
          {quiz.questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} />
          ))}
        </div>
      )}

      {/* Responses tab */}
      {tab === "responses" && (
        <Card>
          {results.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-400">No responses yet.</p>
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-medium">Rank</th>
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">Group</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-4 text-slate-400 tabular-nums">{i + 1}</td>
                      <td className="px-5 py-4 font-medium text-foreground">{r.studentName}</td>
                      <td className="px-5 py-4 text-slate-500">{r.group}</td>
                      <td className="px-5 py-4 tabular-nums text-foreground">
                        {r.score}/{r.maxScore}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(r.submittedAt)}
                        {r.late && <span className="ml-2"><Badge variant="warning">Late</Badge></span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="divide-y divide-slate-50 md:hidden">
                {results.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-4 text-xs text-slate-400 tabular-nums">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.studentName}</p>
                        <p className="text-xs text-slate-400">
                          {r.group} · {formatDate(r.submittedAt)}
                          {r.late && (
                            <span className="ml-2">
                              <Badge variant="warning">Late</Badge>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {r.score}/{r.maxScore}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
