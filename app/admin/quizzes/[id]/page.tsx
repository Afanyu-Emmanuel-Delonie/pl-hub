"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Modal } from "@/components/ui/Modal";
import { ShareLink } from "@/components/ui/ShareLink";
import { QRCodeImage } from "@/components/ui/QRCodeImage";
import { useQuizStore } from "@/lib/store";
import { isQuizOpen, orderQuestions } from "@/lib/quizzes";
import { formatDate, formatDeadline } from "@/lib/format";
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

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("questions");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<{ id: string; studentName: string } | null>(null);
  const { quizzes, responses, deleteQuiz, endQuiz, reopenQuiz, deleteQuizResponse } = useQuizStore();

  const quiz = useMemo(() => quizzes.find((q) => q.id === params.id), [quizzes, params.id]);
  const results = useMemo(
    () =>
      responses.filter((r) => r.quizId === params.id).sort(
        (a, b) => b.score / b.maxScore - a.score / a.maxScore
      ),
    [responses, params.id]
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
  const orderedQuestions = orderQuestions(quiz.questions);

  const average =
    results.length > 0
      ? Math.round(
          (results.reduce((sum, r) => sum + r.score / r.maxScore, 0) / results.length) * 100
        )
      : 0;

  function handleEndQuiz() {
    endQuiz(quiz!.id);
    setConfirmOpen(false);
  }

  function handleReopenQuiz() {
    reopenQuiz(quiz!.id);
  }

  function handleDelete() {
    deleteQuiz(quiz!.id);
    router.push("/admin/quizzes");
  }

  function confirmDeleteResponse() {
    if (!responseToDelete) return;
    deleteQuizResponse(responseToDelete.id);
    setResponseToDelete(null);
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
            <span>
              {quiz.questions.length} questions ·{" "}
              {quiz.questions.reduce((sum, q) => sum + q.points, 0)} points
            </span>
            <Badge variant={isClosed ? "neutral" : "brand"} dot>
              {isClosed ? "Closed" : "Open"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Link href={`/admin/quizzes/${quiz.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          {isClosed ? (
            <Button variant="secondary" onClick={handleReopenQuiz}>
              Reopen quiz
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              End quiz
            </Button>
          )}
          {isClosed && (
            <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
              Delete quiz
            </Button>
          )}
        </div>
      </div>

      {/* Share */}
      <Card className="mb-6 px-5 py-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Share with students
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="shrink-0 self-start transition-opacity hover:opacity-80"
            aria-label="View larger QR code"
          >
            <QRCodeImage path={`/q/${quiz.id}`} size={96} />
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <ShareLink path={`/q/${quiz.id}`} />
            <p className="text-xs text-slate-400">
              Students can scan the QR code or open the link to start.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Responses" value={String(results.length)} />
        <StatCard label="Average score" value={results.length > 0 ? `${average}%` : "—"} />
        <StatCard
          label="Top score"
          value={results.length > 0 ? `${results[0].score}/${results[0].maxScore}` : "—"}
        />
      </div>

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
          {orderedQuestions.map((q, i) => (
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
                    <th className="px-5 py-3 font-medium" />
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
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setResponseToDelete({ id: r.id, studentName: r.studentName })}
                          className="text-slate-400 hover:text-red-500"
                          aria-label="Delete response"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {r.score}/{r.maxScore}
                      </p>
                      <button
                        type="button"
                        onClick={() => setResponseToDelete({ id: r.id, studentName: r.studentName })}
                        className="text-slate-400 hover:text-red-500"
                        aria-label="Delete response"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* End quiz confirm modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="End quiz?">
        <p className="text-sm text-slate-600">
          This immediately blocks every group from responding. You can reopen it at any time.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleEndQuiz}>End quiz</Button>
        </div>
      </Modal>

      {/* Delete quiz confirm modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete quiz?">
        <p className="text-sm text-slate-600">
          This permanently deletes &quot;{quiz.title}&quot; and all {results.length} of its
          responses. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Delete response confirm modal */}
      <Modal open={!!responseToDelete} onClose={() => setResponseToDelete(null)} title="Delete response?">
        <p className="text-sm text-slate-600">
          Delete {responseToDelete?.studentName}&apos;s response? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResponseToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteResponse}>Delete</Button>
        </div>
      </Modal>

      {/* QR code modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Scan to start">
        <div className="flex flex-col items-center gap-4">
          <QRCodeImage path={`/q/${quiz.id}`} size={240} />
          <ShareLink path={`/q/${quiz.id}`} />
        </div>
      </Modal>
    </div>
  );
}
