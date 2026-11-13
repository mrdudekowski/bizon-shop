import { createElement, type ReactNode } from "react";

export function BizonText({ value }: { value: string }) {
  const expression = /(?<![\p{L}\p{N}_])BIZON(?![\p{L}\p{N}_])/giu;
  const output: ReactNode[] = [];
  let previousIndex = 0;

  for (const match of value.matchAll(expression)) {
    const index = match.index ?? 0;
    if (index > previousIndex) output.push(value.slice(previousIndex, index));
    output.push(createElement("strong", { key: `bizon-${index}`, className: "bizon-word-emphasis" }, match[0]));
    previousIndex = index + match[0].length;
  }

  if (previousIndex === 0) return value;
  if (previousIndex < value.length) output.push(value.slice(previousIndex));
  return output;
}
