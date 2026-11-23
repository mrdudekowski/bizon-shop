const DEFAULT_TELEGRAM_PART_LIMIT = 3800;

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function splitBodyAtCapacity(value: string, capacity: number): string[] {
  const points = Array.from(value);
  const chunks: string[] = [];
  let start = 0;

  while (start < points.length) {
    let end = Math.min(start + capacity, points.length);
    if (end < points.length) {
      const lineBreak = points.lastIndexOf("\n", end - 1);
      if (lineBreak >= start) end = lineBreak + 1;
    }
    chunks.push(points.slice(start, end).join(""));
    start = end;
  }

  return chunks;
}

function partHeading(title: string, index: number, total: number): string {
  return `${title} — часть ${index} из ${total}\n`;
}

export function splitTelegramText(text: string, maxLength = DEFAULT_TELEGRAM_PART_LIMIT): string[] {
  if (!text) return [];
  if (!Number.isSafeInteger(maxLength) || maxLength < 1) {
    throw new RangeError("Telegram part limit must be a positive integer");
  }
  if (codePointLength(text) <= maxLength) return [text];

  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const title = /^Новая заявка Bizon(?: #\S+)?$/.test(firstLine) ? firstLine : "Новая заявка Bizon";
  let estimatedTotal = 2;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const maxHeadingLength = codePointLength(partHeading(title, estimatedTotal, estimatedTotal));
    const capacity = maxLength - maxHeadingLength;
    if (capacity < 1) throw new RangeError("Telegram part limit is too small for the notification heading");

    const chunks = splitBodyAtCapacity(text, capacity);
    if (chunks.length === estimatedTotal) {
      return chunks.map((chunk, index) => `${partHeading(title, index + 1, chunks.length)}${chunk}`);
    }
    estimatedTotal = chunks.length;
  }

  throw new Error("Unable to determine a stable Telegram part count");
}
