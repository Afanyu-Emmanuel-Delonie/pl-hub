"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  subscribeQuizzes,
  subscribeQuizResponses,
  subscribeAssignments,
  subscribeAssignmentSubmissions,
  subscribeStudents,
  subscribeBonusAwards,
  subscribeAttendance,
  subscribeCAWeights,
  subscribeGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupDocs,
  createQuiz,
  saveQuiz,
  removeQuiz,
  patchQuiz,
  submitQuizResponse,
  removeQuizResponse,
  createAssignment,
  saveAssignment,
  removeAssignment,
  patchAssignment,
  submitAssignment,
  gradeSubmission,
  removeSubmission,
  createBonusAward,
  setAttendance as setAttendanceDoc,
  saveCAWeights,
} from "./db";
import { quizGroups } from "./quizzes";
import { DEFAULT_CA_WEIGHTS } from "./mock-data";
import type {
  Assignment,
  AssignmentSubmission,
  BonusAward,
  CAWeights,
  Quiz,
  QuizResponse,
  Student,
} from "./types";

type AppStore = {
  // data
  quizzes: Quiz[];
  quizResponses: QuizResponse[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  students: Student[];
  bonusAwards: BonusAward[];
  attendance: Record<string, number>;
  caWeights: CAWeights;
  groups: string[];
  loading: boolean;

  // group actions
  addGroup: (name: string) => Promise<void>;
  renameGroup: (name: string, newName: string) => Promise<void>;
  removeGroup: (name: string) => Promise<void>;

  // quiz actions
  addQuiz: (quiz: Quiz) => Promise<void>;
  updateQuiz: (quiz: Quiz) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  endQuiz: (id: string) => Promise<void>;
  reopenQuiz: (id: string) => Promise<void>;
  addQuizResponse: (response: QuizResponse) => Promise<void>;
  deleteQuizResponse: (id: string) => Promise<void>;

  // assignment actions
  addAssignment: (assignment: Assignment) => Promise<void>;
  updateAssignment: (assignment: Assignment) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  toggleAssignmentGroup: (id: string, group: string, closedGroups: string[]) => Promise<void>;
  addSubmission: (submission: AssignmentSubmission) => Promise<void>;
  saveGrade: (id: string, score: number, comment: string) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;

  // bonus
  addBonusAward: (award: BonusAward) => Promise<void>;

  // profile / continuous assessment
  setAttendance: (studentId: string, percentage: number) => Promise<void>;
  saveCAWeights: (weights: CAWeights) => Promise<void>;
};

const StoreContext = createContext<AppStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [bonusAwards, setBonusAwards] = useState<BonusAward[]>([]);
  const [attendance, setAttendanceState] = useState<Record<string, number>>({});
  const [caWeights, setCaWeights] = useState<CAWeights>(DEFAULT_CA_WEIGHTS);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = 0;
    const total = 9;
    // Every subscription — success or error — counts toward "loaded", so a
    // denied/broken collection can never leave the dashboard spinning forever.
    function tick() { if (++resolved >= total) setLoading(false); }

    const unsubs = [
      subscribeQuizzes((data) => { setQuizzes(data); tick(); }, tick),
      subscribeQuizResponses((data) => { setQuizResponses(data); tick(); }, tick),
      subscribeAssignments((data) => { setAssignments(data); tick(); }, tick),
      subscribeAssignmentSubmissions((data) => { setSubmissions(data); tick(); }, tick),
      subscribeStudents((data) => { setStudents(data); tick(); }, tick),
      subscribeBonusAwards((data) => { setBonusAwards(data); tick(); }, tick),
      subscribeAttendance((records) => {
        setAttendanceState(Object.fromEntries(records.map((r) => [r.studentId, r.percentage])));
        tick();
      }, tick),
      subscribeCAWeights((weights) => {
        if (weights) setCaWeights(weights);
        tick();
      }, tick),
      subscribeGroups((data) => { setGroups(data); tick(); }, tick),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // ── quiz actions ────────────────────────────────────────────────────────────
  const addQuiz = useCallback((quiz: Quiz) => createQuiz(quiz), []);
  const updateQuiz = useCallback((quiz: Quiz) => saveQuiz(quiz), []);
  const deleteQuiz = useCallback((id: string) => removeQuiz(id), []);

  const endQuiz = useCallback(async (id: string) => {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) return;
    await patchQuiz(id, { closedGroups: quizGroups(quiz, groups) });
  }, [quizzes, groups]);

  const reopenQuiz = useCallback(async (id: string) => {
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 7);
    await patchQuiz(id, { closedGroups: [], deadline: newDeadline.toISOString() });
  }, []);

  const addQuizResponse = useCallback((r: QuizResponse) => submitQuizResponse(r), []);
  const deleteQuizResponse = useCallback((id: string) => removeQuizResponse(id), []);

  // ── assignment actions ──────────────────────────────────────────────────────
  const addAssignment = useCallback((a: Assignment) => createAssignment(a), []);
  const updateAssignment = useCallback((a: Assignment) => saveAssignment(a), []);
  const deleteAssignment = useCallback((id: string) => removeAssignment(id), []);

  const toggleAssignmentGroup = useCallback(
    (id: string, _group: string, closedGroups: string[]) =>
      patchAssignment(id, { closedGroups }),
    []
  );

  const addSubmission = useCallback((s: AssignmentSubmission) => submitAssignment(s), []);
  const saveGrade = useCallback(
    (id: string, score: number, comment: string) => gradeSubmission(id, score, comment),
    []
  );
  const deleteSubmission = useCallback((id: string) => removeSubmission(id), []);

  // ── groups ──────────────────────────────────────────────────────────────────
  const addGroup = useCallback((name: string) => createGroup(name), []);

  const renameGroup = useCallback(async (name: string, newName: string) => {
    const docs = await getGroupDocs();
    const found = docs.find((d) => d.name === name);
    if (found) await updateGroup(found.id, newName);
  }, []);

  const removeGroup = useCallback(async (name: string) => {
    const docs = await getGroupDocs();
    const found = docs.find((d) => d.name === name);
    if (found) await deleteGroup(found.id);
  }, []);

  // ── bonus ───────────────────────────────────────────────────────────────────
  const addBonusAward = useCallback((award: BonusAward) => createBonusAward(award), []);

  // ── profile / continuous assessment ─────────────────────────────────────────
  const setAttendance = useCallback(
    (studentId: string, percentage: number) => setAttendanceDoc(studentId, percentage),
    []
  );
  const saveCAWeightsAction = useCallback((weights: CAWeights) => saveCAWeights(weights), []);

  return (
    <StoreContext.Provider
      value={{
        quizzes, quizResponses, assignments, submissions, students, bonusAwards,
        attendance, caWeights, groups, loading,
        addQuiz, updateQuiz, deleteQuiz, endQuiz, reopenQuiz, addQuizResponse, deleteQuizResponse,
        addAssignment, updateAssignment, deleteAssignment, toggleAssignmentGroup,
        addSubmission, saveGrade, deleteSubmission, addBonusAward,
        setAttendance, saveCAWeights: saveCAWeightsAction,
        addGroup, renameGroup, removeGroup,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

// backwards-compat alias used by quiz pages
export function useQuizStore() {
  const { quizzes, quizResponses: responses, groups, addQuiz, updateQuiz, deleteQuiz, endQuiz, reopenQuiz, deleteQuizResponse } = useStore();
  return { quizzes, responses, groups, addQuiz, updateQuiz, deleteQuiz, endQuiz, reopenQuiz, deleteQuizResponse };
}
