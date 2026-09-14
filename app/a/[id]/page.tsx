"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { submitAssignment } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Dropdown } from "@/components/ui/Dropdown";
import { Logo } from "@/components/ui/Logo";
import { coveredGroups, deadlineForGroup, isClosedForGroup } from "@/lib/assignments";
import { formatDeadline } from "@/lib/format";
import { validateName, validateStudentId, validateGroup, validateGithubLink } from "@/lib/validation";
import type { Assignment } from "@/lib/types";

function AssignmentContent({ assignment }: { assignment: Assignment }) {
  return (
    <div className="space-y-6">
      {assignment.instructions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Instructions</h2>
          <ul className="space-y-2">
            {assignment.instructions.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}
      {assignment.content.map((block) => {
        if (block.type === "text") return (
          <section key={block.id}>
            <p className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">{block.value}</p>
          </section>
        );
        if (block.type === "code") return (
          <section key={block.id}>
            <CodeBlock code={block.value} label={block.language ?? "SQL"} />
          </section>
        );
        if (block.type === "question") return (
          <section key={block.id}>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{block.text}</h3>
            <ol className="space-y-3">
              {block.subQuestions.map((sq, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-brand">{i + 1}</span>
                  <p className="pt-0.5 text-sm text-slate-600 leading-relaxed">{sq}</p>
                </li>
              ))}
            </ol>
          </section>
        );
        return null;
      })}
    </div>
  );
}

function SubmitPanel({
  assignment,
  openGroups,
  onSubmitted,
}: {
  assignment: Assignment;
  openGroups: string[];
  onSubmitted: () => void;
}) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [group, setGroup] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; studentId?: string; group?: string; githubLink?: string }>({});

  const deadline = group ? deadlineForGroup(assignment, group) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = {
      name: validateName(name) ?? undefined,
      studentId: validateStudentId(studentId) ?? undefined,
      group: validateGroup(group) ?? undefined,
      githubLink: validateGithubLink(githubLink) ?? undefined,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    await submitAssignment({
      id: `${assignment.id}__${studentId.trim().toUpperCase()}`,
      assignmentId: assignment.id,
      studentId: studentId.trim().toUpperCase(),
      studentName: name.trim(),
      group,
      githubLink: githubLink.trim(),
      submittedAt: new Date().toISOString(),
      late: false,
      graded: false,
      score: null,
      maxScore: assignment.maxScore,
      comment: "",
    });
    setSaving(false);
    setSubmitted(true);
    onSubmitted();
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">Submitted!</h3>
          <p className="mt-1 text-sm text-slate-500">You can safely close this page.</p>
        </div>
      </div>
    );
  }

  if (openGroups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">Submissions closed</h3>
          <p className="mt-1 text-sm text-slate-500">All groups are past their deadline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Submit your work</h2>
        <p className="mt-0.5 text-xs text-slate-400">Worth {assignment.maxScore} marks</p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5">
        <div>
          <Label>Full name</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }}
            placeholder="Your full name"
            error={errors.name}
          />
        </div>
        <div>
          <Label>Student ID</Label>
          <Input
            value={studentId}
            onChange={(e) => { setStudentId(e.target.value); setErrors((er) => ({ ...er, studentId: undefined })); }}
            placeholder="e.g. S001"
            error={errors.studentId}
          />
        </div>
        <div>
          <Label>Group</Label>
          <Dropdown
            options={openGroups.map((g) => ({ label: g, value: g }))}
            value={group}
            onChange={(v) => { setGroup(v); setErrors((er) => ({ ...er, group: undefined })); }}
            placeholder="Select your group"
            error={errors.group}
          />
          {deadline && <p className="mt-1.5 text-xs text-slate-400">Deadline: {formatDeadline(deadline)}</p>}
        </div>
        <div>
          <Label>GitHub repository link</Label>
          <Input
            type="url"
            value={githubLink}
            onChange={(e) => { setGithubLink(e.target.value); setErrors((er) => ({ ...er, githubLink: undefined })); }}
            placeholder="https://github.com/you/repo"
            error={errors.githubLink}
          />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Submitting…" : "Submit assignment"}
        </Button>
      </form>
    </div>
  );
}

export default function PublicAssignmentPage() {
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null | undefined>(undefined);
  const unsubAssignmentRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "assignments", params.id), (snap) => {
      setAssignment(snap.exists() ? ({ id: snap.id, ...snap.data() } as Assignment) : null);
    });
    unsubAssignmentRef.current = unsub;
    return unsub;
  }, [params.id]);

  if (assignment === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </main>
    );
  }

  if (assignment === null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-500">Assignment not found.</p>
      </main>
    );
  }

  const openGroups = coveredGroups(assignment).filter((g) => !isClosedForGroup(assignment, g));

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <Logo size={28} />
        <span className="max-w-[55%] truncate text-sm font-medium text-foreground sm:max-w-none">{assignment.title}</span>
        <span className="text-xs font-medium text-slate-400">{assignment.maxScore} marks</span>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{assignment.title}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {assignment.deadlines.map((d, i) => (
                  <span key={i}>{d.groups.join(", ")} — due {formatDeadline(d.deadline)}</span>
                ))}
              </div>
            </div>
            <AssignmentContent assignment={assignment} />
          </div>
          <div className="w-full lg:w-80 lg:shrink-0 lg:sticky lg:top-20">
            <SubmitPanel
              assignment={assignment}
              openGroups={openGroups}
              onSubmitted={() => unsubAssignmentRef.current?.()}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
