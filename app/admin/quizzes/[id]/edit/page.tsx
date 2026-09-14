"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { GroupPicker } from "@/components/admin/GroupPicker";
import { QuestionEditor, emptyQuestion } from "@/components/admin/QuestionEditor";
import { useQuizStore } from "@/lib/store";
import type { QuizQuestion } from "@/lib/types";

export default function EditQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { quizzes, updateQuiz } = useQuizStore();

  const quiz = useMemo(() => quizzes.find((q) => q.id === params.id), [quizzes, params.id]);

  const [title, setTitle] = useState(quiz?.title ?? "");
  const [deadline, setDeadline] = useState(quiz?.deadline ?? "");
  const [groups, setGroups] = useState<string[]>(quiz?.groups ?? []);
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz?.questions ?? []);

  // Generated client-side only — emptyQuestion()'s random id would otherwise
  // mismatch between server and client render for a quiz with no questions yet.
  useEffect(() => {
    setQuestions((prev) => (prev.length === 0 ? [emptyQuestion()] : prev));
  }, []);

  if (!quiz) {
    return (
      <div>
        <Link href="/admin/quizzes" className="text-sm text-brand hover:underline">
          ← Back to quizzes
        </Link>
        <p className="mt-4 text-sm text-slate-500">Quiz not found.</p>
      </div>
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline || questions.length === 0) return;

    updateQuiz({
      ...quiz!,
      title: title.trim(),
      deadline,
      groups,
      questions,
    });

    router.push(`/admin/quizzes/${quiz!.id}`);
  }

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/quizzes/${quiz.id}`} className="text-sm text-brand hover:underline">
        ← Back to quiz
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit quiz</h1>
        <p className="mt-1 text-sm text-slate-500">{quiz.title}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-4 px-5 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Basics</h2>
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Deadline</Label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="max-w-xs"
              required
            />
          </div>
          <div>
            <Label>Groups <span className="text-slate-400 font-normal">(empty = all groups)</span></Label>
            <GroupPicker selected={groups} onChange={setGroups} />
          </div>
        </Card>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Questions
          </h2>
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
          <Link href={`/admin/quizzes/${quiz.id}`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
