// ─────────────────────────────────────────────
//  SHARED UTILS — Import Parser
// ─────────────────────────────────────────────

export interface ParsedExercise {
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
}

function parseOneLine(line: string): ParsedExercise | null {
  line = line.replace(/^[\d.\-*•]+\s*/, '').trim();
  if (!line || line.length < 2) return null;

  // "Bench Press 4 sets x 10 reps @ 80kg"
  const long = line.match(
    /^(.*?)\s+(\d+)\s+sets?\s*[x×*]?\s*(\d+)\s+reps?(?:\s+[@]?\s*([\d.]+)\s*kg?)?/i
  );
  if (long) return {
    name: long[1].trim(),
    sets: parseInt(long[2]),
    reps: long[3],
    weight: long[4] ? parseFloat(long[4]) : null,
  };

  // "Bench Press 4x10 80kg"
  const short = line.match(
    /^(.*?)\s+(\d+)\s*[x×Xx*]\s*([\d\-–]+)(?:\s+[@]?\s*([\d.]+)\s*kg?)?/i
  );
  if (short) return {
    name: short[1].trim(),
    sets: parseInt(short[2]),
    reps: short[3].replace('–', '-'),
    weight: short[4] ? parseFloat(short[4]) : null,
  };

  return null;
}

export function parseWorkoutText(text: string): ParsedExercise[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(parseOneLine)
    .filter((x): x is ParsedExercise => x !== null);
}

export function parseCSVText(text: string): ParsedExercise[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const delim = lines[0].includes(',') ? ',' : ';';
  const firstRow = lines[0].split(delim).map(c => c.trim().toLowerCase());

  let ni = 0, si = 1, ri = 2, wi = 3;
  firstRow.forEach((h, i) => {
    if (/name|exercise|ท่า/.test(h))    ni = i;
    if (/sets?|เซ็ต/.test(h))          si = i;
    if (/reps?|เรป/.test(h))           ri = i;
    if (/weight|kg|น้ำหนัก/.test(h))   wi = i;
  });

  const hasHeader = firstRow.some(h => /name|exercise|sets?|reps?/.test(h));
  const results: ParsedExercise[] = [];

  for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
    const cols = lines[i].split(delim).map(c => c.trim().replace(/^"|"$/g, ''));
    const name   = cols[ni];
    const sets   = parseInt(cols[si]);
    const reps   = cols[ri] || '';
    const weight = parseFloat(cols[wi]) || null;
    if (name && sets) results.push({ name, sets, reps, weight });
  }

  return results;
}
