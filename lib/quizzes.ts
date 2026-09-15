import type { Quiz, QuizQuestion } from "./types";

// Fisher–Yates shuffle.
function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Bonus questions are optional extra credit and always come last, in both
// the admin's question list and the student's answering order.
export function orderQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return [...questions.filter((q) => !q.isBonus), ...questions.filter((q) => q.isBonus)];
}

// Gives each student their own question order so no two people sitting the
// quiz at the same time see the same sequence — bonus questions are shuffled
// separately and still always land at the end.
export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const regular = shuffle(questions.filter((q) => !q.isBonus));
  const bonus = shuffle(questions.filter((q) => q.isBonus));
  return [...regular, ...bonus];
}

// Groups the quiz applies to — empty selection on the quiz means "every
// group", resolved against the system's actual recorded groups rather than
// a fixed list, so a newly added/renamed group is reflected immediately.
export function quizGroups(quiz: Quiz, allGroups: string[]): string[] {
  return quiz.groups.length === 0 ? allGroups : quiz.groups;
}

// The [start, end) instants of an automatic-mode quiz's sitting, or null for
// a manual-mode quiz (or an automatic one still missing its schedule).
export function scheduleWindow(quiz: Quiz): { start: number; end: number } | null {
  if (quiz.scheduleMode !== "automatic" || !quiz.startTime || !quiz.durationMinutes) return null;
  const start = new Date(quiz.startTime).getTime();
  return { start, end: start + quiz.durationMinutes * 60_000 };
}

// `now` defaults to the caller's local clock, which is fine for admin
// screens (nothing security-sensitive rides on it there). The student-facing
// quiz page must instead pass a server-synced `trustedNow()` — see
// lib/serverTime.ts — so a student can't dodge or extend an automatic
// window by changing their device clock.
export function isQuizClosedForGroup(quiz: Quiz, group: string, now: number = Date.now()): boolean {
  if (quiz.closedGroups.includes(group)) return true;
  const window = scheduleWindow(quiz);
  if (window) return now >= window.end;
  return new Date(quiz.deadline).getTime() < now;
}

// Open overall if at least one covered group can currently respond: for a
// manual-mode quiz that means the TA has started it and the deadline hasn't
// passed; for an automatic-mode quiz it means `now` falls inside its
// scheduled window. A manual quiz that hasn't been started, or an automatic
// one before its start time, is never "open".
export function isQuizOpen(quiz: Quiz, allGroups: string[], now: number = Date.now()): boolean {
  const window = scheduleWindow(quiz);
  if (window) {
    if (now < window.start) return false;
  } else if (!quiz.started) {
    return false;
  }
  return quizGroups(quiz, allGroups).some((g) => !isQuizClosedForGroup(quiz, g, now));
}

// Three-state phase for rendering: "before" (waiting screen), "open"
// (answering), "after" (closed — whether by deadline, schedule, or the TA
// manually ending it). Distinct from isQuizOpen's boolean so "waiting" and
// "finished" render differently even though both are "not open".
export function quizPhase(quiz: Quiz, allGroups: string[], now: number = Date.now()): "before" | "open" | "after" {
  const window = scheduleWindow(quiz);
  if (window) {
    if (now < window.start) return "before";
    return isQuizOpen(quiz, allGroups, now) ? "open" : "after";
  }
  if (!quiz.started) return "before";
  return isQuizOpen(quiz, allGroups, now) ? "open" : "after";
}

// Same three states, named for the admin's "not-started"/"open"/"closed" badges.
export function quizStatus(quiz: Quiz, allGroups: string[], now: number = Date.now()): "not-started" | "open" | "closed" {
  const phase = quizPhase(quiz, allGroups, now);
  return phase === "before" ? "not-started" : phase === "open" ? "open" : "closed";
}
