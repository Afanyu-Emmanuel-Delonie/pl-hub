import type { ContentBlock } from "./types";

export type ParsedAssignmentMarkdown = {
  title?: string;
  maxScore?: number;
  instructions: string[];
  blocks: ContentBlock[];
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

type Section = null | "instructions" | "content";

// Parses a pasted assignment doc into title/instructions/content blocks.
// Expected shape:
//   # Assignment title
//   Max score: 20
//
//   ## Instructions
//   - Name your repo assignment_1_your_name
//   - Push before the deadline
//
//   ## Content
//   Narrative/scenario paragraph text.
//
//   ```sql
//   CREATE TABLE customers (...);
//   ```
//
//   ### Question title
//   1. Sub-question one
//   2. Sub-question two
//
// Only "## Instructions" and "## Content" are recognized section headings;
// everything else (a "# " title line, a "Max score:" line, blank lines) is
// handled specially or ignored, so the source doc doesn't need cleanup
// before pasting. Deadlines and groups aren't part of this format — those
// stay TA-set fields on the create/edit form after import.
export function parseAssignmentMarkdown(text: string): ParsedAssignmentMarkdown {
  const lines = text.split(/\r?\n/);
  const instructions: string[] = [];
  const blocks: ContentBlock[] = [];

  let title: string | undefined;
  let maxScore: number | undefined;
  let section: Section = null;
  let paragraph: string[] = [];
  let inFence = false;
  let fenceLanguage: string | undefined;
  let fenceLines: string[] = [];
  let currentQuestion: (ContentBlock & { type: "question" }) | null = null;

  function flushParagraph() {
    const value = paragraph.join(" ").trim();
    paragraph = [];
    currentQuestion = null;
    if (value) blocks.push({ id: uid(), type: "text", value });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Fenced code blocks take priority over every other rule, including
    // blank-line handling, so SQL containing blank lines round-trips intact.
    if (inFence) {
      if (/^```/.test(line)) {
        blocks.push({
          id: uid(),
          type: "code",
          value: fenceLines.join("\n"),
          ...(fenceLanguage ? { language: fenceLanguage } : {}),
        });
        inFence = false;
        fenceLanguage = undefined;
        fenceLines = [];
        currentQuestion = null;
      } else {
        fenceLines.push(rawLine);
      }
      continue;
    }

    const fenceStart = line.match(/^```\s*([A-Za-z0-9]*)\s*$/);
    if (fenceStart) {
      flushParagraph();
      inFence = true;
      fenceLanguage = fenceStart[1] ? fenceStart[1].toUpperCase() : undefined;
      fenceLines = [];
      continue;
    }

    if (!title) {
      const titleMatch = line.match(/^#\s+(.+)$/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        continue;
      }
    }

    if (maxScore === undefined) {
      const maxScoreMatch = line.match(/^max\s*score\s*:?\s*(\d+)/i);
      if (maxScoreMatch) {
        maxScore = Number(maxScoreMatch[1]);
        continue;
      }
    }

    if (/^##\s+instructions/i.test(line)) {
      flushParagraph();
      section = "instructions";
      continue;
    }
    if (/^##\s+content/i.test(line)) {
      flushParagraph();
      section = "content";
      continue;
    }

    if (section === "instructions") {
      const bulletMatch = line.match(/^(?:[-*]|\d+[.)])\s*(.+)$/);
      if (bulletMatch) instructions.push(bulletMatch[1].trim());
      continue;
    }

    if (section === "content") {
      if (line === "") {
        flushParagraph();
        continue;
      }

      const questionHeadingMatch = line.match(/^###\s+(.+)$/);
      if (questionHeadingMatch) {
        flushParagraph();
        const heading = questionHeadingMatch[1].trim().replace(/^question\s*\d*\s*[:.-]?\s*/i, "");
        currentQuestion = { id: uid(), type: "question", text: heading, subQuestions: [] };
        blocks.push(currentQuestion);
        continue;
      }

      const subQuestionMatch = currentQuestion ? line.match(/^\d+[.)]\s*(.+)$/) : null;
      if (subQuestionMatch) {
        currentQuestion!.subQuestions.push(subQuestionMatch[1].trim());
        continue;
      }

      // Plain text while a question is "active" ends it — anything after is
      // a new paragraph, not another sub-question.
      currentQuestion = null;
      paragraph.push(line);
    }
  }
  flushParagraph();

  return { title, maxScore, instructions, blocks };
}
