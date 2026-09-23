"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, MessageSquare, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ShareLink } from "@/components/ui/ShareLink";
import { AssignmentBody } from "@/components/shared/AssignmentBody";
import { useStore } from "@/lib/store";
import { coveredGroups, deadlineForGroup, isAssignmentOpen, isClosedForGroup } from "@/lib/assignments";
import { exportAssignmentPdf } from "@/lib/pdf";
import { exportMarksXlsx } from "@/lib/excel";
import type { AssignmentSubmission } from "@/lib/types";
import { formatDate, formatDeadline, isPast } from "@/lib/format";

type Tab = "details" | "submissions";
type StatusFilter = "all" | "remaining" | "completed";

function GradeRow({ submission, onDelete }: { submission: AssignmentSubmission; onDelete: () => void }) {
  const { saveGrade } = useStore();
  const [score, setScore] = useState<string>(submission.score === null ? "" : String(submission.score));
  const [comment, setComment] = useState(submission.comment);
  const [saved, setSaved] = useState(submission.graded);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await saveGrade(submission.id, Number(score), comment);
    setSaved(true);
    setSaving(false);
  }

  return (
    <tr className="border-b border-slate-50 last:border-0 align-top">
      <td className="px-5 py-4">
        <p className="font-medium text-foreground">{submission.studentName}</p>
        <p className="text-xs text-slate-400">{submission.studentId} · {submission.group}</p>
      </td>
      <td className="px-5 py-4">
        <a href={submission.githubLink} target="_blank" rel="noreferrer" className="font-mono text-xs text-brand hover:underline break-all">
          {submission.githubLink.replace("https://", "")}
        </a>
        <p className="mt-1 text-xs text-slate-400">
          {formatDate(submission.submittedAt)}
          {submission.late && <span className="ml-2"><Badge variant="warning">Late</Badge></span>}
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Input type="number" min={0} max={submission.maxScore} value={score} placeholder="—"
            onChange={(e) => { setScore(e.target.value); setSaved(false); }} className="w-16 text-center tabular-nums" />
          <span className="text-xs text-slate-400">/ {submission.maxScore}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <Input value={comment} onChange={(e) => { setComment(e.target.value); setSaved(false); }}
          placeholder="Optional comment" className="min-w-[180px]" />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-3">
          {saved ? (
            <span className="text-xs font-medium text-slate-400">Saved</span>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={saving || score === ""}>
              {saving ? "…" : "Save"}
            </Button>
          )}
          <button type="button" onClick={onDelete} className="text-slate-400 hover:text-red-500" aria-label="Delete submission">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function GradeCard({ submission, onDelete }: { submission: AssignmentSubmission; onDelete: () => void }) {
  const { saveGrade } = useStore();
  const [score, setScore] = useState<string>(submission.score === null ? "" : String(submission.score));
  const [comment, setComment] = useState(submission.comment);
  const [saved, setSaved] = useState(submission.graded);
  const [saving, setSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [draft, setDraft] = useState(comment);

  async function persist(nextComment: string) {
    setSaving(true);
    await saveGrade(submission.id, Number(score), nextComment);
    setComment(nextComment);
    setSaved(true);
    setSaving(false);
  }

  function openMore() {
    setDraft(comment);
    setMoreOpen(true);
  }

  async function handleSaveComment() {
    await persist(draft);
    setMoreOpen(false);
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{submission.studentName}</p>
          <p className="text-xs text-slate-400">{submission.studentId} · {submission.group}</p>
        </div>
        {submission.late && <Badge variant="warning">Late</Badge>}
      </div>
      <a href={submission.githubLink} target="_blank" rel="noreferrer"
        className="mt-2 block break-all font-mono text-xs text-brand hover:underline">
        {submission.githubLink.replace("https://", "")}
      </a>
      <p className="mt-1 text-xs text-slate-400">{formatDate(submission.submittedAt)}</p>
      <div className="mt-3 flex items-center gap-2">
        <Input type="number" min={0} max={submission.maxScore} value={score} placeholder="—"
          onChange={(e) => { setScore(e.target.value); setSaved(false); }} className="w-16 text-center tabular-nums" />
        <span className="text-xs text-slate-400">/ {submission.maxScore}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={openMore} aria-label="Comment or delete">
            <MessageSquare className="h-4 w-4" />
            {comment ? "Comment" : "More"}
            {comment && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
          </Button>
          {saved ? (
            <span className="w-10 text-right text-xs font-medium text-slate-400">Saved</span>
          ) : (
            <Button size="sm" onClick={() => persist(comment)} disabled={saving || score === ""}>
              {saving ? "…" : "Save"}
            </Button>
          )}
        </div>
      </div>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title={submission.studentName}>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Comment</label>
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Optional comment" rows={3} />
        {score === "" && <p className="mt-1.5 text-xs text-slate-400">Enter a score first — comments are saved together with the score.</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="danger" onClick={() => { setMoreOpen(false); onDelete(); }}>
            <Trash2 className="h-4 w-4" /> Delete submission
          </Button>
          <Button onClick={handleSaveComment} disabled={saving || score === ""}>
            {saving ? "Saving…" : "Save comment"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { assignments, submissions, students, groups: allGroups, deleteAssignment, toggleAssignmentGroup, setResultsPublished, deleteSubmission } = useStore();
  const [tab, setTab] = useState<Tab>("details");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<{ id: string; studentName: string } | null>(null);

  const assignment = useMemo(() => assignments.find((a) => a.id === params.id), [assignments, params.id]);
  const subs = useMemo(() => submissions.filter((s) => s.assignmentId === params.id), [submissions, params.id]);

  if (!assignment) {
    return (
      <div>
        <Link href="/admin/assignments" className="text-sm text-brand hover:underline">← Back to assignments</Link>
        <p className="mt-4 text-sm text-slate-500">Assignment not found.</p>
      </div>
    );
  }

  const graded = subs.filter((s) => s.graded).length;
  const remaining = subs.length - graded;
  const visibleSubs = status === "all" ? subs : subs.filter((s) => (status === "completed") === s.graded);
  const isClosed = !isAssignmentOpen(assignment);
  const groups = coveredGroups(assignment);

  function toggleGroup(group: string) {
    const closedGroups = assignment!.closedGroups.includes(group)
      ? assignment!.closedGroups.filter((g) => g !== group)
      : [...assignment!.closedGroups, group];
    toggleAssignmentGroup(assignment!.id, group, closedGroups);
  }

  async function handleExportMarks() {
    setExporting(true);
    try {
      const slug = assignment!.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      await exportMarksXlsx({ assignments: [assignment!], submissions: subs, students, groups: allGroups, filename: `${slug}-marks.xlsx` });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    await deleteAssignment(assignment!.id);
    router.push("/admin/assignments");
  }

  async function confirmDeleteSubmission() {
    if (!submissionToDelete) return;
    await deleteSubmission(submissionToDelete.id);
    setSubmissionToDelete(null);
  }

  return (
    <div>
      <Link href="/admin/assignments" className="text-sm text-brand hover:underline">← Back to assignments</Link>

      <div className="mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{assignment.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Max score: {assignment.maxScore}</span>
            <span>·</span>
            <span>{subs.length} submissions</span>
            <span>·</span>
            <span>{graded} graded · {remaining} remaining</span>
            <Badge variant={isClosed ? "neutral" : "brand"} dot>{isClosed ? "Closed" : "Open"}</Badge>
          </div>
        </div>
        <Link href={`/admin/assignments/${assignment.id}/edit`} className="self-start">
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(["details", "submissions"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-foreground"
            }`}>
            {t}
            {t === "submissions" && (
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${tab === t ? "bg-brand-tint text-brand" : "bg-slate-100 text-slate-500"}`}>
                {subs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="space-y-5">
          <Card className="px-5 py-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Share with students</h2>
            <ShareLink path={`/a/${assignment.id}`} />
          </Card>

          <Card className="px-5 py-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Results</h2>
              <Button
                size="sm"
                variant={assignment.resultsPublished ? "secondary" : "primary"}
                onClick={() => setResultsPublished(assignment.id, !assignment.resultsPublished)}
              >
                {assignment.resultsPublished ? "Unpublish" : "Publish results"}
              </Button>
            </div>
            {assignment.resultsPublished ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Live — students can look up their own score by name or Student ID.
                </p>
                <ShareLink path={`/a/${assignment.id}/results`} />
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {graded} of {subs.length} submissions graded. Publish once you&apos;ve finished marking so
                students can look up their results — nothing is visible to them until you do.
              </p>
            )}
          </Card>

          <Card className="px-5 py-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Deadlines</h2>
            <p className="mb-3 mt-1 text-xs text-slate-400">Click a group to close or reopen its access early.</p>
            <ul className="space-y-1">
              {groups.map((g) => {
                const deadline = deadlineForGroup(assignment, g);
                const pastDeadline = Boolean(deadline && isPast(deadline));
                const closed = isClosedForGroup(assignment, g);
                const closedEarly = assignment.closedGroups.includes(g) && !pastDeadline;
                return (
                  <li key={g}>
                    <button type="button" disabled={pastDeadline} onClick={() => toggleGroup(g)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${pastDeadline ? "cursor-default" : "hover:bg-slate-50"}`}>
                      <span className="text-slate-600">{g}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-500">{deadline ? formatDeadline(deadline) : "—"}</span>
                        {closedEarly && <Badge variant="warning">Closed early</Badge>}
                        <Badge variant={closed ? "neutral" : "brand"}>{closed ? "Closed" : "Open"}</Badge>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <AssignmentBody assignment={assignment} />

          {isClosed && (
            <Card className="px-5 py-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Archive</h2>
              <p className="mb-4 text-xs text-slate-400">Export a record before deleting.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => exportAssignmentPdf(assignment, subs)}>Export as PDF</Button>
                <Button variant="secondary" onClick={() => setDeleteOpen(true)}>Delete assignment</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "submissions" && subs.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All", subs.length],
                ["remaining", "Remaining", remaining],
                ["completed", "Completed", graded],
              ] as [StatusFilter, string, number][]).map(([key, label, count]) => (
                <button key={key} type="button" onClick={() => setStatus(key)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${status === key ? "border-brand bg-brand-tint text-brand" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {label} <span className="tabular-nums opacity-70">{count}</span>
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportMarks} disabled={exporting} className="self-start sm:self-auto">
              <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export marks (Excel)"}
            </Button>
          </div>
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(graded / subs.length) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {remaining === 0 ? "All submissions graded." : `${graded} of ${subs.length} graded — ${remaining} left to mark.`}
            </p>
          </div>
        </div>
      )}

      {tab === "submissions" && (
        <Card>
          {subs.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-400">No submissions yet.</p>
          ) : visibleSubs.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-400">
              {status === "remaining" ? "Nothing left to grade." : "No graded submissions yet."}
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Submission</th>
                      <th className="px-5 py-3 font-medium">Score</th>
                      <th className="px-5 py-3 font-medium">Comment</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>{visibleSubs.map((s) => (
                    <GradeRow
                      key={s.id}
                      submission={s}
                      onDelete={() => setSubmissionToDelete({ id: s.id, studentName: s.studentName })}
                    />
                  ))}</tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-50 md:hidden">
                {visibleSubs.map((s) => (
                  <GradeCard
                    key={s.id}
                    submission={s}
                    onDelete={() => setSubmissionToDelete({ id: s.id, studentName: s.studentName })}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete assignment?">
        <p className="text-sm text-slate-600">
          This permanently deletes &quot;{assignment.title}&quot; and all {subs.length} of its submissions. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      <Modal open={!!submissionToDelete} onClose={() => setSubmissionToDelete(null)} title="Delete submission?">
        <p className="text-sm text-slate-600">
          Delete {submissionToDelete?.studentName}&apos;s submission? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSubmissionToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteSubmission}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
