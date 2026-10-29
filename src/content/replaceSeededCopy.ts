export function replaceSeededCopy(
  current: string,
  previous: string,
  next: string,
): string {
  if (current.trim() === "" || current === previous || current === next) {
    return next;
  }
  return current;
}
