"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import { computeLeaderboard } from "@/lib/rankings";
import type { BonusAward } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function RankingsPage() {
  const { students, submissions, quizResponses, bonusAwards, addBonusAward } = useStore();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [group, setGroup] = useState("");
  const [points, setPoints] = useState(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const matched = useMemo(
    () => students.find((s) => s.id.toLowerCase() === studentId.toLowerCase()),
    [students, studentId]
  );

  const leaderboard = useMemo(
    () => computeLeaderboard(students, submissions, quizResponses, bonusAwards),
    [students, submissions, quizResponses, bonusAwards]
  );

  function resetForm() {
    setStudentId(""); setStudentName(""); setGroup(""); setPoints(1); setReason("");
  }

  async function handleAward(e: React.FormEvent) {
    e.preventDefault();
    const name = matched ? matched.name : studentName.trim();
    const grp = matched ? matched.group : group.trim();
    if (!studentId.trim() || !name || !grp || !points) return;

    setSaving(true);
    const award: BonusAward = {
      id: `b${Date.now()}`,
      studentId: studentId.trim().toUpperCase(),
      studentName: name,
      group: grp,
      points,
      reason: reason.trim(),
      awardedAt: new Date().toISOString(),
    };
    await addBonusAward(award);
    setSaving(false);
    resetForm();
    setOpen(false);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Rankings</h1>
          <p className="mt-1 text-sm text-slate-500">Combined standing across assignments, quizzes, and bonus points.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start">Award points</Button>
      </div>

      <Card>
        <table className="hidden w-full text-left text-sm md:table">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Rank</th>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Group</th>
              <th className="px-5 py-3 font-medium">Assignments</th>
              <th className="px-5 py-3 font-medium">Quizzes</th>
              <th className="px-5 py-3 font-medium">Bonus</th>
              <th className="px-5 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, i) => (
              <tr key={row.studentId} className={`border-b border-slate-50 last:border-0 ${i < 3 ? "bg-brand-tint/40" : ""}`}>
                <td className="px-5 py-4 tabular-nums text-slate-500">{i + 1}</td>
                <td className="px-5 py-4"><span className={`text-foreground ${i < 3 ? "font-semibold" : "font-medium"}`}>{row.studentName}</span></td>
                <td className="px-5 py-4 text-slate-500">{row.group}</td>
                <td className="px-5 py-4 tabular-nums text-slate-500">{row.assignmentPoints}</td>
                <td className="px-5 py-4 tabular-nums text-slate-500">{row.quizPoints}</td>
                <td className="px-5 py-4 tabular-nums text-slate-500">{row.bonus > 0 ? `+${row.bonus}` : "—"}</td>
                <td className="px-5 py-4 tabular-nums font-semibold text-foreground">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divide-y divide-slate-50 md:hidden">
          {leaderboard.map((row, i) => (
            <div key={row.studentId} className={`flex items-center justify-between gap-3 px-4 py-3.5 ${i < 3 ? "bg-brand-tint/40" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="w-4 text-sm text-slate-400 tabular-nums">{i + 1}</span>
                <div>
                  <p className={`text-sm text-foreground ${i < 3 ? "font-semibold" : "font-medium"}`}>{row.studentName}</p>
                  <p className="text-xs text-slate-400">
                    {row.group} · {row.assignmentPoints} assignments · {row.quizPoints} quizzes
                    {row.bonus > 0 && ` · +${row.bonus} bonus`}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{row.total}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Performance point history</h2>
        </div>
        {bonusAwards.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No performance points awarded yet.</p>
        ) : (
          <ul>
            {bonusAwards.map((award) => (
              <li key={award.id} className="flex items-start justify-between gap-3 border-b border-slate-50 px-4 py-3 last:border-0 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {award.studentName} <span className="font-normal text-slate-400">· {award.group}</span>
                  </p>
                  {award.reason && <p className="mt-0.5 text-xs text-slate-500">{award.reason}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-brand tabular-nums">+{award.points}</p>
                  <p className="text-xs text-slate-400">{formatDate(award.awardedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Award performance points">
        <form onSubmit={handleAward} className="space-y-4">
          <div>
            <Label>Student ID</Label>
            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. S001" required />
            {matched && <p className="mt-1 text-xs text-brand font-medium">✓ {matched.name} · {matched.group}</p>}
          </div>
          {!matched && (
            <>
              <div>
                <Label>Student Name</Label>
                <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Full name" required />
              </div>
              <div>
                <Label>Group</Label>
                <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Group A" required />
              </div>
            </>
          )}
          <div>
            <Label>Points</Label>
            <Input type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} className="w-24" required />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g., Outstanding participation in lab session" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Award points"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
