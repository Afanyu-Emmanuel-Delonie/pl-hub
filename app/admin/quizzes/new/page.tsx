"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { GroupPicker } from "@/components/admin/GroupPicker";
import { QuizScheduleFields } from "@/components/admin/QuizScheduleFields";
import { QuizImportPanel } from "@/components/admin/QuizImportPanel";
import { QuestionEditor, emptyQuestion } from "@/components/admin/QuestionEditor";
import { useQuizStore } from "@/lib/store";
import { kigaliInputToISO } from "@/lib/format";
import type { Quiz, QuizQuestion, QuizScheduleMode } from "@/lib/types";

export default function NewQuizPage() {
  const router = useRouter();
  const { addQuiz } = useQuizStore();

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [scheduleMode, setScheduleMode] = useState<QuizScheduleMode>("manual");
  const [startInput, setStartInput] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Generated client-side only — emptyQuestion()'s random id would otherwise
  // mismatch between the statically prerendered HTML and the client render.
  useEffect(() => {
    setQuestions((prev) => (prev.length === 0 ? [emptyQuestion()] : prev));
  }, []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) return;
    if (scheduleMode === "manual" && !deadline) return;
    if (scheduleMode === "automatic" && (!startInput || !durationMinutes)) return;

    const id = `q${Date.now()}`;
    const quiz: Quiz = {
      id,
      title: title.trim(),
      // Automatic-mode quizzes don't use `deadline`/`started` at all, but a
      // placeholder deadline keeps older code (and Quiz's required field)
      // happy without meaning anything for how the quiz actually opens/closes.
      deadline: scheduleMode === "manual" ? deadline : new Date().toISOString(),
      groups,
      questions,
      closedGroups: [],
      createdAt: new Date().toISOString(),
      started: false,
      scheduleMode,
      ...(scheduleMode === "automatic"
        ? { startTime: kigaliInputToISO(startInput), durationMinutes: Number(durationMinutes) }
        : {}),
    };

    addQuiz(quiz);
    router.push(`/admin/quizzes/${id}`);
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/quizzes" className="text-sm text-brand hover:underline">
        ← Back to quizzes
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New quiz</h1>
        <p className="mt-1 text-sm text-slate-500">
          Build questions with multiple choice, multi-select, true/false, or short answer.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        <Card className="space-y-4 px-5 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Basics</h2>
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz 3 — Transactions"
              required
            />
          </div>
          <QuizScheduleFields
            scheduleMode={scheduleMode}
            onScheduleModeChange={setScheduleMode}
            deadline={deadline}
            onDeadlineChange={setDeadline}
            startInput={startInput}
            onStartInputChange={setStartInput}
            durationMinutes={durationMinutes}
            onDurationMinutesChange={setDurationMinutes}
          />
          <div>
            <Label>Groups <span className="text-slate-400 font-normal">(empty = all groups)</span></Label>
            <GroupPicker selected={groups} onChange={setGroups} />
          </div>
        </Card>

        {/* Questions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Questions
            </h2>
          </div>

          <div className="mb-3">
            <QuizImportPanel
              onImport={setQuestions}
              onTitleSuggestion={(suggested) => setTitle((t) => (t.trim() ? t : suggested))}
            />
          </div>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                index={i}
                question={q}
                removable={questions.length > 1}
                onChange={(updated) =>
                  setQuestions((prev) => prev.map((p) => (p.id === q.id ? updated : p)))
                }
                onRemove={() =>
                  setQuestions((prev) => prev.filter((p) => p.id !== q.id))
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
            className="mt-4 text-sm font-medium text-brand hover:underline"
          >
            + Add question
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/admin/quizzes">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit">Create quiz</Button>
        </div>
      </form>
    </div>
  );
}
