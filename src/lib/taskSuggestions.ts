import type { ActivityValues, Entry } from "../types";

export function suggestTasks(
  query: string,
  entries: Entry[],
  excludeId = 0,
): Entry[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const seen = new Set<string>();
  return [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .filter((entry) => {
      if (
        entry.id === excludeId ||
        !terms.every((term) => entry.description.toLowerCase().includes(term))
      )
        return false;
      const key = JSON.stringify([
        entry.description.toLowerCase(),
        entry.project,
        entry.tag,
        entry.user,
      ]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export function applyTaskSuggestion(
  values: ActivityValues,
  entry: Entry,
): ActivityValues {
  return {
    ...values,
    description: entry.description,
    client: entry.client,
    project: String(entry.project),
    tag: entry.tag,
    user: entry.user,
  };
}
