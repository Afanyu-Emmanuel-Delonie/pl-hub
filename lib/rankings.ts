import { ASSIGNMENT_SUBMISSIONS, BONUS_AWARDS, QUIZ_RESPONSES, STUDENTS } from "./mock-data";
import type { BonusAward } from "./types";

export type LeaderboardRow = {
  studentId: string;
  studentName: string;
  group: string;
  assignmentPoints: number;
  quizPoints: number;
  bonus: number;
  total: number;
};

export function computeLeaderboard(extraAwards: BonusAward[] = []): LeaderboardRow[] {
  const rows: Record<string, LeaderboardRow> = {};

  for (const student of STUDENTS) {
    rows[student.id] = {
      studentId: student.id,
      studentName: student.name,
      group: student.group,
      assignmentPoints: 0,
      quizPoints: 0,
      bonus: 0,
      total: 0,
    };
  }

  for (const sub of ASSIGNMENT_SUBMISSIONS) {
    const row = rows[sub.studentId];
    if (!row) continue;
    row.assignmentPoints += sub.score ?? 0;
  }

  for (const resp of QUIZ_RESPONSES) {
    const row = rows[resp.studentId];
    if (!row) continue;
    row.quizPoints += resp.score;
  }

  for (const award of [...BONUS_AWARDS, ...extraAwards]) {
    const row = rows[award.studentId];
    if (!row) continue;
    row.bonus += award.points;
  }

  const list = Object.values(rows).map((row) => ({
    ...row,
    assignmentPoints: row.assignmentPoints || 0,
    quizPoints: row.quizPoints || 0,
    bonus: row.bonus || 0,
    total: (row.assignmentPoints || 0) + (row.quizPoints || 0) + (row.bonus || 0),
  }));

  return list.sort((a, b) => b.total - a.total);
}
