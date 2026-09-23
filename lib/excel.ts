import type {
  Assignment,
  AssignmentSubmission,
  BonusAward,
  Quiz,
  QuizArchiveRecord,
  QuizResponse,
  Student,
} from "./types";
import { buildGroupLabels } from "./groups";

// Excel sheet names: max 31 chars, none of  \ / ? * [ ] :  and must be unique (case-insensitive).
function sheetName(group: string, used: Set<string>): string {
  const base = group.replace(/[\\/?*[\]:]/g, "-").trim().slice(0, 31) || "Group";
  let name = base;
  for (let i = 2; used.has(name.toLowerCase()); i++) {
    const suffix = ` (${i})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(name.toLowerCase());
  return name;
}

function download(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Student IDs are typed by hand, so "s001 " and "S001" are the same person.
const normId = (id: string) => id.trim().toUpperCase();

type Column = { id: string; title: string; max: number; createdAt: string };

/**
 * One workbook, one tab per group. Each tab lists that group's students with a
 * column per assignment (in the order they were created) and a total.
 * Pass `quizzes`/`quizResponses` to add the quiz columns and an overall total too.
 * Spellings of the same group ("Friday Group D" / "Group D") share one tab, and
 * a student is one row however many times they appear.
 */
export async function exportMarksXlsx({
  assignments,
  submissions,
  quizzes,
  quizResponses = [],
  quizArchive = [],
  bonusAwards = [],
  students,
  groups,
  filename,
}: {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  quizzes?: Quiz[];
  quizResponses?: QuizResponse[];
  quizArchive?: QuizArchiveRecord[];
  bonusAwards?: BonusAward[];
  students: Student[];
  groups: string[];
  filename: string;
}) {
  // Loaded on demand — exceljs is large and only needed when exporting.
  const mod = await import("exceljs");
  const ExcelJS = mod.default ?? mod;
  const withQuizzes = quizzes !== undefined;

  const byDate = (a: Column, b: Column) => a.createdAt.localeCompare(b.createdAt);
  const aCols: Column[] = assignments
    .map((a) => ({ id: a.id, title: a.title, max: a.maxScore, createdAt: a.createdAt }))
    .sort(byDate);
  // Deleted quizzes live on as archive records so their marks still show up.
  const qCols: Column[] = withQuizzes
    ? [
        ...quizzes.map((q) => ({
          id: q.id,
          title: q.title,
          max: q.questions.reduce((sum, x) => sum + x.points, 0),
          createdAt: q.createdAt,
        })),
        ...quizArchive
          .filter((r) => !quizzes.some((q) => q.id === r.id))
          .map((r) => ({ id: r.id, title: r.title, max: r.maxScore, createdAt: r.createdAt })),
      ].sort(byDate)
    : [];

  const aIds = new Set(aCols.map((c) => c.id));
  const qIds = new Set(qCols.map((c) => c.id));
  const subs = submissions.filter((s) => aIds.has(s.assignmentId));
  const resps = quizResponses.filter((r) => qIds.has(r.quizId));

  const groupLabel = buildGroupLabels([
    ...groups,
    ...students.map((s) => s.group),
    ...subs.map((s) => s.group),
    ...resps.map((r) => r.group),
  ]);

  // Roster first, then anyone who submitted/responded without being on it.
  const roster = new Map<string, { id: string; name: string; group: string }>();
  const addPerson = (id: string, name: string, group: string) => {
    const key = normId(id);
    if (!roster.has(key)) roster.set(key, { id: id.trim(), name, group: groupLabel(group) });
  };
  students.forEach((s) => addPerson(s.id, s.name, s.group));
  subs.forEach((s) => addPerson(s.studentId, s.studentName, s.group));
  resps.forEach((r) => addPerson(r.studentId, r.studentName, r.group));

  // Best mark wins if a student somehow has two entries for the same item.
  const aScore = new Map<string, AssignmentSubmission>();
  for (const s of subs) {
    const k = `${normId(s.studentId)}|${s.assignmentId}`;
    const prev = aScore.get(k);
    if (!prev || (s.score ?? -1) > (prev.score ?? -1)) aScore.set(k, s);
  }
  const qScore = new Map<string, number>();
  for (const r of resps) {
    const k = `${normId(r.studentId)}|${r.quizId}`;
    qScore.set(k, Math.max(qScore.get(k) ?? 0, r.score));
  }
  const bonusById = new Map<string, number>();
  for (const b of bonusAwards) {
    const k = normId(b.studentId);
    bonusById.set(k, (bonusById.get(k) ?? 0) + b.points);
  }

  const sumMax = (cols: Column[]) => cols.reduce((sum, c) => sum + c.max, 0);
  const groupNames = Array.from(new Set(Array.from(roster.values()).map((p) => p.group))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const wb = new ExcelJS.Workbook();
  const used = new Set<string>();
  const colWidth = (title: string) => Math.max(14, Math.min(28, title.length + 6));

  for (const group of groupNames) {
    const members = Array.from(roster.entries())
      .filter(([, p]) => p.group === group)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name));

    const ws = wb.addWorksheet(sheetName(group, used), { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
    ws.columns = [
      { header: "Student ID", key: "id", width: 16 },
      { header: "Name", key: "name", width: 28 },
      ...aCols.map((c) => ({ header: `${c.title} (/${c.max})`, key: `a:${c.id}`, width: colWidth(c.title) })),
      ...qCols.map((c) => ({ header: `${c.title} (/${c.max})`, key: `q:${c.id}`, width: colWidth(c.title) })),
      ...(withQuizzes
        ? [
            { header: `Assignments (/${sumMax(aCols)})`, key: "aTotal", width: 16 },
            { header: `Quizzes (/${sumMax(qCols)})`, key: "qTotal", width: 14 },
            { header: "Bonus", key: "bonus", width: 10 },
            { header: `Overall (/${sumMax(aCols) + sumMax(qCols)})`, key: "total", width: 16 },
          ]
        : [{ header: `Total (/${sumMax(aCols)})`, key: "total", width: 14 }]),
    ];

    for (const [nid, person] of members) {
      const row: Record<string, string | number> = { id: person.id, name: person.name };
      let aTotal = 0;
      let qTotal = 0;
      for (const c of aCols) {
        const sub = aScore.get(`${nid}|${c.id}`);
        if (!sub) row[`a:${c.id}`] = "Not submitted";
        else if (sub.score === null) row[`a:${c.id}`] = "Ungraded";
        else {
          row[`a:${c.id}`] = sub.score;
          aTotal += sub.score;
        }
      }
      for (const c of qCols) {
        const score = qScore.get(`${nid}|${c.id}`);
        if (score === undefined) row[`q:${c.id}`] = "Not taken";
        else {
          row[`q:${c.id}`] = score;
          qTotal += score;
        }
      }
      const bonus = bonusById.get(nid) ?? 0;
      if (withQuizzes) {
        row.aTotal = aTotal;
        row.qTotal = qTotal;
        row.bonus = bonus;
        row.total = aTotal + qTotal + bonus;
      } else {
        row.total = aTotal;
      }
      ws.addRow(row);
    }

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003262" } };
    header.alignment = { vertical: "middle", wrapText: true };
    const totalsFrom = withQuizzes ? ws.columnCount - 3 : ws.columnCount;
    ws.eachRow((row, n) => {
      row.eachCell((cell, c) => {
        if (n === 1 || c <= 2) return;
        cell.alignment = { horizontal: "center" };
        if (c >= totalsFrom) cell.font = { bold: true };
      });
    });
  }

  if (wb.worksheets.length === 0) wb.addWorksheet("No data");

  download((await wb.xlsx.writeBuffer()) as ArrayBuffer, filename);
}
