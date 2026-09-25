### Task 1: Feature image assets + SSOT module

**Files:**
- Create: `public/images/catalog/features/*.png` (17 files)
- Create: `src/lib/catalog/featureImages.ts`
- Create: `src/lib/catalog/featureImages.test.ts`

**Interfaces:**
- Consumes: `TIRE_PERFORMANCE_FEATURE_OPTIONS` from `src/collections/fields/tireCatalogFields.ts`
- Produces:
  - `export type TireFeatureKey = (typeof TIRE_PERFORMANCE_FEATURE_OPTIONS)[number]["value"]`
  - `export type FeatureImage = { src: string; alt: string; label: string }`
  - `export function getFeatureImage(key: string): FeatureImage | null`
  - `export const FEATURE_IMAGE_KEYS: readonly TireFeatureKey[]`

- [ ] **Step 1: Create target directory and copy/rename assets**

Assets live in Cursor project assets (not the git repo). From repo root, run PowerShell:

```powershell
$assets = "C:\Users\HP\.cursor\projects\c-Users-HP-Documents-Cursor-projects-Commersial-Bizon\assets"
$dest = "public/images/catalog/features"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$map = @{
  "1b"  = "handling"
  "2b"  = "safety"
  "3b"  = "high-mileage"
  "4b"  = "economy"
  "5b"  = "wet-grip"
  "6b"  = "anti-wear"
  "7b"  = "anti-tear"
  "8b"  = "short-braking-distance"
  "9b"  = "low-noise"
  "10b" = "heavy-load"
  "11b" = "self-cleaning"
  "12b" = "retreadability"
  "13b" = "stone-ejection"
  "14b" = "low-rolling-resistance"
  "15b" = "heat-dissipation"
  "16b" = "cut-resistance"
  "17b" = "puncture-resistance"
}

Get-ChildItem $assets -File | Where-Object { $_.Name -match 'images_(\d+b)-' } | ForEach-Object {
  $nb = [regex]::Match($_.Name, 'images_(\d+b)-').Groups[1].Value
  $key = $map[$nb]
  if (-not $key) { throw "Unknown asset number: $nb" }
  Copy-Item $_.FullName (Join-Path $dest "$key.png") -Force
}

Get-ChildItem $dest | Measure-Object | Select-Object -ExpandProperty Count
```

Expected: `17`

- [ ] **Step 2: Write failing test for image SSOT**

Create `src/lib/catalog/featureImages.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TIRE_PERFORMANCE_FEATURE_OPTIONS } from "@/collections/fields/tireCatalogFields";
import { FEATURE_IMAGE_KEYS, getFeatureImage } from "./featureImages";

describe("featureImages", () => {
  it("covers every CMS performance feature key", () => {
    const cmsKeys = TIRE_PERFORMANCE_FEATURE_OPTIONS.map((o) => o.value);
    expect([...FEATURE_IMAGE_KEYS].sort()).toEqual([...cmsKeys].sort());
  });

  it("resolves a public src and label for each key", () => {
    for (const key of FEATURE_IMAGE_KEYS) {
      const image = getFeatureImage(key);
      expect(image).not.toBeNull();
      expect(image!.src).toBe(`/images/catalog/features/${key}.png`);
      expect(image!.label.length).toBeGreaterThan(0);
      expect(image!.alt.length).toBeGreaterThan(0);

      const diskPath = join(process.cwd(), "public", "images", "catalog", "features", `${key}.png`);
      expect(existsSync(diskPath), `missing file for ${key}`).toBe(true);
    }
  });

  it("returns null for unknown keys", () => {
    expect(getFeatureImage("not-a-feature")).toBeNull();
  });
});
```

- [ ] **Step 3: Run test вЂ” expect FAIL**

```bash
npx vitest run src/lib/catalog/featureImages.test.ts
```

Expected: FAIL (module missing / `getFeatureImage` undefined)

- [ ] **Step 4: Implement `featureImages.ts`**

Create `src/lib/catalog/featureImages.ts`:

```ts
import { TIRE_PERFORMANCE_FEATURE_OPTIONS } from "@/collections/fields/tireCatalogFields";

export type TireFeatureKey = (typeof TIRE_PERFORMANCE_FEATURE_OPTIONS)[number]["value"];

export type FeatureImage = {
  src: string;
  alt: string;
  label: string;
};

export const FEATURE_IMAGE_KEYS = TIRE_PERFORMANCE_FEATURE_OPTIONS.map(
  (option) => option.value,
) as TireFeatureKey[];

const byKey = Object.fromEntries(
  TIRE_PERFORMANCE_FEATURE_OPTIONS.map((option) => [
    option.value,
    {
      src: `/images/catalog/features/${option.value}.png`,
      alt: option.label,
      label: option.label,
    } satisfies FeatureImage,
  ]),
) as Record<TireFeatureKey, FeatureImage>;

export function getFeatureImage(key: string): FeatureImage | null {
  if (key in byKey) return byKey[key as TireFeatureKey];
  return null;
}
```

- [ ] **Step 5: Run test вЂ” expect PASS**

```bash
npx vitest run src/lib/catalog/featureImages.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add public/images/catalog/features src/lib/catalog/featureImages.ts src/lib/catalog/featureImages.test.ts
git commit -m "$(cat <<'EOF'
Add static feature images SSOT for model advantages carousel.

EOF
)"
```

---

