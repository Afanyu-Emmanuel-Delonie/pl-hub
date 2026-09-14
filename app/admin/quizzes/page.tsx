"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Badge } from "@/components/ui/Badge";
import { useQuizStore } from "@/lib/store";
import { quizStatus } from "@/lib/quizzes";
import { formatDeadline } from "@/lib/format";

const STATUS_LABEL = { open: "Open", "not-started": "Not started", closed: "Closed" } as const;
const STATUS_VARIANT = { open: "brand", "not-started": "warning", closed: "neutral" } as const;

export default function QuizzesPage() {
  const { quizzes, responses, groups } = useQuizStore();

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quizzes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create quizzes and review results as they come in.
          </p>
        </div>
        <ButtonLink href="/admin/quizzes/new">New quiz</ButtonLink>
      </div>

      <Card>
        {/* Desktop table */}
        <table className="hidden w-full text-left text-sm md:table">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Groups</th>
              <th className="px-5 py-3 font-medium">Deadline</th>
              <th className="px-5 py-3 font-medium">Questions</th>
              <th className="px-5 py-3 font-medium">Responses</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => {
              const count = responses.filter((r) => r.quizId === quiz.id).length;
              const status = quizStatus(quiz, groups);
              return (
                <tr key={quiz.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/quizzes/${quiz.id}`}
                      className="font-medium text-foreground hover:text-brand"
                    >
                      {quiz.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {quiz.groups.length === 0 ? "All groups" : quiz.groups.join(", ")}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDeadline(quiz.deadline)}</td>
                  <td className="px-5 py-4 text-slate-500 tabular-nums">{quiz.questions.length}</td>
                  <td className="px-5 py-4 text-slate-500 tabular-nums">{count}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="divide-y divide-slate-50 md:hidden">
          {quizzes.map((quiz) => {
            const count = responses.filter((r) => r.quizId === quiz.id).length;
            const status = quizStatus(quiz, groups);
            return (
              <Link
                key={quiz.id}
                href={`/admin/quizzes/${quiz.id}`}
                className="block px-4 py-4 active:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{quiz.title}</p>
                  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {quiz.groups.length === 0 ? "All groups" : quiz.groups.join(", ")}
                  {" · "}
                  {formatDeadline(quiz.deadline)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {quiz.questions.length} questions · {count} responses
                </p>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
