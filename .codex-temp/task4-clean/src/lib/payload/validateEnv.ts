/**
 * Fail fast with readable errors when Payload env is misconfigured.
 * Prevents cryptic browser console `[ Server ] undefined` on /admin.
 */
export function validatePayloadEnv(): void {
  const secret = process.env.PAYLOAD_SECRET?.trim();
  const databaseUri = process.env.DATABASE_URI?.trim();

  if (!secret) {
    throw new Error(
      "PAYLOAD_SECRET is not set. Copy .env.example to .env.local and set a random string (32+ chars).",
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `PAYLOAD_SECRET is too short (${secret.length} chars). Use at least 32 characters.`,
    );
  }

  if (!databaseUri) {
    throw new Error(
      "DATABASE_URI is not set. Start PostgreSQL (npm run db:up) and configure .env.local — see README.",
    );
  }

  if (!databaseUri.startsWith("postgresql://") && !databaseUri.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URI must be a PostgreSQL connection string (postgresql://...).",
    );
  }
}
