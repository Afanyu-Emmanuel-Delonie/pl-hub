const DAY_WORDS =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thur?s?|fri|sat|sun)\b\.?/gi;

// The same group shows up under several spellings ("Friday Group D", "Group D",
// "group-d") depending on how it was typed or which session it was picked from.
// `key` is what identifies the group; `label` is the readable name to show.
export function canonicalGroup(name: string): { key: string; label: string } {
  const stripped = name
    .replace(DAY_WORDS, " ")
    .replace(/[\s\-–—,:;()/]+/g, " ")
    .trim();
  // A group literally named "Friday" would strip to nothing — keep it as typed.
  const label = stripped || name.trim();
  return { key: label.toLowerCase().replace(/[^a-z0-9]/g, ""), label };
}

// Maps every spelling in `names` to one label per canonical group. Earlier names
// win the label, so pass the official group list first.
export function buildGroupLabels(names: string[]): (name: string) => string {
  const byKey = new Map<string, string>();
  for (const n of names) {
    const { key, label } = canonicalGroup(n);
    if (!byKey.has(key)) byKey.set(key, label);
  }
  return (name) => {
    const { key, label } = canonicalGroup(name);
    return byKey.get(key) ?? label;
  };
}
