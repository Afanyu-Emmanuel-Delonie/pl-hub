"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { computeCARow, quizWeight } from "@/lib/ca";
import { formatDate } from "@/lib/format";
import type { CAWeights } from "@/lib/types";

function pct(n: number) {
  return `${Math.round(n * 10) / 10}%`;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const {
    students,
    attendance,
    caWeights,
    setAttendance,
    saveCAWeights,
    assignments,
    submissions,
    quizzes,
    quizResponses,
    quizArchive,
    groups,
    addGroup,
    renameGroup,
    removeGroup,
  } = useStore();
  const [weights, setWeights] = useState<CAWeights>(caWeights);
  const [savedWeights, setSavedWeights] = useState(caWeights);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupValue, setEditGroupValue] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const studentCountByGroup = Object.fromEntries(
    groups.map((g) => [g, students.filter((s) => s.group === g).length])
  );

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name || groups.includes(name)) return;
    setSavingGroup(true);
    await addGroup(name);
    setNewGroupName("");
    setSavingGroup(false);
  }

  function startEditGroup(group: string) {
    setEditingGroup(group);
    setEditGroupValue(group);
  }

  async function handleRenameGroup(original: string) {
    const name = editGroupValue.trim();
    if (!name || name === original) { setEditingGroup(null); return; }
    setSavingGroup(true);
    await renameGroup(original, name);
    setEditingGroup(null);
    setSavingGroup(false);
  }

  async function confirmDeleteGroup() {
    if (!groupToDelete) return;
    await removeGroup(groupToDelete);
    setGroupToDelete(null);
  }

  // caWeights starts as a placeholder default and updates once the Firestore
  // doc actually loads — sync the local draft when that real value arrives.
  useEffect(() => {
    setWeights(caWeights);
    setSavedWeights(caWeights);
  }, [caWeights]);

  const wQuizzes = quizWeight(weights);
  const overAllocated = weights.attendance + weights.assignments > 100;
  const weightsDirty = JSON.stringify(weights) !== JSON.stringify(savedWeights);

  const rows = useMemo(
    () =>
      students.map((s) =>
        computeCARow(s, attendance, weights, assignments, submissions, quizzes, quizResponses, quizArchive)
      ),
    [students, attendance, weights, assignments, submissions, quizzes, quizResponses, quizArchive]
  );

  // Every quiz that's ever counted toward CA, live or deleted — deleting a
  // quiz to free up space archives its points-possible total here instead of
  // losing it, so this list (and the CA percentages above) stay correct no
  // matter what gets cleaned up. See QuizArchiveRecord.
  const quizRecordRows = useMemo(() => {
    const live = quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      groups: q.groups,
      points: q.questions.reduce((sum, question) => sum + question.points, 0),
      status: "live" as const,
      date: q.createdAt,
    }));
    const archived = quizArchive.map((a) => ({
      id: a.id,
      title: a.title,
      groups: a.groups,
      points: a.maxScore,
      status: "archived" as const,
      date: a.archivedAt,
    }));
    return [...live, ...archived].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [quizzes, quizArchive]);
  const totalQuizPoints = quizRecordRows.reduce((sum, r) => sum + r.points, 0);

  async function handleSaveWeights() {
    await saveCAWeights(weights);
    setSavedWeights(weights);
  }

  function handleAttendanceChange(studentId: string, value: string) {
    const n = value === "" ? 0 : Number(value);
    setAttendance(studentId, n);
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
          <p className="text-xs text-slate-400">{user?.email ?? "—"}</p>
        </div>
      </Card>

      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Groups
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage the groups students are assigned to. Used when setting
          per-group deadlines on assignments and quizzes.
        </p>
      </div>

      <Card className="mb-6">
        <form onSubmit={handleAddGroup} className="flex gap-2 border-b border-slate-100 px-5 py-4">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <Button type="submit" size="sm" disabled={savingGroup || !newGroupName.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>

        {groups.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No groups yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {groups.map((group) => (
              <li key={group} className="flex items-center gap-3 px-5 py-3">
                {editingGroup === group ? (
                  <>
                    <input
                      autoFocus
                      value={editGroupValue}
                      onChange={(e) => setEditGroupValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRenameGroup(group); if (e.key === "Escape") setEditingGroup(null); }}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                    <button type="button" onClick={() => handleRenameGroup(group)} className="text-brand hover:text-brand-hover" aria-label="Save">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setEditingGroup(null)} className="text-slate-400 hover:text-slate-600" aria-label="Cancel">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-foreground">{group}</span>
                    <span className="text-xs text-slate-400">{studentCountByGroup[group] ?? 0} student{studentCountByGroup[group] !== 1 ? "s" : ""}</span>
                    <button type="button" onClick={() => startEditGroup(group)} className="text-slate-400 hover:text-slate-600" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setGroupToDelete(group)} className="text-slate-400 hover:text-red-500" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
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
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveWeights}
            disabled={!weightsDirty}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save split
          </button>
          {!weightsDirty && (
            <span className="text-xs text-slate-400">Saved</span>
          )}
        </div>
      </Card>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Quiz points record</h3>
          <p className="mt-1 text-xs text-slate-500">
            Every quiz counted toward the quiz percentage above, including deleted ones — safe to
            delete a quiz once you&apos;re done with it; its points stay counted here.
          </p>
        </div>
        <span className="shrink-0 text-xs text-slate-400">{totalQuizPoints} points total</span>
      </div>

      <Card className="mb-6">
        {quizRecordRows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No quizzes recorded yet.</p>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Groups</th>
                  <th className="px-5 py-3 font-medium">Points</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {quizRecordRows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">{r.title}</td>
                    <td className="px-5 py-3 text-slate-500">{r.groups.length === 0 ? "All groups" : r.groups.join(", ")}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">{r.points}</td>
                    <td className="px-5 py-3">
                      <Badge variant={r.status === "live" ? "brand" : "neutral"}>
                        {r.status === "live" ? "Live" : "Archived"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divide-y divide-slate-50 md:hidden">
              {quizRecordRows.map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground">{r.title}</p>
                    <Badge variant={r.status === "live" ? "brand" : "neutral"}>
                      {r.status === "live" ? "Live" : "Archived"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {r.groups.length === 0 ? "All groups" : r.groups.join(", ")} · {r.points} points · {formatDate(r.date)}
                  </p>
                </div>
              ))}
            </div>
          </>
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
                          handleAttendanceChange(row.studentId, e.target.value)
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
                  onChange={(e) => handleAttendanceChange(row.studentId, e.target.value)}
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

      <Modal open={!!groupToDelete} onClose={() => setGroupToDelete(null)} title="Delete group?">
        <p className="text-sm text-slate-600">
          Delete &quot;{groupToDelete}&quot;? This won&apos;t remove students already in this group.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setGroupToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteGroup}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
