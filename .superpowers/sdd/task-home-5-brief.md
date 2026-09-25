### Task 5: Redirect `/selection` + update CTAs

**Files:**
- Modify: `src/app/(site)/selection/page.tsx` (replace with redirect)
- Modify: `src/lib/cms/pages/defaults/home.ts` (CTA hrefs)
- Modify: `src/components/layout/SiteShell.jsx` (featuredItem link)
- Modify: `src/components/main/MainChrome.tsx` if CTA is `/selection`
- Modify: `src/constants/navigation.js` вЂ” set `selection: "/#solutions"` **or** keep `/selection` relying on redirect (prefer keep `ROUTES.selection = "/selection"` for sitemap stability + redirect)
- Modify: `src/lib/cart/selectionCartItem.ts` result `url`
- Modify: `src/components/selection/RequestContextSummary.tsx` edit link
- Modify: any hard-coded `/selection` in home defaults / merge tests expectations

**Interfaces:**
- Consumes: `selectionLegacyToHomePath`
- Produces: legacy URLs land on home panel

- [ ] **Step 1: Selection page becomes redirect**

Replace `src/app/(site)/selection/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

import { selectionLegacyToHomePath } from "@/lib/selection/homeHref";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toQueryString(
  source: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value != null) params.set(key, value);
  }
  return params.toString();
}

export default async function SelectionPage({ searchParams }: PageProps) {
  const query = toQueryString(await searchParams);
  redirect(selectionLegacyToHomePath(query));
}
```

Remove unused metadata/catalog loading (redirect is enough). If Next complains about missing metadata, omit or keep minimal.

- [ ] **Step 2: Update defaults + chrome links**

In `src/lib/cms/pages/defaults/home.ts`, change CTA `href: "/selection"` в†’ `href: "/#solutions"` (both occurrences).

In `SiteShell.jsx` featured item:

```js
: { name: "РџРѕРґРѕР±СЂР°С‚СЊ С€РёРЅС‹", link: "/#solutions" }
```

In `MainChrome.tsx`, if `ROUTES.selection` is used for the accent button, either point to `/#solutions` or add `ROUTES.selectionEntry = "/#solutions"` and use that for CTAs while leaving sitemap `ROUTES.selection` as `/selection`.

Update `selectionCartItem.ts`:

```ts
url: selectionHomeHref(state, "result"),
```

Update `RequestContextSummary.tsx` link to `selectionHomeHref({ vehicle: context.vehicle, conditions: [] }, "vehicle")` or simple `` `/?vehicle=${вЂ¦}#solutions` ``.

Fix unit tests that assert `/selection` CTA hrefs (`merge.test.ts`, `selectionCartItem.test.ts`) to expect the new URLs.

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/lib/selection src/lib/cart/selectionCartItem.test.ts src/lib/cms/pages/merge.test.ts
npx tsc --noEmit
```

Expected: PASS / exit 0

- [ ] **Step 4: Manual smoke**

1. Visit `/selection?vehicle=regional-truck` в†’ ends on `/?vehicle=regional-truck#solutions`.
2. Header/burger вЂњРџРѕРґРѕР±СЂР°С‚СЊ С€РёРЅС‹вЂќ opens home solutions section.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/app/(site)/selection/page.tsx src/lib/cms/pages/defaults/home.ts src/components/layout/SiteShell.jsx src/components/main/MainChrome.tsx src/lib/cart/selectionCartItem.ts src/components/selection/RequestContextSummary.tsx src/lib/cms/pages/merge.test.ts src/lib/cart/selectionCartItem.test.ts
git commit -m "Redirect /selection into homepage inline wizard and update CTAs."
```

---

