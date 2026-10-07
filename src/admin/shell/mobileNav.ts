const PRIMARY_HREFS = ["/", "/wheels", "/shop"] as const;

export function splitNav<T extends { href: string }>(items: readonly T[]): { primary: T[]; more: T[] } {
  const primarySet: readonly string[] = PRIMARY_HREFS;
  return {
    primary: items.filter((item) => primarySet.includes(item.href)),
    more: items.filter((item) => !primarySet.includes(item.href)),
  };
}

export function isNavCurrent(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || (pathname.startsWith("/tires/") && !pathname.startsWith("/tires/directions"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isMoreCurrent(pathname: string, moreItems: readonly { href: string }[]): boolean {
  return moreItems.some((item) => isNavCurrent(pathname, item.href));
}

export function profileInitials(login: string): string {
  const trimmed = login.trim();
  if (!trimmed) return "?";
  const local = trimmed.split("@")[0] ?? trimmed;
  const parts = local.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  return local.slice(0, 2).toUpperCase();
}
