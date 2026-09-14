"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { GroupPicker } from "@/components/admin/GroupPicker";
import { QuestionEditor, emptyQuestion } from "@/components/admin/QuestionEditor";
import { addQuiz } from "@/lib/mock-data";
import type { Quiz, QuizQuestion } from "@/lib/types";

export default function NewQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline || questions.length === 0) return;

    const id = `q${Date.now()}`;
    const quiz: Quiz = {
      id,
      title: title.trim(),
      deadline,
      groups,
      questions,
      closed: false,
      createdAt: new Date().toISOString(),
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Deadline</Label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>Groups <span className="text-slate-400 font-normal">(empty = all groups)</span></Label>
            <GroupPicker selected={groups} onChange={setGroups} />
          </div>
        </Card>

        {/* Questions */}
        <div>
          <div className="mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Questions
            </h2>
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
