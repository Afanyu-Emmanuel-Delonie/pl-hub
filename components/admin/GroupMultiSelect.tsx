"use client";

import { useStore } from "@/lib/store";

export function GroupMultiSelect({
  selected,
  onChange,
  options,
  variant = "default",
}: {
  selected: string[];
  onChange: (groups: string[]) => void;
  options?: string[];
  variant?: "default" | "danger";
}) {
  const { groups } = useStore();
  const list = options ?? groups;
  function toggle(group: string) {
    if (selected.includes(group)) {
      onChange(selected.filter((g) => g !== group));
    } else {
      onChange([...selected, group]);
    }
  }

  const activeClasses =
    variant === "danger"
      ? "border-rose-400 bg-rose-50 text-rose-600"
      : "border-brand bg-brand-tint text-brand";

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((group) => {
        const active = selected.includes(group);
        return (
          <button
            type="button"
            key={group}
            onClick={() => toggle(group)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? activeClasses : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {group}
          </button>
        );
      })}
    </div>
  );
}
