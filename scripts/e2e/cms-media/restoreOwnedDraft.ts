import { isDeepStrictEqual } from "node:util";

export async function restoreOwnedDraft<T>(
  original: T, owned: T, read: () => Promise<T | null>, save: (original: T, expected: T) => Promise<void>,
) {
  const current = await read();
  if (isDeepStrictEqual(current, original)) return;
  if (!isDeepStrictEqual(current, owned)) {
    throw new Error("CMS draft changed in another session; E2E cleanup left it untouched");
  }
  await save(original, owned);
}
