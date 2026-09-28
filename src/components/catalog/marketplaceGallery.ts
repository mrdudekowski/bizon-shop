export function marketplaceShown(pinned: number, hovered: number | null): number {
  return hovered ?? pinned;
}
