import { createElement, type ReactNode } from "react";

const BIZON_TOKEN = /(?<![\p{L}\p{N}_])BIZON(?![\p{L}\p{N}_])/giu;
const EMAIL_ADDRESS = /[\p{L}\p{N}!#$%&'*+/=?^_`{|}~.-]+@[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?)+/giu;

export function findBizonTextTokens(value: string): Array<{ index: number; text: string }> {
  const emailRanges = Array.from(value.matchAll(EMAIL_ADDRESS), (match) => {
    const start = match.index ?? 0;
    return { start, end: start + match[0].length };
  });

  return Array.from(value.matchAll(BIZON_TOKEN), (match) => ({ index: match.index ?? 0, text: match[0] })).filter(
    (token) => !emailRanges.some((email) => token.index < email.end && token.index + token.text.length > email.start),
  );
}

export function BizonText({ value }: { value: string }) {
  const output: ReactNode[] = [];
  let previousIndex = 0;

  for (const match of findBizonTextTokens(value)) {
    const index = match.index;
    if (index > previousIndex) output.push(value.slice(previousIndex, index));
    output.push(createElement("strong", { key: `bizon-${index}`, className: "bizon-word-emphasis" }, match.text));
    previousIndex = index + match.text.length;
  }

  if (previousIndex === 0) return value;
  if (previousIndex < value.length) output.push(value.slice(previousIndex));
  return output;
}
