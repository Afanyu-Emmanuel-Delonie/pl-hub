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
  // Gates the public /a/[id]/results lookup page — students can't see any
  // scores until the TA explicitly flips this on, so a partial grading pass
  // is never visible. Missing/false on older assignments (not yet published).
  resultsPublished?: boolean;
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

export type QuizScheduleMode = "manual" | "automatic";

export type Quiz = {
  id: string;
  title: string;
  deadline: string;
  groups: Group[];
  questions: QuizQuestion[];
  closedGroups: Group[]; // groups manually blocked from responding, ahead of the deadline
  createdAt: string;
  started: boolean; // manual mode only — gate students wait behind until the TA clicks "Start quiz"
  // "manual" (default, missing on older quizzes) = today's TA-driven start/end via `started`/`deadline`.
  // "automatic" = fully clock-driven: opens exactly at `startTime` and closes `durationMinutes` later,
  // with no TA action at either end — used for timed sittings like the 6:30am slot.
  scheduleMode?: QuizScheduleMode;
  startTime?: string; // ISO instant; required when scheduleMode === "automatic"
  durationMinutes?: number; // required when scheduleMode === "automatic"
  // Shared identifier linking the two sittings of the same two-sitting quiz
  // (e.g. SET 1 and SET 2 created together via the import page) — lets the
  // student page block someone who already took one sitting from also
  // taking the other. Absent on quizzes created singly.
  pairId?: string;
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
  autoSubmitted?: boolean; // ended automatically without the student pressing submit
  tabSwitchCount?: number;
  // Why autoSubmitted fired — "tabswitch" (too many tab switches) or "time" (the
  // scheduled window closed mid-attempt). Absent on older responses (tab-switch).
  autoSubmitReason?: "tabswitch" | "time";
  // Denormalized from the quiz at submit time so a duplicate-attempt check
  // can query quizResponses by studentId alone, without first looking up
  // which quiz ids share a pairId.
  pairId?: string;
};

// A slim, permanent record of a quiz's grading-relevant facts, written right
// before the quiz document itself is deleted. Quiz documents carry the full
// question list (text, options, code blocks) and are the main thing worth
// clearing out to save space; QuizResponse docs (the actual marks) are never
// deleted alongside them. This record is what lets CA math keep using the
// right "out of how many points" total after the source quiz is gone.
export type QuizArchiveRecord = {
  id: string; // same id the quiz document had
  title: string;
  groups: Group[];
  maxScore: number; // sum of question points, frozen at archive time
  createdAt: string;
  archivedAt: string;
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
