import type { Quiz, QuizQuestion } from "./types";
import { isPast } from "./format";

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

export function isQuizClosedForGroup(quiz: Quiz, group: string): boolean {
  if (quiz.closedGroups.includes(group)) return true;
  return isPast(quiz.deadline);
}

// Open overall if at least one covered group can still respond.
export function isQuizOpen(quiz: Quiz, allGroups: string[]): boolean {
  return quizGroups(quiz, allGroups).some((g) => !isQuizClosedForGroup(quiz, g));
}
