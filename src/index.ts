export interface RecognizedWord {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}
export interface OcrWord extends RecognizedWord {
  start: number;
  end: number;
  line: number;
}
export interface SearchHit {
  start: number;
  end: number;
  words: OcrWord[];
}
export interface OcrLayer {
  text: string;
  words: readonly OcrWord[];
  search(query: string): SearchHit[];
  hitTest(x: number, y: number): OcrWord | undefined;
}
/** Consumes recognized words only; does not perform OCR inference. */
export function createOcrLayer(
  input: readonly RecognizedWord[],
  options: { width: number; height: number; minConfidence?: number; lineTolerance?: number },
): OcrLayer {
  const { width, height } = options;
  const min = options.minConfidence ?? 0,
    tolerance = options.lineTolerance ?? 0.5;
  if (
    ![width, height].every((n) => Number.isFinite(n) && n > 0 && n <= 1e7) ||
    !Number.isFinite(min) ||
    min < 0 ||
    min > 1 ||
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    tolerance > 1 ||
    !Array.isArray(input) ||
    input.length > 10_000
  )
    throw new RangeError('Invalid OCR limits');
  const ids = new Set<string>();
  let totalText = 0;
  const words = input
    .map((word) => {
      if (
        typeof word.id !== 'string' ||
        !word.id ||
        word.id.length > 128 ||
        ids.has(word.id) ||
        typeof word.text !== 'string' ||
        !word.text.length ||
        word.text.length > 1024 ||
        /[\r\n]/u.test(word.text) ||
        ![word.x, word.y, word.width, word.height, word.confidence].every(Number.isFinite) ||
        word.x < 0 ||
        word.y < 0 ||
        word.width <= 0 ||
        word.height <= 0 ||
        word.x + word.width > width ||
        word.y + word.height > height ||
        word.confidence < 0 ||
        word.confidence > 1
      )
        throw new RangeError('Invalid recognized word');
      totalText += word.text.length;
      if (totalText > 1_000_000) throw new RangeError('OCR text limit');
      ids.add(word.id);
      return { ...word };
    })
    .filter((w) => w.confidence >= min)
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  const lines: RecognizedWord[][] = [];
  for (const word of words) {
    const line = lines.at(-1),
      anchor = line?.[0];
    if (anchor && Math.abs(word.y - anchor.y) <= Math.min(word.height, anchor.height) * tolerance)
      line!.push(word);
    else lines.push([word]);
  }
  let text = '';
  const ordered: OcrWord[] = [];
  lines.forEach((line, index) => {
    line.sort((a, b) => a.x - b.x || a.id.localeCompare(b.id));
    if (index) text += '\n';
    line.forEach((word, i) => {
      if (i) text += ' ';
      const start = text.length;
      text += word.text;
      ordered.push(Object.freeze({ ...word, start, end: text.length, line: index }));
    });
  });
  Object.freeze(ordered);
  return Object.freeze({
    text,
    words: ordered,
    search(query: string): SearchHit[] {
      if (typeof query !== 'string' || !query.length || query.length > 4096)
        throw new RangeError('Expected nonempty literal query');
      const hits: SearchHit[] = [];
      let wordIndex = 0;
      for (
        let start = text.indexOf(query);
        start >= 0;
        start = text.indexOf(query, start + query.length)
      ) {
        if (hits.length >= 10_000) throw new RangeError('Search hit limit');
        const end = start + query.length;
        while (wordIndex < ordered.length && ordered[wordIndex]!.end <= start) wordIndex++;
        const found: OcrWord[] = [];
        for (let i = wordIndex; i < ordered.length && ordered[i]!.start < end; i++)
          found.push(ordered[i]!);
        hits.push({ start, end, words: found });
      }
      return hits;
    },
    hitTest(x: number, y: number): OcrWord | undefined {
      if (![x, y].every(Number.isFinite)) throw new RangeError('Invalid hit point');
      return ordered
        .filter((w) => x >= w.x && y >= w.y && x < w.x + w.width && y < w.y + w.height)
        .sort((a, b) => b.confidence - a.confidence || a.width * a.height - b.width * b.height)[0];
    },
  });
}
