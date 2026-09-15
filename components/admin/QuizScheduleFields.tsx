"use client";

import { Input, Label } from "@/components/ui/Field";
import type { QuizScheduleMode } from "@/lib/types";

const MODES: { value: QuizScheduleMode; label: string; description: string }[] = [
  { value: "manual", label: "Manual", description: "You click \"Start quiz\" and \"End quiz\" yourself." },
  { value: "automatic", label: "Automatic", description: "Opens and closes itself on a timer — no action needed." },
];

export function QuizScheduleFields({
  scheduleMode,
  onScheduleModeChange,
  deadline,
  onDeadlineChange,
  startInput,
  onStartInputChange,
  durationMinutes,
  onDurationMinutesChange,
}: {
  scheduleMode: QuizScheduleMode;
  onScheduleModeChange: (mode: QuizScheduleMode) => void;
  deadline: string;
  onDeadlineChange: (value: string) => void;
  startInput: string;
  onStartInputChange: (value: string) => void;
  durationMinutes: string;
  onDurationMinutesChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Scheduling</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onScheduleModeChange(m.value)}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
              scheduleMode === m.value
                ? "border-brand bg-brand-tint"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className={`text-sm font-medium ${scheduleMode === m.value ? "text-brand" : "text-foreground"}`}>
              {m.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{m.description}</p>
          </button>
        ))}
      </div>

      {scheduleMode === "manual" ? (
        <div className="max-w-xs">
          <Label>Deadline</Label>
          <Input
            type="datetime-local"
            value={deadline}
            onChange={(e) => onDeadlineChange(e.target.value)}
            required
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Start time</Label>
            <Input
              type="datetime-local"
              value={startInput}
              onChange={(e) => onStartInputChange(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-slate-400">Interpreted as Kigali time (UTC+2).</p>
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => onDurationMinutesChange(e.target.value)}
              placeholder="e.g. 12"
              required
            />
            <div className="mt-1.5 flex gap-1.5">
              {[12, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onDurationMinutesChange(String(mins))}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
