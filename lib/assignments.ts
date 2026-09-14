import type { Assignment } from "./types";
import { isPast } from "./format";

export function deadlineForGroup(assignment: Assignment, group: string): string | null {
  const match = assignment.deadlines.find((d) => d.groups.includes(group));
  return match ? match.deadline : null;
}

export function isClosedForGroup(assignment: Assignment, group: string): boolean {
  if (assignment.closed) return true;
  const deadline = deadlineForGroup(assignment, group);
  return deadline ? isPast(deadline) : false;
}

// Open overall if the TA hasn't manually closed it and at least one covered group can still submit.
export function isAssignmentOpen(assignment: Assignment): boolean {
  if (assignment.closed) return false;
  if (assignment.deadlines.length === 0) return true;
  return assignment.deadlines.some((d) => !isPast(d.deadline));
}

export function allDeadlinesPast(assignment: Assignment): boolean {
  if (assignment.deadlines.length === 0) return false;
  return assignment.deadlines.every((d) => isPast(d.deadline));
}
