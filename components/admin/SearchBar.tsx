"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ASSIGNMENTS, QUIZZES, STUDENTS } from "@/lib/mock-data";

type Result = {
  id: string;
  label: string;
  meta: string;
  type: "Student" | "Assignment" | "Quiz";
  href: string;
};

function buildResults(query: string): Result[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const students: Result[] = STUDENTS.filter(
    (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
  ).map((s) => ({
    id: `student-${s.id}`,
    label: s.name,
    meta: `${s.id} · ${s.group}`,
    type: "Student",
    href: "/admin/rankings",
  }));

  const assignments: Result[] = ASSIGNMENTS.filter((a) =>
    a.title.toLowerCase().includes(q)
  ).map((a) => ({
    id: `assignment-${a.id}`,
    label: a.title,
    meta: "Assignment",
    type: "Assignment",
    href: `/admin/assignments/${a.id}`,
  }));

  const quizzes: Result[] = QUIZZES.filter((q2) =>
    q2.title.toLowerCase().includes(q)
  ).map((qz) => ({
    id: `quiz-${qz.id}`,
    label: qz.title,
    meta: "Quiz",
    type: "Quiz",
    href: `/admin/quizzes/${qz.id}`,
  }));

  return [...students, ...assignments, ...quizzes].slice(0, 8);
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => buildResults(query), [query]);

  function goTo(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full max-w-sm">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      >
        <path
          d="M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM17 17l-3.5-3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        placeholder="Search students, assignments, quizzes"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-foreground placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-tint-strong"
      />

      {open && query.trim() !== "" && (
        <div className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No matches.</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(r.href)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <span>
                      <span className="font-medium text-foreground">{r.label}</span>
                      <span className="ml-2 text-xs text-slate-400">{r.meta}</span>
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
