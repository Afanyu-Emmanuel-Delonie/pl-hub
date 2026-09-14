import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Assignment, AssignmentSubmission } from "./types";
import { formatDate } from "./format";

export function exportAssignmentPdf(
  assignment: Assignment,
  submissions: AssignmentSubmission[]
) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(assignment.title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleString()} · ${submissions.length} submissions`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [["Student", "ID", "Group", "GitHub", "Submitted", "Score", "Comment"]],
    body: submissions.map((s) => [
      s.studentName,
      s.studentId,
      s.group,
      s.githubLink,
      formatDate(s.submittedAt) + (s.late ? " (late)" : ""),
      s.score !== null ? `${s.score}/${s.maxScore}` : "—",
      s.comment || "",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 50, 98] },
    columnStyles: { 3: { cellWidth: 32 }, 6: { cellWidth: 32 } },
  });

  const filename = assignment.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${filename}.pdf`);
}
