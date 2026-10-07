export async function publishEntriesThenMark<T>(
  entries: T[],
  publishEntry: (entry: T) => Promise<void>,
  markPublished: () => Promise<void>,
): Promise<void> {
  for (const entry of entries) await publishEntry(entry);
  await markPublished();
}
