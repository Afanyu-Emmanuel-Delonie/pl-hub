import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import type { Assignment } from "@/lib/types";

export function AssignmentBody({ assignment }: { assignment: Assignment }) {
  return (
    <div className="space-y-5">
      {assignment.instructions.length > 0 && (
        <Card className="px-5 py-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Instructions
          </h2>
          <ul className="space-y-1.5">
            {assignment.instructions.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                {point}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {assignment.content.map((block) => {
        if (block.type === "text") {
          return (
            <Card key={block.id} className="px-5 py-5">
              <p className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">
                {block.value}
              </p>
            </Card>
          );
        }
        if (block.type === "code") {
          return (
            <Card key={block.id} className="px-5 py-5">
              <CodeBlock code={block.value} label={block.language ?? "SQL"} />
            </Card>
          );
        }
        if (block.type === "question") {
          return (
            <Card key={block.id} className="px-5 py-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{block.text}</h3>
              <ol className="space-y-3">
                {block.subQuestions.map((sq, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-brand">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-sm text-slate-600 leading-relaxed">{sq}</p>
                  </li>
                ))}
              </ol>
            </Card>
          );
        }
        return null;
      })}
    </div>
  );
}
