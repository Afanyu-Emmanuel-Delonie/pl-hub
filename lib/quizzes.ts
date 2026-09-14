import { GROUPS } from "./mock-data";
import type { Quiz } from "./types";
import { isPast } from "./format";

// Groups the quiz applies to — empty selection on the quiz means "every group".
export function quizGroups(quiz: Quiz): string[] {
  return quiz.groups.length === 0 ? GROUPS : quiz.groups;
}

export function isQuizClosedForGroup(quiz: Quiz, group: string): boolean {
  if (quiz.closedGroups.includes(group)) return true;
  return isPast(quiz.deadline);
}

// Open overall if at least one covered group can still respond.
export function isQuizOpen(quiz: Quiz): boolean {
  return quizGroups(quiz).some((g) => !isQuizClosedForGroup(quiz, g));
}
