### Task 2: Map feature `key` onto site advantages

**Files:**
- Modify: `src/lib/cms/types.ts` (`CmsTireAdvantage`)
- Modify: `src/lib/cms/payload/mappers.ts` (advantages map)
- Modify: `src/lib/cms/payload/mappers.test.ts`
- Modify: `src/lib/catalog/tireReadModel.test.ts` only if fixtures break typecheck

**Interfaces:**
- Consumes: Payload `features[].key`, `title`, `description`
- Produces: `CmsTireAdvantage = { key: string; title: string; description?: string }`

- [ ] **Step 1: Update failing mapper expectation**

In `src/lib/cms/payload/mappers.test.ts`, change the advantages expectation to include `key`:

```ts
expect(mapped.advantages).toEqual([
  { key: "wet-grip", title: "РЎС†РµРїР»РµРЅРёРµ", description: "РќР° РјРѕРєСЂРѕРј РїРѕРєСЂС‹С‚РёРё" },
]);
```

- [ ] **Step 2: Run test вЂ” expect FAIL**

```bash
npx vitest run src/lib/cms/payload/mappers.test.ts
```

Expected: FAIL вЂ” received object missing `key`

- [ ] **Step 3: Extend type + mapper**

In `src/lib/cms/types.ts`:

```ts
export type CmsTireAdvantage = {
  key: string;
  title: string;
  description?: string;
};
```

In `src/lib/cms/payload/mappers.ts`, replace advantages mapping with:

```ts
const advantages = (doc.features ?? []).map((feature) => ({
  key: feature.key,
  title: feature.title,
  description: feature.description?.trim() || undefined,
}));
```

If `tireReadModel.test.ts` (or any fixture) constructs `advantages: []` only, leave it. If it builds advantage objects without `key`, add `key: "handling"` (or omit objects).

- [ ] **Step 4: Run tests вЂ” expect PASS**

```bash
npx vitest run src/lib/cms/payload/mappers.test.ts src/lib/catalog/tireReadModel.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/lib/cms/types.ts src/lib/cms/payload/mappers.ts src/lib/cms/payload/mappers.test.ts
git commit -m "$(cat <<'EOF'
Include feature key on tire model advantages for image lookup.

EOF
)"
```

---

