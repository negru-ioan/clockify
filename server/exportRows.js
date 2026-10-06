// Consolidate only equivalent activities on the same day; never mutate stored entries.
export function groupExportRows(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const key = JSON.stringify([
      entry.date,
      entry.project,
      entry.client,
      entry.description.trim().toLowerCase(),
      entry.user.trim().toLowerCase(),
      entry.tag,
    ]);
    const existing = groups.get(key);
    if (existing) existing.hours += entry.hours;
    else groups.set(key, { ...entry });
  }
  return [...groups.values()];
}
