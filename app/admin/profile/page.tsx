"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { ATTENDANCE, DEFAULT_CA_WEIGHTS, STUDENTS } from "@/lib/mock-data";
import { computeCARow, quizWeight } from "@/lib/ca";
import type { CAWeights } from "@/lib/types";

function pct(n: number) {
  return `${Math.round(n * 10) / 10}%`;
}

export default function ProfilePage() {
  const [weights, setWeights] = useState<CAWeights>(DEFAULT_CA_WEIGHTS);
  const [attendance, setAttendance] = useState<Record<string, number>>(() =>
    Object.fromEntries(ATTENDANCE.map((a) => [a.studentId, a.percentage]))
  );

  const wQuizzes = quizWeight(weights);
  const overAllocated = weights.attendance + weights.assignments > 100;

  const rows = useMemo(
    () => STUDENTS.map((s) => computeCARow(s, attendance, weights)),
    [attendance, weights]
  );

  function setAttendanceFor(studentId: string, value: string) {
    const n = value === "" ? 0 : Number(value);
    setAttendance((prev) => ({ ...prev, [studentId]: n }));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your account and semester-level grading settings.
        </p>
      </div>

      <Card className="mb-6 flex items-center gap-4 px-5 py-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-brand">
          TA
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Course Staff</p>
          <p className="text-xs text-slate-400">ta@university.edu</p>
        </div>
      </Card>

      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Continuous Assessment
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Split the CA bucket across attendance, assignments, and quizzes, then
          log each student&apos;s end-of-semester attendance to get their score.
          Set once per semester.
        </p>
      </div>

      <Card className="mb-6 px-5 py-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          How the CA bucket is split
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <Label>Attendance</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={weights.attendance}
              onChange={(e) =>
                setWeights((w) => ({ ...w, attendance: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label>Assignments</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={weights.assignments}
              onChange={(e) =>
                setWeights((w) => ({ ...w, assignments: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label>Quizzes</Label>
            <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              {wQuizzes}% <span className="ml-1.5 text-xs text-slate-400">(remaining)</span>
            </div>
          </div>
          <div>
            <Label>% of final grade</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={weights.totalWeight}
              onChange={(e) =>
                setWeights((w) => ({ ...w, totalWeight: Number(e.target.value) }))
              }
            />
          </div>
        </div>
        {overAllocated && (
          <p className="mt-3 text-xs font-medium text-rose-600">
            Attendance + assignments exceed 100% — quizzes has been clamped to 0%.
          </p>
        )}
      </Card>

      <Card>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="whitespace-nowrap px-5 py-3 font-medium">Student</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Group</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">
                  Attendance ({weights.attendance}%)
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center font-medium">
                  Assignments ({weights.assignments}%)
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center font-medium">
                  Quizzes ({wQuizzes}%)
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-center font-medium">
                  CA score
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.studentId} className="border-b border-slate-50 last:border-0">
                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="font-medium text-foreground">{row.studentName}</p>
                    <p className="text-xs text-slate-400">{row.studentId}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {row.group}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="—"
                        value={row.attendancePct ?? ""}
                        onChange={(e) =>
                          setAttendanceFor(row.studentId, e.target.value)
                        }
                        className="w-20 text-center tabular-nums"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-center tabular-nums text-slate-500">
                    {pct(row.assignmentPct)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-center tabular-nums text-slate-500">
                    {pct(row.quizPct)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-center tabular-nums font-semibold text-foreground">
                    {Math.round(row.caScore * 10) / 10}/{weights.totalWeight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-slate-50 md:hidden">
          {rows.map((row) => (
            <div key={row.studentId} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{row.studentName}</p>
                  <p className="text-xs text-slate-400">
                    {row.studentId} · {row.group}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {Math.round(row.caScore * 10) / 10}/{weights.totalWeight}
                  </p>
                  <p className="text-[11px] text-slate-400">CA score</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Attendance</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="—"
                  value={row.attendancePct ?? ""}
                  onChange={(e) => setAttendanceFor(row.studentId, e.target.value)}
                  className="w-16 text-center tabular-nums"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Assignments {pct(row.assignmentPct)} · Quizzes {pct(row.quizPct)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
