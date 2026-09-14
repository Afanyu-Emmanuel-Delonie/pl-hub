import type { AssignmentSubmission, BonusAward, QuizResponse, Student } from "./types";

export type LeaderboardRow = {
  studentId: string;
  studentName: string;
  group: string;
  assignmentPoints: number;
  quizPoints: number;
  bonus: number;
  total: number;
};

export function computeLeaderboard(
  students: Student[],
  submissions: AssignmentSubmission[],
  quizResponses: QuizResponse[],
  bonusAwards: BonusAward[]
): LeaderboardRow[] {
  const rows: Record<string, LeaderboardRow> = {};

  for (const student of students) {
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

  for (const sub of submissions) {
    if (!rows[sub.studentId]) continue;
    rows[sub.studentId].assignmentPoints += sub.score ?? 0;
  }

  for (const resp of quizResponses) {
    if (!rows[resp.studentId]) continue;
    rows[resp.studentId].quizPoints += resp.score;
  }

  for (const award of bonusAwards) {
    if (!rows[award.studentId]) continue;
    rows[award.studentId].bonus += award.points;
  }

  return Object.values(rows)
    .map((row) => ({
      ...row,
      total: row.assignmentPoints + row.quizPoints + row.bonus,
    }))
    .sort((a, b) => b.total - a.total);
}
