import type {
  Assignment,
  AssignmentSubmission,
  CAWeights,
  Quiz,
  QuizArchiveRecord,
  QuizResponse,
  Student,
} from "./types";

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
  weights: CAWeights,
  assignments: Assignment[],
  submissions: AssignmentSubmission[],
  quizzes: Quiz[],
  quizResponses: QuizResponse[],
  // Deleted quizzes' points-possible totals — without these, deleting an old
  // quiz to free up space would shrink the denominator and retroactively
  // inflate everyone's quiz percentage. See QuizArchiveRecord.
  quizArchive: QuizArchiveRecord[] = []
): CARow {
  const totalAssignmentMax = assignments.reduce((sum, a) => sum + a.maxScore, 0);
  const totalQuizMax =
    quizzes.reduce(
      (sum, q) => sum + q.questions.reduce((qSum, question) => qSum + question.points, 0),
      0
    ) + quizArchive.reduce((sum, a) => sum + a.maxScore, 0);

  const earnedAssignment = submissions
    .filter((s) => s.studentId === student.id)
    .reduce((sum, s) => sum + (s.score ?? 0), 0);

  const earnedQuiz = quizResponses
    .filter((r) => r.studentId === student.id)
    .reduce((sum, r) => sum + r.score, 0);

  const assignmentPct =
    totalAssignmentMax > 0 ? (earnedAssignment / totalAssignmentMax) * 100 : 0;
  const quizPct = totalQuizMax > 0 ? (earnedQuiz / totalQuizMax) * 100 : 0;
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
