"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import { isAssignmentOpen } from "@/lib/assignments";
import { formatDeadline } from "@/lib/format";

export default function AssignmentsPage() {
  const { assignments, submissions, groups } = useStore();
  const coversAllGroups = (deadlineGroups: string[]) =>
    groups.length > 0 && deadlineGroups.length >= groups.length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Post assignments and track submissions across groups.
          </p>
        </div>
        <ButtonLink href="/admin/assignments/new">New assignment</ButtonLink>
      </div>

      <Card>
        <table className="hidden w-full text-left text-sm md:table">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Deadlines</th>
              <th className="px-5 py-3 font-medium">Submissions</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => {
              const subs = submissions.filter((s) => s.assignmentId === assignment.id);
              const graded = subs.filter((s) => s.graded).length;
              const open = isAssignmentOpen(assignment);
              return (
                <tr key={assignment.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <Link href={`/admin/assignments/${assignment.id}`} className="font-medium text-foreground hover:text-brand">
                      {assignment.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {assignment.deadlines.map((d, i) => (
                      <p key={i} className="whitespace-nowrap">
                        {coversAllGroups(d.groups) ? "All groups" : d.groups.join(", ")}
                        {": "}
                        {formatDeadline(d.deadline)}
                      </p>
                    ))}
                  </td>
                  <td className="px-5 py-4 text-slate-500 tabular-nums">
                    {graded}/{subs.length} graded
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={open ? "brand" : "neutral"}>{open ? "Open" : "Closed"}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="divide-y divide-slate-50 md:hidden">
          {assignments.map((assignment) => {
            const subs = submissions.filter((s) => s.assignmentId === assignment.id);
            const graded = subs.filter((s) => s.graded).length;
            const open = isAssignmentOpen(assignment);
            return (
              <Link key={assignment.id} href={`/admin/assignments/${assignment.id}`} className="block px-4 py-4 active:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{assignment.title}</p>
                  <Badge variant={open ? "brand" : "neutral"}>{open ? "Open" : "Closed"}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  {assignment.deadlines.map((d, i) => (
                    <p key={i}>
                      {coversAllGroups(d.groups) ? "All groups" : d.groups.join(", ")}
                      {": "}
                      {formatDeadline(d.deadline)}
                    </p>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">{graded}/{subs.length} graded</p>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
