"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";

// Archived quizzes have had their question list deleted to free up space,
// but their student responses (the actual marks) were never touched — this
// is where those marks are still browsable after the quiz itself is gone.
export default function QuizArchivePage() {
  const { quizArchive, quizResponses, deleteQuizResponse } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [responseToDelete, setResponseToDelete] = useState<{ id: string; studentName: string } | null>(null);

  const sorted = useMemo(
    () => [...quizArchive].sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()),
    [quizArchive]
  );

  const responsesByQuiz = useMemo(() => {
    const map = new Map<string, typeof quizResponses>();
    for (const r of quizResponses) {
      const list = map.get(r.quizId) ?? [];
      list.push(r);
      map.set(r.quizId, list);
    }
    for (const list of map.values()) list.sort((a, b) => b.score / b.maxScore - a.score / a.maxScore);
    return map;
  }, [quizResponses]);

  function confirmDeleteResponse() {
    if (!responseToDelete) return;
    deleteQuizResponse(responseToDelete.id);
    setResponseToDelete(null);
  }

  return (
    <div>
      <Link href="/admin/quizzes" className="text-sm text-brand hover:underline">
        ← Back to quizzes
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Archived quizzes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quizzes deleted to free up space. Their questions are gone, but every recorded response
          stays here and keeps counting toward CA.
        </p>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <p className="px-5 py-12 text-center text-sm text-slate-400">No archived quizzes yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((record) => {
            const responses = responsesByQuiz.get(record.id) ?? [];
            const isOpen = openId === record.id;
            return (
              <Card key={record.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : record.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/60"
                >
                  <div>
                    <p className="font-medium text-foreground">{record.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {record.groups.length === 0 ? "All groups" : record.groups.join(", ")}
                      {" · "}
                      {record.maxScore} points · archived {formatDate(record.archivedAt)}
                    </p>
                  </div>
                  <Badge variant="neutral">{responses.length} response{responses.length !== 1 ? "s" : ""}</Badge>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100">
                    {responses.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-slate-400">No responses recorded.</p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-3 font-medium">Student</th>
                            <th className="px-5 py-3 font-medium">Group</th>
                            <th className="px-5 py-3 font-medium">Score</th>
                            <th className="px-5 py-3 font-medium">Submitted</th>
                            <th className="px-5 py-3 font-medium" />
                          </tr>
                        </thead>
                        <tbody>
                          {responses.map((r) => (
                            <tr key={r.id} className="border-b border-slate-50 last:border-0">
                              <td className="px-5 py-3 font-medium text-foreground">{r.studentName}</td>
                              <td className="px-5 py-3 text-slate-500">{r.group}</td>
                              <td className="px-5 py-3 tabular-nums text-foreground">{r.score}/{r.maxScore}</td>
                              <td className="px-5 py-3 text-slate-500">
                                {formatDate(r.submittedAt)}
                                {r.late && <span className="ml-2"><Badge variant="warning">Late</Badge></span>}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setResponseToDelete({ id: r.id, studentName: r.studentName })}
                                  className="text-slate-400 hover:text-red-500"
                                  aria-label="Delete response"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!responseToDelete} onClose={() => setResponseToDelete(null)} title="Delete response?">
        <p className="text-sm text-slate-600">
          Delete {responseToDelete?.studentName}&apos;s response? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResponseToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteResponse}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
