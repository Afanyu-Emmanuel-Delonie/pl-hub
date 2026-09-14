"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { GroupMultiSelect } from "@/components/admin/GroupMultiSelect";
import { useStore } from "@/lib/store";
import type { ContentBlock, GroupDeadline } from "@/lib/types";
import { AlignLeft, Code2, HelpCircle, GripVertical, X, Plus } from "lucide-react";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function BlockShell({
  label,
  icon: Icon,
  onRemove,
  children,
}: {
  label: string;
  icon: React.ElementType;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <GripVertical className="h-3.5 w-3.5" />
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <button type="button" onClick={onRemove} className="text-slate-300 hover:text-rose-500 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

export default function EditAssignmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { assignments, updateAssignment } = useStore();

  const assignment = useMemo(() => assignments.find((a) => a.id === params.id), [assignments, params.id]);

  const [title, setTitle] = useState(assignment?.title ?? "");
  const [instructions, setInstructions] = useState<string[]>(
    assignment?.instructions.length ? assignment.instructions : [""]
  );
  const [maxScore, setMaxScore] = useState(assignment?.maxScore ?? 20);
  const [blocks, setBlocks] = useState<ContentBlock[]>(assignment?.content ?? []);
  const [deadlines, setDeadlines] = useState<GroupDeadline[]>(
    assignment?.deadlines.length ? assignment.deadlines : [{ groups: [], deadline: "" }]
  );

  if (!assignment) {
    return (
      <div>
        <Link href="/admin/assignments" className="text-sm text-brand hover:underline">
          ← Back to assignments
        </Link>
        <p className="mt-4 text-sm text-slate-500">Assignment not found.</p>
      </div>
    );
  }

  // --- block helpers ---
  function addBlock(type: ContentBlock["type"]) {
    const base = { id: uid() };
    const block: ContentBlock =
      type === "text"
        ? { ...base, type: "text", value: "" }
        : type === "code"
        ? { ...base, type: "code", value: "", language: "SQL" }
        : { ...base, type: "question", text: "", subQuestions: [""] };
    setBlocks((prev) => [...prev, block]);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function updateBlock(id: string, patch: Partial<ContentBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b))
    );
  }

  function updateSubQuestion(blockId: string, idx: number, value: string) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "question") return b;
        return { ...b, subQuestions: b.subQuestions.map((q, i) => (i === idx ? value : q)) };
      })
    );
  }

  function addSubQuestion(blockId: string) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "question") return b;
        return { ...b, subQuestions: [...b.subQuestions, ""] };
      })
    );
  }

  function removeSubQuestion(blockId: string, idx: number) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId || b.type !== "question") return b;
        return { ...b, subQuestions: b.subQuestions.filter((_, i) => i !== idx) };
      })
    );
  }

  function updateDeadline(index: number, patch: Partial<GroupDeadline>) {
    setDeadlines((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;
    const validDeadlines = deadlines.filter((d) => d.groups.length > 0 && d.deadline);
    if (!title.trim() || validDeadlines.length === 0) return;

    await updateAssignment({
      ...assignment,
      title: title.trim(),
      instructions: instructions.map((p) => p.trim()).filter(Boolean),
      maxScore,
      content: blocks,
      deadlines: validDeadlines,
    });

    router.push(`/admin/assignments/${assignment.id}`);
  }

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/assignments/${assignment.id}`} className="text-sm text-brand hover:underline">
        ← Back to assignment
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit assignment</h1>
        <p className="mt-1 text-sm text-slate-500">{assignment.title}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-4 px-5 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Basics</h2>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Max score</Label>
            <Input
              type="number"
              min={1}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              className="w-32"
              required
            />
          </div>
        </Card>

        <Card className="px-5 py-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Instructions</h2>
          <div className="space-y-2">
            {instructions.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                <Input
                  value={point}
                  onChange={(e) =>
                    setInstructions((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))
                  }
                  placeholder="e.g. Name your repo assignment_1_your_name"
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setInstructions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="mt-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setInstructions((prev) => [...prev, ""])}
            className="mt-3 text-sm font-medium text-brand hover:underline"
          >
            + Add point
          </button>
        </Card>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Content</h2>
          <div className="space-y-3">
            {blocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                No blocks yet — add text, code, or questions below.
              </div>
            )}
            {blocks.map((block) => {
              if (block.type === "text") {
                return (
                  <BlockShell key={block.id} label="Text" icon={AlignLeft} onRemove={() => removeBlock(block.id)}>
                    <Textarea
                      value={block.value}
                      onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                      rows={4}
                      placeholder="Describe the scenario, context, or any narrative..."
                    />
                  </BlockShell>
                );
              }
              if (block.type === "code") {
                return (
                  <BlockShell key={block.id} label="Code" icon={Code2} onRemove={() => removeBlock(block.id)}>
                    <div className="mb-2 flex items-center gap-2">
                      <Input
                        value={block.language ?? "SQL"}
                        onChange={(e) => updateBlock(block.id, { language: e.target.value })}
                        placeholder="SQL"
                        className="w-28 text-xs"
                      />
                      <span className="text-xs text-slate-400">language label</span>
                    </div>
                    <Textarea
                      value={block.value}
                      onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                      rows={8}
                      placeholder={"CREATE TABLE ..."}
                      className="font-mono text-xs"
                    />
                  </BlockShell>
                );
              }
              if (block.type === "question") {
                return (
                  <BlockShell key={block.id} label="Question" icon={HelpCircle} onRemove={() => removeBlock(block.id)}>
                    <div className="mb-3">
                      <Input
                        value={block.text}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        placeholder="Question title, e.g. Basic Joins"
                      />
                    </div>
                    <div className="space-y-2">
                      {block.subQuestions.map((sq, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="mt-2.5 w-5 shrink-0 text-center text-xs font-medium text-slate-400">
                            {idx + 1}.
                          </span>
                          <Textarea
                            value={sq}
                            onChange={(e) => updateSubQuestion(block.id, idx, e.target.value)}
                            rows={2}
                            placeholder="Sub-question..."
                          />
                          {block.subQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubQuestion(block.id, idx)}
                              className="mt-2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addSubQuestion(block.id)}
                      className="mt-3 text-sm font-medium text-brand hover:underline"
                    >
                      + Add sub-question
                    </button>
                  </BlockShell>
                );
              }
            })}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="mr-1 text-xs text-slate-400">Add block:</span>
            {(["text", "code", "question"] as const).map((type) => {
              const Icon = type === "text" ? AlignLeft : type === "code" ? Code2 : HelpCircle;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 capitalize hover:border-brand hover:text-brand transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" /> {type}
                </button>
              );
            })}
          </div>
        </div>

        <Card className="space-y-4 px-5 py-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Deadlines by group</h2>
            <p className="mt-1 text-xs text-slate-400">Different groups can have different deadlines.</p>
          </div>
          <div className="space-y-4">
            {deadlines.map((d, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Deadline {i + 1}</p>
                  {deadlines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDeadlines((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs font-medium text-slate-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="mb-3">
                  <GroupMultiSelect
                    selected={d.groups}
                    onChange={(groups) => updateDeadline(i, { groups })}
                  />
                </div>
                <Input
                  type="datetime-local"
                  value={d.deadline}
                  onChange={(e) => updateDeadline(i, { deadline: e.target.value })}
                  className="max-w-xs"
                  required
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDeadlines((prev) => [...prev, { groups: [], deadline: "" }])}
            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add another deadline
          </button>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href={`/admin/assignments/${assignment.id}`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
