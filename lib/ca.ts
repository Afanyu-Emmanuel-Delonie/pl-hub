import { ASSIGNMENTS, ASSIGNMENT_SUBMISSIONS, QUIZZES, QUIZ_RESPONSES } from "./mock-data";
import type { CAWeights, Student } from "./types";

const TOTAL_ASSIGNMENT_MAX = ASSIGNMENTS.reduce((sum, a) => sum + a.maxScore, 0);
const TOTAL_QUIZ_MAX = QUIZZES.reduce((sum, q) => sum + q.questions.length, 0);

export type CARow = {
  studentId: string;
  studentName: string;
  group: string;
  attendancePct: number | null;
  assignmentPct: number;
  quizPct: number;
  caPercent: number;
  caScore: number;
};

export function quizWeight(weights: CAWeights) {
  return Math.max(0, 100 - weights.attendance - weights.assignments);
}

export function computeCARow(
  student: Student,
  attendanceById: Record<string, number>,
  weights: CAWeights
): CARow {
  const earnedAssignment = ASSIGNMENT_SUBMISSIONS.filter(
    (s) => s.studentId === student.id
  ).reduce((sum, s) => sum + (s.score ?? 0), 0);

  const earnedQuiz = QUIZ_RESPONSES.filter((r) => r.studentId === student.id).reduce(
    (sum, r) => sum + r.score,
    0
  );

  const assignmentPct =
    TOTAL_ASSIGNMENT_MAX > 0 ? (earnedAssignment / TOTAL_ASSIGNMENT_MAX) * 100 : 0;
  const quizPct = TOTAL_QUIZ_MAX > 0 ? (earnedQuiz / TOTAL_QUIZ_MAX) * 100 : 0;
  const attendancePct = attendanceById[student.id] ?? null;

  const wQuizzes = quizWeight(weights);
  const caPercent =
    ((attendancePct ?? 0) * weights.attendance +
      assignmentPct * weights.assignments +
      quizPct * wQuizzes) /
    100;

  const caScore = (caPercent * weights.totalWeight) / 100;

  return {
    studentId: student.id,
    studentName: student.name,
    group: student.group,
    attendancePct,
    assignmentPct,
    quizPct,
    caPercent,
    caScore,
  };
}
