import type {CommandDefinition} from './definition.js';

// Very small fuzzy score: higher is better
export function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  // exact substring
  if (t.includes(q)) return 100;
  // subsequence score: letters of query appear in order in text
  let qi = 0;
  let score = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qi]) {
      qi++;
      score += 10;
      if (qi === q.length) break;
    }
  }
  // if not full match, small bonus based on how many chars matched
  if (qi > 0) score += qi;
  return qi === q.length ? score : 0;
}

export function fuzzyFilter(
  query: string,
  items: CommandDefinition[]
): CommandDefinition[] {
  const scored = items
    .map(it => {
      const text = `${it.name} ${it.description ?? ''} ${(
        it.keywords ?? []
      ).join(' ')}`;
      const score = fuzzyScore(query, text);
      return {it, score};
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(x => x.it);
}
