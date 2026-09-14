"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ASSIGNMENTS, ASSIGNMENT_SUBMISSIONS, setAssignmentClosedGroups } from "@/lib/mock-data";
import { coveredGroups, deadlineForGroup, isAssignmentOpen, isClosedForGroup } from "@/lib/assignments";
import type { AssignmentSubmission } from "@/lib/types";
import { formatDate, formatDeadline, isPast } from "@/lib/format";

type Tab = "details" | "submissions";

function useGradeState(submission: AssignmentSubmission) {
  const [score, setScore] = useState<string>(
    submission.score === null ? "" : String(submission.score)
  );
  const [comment, setComment] = useState(submission.comment);
  const [saved, setSaved] = useState(submission.graded);
  return { score, setScore, comment, setComment, saved, setSaved };
}

function GradeRow({ submission }: { submission: AssignmentSubmission }) {
  const { score, setScore, comment, setComment, saved, setSaved } =
    useGradeState(submission);

  return (
    <tr className="border-b border-slate-50 last:border-0 align-top">
      <td className="px-5 py-4">
        <p className="font-medium text-foreground">{submission.studentName}</p>
        <p className="text-xs text-slate-400">
          {submission.studentId} · {submission.group}
        </p>
      </td>
      <td className="px-5 py-4">
        <a
          href={submission.githubLink}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-brand hover:underline break-all"
        >
          {submission.githubLink.replace("https://", "")}
        </a>
        <p className="mt-1 text-xs text-slate-400">
          {formatDate(submission.submittedAt)}
          {submission.late && (
            <span className="ml-2">
              <Badge variant="warning">Late</Badge>
            </span>
          )}
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={submission.maxScore}
            value={score}
            placeholder="—"
            onChange={(e) => { setScore(e.target.value); setSaved(false); }}
            className="w-16 text-center tabular-nums"
          />
          <span className="text-xs text-slate-400">/ {submission.maxScore}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <Input
          value={comment}
          onChange={(e) => { setComment(e.target.value); setSaved(false); }}
          placeholder="Optional comment"
          className="min-w-[180px]"
        />
      </td>
      <td className="px-5 py-4 text-right">
        {saved ? (
          <span className="text-xs font-medium text-slate-400">Saved</span>
        ) : (
          <Button size="sm" onClick={() => setSaved(true)}>Save</Button>
        )}
      </td>
    </tr>
  );
}

function GradeCard({ submission }: { submission: AssignmentSubmission }) {
  const { score, setScore, comment, setComment, saved, setSaved } =
    useGradeState(submission);

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{submission.studentName}</p>
          <p className="text-xs text-slate-400">
            {submission.studentId} · {submission.group}
          </p>
        </div>
        {submission.late && <Badge variant="warning">Late</Badge>}
      </div>

      <a
        href={submission.githubLink}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block break-all font-mono text-xs text-brand hover:underline"
      >
        {submission.githubLink.replace("https://", "")}
      </a>
      <p className="mt-1 text-xs text-slate-400">{formatDate(submission.submittedAt)}</p>

      <div className="mt-3 flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          max={submission.maxScore}
          value={score}
          placeholder="—"
          onChange={(e) => { setScore(e.target.value); setSaved(false); }}
          className="w-16 text-center tabular-nums"
        />
        <span className="text-xs text-slate-400">/ {submission.maxScore}</span>
      </div>

      <Input
        value={comment}
        onChange={(e) => { setComment(e.target.value); setSaved(false); }}
        placeholder="Optional comment"
        className="mt-2"
      />

      <div className="mt-3 text-right">
        {saved ? (
          <span className="text-xs font-medium text-slate-400">Saved</span>
        ) : (
          <Button size="sm" onClick={() => setSaved(true)}>Save</Button>
        )}
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("details");
  const [, forceUpdate] = useState(0);

  const assignment = useMemo(
    () => ASSIGNMENTS.find((a) => a.id === params.id),
    [params.id]
  );
  const submissions = useMemo(
    () => ASSIGNMENT_SUBMISSIONS.filter((s) => s.assignmentId === params.id),
    [params.id]
  );

  if (!assignment) {
    return (
      <div>
        <Link href="/admin/assignments" className="text-sm text-brand hover:underline">
          ← Back to assignments
        </Link>
        <p className="mt-4 text-sm text-slate-500">Assignment not found.</p>
      </div>
    );
  }

  const graded = submissions.filter((s) => s.graded).length;
  const isClosed = !isAssignmentOpen(assignment);
  const groups = coveredGroups(assignment);

  function toggleGroup(group: string) {
    const closedGroups = assignment!.closedGroups.includes(group)
      ? assignment!.closedGroups.filter((g) => g !== group)
      : [...assignment!.closedGroups, group];
    setAssignmentClosedGroups(assignment!.id, closedGroups);
    forceUpdate((n) => n + 1);
  }

  return (
    <div>
      {/* Back */}
      <Link href="/admin/assignments" className="text-sm text-brand hover:underline">
        ← Back to assignments
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {assignment.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Max score: {assignment.maxScore}</span>
            <span>·</span>
            <span>{submissions.length} submissions</span>
            <span>·</span>
            <span>{graded} graded</span>
            <Badge variant={isClosed ? "neutral" : "brand"} dot>
              {isClosed ? "Closed" : "Open"}
            </Badge>
          </div>
        </div>
        <Link href={`/admin/assignments/${assignment.id}/edit`} className="self-start">
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(["details", "submissions"] as Tab[]).map((t) => (
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
            {t === "submissions" && (
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                tab === t ? "bg-brand-tint text-brand" : "bg-slate-100 text-slate-500"
              }`}>
                {submissions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === "details" && (
        <div className="space-y-5">
      {assignment.instructions.length > 0 && (
        <Card className="px-5 py-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Instructions
          </h2>
          <ul className="space-y-1.5">
            {assignment.instructions.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                {point}
              </li>
            ))}
          </ul>
        </Card>
      )}

          {/* Deadlines */}
          <Card className="px-5 py-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Deadlines
            </h2>
            <p className="mb-3 mt-1 text-xs text-slate-400">
              Click a group to close or reopen its access early.
            </p>
            <ul className="space-y-1">
              {groups.map((g) => {
                const deadline = deadlineForGroup(assignment, g);
                const pastDeadline = Boolean(deadline && isPast(deadline));
                const closed = isClosedForGroup(assignment, g);
                const closedEarly = assignment.closedGroups.includes(g) && !pastDeadline;
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
                        <span className="text-slate-500">
                          {deadline ? formatDeadline(deadline) : "—"}
                        </span>
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

          {/* Content blocks */}
          {assignment.content.length > 0 && (
            <div className="space-y-5">
              {assignment.content.map((block) => {
                if (block.type === "text") {
                  return (
                    <Card key={block.id} className="px-5 py-5">
                      <p className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">
                        {block.value}
                      </p>
                    </Card>
                  );
                }
                if (block.type === "code") {
                  return (
                    <Card key={block.id} className="px-5 py-5">
                      <CodeBlock code={block.value} label={block.language ?? "SQL"} />
                    </Card>
                  );
                }
                if (block.type === "question") {
                  return (
                    <Card key={block.id} className="px-5 py-5">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">
                        {block.text}
                      </h3>
                      <ol className="space-y-3">
                        {block.subQuestions.map((sq, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-brand">
                              {i + 1}
                            </span>
                            <p className="pt-0.5 text-sm text-slate-600 leading-relaxed">{sq}</p>
                          </li>
                        ))}
                      </ol>
                    </Card>
                  );
                }
              })}
            </div>
          )}
        </div>
      )}

      {/* Submissions tab */}
      {tab === "submissions" && (
        <Card>
          {submissions.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-400">
              No submissions yet.
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
                  <tbody>
                    {submissions.map((s) => (
                      <GradeRow key={s.id} submission={s} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-50 md:hidden">
                {submissions.map((s) => (
                  <GradeCard key={s.id} submission={s} />
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
