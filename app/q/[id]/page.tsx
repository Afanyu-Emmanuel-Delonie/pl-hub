"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Clock } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getStudentQuizResponses, submitQuizResponse, subscribeGroups, upsertStudent } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Dropdown } from "@/components/ui/Dropdown";
import { Logo } from "@/components/ui/Logo";
import { isQuizClosedForGroup, quizGroups, quizPhase, shuffleQuestions } from "@/lib/quizzes";
import { validateName, validateStudentId, validateGroup } from "@/lib/validation";
import { syncServerTime, trustedNow } from "@/lib/serverTime";
import { formatKigaliTime } from "@/lib/format";
import type { Quiz, QuizQuestion } from "@/lib/types";

type Step = "intro" | "answering" | "done" | "incomplete";
type Answer = number[] | string;

// Number of tab-switches allowed (with warnings) before the quiz auto-submits.
const MAX_TAB_SWITCHES = 3;

function isAnswered(question: QuizQuestion, answer: Answer | undefined) {
  if (question.type === "short-answer") return typeof answer === "string" && answer.trim() !== "";
  if (!Array.isArray(answer)) return false;
  // Multi-select questions require picking exactly as many options as are
  // correct (e.g. "select TWO") — anything else is an incomplete answer.
  if (question.type === "multi-select") return answer.length === question.correctIndexes.length;
  return answer.length > 0;
}

function scoreAnswer(question: QuizQuestion, answer: Answer | undefined): number {
  if (question.type === "short-answer" || !Array.isArray(answer)) return 0;
  const correct = [...question.correctIndexes].sort().join(",");
  const given = [...answer].sort().join(",");
  return correct === given ? 1 : 0;
}

function WaitingForStart({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-tint" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint">
          <Clock className="h-7 w-7 text-brand" />
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Quiz</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-3 text-sm text-slate-500">Waiting for your instructor to start the quiz…</p>
      <div className="mt-6 flex items-center justify-center gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
      </div>
      <p className="mt-6 text-xs text-slate-400">This page updates automatically — no need to refresh.</p>
    </div>
  );
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// The automatic-mode counterpart to WaitingForStart — opens and closes on
// its own timer, so instead of "waiting for your instructor" this tells the
// student exactly when to come back, using a live countdown once it's close.
function ScheduledWait({ title, startTime, now }: { title: string; startTime: string; now: number }) {
  const startMs = new Date(startTime).getTime();
  const msLeft = startMs - now;
  const showCountdown = msLeft < 60 * 60_000; // under an hour away

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-tint" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint">
          <Clock className="h-7 w-7 text-brand" />
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Quiz</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-3 text-sm text-slate-500">This quiz opens at {formatKigaliTime(startTime)}</p>
      {showCountdown && (
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-brand">{formatCountdown(msLeft)}</p>
      )}
      <p className="mt-6 text-xs text-slate-400">This page updates automatically — no need to refresh.</p>
    </div>
  );
}

// Doesn't stop a screenshot — nothing rendered by a webpage can — but stamps
// every question with the student's identity so a leaked screenshot is
// traceable back to whoever took it. Purely visual: pointer-events-none so
// it never intercepts clicks, and it sits behind the select-none content.
function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
    >
      <div className="grid h-full w-full grid-cols-2 content-between gap-y-10 p-3 opacity-[0.07]">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-xs font-semibold text-slate-900 [transform:rotate(-22deg)]"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReviewQuestion({ question, index, answer }: { question: QuizQuestion; index: number; answer: Answer | undefined }) {
  const isGraded = question.type !== "short-answer";
  const isCorrect = isGraded && scoreAnswer(question, answer) === 1;
  const chosen = Array.isArray(answer) ? answer : [];

  return (
    <div className="border-b border-slate-100 px-6 py-5 last:border-b-0">
      <div className="mb-3 flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
            !isGraded ? "bg-slate-400" : isCorrect ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          {index + 1}
        </span>
        <div>
          <p className="pt-0.5 text-sm font-medium leading-relaxed text-foreground">{question.text}</p>
          {question.isBonus && (
            <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Bonus · optional
            </span>
          )}
        </div>
      </div>

      {question.codeBlock && (
        <div className="mb-3 ml-10">
          <CodeBlock code={question.codeBlock.value} label={question.codeBlock.language ?? "SQL"} />
        </div>
      )}

      {question.type === "short-answer" ? (
        <div className="ml-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {typeof answer === "string" && answer.trim() !== "" ? (
            answer
          ) : (
            <span className="italic text-slate-400">No answer given</span>
          )}
        </div>
      ) : (
        <div className="ml-10 space-y-2">
          {question.options.map((opt, idx) => {
            const isCorrectOpt = question.correctIndexes.includes(idx);
            const wasChosen = chosen.includes(idx);
            const style = isCorrectOpt
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-medium"
              : wasChosen
              ? "border-rose-300 bg-rose-50 text-rose-700"
              : "border-slate-200 text-slate-500";
            return (
              <div key={idx} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${style}`}>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    isCorrectOpt
                      ? "border-emerald-400 bg-emerald-400 text-white"
                      : wasChosen
                      ? "border-rose-400 bg-rose-400 text-white"
                      : "border-slate-300 text-slate-400"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
                {isCorrectOpt && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Correct</span>
                )}
                {!isCorrectOpt && wasChosen && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-rose-600">Your answer</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PublicQuizPage() {
  const params = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined);

  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [group, setGroup] = useState("");
  const [errors, setErrors] = useState<{ name?: string; studentId?: string; group?: string }>({});
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [current, setCurrent] = useState(0);
  const [orderedQuestions, setOrderedQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [allGroups, setAllGroups] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [autoSubmitReason, setAutoSubmitReason] = useState<"tabswitch" | "time">("tabswitch");
  const [timeSynced, setTimeSynced] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const unsubQuizRef = useRef<(() => void) | null>(null);
  const tabSwitchCountRef = useRef(0);
  const autoSubmitLockRef = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "quizzes", params.id), (snap) => {
      setQuiz(snap.exists() ? ({ id: snap.id, ...snap.data() } as Quiz) : null);
    });
    unsubQuizRef.current = unsub;
    return unsub;
  }, [params.id]);

  // The groups a quiz with no explicit selection applies to should reflect
  // whatever groups actually exist in the system, not a fixed placeholder
  // list — so this pulls the live roster instead of guessing at names.
  useEffect(() => {
    return subscribeGroups((data) => setAllGroups(data));
  }, []);

  // Automatic-mode open/close runs off a server-synced clock, not the
  // student's own device clock (which they could set back or forward to
  // dodge the window or claim extra time). Re-synced periodically in case a
  // student leaves the waiting screen open for a long time before start.
  useEffect(() => {
    let cancelled = false;
    syncServerTime().then(() => { if (!cancelled) setTimeSynced(true); });
    const resync = setInterval(syncServerTime, 60_000);
    return () => { cancelled = true; clearInterval(resync); };
  }, []);

  // Re-renders once a second so the trusted-time-derived phase (waiting →
  // open → closed) and the auto-submit check below stay live without a
  // manual refresh.
  useEffect(() => {
    const id = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Anti-cheating: switching away from the tab more than twice while
  // answering auto-submits whatever they've answered so far. Only armed
  // during "answering" — leaving before starting or after submitting
  // doesn't count. A ref (not the state) drives the actual decision so the
  // handler always sees the true running count, not a stale render's copy.
  useEffect(() => {
    if (step !== "answering") return;

    function handleVisibilityChange() {
      if (!document.hidden) return;
      tabSwitchCountRef.current += 1;
      const count = tabSwitchCountRef.current;
      setTabSwitchCount(count);
      if (count > MAX_TAB_SWITCHES && !autoSubmitLockRef.current) {
        autoSubmitLockRef.current = true;
        handleSubmit(true, count, "tabswitch");
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Automatic-mode quizzes close themselves the instant the scheduled window
  // ends. A student still mid-attempt at that point is auto-submitted with
  // whatever they've picked so far, same as the tab-switch limit — but a
  // student who never got past the intro screen is left alone (see the
  // "after" render branch below), so a no-show isn't recorded as an attempt.
  //
  // Sitting 1 of a two-sitting pair is special: if the student got less than
  // halfway through by the time the window closes, nothing is submitted at
  // all — no response is recorded, so the pair check doesn't block them from
  // taking sitting 2 the next morning. More than halfway (or any other quiz)
  // always submits and is final.
  //
  // Re-checks every clockTick (every second) since "now" crossing the
  // window's end isn't itself a state change React would otherwise notice.
  useEffect(() => {
    if (!quiz || quiz.scheduleMode !== "automatic") return;
    if (step !== "answering" || autoSubmitLockRef.current) return;
    if (quizPhase(quiz, allGroups, trustedNow()) === "after") {
      autoSubmitLockRef.current = true;
      const regular = orderedQuestions.filter((q) => !q.isBonus);
      const answeredCount = regular.filter((q) => isAnswered(q, answers[q.id])).length;
      const answeredEnough = regular.length === 0 || answeredCount / regular.length > 0.5;
      if (quiz.pairSitting === 1 && !answeredEnough) {
        markIncomplete();
      } else {
        handleSubmit(true, tabSwitchCountRef.current, "time");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, allGroups, step, clockTick]);

  if (quiz === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </main>
    );
  }

  if (quiz === null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-500">Quiz not found.</p>
      </main>
    );
  }

  // An automatic-mode quiz's open/close is time-critical, so hold on the
  // loading screen until the trusted clock offset is known rather than
  // briefly computing the phase off the student's own (untrusted) clock.
  if (quiz.scheduleMode === "automatic" && !timeSynced) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </main>
    );
  }

  const nowMs = trustedNow();
  const groups = quizGroups(quiz, allGroups);
  const phase = quizPhase(quiz, allGroups, nowMs);
  const groupClosed = group !== "" && isQuizClosedForGroup(quiz, group, nowMs);
  const question = orderedQuestions[current];
  const totalQ = quiz.questions.length;
  const canAdvance = question && (question.isBonus || isAnswered(question, answers[question.id]));

  function setAnswer(questionId: string, answer: Answer) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function toggleChoice(q: QuizQuestion, index: number) {
    const cur = (answers[q.id] as number[] | undefined) ?? [];
    if (q.type === "multi-select") {
      if (cur.includes(index)) {
        setAnswer(q.id, cur.filter((i) => i !== index));
      } else if (cur.length < q.correctIndexes.length) {
        setAnswer(q.id, [...cur, index]);
      }
      // else: already picked the required number — ignore extra selections
      // until one is deselected, rather than letting the count run away.
    } else {
      setAnswer(q.id, [index]);
    }
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = {
      name: validateName(name) ?? undefined,
      studentId: validateStudentId(studentId) ?? undefined,
      group: groupClosed ? "This group's access is closed." : (validateGroup(group) ?? undefined),
    };
    setErrors(nextErrors);
    setDuplicateError(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    // Block a repeat attempt: either this exact quiz again, or — for a
    // two-sitting quiz — the *other* sitting (same pairId). Checked here,
    // right before entry, rather than only at submit time, so a student
    // isn't allowed to answer the whole thing before finding out it won't
    // count.
    setCheckingDuplicate(true);
    try {
      const normalizedId = studentId.trim().toUpperCase();
      const priorResponses = await getStudentQuizResponses(normalizedId);
      const sameQuiz = priorResponses.some((r) => r.quizId === quiz!.id);
      const otherSitting = !sameQuiz && quiz!.pairId && priorResponses.some((r) => r.pairId === quiz!.pairId);
      if (sameQuiz) {
        setDuplicateError("You've already completed this quiz — it can only be taken once.");
        return;
      }
      if (otherSitting) {
        setDuplicateError("You've already completed the other sitting of this quiz — only one sitting is allowed per student.");
        return;
      }
    } finally {
      setCheckingDuplicate(false);
    }

    setOrderedQuestions(shuffleQuestions(quiz!.questions));
    setStep("answering");
  }

  async function handleSubmit(
    auto = false,
    switchCount = tabSwitchCountRef.current,
    reason: "tabswitch" | "time" = "tabswitch"
  ) {
    const regular = quiz!.questions.filter((q) => !q.isBonus);
    const bonus = quiz!.questions.filter((q) => q.isBonus);
    // Bonus questions add to the score as extra credit but never inflate
    // maxScore — a perfect regular score is still 100% without them.
    const score =
      regular.reduce((sum, q) => sum + scoreAnswer(q, answers[q.id]), 0) +
      bonus.reduce((sum, q) => sum + scoreAnswer(q, answers[q.id]), 0);
    const maxScore = regular.length;
    const normalizedId = studentId.trim().toUpperCase();
    const studentName = name.trim();
    await Promise.all([
      submitQuizResponse({
        id: `${quiz!.id}__${normalizedId}`,
        quizId: quiz!.id,
        studentId: normalizedId,
        studentName,
        group,
        score,
        maxScore,
        submittedAt: new Date().toISOString(),
        late: false,
        autoSubmitted: auto,
        tabSwitchCount: switchCount,
        ...(auto ? { autoSubmitReason: reason } : {}),
        ...(quiz!.pairId ? { pairId: quiz!.pairId } : {}),
      }),
      upsertStudent({ id: normalizedId, name: studentName, group }),
    ]);
    setResult({ score, maxScore });
    setAutoSubmitted(auto);
    setAutoSubmitReason(reason);
    setStep("done");
    // No more updates matter to this student once they've submitted — free
    // the connection instead of leaving it open until the tab is closed.
    unsubQuizRef.current?.();
  }

  function handleNext() {
    if (current < totalQ - 1) setCurrent((c) => c + 1);
    else handleSubmit();
  }

  // Sitting 1 ending with less than half answered: nothing is recorded, so
  // the student is free to take sitting 2 instead of being locked out by it.
  function markIncomplete() {
    setStep("incomplete");
    unsubQuizRef.current?.();
  }

  const scorePct = result && result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <Logo size={28} />
        {step === "answering" && (
          <span className="text-xs font-medium text-slate-400 tabular-nums">{current + 1} / {totalQ}</span>
        )}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className={`w-full ${step === "done" ? "max-w-2xl" : "max-w-lg"}`}>

          {phase === "before" && step !== "done" && (
            quiz.scheduleMode === "automatic" && quiz.startTime ? (
              <ScheduledWait title={quiz.title} startTime={quiz.startTime} now={nowMs} />
            ) : (
              <WaitingForStart title={quiz.title} />
            )
          )}

          {phase === "after" && step !== "done" && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-foreground">Quiz closed</h2>
              <p className="mt-1 text-sm text-slate-500">This quiz is no longer accepting responses.</p>
            </div>
          )}

          {phase === "open" && step === "intro" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Quiz</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{quiz.title}</h1>
                <p className="mt-1 text-sm text-slate-500">{totalQ} question{totalQ !== 1 ? "s" : ""}</p>
              </div>
              <form onSubmit={handleStart} noValidate className="space-y-4 px-6 py-5">
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }}
                    placeholder="Your full name"
                    error={errors.name}
                  />
                </div>
                <div>
                  <Label>Student ID</Label>
                  <Input
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value); setErrors((er) => ({ ...er, studentId: undefined })); }}
                    placeholder="e.g. S001"
                    error={errors.studentId}
                  />
                </div>
                <div>
                  <Label>Group</Label>
                  <Dropdown
                    options={groups.map((g) => ({ label: g, value: g }))}
                    value={group}
                    onChange={(v) => { setGroup(v); setErrors((er) => ({ ...er, group: undefined })); }}
                    placeholder="Select your group"
                    error={errors.group || (groupClosed ? "This group's access is closed." : undefined)}
                  />
                </div>
                {duplicateError && (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    {duplicateError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={groupClosed || checkingDuplicate}>
                  {checkingDuplicate ? "Checking…" : "Start quiz →"}
                </Button>
              </form>
            </div>
          )}

          {step === "answering" && question && phase !== "after" && (
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Watermark text={`${name.trim()} · ${studentId.trim().toUpperCase()}`} />
              <div className="px-6 pt-6">
                <ProgressBar current={current + 1} total={totalQ} />
              </div>
              <div className="px-6 pb-6">
                {tabSwitchCount > 0 && tabSwitchCount <= MAX_TAB_SWITCHES && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Warning: switching away from this tab isn&apos;t allowed during the quiz
                    ({tabSwitchCount} of {MAX_TAB_SWITCHES}).{" "}
                    {tabSwitchCount === MAX_TAB_SWITCHES
                      ? "Doing it once more submits your quiz automatically."
                      : "Repeated switching will submit your quiz automatically."}
                  </div>
                )}
                {/* Question content is not selectable/copyable — deters lifting
                    questions to share or search elsewhere. This can't stop a
                    screenshot or a second device photographing the screen —
                    no website can block those — only copy/select via the page. */}
                <div
                  className="select-none"
                  onCopy={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {current + 1}
                    </span>
                    <div>
                      <p className="pt-0.5 text-base font-medium leading-relaxed text-foreground">{question.text}</p>
                      {question.isBonus && (
                        <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Bonus · optional
                        </span>
                      )}
                    </div>
                  </div>
                  {question.type === "multi-select" && (
                    <p className="mb-3 text-xs font-medium text-slate-400">
                      Select exactly {question.correctIndexes.length}
                      {(() => {
                        const picked = ((answers[question.id] as number[] | undefined) ?? []).length;
                        return picked > 0 ? ` (${picked} selected)` : "";
                      })()}
                    </p>
                  )}
                  {question.codeBlock && (
                    <div className="mb-4">
                      <CodeBlock code={question.codeBlock.value} label={question.codeBlock.language ?? "SQL"} />
                    </div>
                  )}
                  {question.type !== "short-answer" && (
                    <div className="space-y-2.5">
                      {question.options.map((opt, idx) => {
                        const selected = ((answers[question.id] as number[] | undefined) ?? []).includes(idx);
                        return (
                          <button key={idx} type="button" onClick={() => toggleChoice(question, idx)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${selected ? "border-brand bg-brand-tint font-medium text-brand shadow-sm" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${selected ? "border-brand bg-brand text-white" : "border-slate-300 text-slate-400"}`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {question.type === "short-answer" && (
                  <Input value={(answers[question.id] as string) ?? ""} onChange={(e) => setAnswer(question.id, e.target.value)} placeholder="Type your answer…" />
                )}
                <div className="mt-6 flex items-center justify-between">
                  <button type="button" onClick={() => setCurrent((c) => Math.max(c - 1, 0))} disabled={current === 0}
                    className="text-sm font-medium text-slate-400 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-0">
                    ← Back
                  </button>
                  <Button onClick={handleNext} disabled={!canAdvance}>
                    {current < totalQ - 1
                      ? "Next →"
                      : question.isBonus && !isAnswered(question, answers[question.id])
                      ? "Skip & submit"
                      : "Submit quiz"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "incomplete" && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Time ran out</h2>
              <p className="mt-1 text-sm text-slate-500">
                You didn&apos;t answer enough of this sitting before it closed, so nothing was
                submitted. You&apos;ll get another chance at the next sitting.
              </p>
            </div>
          )}

          {step === "done" && result && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="px-6 py-10 text-center">
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${scorePct >= 70 ? "bg-emerald-50" : scorePct >= 40 ? "bg-amber-50" : "bg-rose-50"}`}>
                  <span className={`text-2xl font-bold ${scorePct >= 70 ? "text-emerald-600" : scorePct >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                    {scorePct}%
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {autoSubmitted ? "Quiz ended automatically" : "Quiz submitted"}
                </h2>
                {autoSubmitted && (
                  <p className="mt-1 text-sm text-slate-500">
                    {autoSubmitReason === "time"
                      ? "Time ran out before you finished — your answers up to that point were submitted for you."
                      : "You switched away from this tab more than twice, which isn't allowed during the quiz — your answers up to that point were submitted for you."}
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-500">
                  You scored <span className="font-semibold text-foreground">{result.score}</span> out of{" "}
                  <span className="font-semibold text-foreground">{result.maxScore}</span>
                </p>
                <p className="mt-6 text-xs text-slate-400">You can safely close this page.</p>
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-foreground">Review your answers</h3>
                <p className="mt-0.5 text-xs text-slate-400">Correct answers are highlighted in green.</p>
              </div>
              {orderedQuestions.map((q, idx) => (
                <ReviewQuestion key={q.id} question={q} index={idx} answer={answers[q.id]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
