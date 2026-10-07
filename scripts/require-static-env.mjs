import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

if (!process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim()) {
  throw new Error("NEXT_PUBLIC_ADMIN_API_URL must be set when building the static CMS.");
}
