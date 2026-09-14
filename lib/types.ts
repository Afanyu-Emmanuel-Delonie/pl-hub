export type Group = string;

export type Student = {
  id: string;
  name: string;
  group: Group;
};

export type GroupDeadline = {
  groups: Group[];
  deadline: string;
};

export type ContentBlock =
  | { id: string; type: "text"; value: string }
  | { id: string; type: "code"; value: string; language?: string }
  | { id: string; type: "question"; text: string; subQuestions: string[] };

export type Assignment = {
  id: string;
  title: string;
  instructions: string[];
  content: ContentBlock[];
  deadlines: GroupDeadline[];
  maxScore: number;
  closedGroups: Group[]; // groups manually blocked from submitting, ahead of their deadline
  createdAt: string;
};


export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  group: Group;
  githubLink: string;
  submittedAt: string;
  late: boolean;
  graded: boolean;
  score: number | null;
  maxScore: number;
  comment: string;
};

export type QuizQuestionType = "multiple-choice" | "multi-select" | "true-false" | "short-answer";

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  text: string;
  codeBlock?: { value: string; language?: string };
  options: string[];        // empty for short-answer
  correctIndexes: number[]; // multiple-choice = 1 item, multi-select = many, true-false = 1 (0=True,1=False)
  points: number;           // defaults to 1
  isBonus?: boolean;        // optional extra-credit question — always shown/ordered last, never required
};

export type Quiz = {
  id: string;
  title: string;
  deadline: string;
  groups: Group[];
  questions: QuizQuestion[];
  closedGroups: Group[]; // groups manually blocked from responding, ahead of the deadline
  createdAt: string;
};

export type QuizResponse = {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  group: Group;
  score: number;
  maxScore: number;
  submittedAt: string;
  late: boolean;
};

export type BonusAward = {
  id: string;
  studentId: string;
  studentName: string;
  group: Group;
  points: number;
  reason: string;
  awardedAt: string;
};

export type AttendanceRecord = {
  studentId: string;
  percentage: number; // 0-100, logged once at the end of the semester
};

export type CAWeights = {
  attendance: number; // % of the CA bucket
  assignments: number; // % of the CA bucket
  // quizzes = 100 - attendance - assignments
  totalWeight: number; // % of the final grade the CA bucket itself is worth (e.g. 30)
};
