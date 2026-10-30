/** A chapter may be a paragraph without a heading. Saving does not ask for one. */
export function editorialSaveBlockReason(
  _pageId: string,
  _draft: { features?: { title: string }[]; sections?: { heading: string }[] },
): string | null {
  return null;
}
