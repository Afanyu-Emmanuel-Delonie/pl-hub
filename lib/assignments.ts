import type { Assignment } from "./types";
import { isPast } from "./format";

export function deadlineForGroup(assignment: Assignment, group: string): string | null {
  const match = assignment.deadlines.find((d) => d.groups.includes(group));
  return match ? match.deadline : null;
}

// All groups covered by at least one deadline entry, in a stable order.
export function coveredGroups(assignment: Assignment): string[] {
  return Array.from(new Set(assignment.deadlines.flatMap((d) => d.groups)));
}

export function isClosedForGroup(assignment: Assignment, group: string): boolean {
  if (assignment.closedGroups.includes(group)) return true;
  const deadline = deadlineForGroup(assignment, group);
  return deadline ? isPast(deadline) : false;
}

// Open overall if at least one covered group can still submit.
export function isAssignmentOpen(assignment: Assignment): boolean {
  const groups = coveredGroups(assignment);
  if (groups.length === 0) return true;
  return groups.some((g) => !isClosedForGroup(assignment, g));
}

export function allDeadlinesPast(assignment: Assignment): boolean {
  if (assignment.deadlines.length === 0) return false;
  return assignment.deadlines.every((d) => isPast(d.deadline));
}
