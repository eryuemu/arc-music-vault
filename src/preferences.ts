export function readPreference(key: string): unknown {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? undefined : JSON.parse(saved);
  } catch {
    return undefined;
  }
}

export function writePreference(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

export function knownIds(value: unknown, validIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && validIds.has(id)))];
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function matchesSearch(query: string, fields: string[]) {
  const text = fields.join(' ').toLocaleLowerCase();
  return query.split(/\s+/).every((term) => text.includes(term));
}
