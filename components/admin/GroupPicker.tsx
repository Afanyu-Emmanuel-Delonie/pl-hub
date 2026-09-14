"use client";

import { useStore } from "@/lib/store";

export function GroupPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (groups: string[]) => void;
}) {
  const { groups } = useStore();
  const allSelected = selected.length === 0;

  function toggle(group: string) {
    if (selected.includes(group)) {
      onChange(selected.filter((g) => g !== group));
    } else {
      onChange([...selected, group]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange([])}
        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
          allSelected
            ? "border-brand bg-brand-tint text-brand"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        All groups
      </button>
      {groups.map((group) => {
        const active = selected.includes(group);
        return (
          <button
            type="button"
            key={group}
            onClick={() => toggle(group)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand bg-brand-tint text-brand"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {group}
          </button>
        );
      })}
    </div>
  );
}
