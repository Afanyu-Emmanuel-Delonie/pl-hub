"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import { computeLeaderboard } from "@/lib/rankings";
import { isAssignmentOpen } from "@/lib/assignments";
import { isQuizOpen } from "@/lib/quizzes";
import { formatDate } from "@/lib/format";
import { exportMarksXlsx } from "@/lib/excel";

export default function AdminOverviewPage() {
  const { assignments, submissions, quizzes, quizResponses, quizArchive, students, bonusAwards, groups, loading } = useStore();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportMarksXlsx({
        assignments, submissions, quizzes, quizResponses, quizArchive, bonusAwards, students, groups,
        filename: "all-marks.xlsx",
      });
    } finally {
      setExporting(false);
    }
  }

  const activeAssignments = assignments.filter(isAssignmentOpen).length;
  const activeQuizzes = quizzes.filter((q) => isQuizOpen(q, groups)).length;
  const pending = submissions.filter((s) => !s.graded);

  const gradedPercents = [
    ...submissions.filter((s) => s.graded && s.score !== null).map(
      (s) => (s.score as number) / s.maxScore
    ),
    ...quizResponses.map((r) => r.score / r.maxScore),
  ];
  const average =
    gradedPercents.length > 0
      ? Math.round((gradedPercents.reduce((a, b) => a + b, 0) / gradedPercents.length) * 100)
      : null;

  const leaderboard = useMemo(
    () => computeLeaderboard(students, submissions, quizResponses, bonusAwards).slice(0, 5),
    [students, submissions, quizResponses, bonusAwards]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Current state of assignments, quizzes, and grading.
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={exporting} className="self-start">
          <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export all marks"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active assignments" value={String(activeAssignments)} />
        <StatCard label="Active quizzes" value={String(activeQuizzes)} />
        <StatCard
          label="Pending grading"
          value={String(pending.length)}
          sublabel={pending.length > 0 ? "Needs your attention" : undefined}
        />
        <StatCard label="Class average" value={average !== null ? `${average}%` : "—"} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Needs grading</h2>
            <Link href="/admin/assignments" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Nothing waiting on you right now.
            </p>
          ) : (
            <ul>
              {pending.map((sub) => {
                const assignment = assignments.find((a) => a.id === sub.assignmentId);
                return (
                  <li
                    key={sub.id}
                    className="flex items-start justify-between gap-3 border-b border-slate-50 px-4 py-3 last:border-0 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {sub.studentName}{" "}
                        <span className="font-normal text-slate-400">· {sub.group}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {assignment?.title} · submitted {formatDate(sub.submittedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {sub.late && <Badge variant="warning">Late</Badge>}
                      <Link
                        href={`/admin/assignments/${sub.assignmentId}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Grade
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Top performers</h2>
            <Link href="/admin/rankings" className="text-sm font-medium text-brand hover:underline">
              Full ranking
            </Link>
          </div>
          <ul>
            {leaderboard.map((row, i) => (
              <li
                key={row.studentId}
                className="flex items-center justify-between gap-3 border-b border-slate-50 px-4 py-3 last:border-0 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-4 shrink-0 text-sm font-medium text-slate-400 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.studentName}</p>
                    <p className="text-xs text-slate-400">{row.group}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{row.total}</p>
                  {row.bonus > 0 && <p className="text-xs text-slate-400">+{row.bonus} bonus</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
