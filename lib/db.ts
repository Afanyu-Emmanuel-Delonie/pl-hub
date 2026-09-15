import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Assignment,
  AssignmentSubmission,
  AttendanceRecord,
  BonusAward,
  CAWeights,
  Quiz,
  QuizArchiveRecord,
  QuizResponse,
  Student,
} from "./types";

// ── helpers ──────────────────────────────────────────────────────────────────

function col(path: string) {
  return collection(db, path);
}

// Every onSnapshot call takes an onError so a denied/broken subscription
// still resolves the caller's "loaded" state instead of hanging forever.
function logSnapshotError(source: string) {
  return (err: unknown) => console.error(`[firestore] ${source} subscription failed:`, err);
}

// ── quizzes ──────────────────────────────────────────────────────────────────

export function subscribeQuizzes(cb: (quizzes: Quiz[]) => void, onError?: () => void): Unsubscribe {
  return onSnapshot(
    query(col("quizzes"), orderBy("createdAt", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quiz))),
    (err) => { logSnapshotError("quizzes")(err); onError?.(); }
  );
}

export async function createQuiz(quiz: Quiz) {
  await setDoc(doc(db, "quizzes", quiz.id), quiz);
}

export async function saveQuiz(quiz: Quiz) {
  await setDoc(doc(db, "quizzes", quiz.id), quiz);
}

// Deliberately does NOT touch quizResponses — those are a student's actual
// recorded marks and must survive the quiz document being cleared out. See
// archiveQuiz, which the store calls first so the points-possible total
// isn't lost along with the quiz.
export async function removeQuiz(id: string) {
  await deleteDoc(doc(db, "quizzes", id));
}

export async function patchQuiz(id: string, patch: Partial<Quiz>) {
  await updateDoc(doc(db, "quizzes", id), patch as Record<string, unknown>);
}

// ── quiz archive (see QuizArchiveRecord) ──────────────────────────────────────

export function subscribeQuizArchive(
  cb: (records: QuizArchiveRecord[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    query(col("quizArchive"), orderBy("archivedAt", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizArchiveRecord))),
    (err) => { logSnapshotError("quizArchive")(err); onError?.(); }
  );
}

export async function archiveQuiz(record: QuizArchiveRecord) {
  await setDoc(doc(db, "quizArchive", record.id), record);
}

// ── quiz responses ────────────────────────────────────────────────────────────

export function subscribeQuizResponses(
  cb: (responses: QuizResponse[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    col("quizResponses"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizResponse))),
    (err) => { logSnapshotError("quizResponses")(err); onError?.(); }
  );
}

export async function submitQuizResponse(response: QuizResponse) {
  await setDoc(doc(db, "quizResponses", response.id), response);
}

// One-time (non-subscribed) lookup used by the student quiz page to check,
// right before letting someone start, whether this student has already
// submitted this exact quiz or the other sitting of a paired quiz — see
// `pairId` on Quiz/QuizResponse. Scoped to one student's own responses.
export async function getStudentQuizResponses(studentId: string): Promise<QuizResponse[]> {
  const snap = await getDocs(query(col("quizResponses"), where("studentId", "==", studentId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizResponse));
}

export async function removeQuizResponse(id: string) {
  await deleteDoc(doc(db, "quizResponses", id));
}

// ── assignments ───────────────────────────────────────────────────────────────

export function subscribeAssignments(
  cb: (assignments: Assignment[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    query(col("assignments"), orderBy("createdAt", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment))),
    (err) => { logSnapshotError("assignments")(err); onError?.(); }
  );
}

export async function createAssignment(assignment: Assignment) {
  await setDoc(doc(db, "assignments", assignment.id), assignment);
}

export async function saveAssignment(assignment: Assignment) {
  await setDoc(doc(db, "assignments", assignment.id), assignment);
}

export async function removeAssignment(id: string) {
  await deleteDoc(doc(db, "assignments", id));
  const snap = await getDocs(query(col("assignmentSubmissions"), where("assignmentId", "==", id)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function patchAssignment(id: string, patch: Partial<Assignment>) {
  await updateDoc(doc(db, "assignments", id), patch as Record<string, unknown>);
}

// ── assignment submissions ────────────────────────────────────────────────────

export function subscribeAssignmentSubmissions(
  cb: (submissions: AssignmentSubmission[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    col("assignmentSubmissions"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AssignmentSubmission))),
    (err) => { logSnapshotError("assignmentSubmissions")(err); onError?.(); }
  );
}

// Scoped to one assignment (rather than reusing subscribeAssignmentSubmissions'
// whole-collection read) so the public results-lookup page only ever pulls
// down the one assignment's submissions, not every student's score on
// every assignment that's ever existed.
export function subscribeAssignmentSubmissionsForAssignment(
  assignmentId: string,
  cb: (submissions: AssignmentSubmission[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    query(col("assignmentSubmissions"), where("assignmentId", "==", assignmentId)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AssignmentSubmission))),
    (err) => { logSnapshotError("assignmentSubmissions (single)")(err); onError?.(); }
  );
}

export async function submitAssignment(submission: AssignmentSubmission) {
  await setDoc(doc(db, "assignmentSubmissions", submission.id), submission);
}

export async function gradeSubmission(
  id: string,
  score: number,
  comment: string
) {
  await updateDoc(doc(db, "assignmentSubmissions", id), {
    score,
    comment,
    graded: true,
  });
}

export async function removeSubmission(id: string) {
  await deleteDoc(doc(db, "assignmentSubmissions", id));
}

// ── students ──────────────────────────────────────────────────────────────────

export function subscribeStudents(
  cb: (students: Student[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    col("students"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student))),
    (err) => { logSnapshotError("students")(err); onError?.(); }
  );
}

// Registers/updates a student the moment they submit a quiz or assignment —
// this is the only place the roster gets populated, so Students, Rankings,
// and the Profile CA table all show real people without the TA maintaining
// a separate list by hand. Safe to call on every submission: merges in the
// latest name/group rather than duplicating or overwriting other fields.
export async function upsertStudent(student: Student) {
  await setDoc(doc(db, "students", student.id), student, { merge: true });
}

// ── bonus awards ──────────────────────────────────────────────────────────────

export function subscribeBonusAwards(
  cb: (awards: BonusAward[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    query(col("bonusAwards"), orderBy("awardedAt", "desc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BonusAward))),
    (err) => { logSnapshotError("bonusAwards")(err); onError?.(); }
  );
}

export async function createBonusAward(award: BonusAward) {
  await setDoc(doc(db, "bonusAwards", award.id), award);
}

// ── attendance ────────────────────────────────────────────────────────────────

export function subscribeAttendance(
  cb: (records: AttendanceRecord[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    col("attendance"),
    (snap) => cb(snap.docs.map((d) => d.data() as AttendanceRecord)),
    (err) => { logSnapshotError("attendance")(err); onError?.(); }
  );
}

export async function setAttendance(studentId: string, percentage: number) {
  await setDoc(doc(db, "attendance", studentId), { studentId, percentage });
}

// ── groups ───────────────────────────────────────────────────────────────────

export function subscribeGroups(
  cb: (groups: string[]) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    query(col("groups"), orderBy("name", "asc")),
    (snap) => cb(snap.docs.map((d) => d.data().name as string)),
    (err) => { logSnapshotError("groups")(err); onError?.(); }
  );
}

export async function createGroup(name: string) {
  await addDoc(col("groups"), { name });
}

export async function updateGroup(id: string, name: string) {
  await updateDoc(doc(db, "groups", id), { name });
}

export async function deleteGroup(id: string) {
  await deleteDoc(doc(db, "groups", id));
}

export async function getGroupDocs(): Promise<{ id: string; name: string }[]> {
  const snap = await getDocs(query(col("groups"), orderBy("name", "asc")));
  return snap.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
}

// ── CA weights (single settings doc) ──────────────────────────────────────────

export function subscribeCAWeights(
  cb: (weights: CAWeights | null) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "settings", "caWeights"),
    (snap) => cb(snap.exists() ? (snap.data() as CAWeights) : null),
    (err) => { logSnapshotError("settings/caWeights")(err); onError?.(); }
  );
}

export async function saveCAWeights(weights: CAWeights) {
  await setDoc(doc(db, "settings", "caWeights"), weights);
}
