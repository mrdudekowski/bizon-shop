import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      "docs/**",
      ".cursor/**",
      "catalog/**",
      "import-templates/**",
      "payload-bizon/**",
      "next-env.d.ts",
      "src/payload-types.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["scripts/**/*.ts"],
    rules: {
      // ponytail: one-off Payload run scripts may use @ts-nocheck for legacy row shapes
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

export default eslintConfig;
