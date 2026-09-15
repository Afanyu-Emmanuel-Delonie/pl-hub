"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { GroupPicker } from "@/components/admin/GroupPicker";
import { QuizScheduleFields } from "@/components/admin/QuizScheduleFields";
import { QuestionPreviewCard } from "@/components/admin/QuestionPreviewCard";
import { useQuizStore } from "@/lib/store";
import { parseQuizMarkdown, type ParsedQuestionSet } from "@/lib/quizImport";
import { kigaliInputToISO } from "@/lib/format";
import type { Quiz, QuizScheduleMode } from "@/lib/types";

type SittingConfig = {
  scheduleMode: QuizScheduleMode;
  deadline: string;
  startInput: string;
  durationMinutes: string;
};

// The first sitting defaults to TA-controlled manual, the second to
// automatic with a 12-minute duration prefilled — the pattern every
// two-sitting quiz built so far has used — but both stay fully editable.
function defaultConfig(automatic: boolean): SittingConfig {
  return {
    scheduleMode: automatic ? "automatic" : "manual",
    deadline: "",
    startInput: "",
    durationMinutes: automatic ? "12" : "",
  };
}

export default function ImportTwoSittingQuizPage() {
  const { addQuiz } = useQuizStore();

  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedQuestionSet[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [configs, setConfigs] = useState<[SittingConfig, SittingConfig]>([
    defaultConfig(false),
    defaultConfig(true),
  ]);
  const [expanded, setExpanded] = useState<[boolean, boolean]>([false, false]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; title: string }[] | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  function handleParse() {
    const result = parseQuizMarkdown(text);
    if (result.sets.length !== 2) {
      setParseError(
        result.sets.length === 0
          ? "Couldn't find any questions in that text — check it matches the expected format."
          : `Expected exactly 2 sittings (SET 1 and SET 2), found ${result.sets.length}${
              result.sets.length > 0 ? `: ${result.sets.map((s) => s.label).join(", ")}` : ""
            }. For a single quiz, use "Paste questions from text" on the New quiz page instead.`
      );
      setParsed(null);
      return;
    }
    setParseError(null);
    setParsed(result.sets);
    setTitle(result.documentTitle ?? "");
    setCreated(null);
  }

  function updateConfig(i: 0 | 1, patch: Partial<SittingConfig>) {
    setConfigs((prev) => {
      const next: [SittingConfig, SittingConfig] = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function toggleExpanded(i: 0 | 1) {
    setExpanded((prev) => {
      const next: [boolean, boolean] = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  const groupValid = groups.length === 1;
  const configsValid = configs.every((c) =>
    c.scheduleMode === "manual" ? Boolean(c.deadline) : Boolean(c.startInput) && Boolean(c.durationMinutes)
  );
  const canCreate = Boolean(parsed) && title.trim() !== "" && groupValid && configsValid && !creating;

  async function handleCreate() {
    if (!parsed || !canCreate) return;
    setCreating(true);
    setCreateError(null);
    try {
      const results: { id: string; title: string }[] = [];
      // Shared across both sittings created in this batch so the student
      // page can block someone who already took one sitting from also
      // taking the other (see Quiz.pairId).
      const pairId = `pair${Date.now()}`;
      for (let i = 0; i < parsed.length; i++) {
        const set = parsed[i];
        const config = configs[i as 0 | 1];
        const id = `q${Date.now()}${i}`;
        const quiz: Quiz = {
          id,
          title: `${title.trim()} — SET ${i + 1} (${set.label})`,
          // Automatic mode ignores `deadline`; a placeholder keeps the
          // required field happy without meaning anything for that quiz.
          deadline: config.scheduleMode === "manual" ? config.deadline : new Date().toISOString(),
          groups,
          questions: set.questions,
          closedGroups: [],
          createdAt: new Date().toISOString(),
          started: false,
          scheduleMode: config.scheduleMode,
          pairId,
          pairSitting: (i === 0 ? 1 : 2) as 1 | 2,
          ...(config.scheduleMode === "automatic"
            ? { startTime: kigaliInputToISO(config.startInput), durationMinutes: Number(config.durationMinutes) }
            : {}),
        };
        await addQuiz(quiz);
        results.push({ id, title: quiz.title });
      }
      setCreated(results);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong creating the quizzes.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/quizzes" className="text-sm text-brand hover:underline">
        ← Back to quizzes
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Import two-sitting quiz</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste a doc with a &quot;## SET 1&quot; and &quot;## SET 2&quot; section — this creates both
          quizzes at once, each with its own schedule.
        </p>
      </div>

      <Card className="space-y-3 px-5 py-5">
        <Label>Paste the quiz doc</Label>
        <Textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setParsed(null); setParseError(null); }}
          rows={10}
          placeholder={"# Quiz I — ...\n\n## SET 1 — 11:00 PM Sitting (13 Questions)\n**1. Question text.** *\n- ✅ Correct option\n- Other option"}
          className="font-mono text-xs"
        />
        {parseError && <p className="text-xs font-medium text-rose-600">{parseError}</p>}
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={handleParse} disabled={!text.trim()}>
            Parse
          </Button>
        </div>
      </Card>

      {parsed && (
        <div className="mt-6 space-y-6">
          <Card className="space-y-4 px-5 py-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Basics</h2>
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              <p className="mt-1 text-xs text-slate-400">
                Each quiz gets this title plus &quot; — SET N (sitting)&quot;.
              </p>
            </div>
            <div>
              <Label>Group <span className="text-slate-400 font-normal">(pick exactly one)</span></Label>
              <GroupPicker selected={groups} onChange={setGroups} />
              {!groupValid && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  Select exactly one group — a two-sitting doc like this is specific to one group.
                </p>
              )}
            </div>
          </Card>

          {parsed.map((set, i) => (
            <Card key={i} className="space-y-4 px-5 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">SET {i + 1} — {set.label}</h2>
                <span className="text-xs text-slate-400">{set.questions.length} questions</span>
              </div>
              <QuizScheduleFields
                scheduleMode={configs[i as 0 | 1].scheduleMode}
                onScheduleModeChange={(mode) => updateConfig(i as 0 | 1, { scheduleMode: mode })}
                deadline={configs[i as 0 | 1].deadline}
                onDeadlineChange={(v) => updateConfig(i as 0 | 1, { deadline: v })}
                startInput={configs[i as 0 | 1].startInput}
                onStartInputChange={(v) => updateConfig(i as 0 | 1, { startInput: v })}
                durationMinutes={configs[i as 0 | 1].durationMinutes}
                onDurationMinutesChange={(v) => updateConfig(i as 0 | 1, { durationMinutes: v })}
              />
              <button
                type="button"
                onClick={() => toggleExpanded(i as 0 | 1)}
                className="text-sm font-medium text-brand hover:underline"
              >
                {expanded[i] ? "Hide" : "Preview"} {set.questions.length} questions
              </button>
              {expanded[i] && (
                <div className="space-y-3">
                  {set.questions.map((q, qi) => (
                    <QuestionPreviewCard key={q.id} question={q} index={qi} />
                  ))}
                </div>
              )}
            </Card>
          ))}

          {createError && <p className="text-sm font-medium text-rose-600">{createError}</p>}

          {created ? (
            <Card className="space-y-2 px-5 py-5">
              <p className="text-sm font-medium text-emerald-700">✓ Created both quizzes</p>
              {created.map((c) => (
                <Link key={c.id} href={`/admin/quizzes/${c.id}`} className="block text-sm text-brand hover:underline">
                  {c.title} →
                </Link>
              ))}
            </Card>
          ) : (
            <div className="flex justify-end">
              <Button type="button" onClick={handleCreate} disabled={!canCreate}>
                {creating ? "Creating…" : "Create both quizzes"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
