"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subscribeAssignmentSubmissionsForAssignment } from "@/lib/db";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import type { Assignment, AssignmentSubmission } from "@/lib/types";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS_SHOWN = 6;

function scoreVariant(pct: number): "success" | "warning" | "danger" {
  if (pct >= 70) return "success";
  if (pct >= 40) return "warning";
  return "danger";
}

function ResultCard({ submission }: { submission: AssignmentSubmission }) {
  const pct = submission.score !== null && submission.maxScore > 0
    ? Math.round((submission.score / submission.maxScore) * 100)
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{submission.studentName}</p>
          <p className="text-xs text-slate-400">{submission.studentId} · {submission.group}</p>
        </div>
        {submission.late && <Badge variant="warning">Late</Badge>}
      </div>

      {submission.graded && pct !== null ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground">
            {submission.score}<span className="text-sm font-medium text-slate-400">/{submission.maxScore}</span>
          </span>
          <Badge variant={scoreVariant(pct)}>{pct}%</Badge>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Submitted — not graded yet.</p>
      )}

      {submission.comment && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{submission.comment}</p>
      )}
    </div>
  );
}

export default function AssignmentResultsPage() {
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null | undefined>(undefined);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    return onSnapshot(doc(db, "assignments", params.id), (snap) => {
      setAssignment(snap.exists() ? ({ id: snap.id, ...snap.data() } as Assignment) : null);
    });
  }, [params.id]);

  // Only pull submissions once results are actually published — no point
  // reading (or handing to the browser) grade data nobody's meant to see yet.
  useEffect(() => {
    if (!assignment?.resultsPublished) return;
    return subscribeAssignmentSubmissionsForAssignment(assignment.id, setSubmissions);
  }, [assignment?.id, assignment?.resultsPublished]);

  const matches = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return [];
    const byId = trimmed.toUpperCase();
    const byName = trimmed.toLowerCase();
    return submissions.filter(
      (s) => s.studentId.toUpperCase() === byId || s.studentName.toLowerCase().includes(byName)
    );
  }, [query, submissions]);

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

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <Logo size={28} />
        <span className="max-w-[60%] truncate text-sm font-medium text-foreground">{assignment.title}</span>
      </header>

      <div className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Results</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{assignment.title}</h1>
          </div>

          {!assignment.resultsPublished ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Not published yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your instructor hasn&apos;t released results for this assignment. Check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="relative mb-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by your name or Student ID"
                  className="pl-9"
                  autoFocus
                />
              </div>

              {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && (
                <p className="text-center text-sm text-slate-400">Keep typing…</p>
              )}

              {query.trim().length >= MIN_QUERY_LENGTH && matches.length === 0 && (
                <p className="text-center text-sm text-slate-400">
                  No result found for &quot;{query.trim()}&quot; — check the spelling of your name or Student ID.
                </p>
              )}

              <div className="space-y-3">
                {matches.slice(0, MAX_RESULTS_SHOWN).map((s) => (
                  <ResultCard key={s.id} submission={s} />
                ))}
              </div>

              {matches.length > MAX_RESULTS_SHOWN && (
                <p className="mt-3 text-center text-xs text-slate-400">
                  Showing {MAX_RESULTS_SHOWN} of {matches.length} matches — narrow your search to find yours.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
