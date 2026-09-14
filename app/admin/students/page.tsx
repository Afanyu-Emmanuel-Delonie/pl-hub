"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ASSIGNMENTS,
  ASSIGNMENT_SUBMISSIONS,
  GROUPS,
  QUIZZES,
  QUIZ_RESPONSES,
  STUDENTS,
} from "@/lib/mock-data";
import { computeLeaderboard } from "@/lib/rankings";

const PAGE_SIZE = 5;

function assignmentCell(studentId: string, assignmentId: string) {
  const sub = ASSIGNMENT_SUBMISSIONS.find(
    (s) => s.studentId === studentId && s.assignmentId === assignmentId
  );
  if (!sub || sub.score === null) return "—";
  return `${sub.score}/${sub.maxScore}`;
}

function quizCell(studentId: string, quizId: string) {
  const resp = QUIZ_RESPONSES.find(
    (r) => r.studentId === studentId && r.quizId === quizId
  );
  if (!resp) return "—";
  return `${resp.score}/${resp.maxScore}`;
}

export default function StudentsPage() {
  const [group, setGroup] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const leaderboard = useMemo(() => computeLeaderboard(), []);
  const totalsById = useMemo(
    () => Object.fromEntries(leaderboard.map((row) => [row.studentId, row])),
    [leaderboard]
  );

  const filtered = useMemo(
    () => (group ? STUDENTS.filter((s) => s.group === group) : STUDENTS),
    [group]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function selectGroup(g: string | null) {
    setGroup(g);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Every mark across assignments, quizzes, and bonus points.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectGroup(null)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              group === null
                ? "border-brand bg-brand-tint text-brand"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All groups
          </button>
          {GROUPS.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => selectGroup(g)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                group === g
                  ? "border-brand bg-brand-tint text-brand"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="whitespace-nowrap px-5 py-3 font-medium">Student</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Group</th>
                {ASSIGNMENTS.map((a, i) => (
                  <th
                    key={a.id}
                    title={a.title}
                    className="whitespace-nowrap px-5 py-3 text-center font-medium"
                  >
                    A{i + 1}
                  </th>
                ))}
                {QUIZZES.map((q, i) => (
                  <th
                    key={q.id}
                    title={q.title}
                    className="whitespace-nowrap px-5 py-3 text-center font-medium"
                  >
                    Q{i + 1}
                  </th>
                ))}
                <th className="whitespace-nowrap px-5 py-3 text-center font-medium">
                  Bonus
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((student) => {
                const totals = totalsById[student.id];
                return (
                  <tr
                    key={student.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.id}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {student.group}
                    </td>
                    {ASSIGNMENTS.map((a) => (
                      <td
                        key={a.id}
                        className="whitespace-nowrap px-5 py-4 text-center tabular-nums text-slate-500"
                      >
                        {assignmentCell(student.id, a.id)}
                      </td>
                    ))}
                    {QUIZZES.map((q) => (
                      <td
                        key={q.id}
                        className="whitespace-nowrap px-5 py-4 text-center tabular-nums text-slate-500"
                      >
                        {quizCell(student.id, q.id)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-5 py-4 text-center tabular-nums text-slate-500">
                      {totals && totals.bonus > 0 ? `+${totals.bonus}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-center tabular-nums font-semibold text-foreground">
                      {totals ? totals.total : 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-slate-50 md:hidden">
          {pageItems.map((student) => {
            const totals = totalsById[student.id];
            return (
              <div key={student.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-slate-400">
                      {student.id} · {student.group}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {totals ? totals.total : 0}
                    </p>
                    <p className="text-[11px] text-slate-400">total</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  {ASSIGNMENTS.map((a, i) => (
                    <span key={a.id} title={a.title}>
                      <span className="text-slate-400">A{i + 1}</span>{" "}
                      <span className="tabular-nums">{assignmentCell(student.id, a.id)}</span>
                    </span>
                  ))}
                  {QUIZZES.map((q, i) => (
                    <span key={q.id} title={q.title}>
                      <span className="text-slate-400">Q{i + 1}</span>{" "}
                      <span className="tabular-nums">{quizCell(student.id, q.id)}</span>
                    </span>
                  ))}
                  <span>
                    <span className="text-slate-400">Bonus</span>{" "}
                    <span className="tabular-nums">
                      {totals && totals.bonus > 0 ? `+${totals.bonus}` : "—"}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
            students
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
