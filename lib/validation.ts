export const STUDENT_ID_MIN_LENGTH = 5;

export function validateName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  return null;
}

export function validateStudentId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed) return "Student ID is required.";
  if (trimmed.length < STUDENT_ID_MIN_LENGTH) {
    return `Student ID must be at least ${STUDENT_ID_MIN_LENGTH} characters.`;
  }
  return null;
}

export function validateGroup(group: string): string | null {
  if (!group) return "Please select your group.";
  return null;
}

export function validateGithubLink(link: string): string | null {
  const trimmed = link.trim();
  if (!trimmed) return "GitHub repository link is required.";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "Enter a valid link (starting with http:// or https://).";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Enter a valid link (starting with http:// or https://).";
  }
  if (!/(^|\.)github\.com$/i.test(url.hostname)) {
    return "Enter a link to a GitHub repository (github.com).";
  }
  return null;
}
