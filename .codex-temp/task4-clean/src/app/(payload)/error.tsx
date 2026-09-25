"use client";

type PayloadErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function isDatabaseConnectionError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("postgres") ||
    normalized.includes("database") ||
    normalized.includes("28p01") ||
    normalized.includes("connect")
  );
}

export default function PayloadError({ error, reset }: PayloadErrorProps) {
  const message = error.message?.trim() || "Payload failed to start.";
  const isDbError = isDatabaseConnectionError(message);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12 text-neutral-100">
      <div className="w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wide text-red-400">
          Payload CMS
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {isDbError ? "PostgreSQL is not available" : "Admin failed to load"}
        </h1>

        {isDbError ? (
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-300">
            <p>
              The browser error <code className="rounded bg-neutral-800 px-1">undefined</code>{" "}
              is a side effect. The real issue is that Payload cannot connect to PostgreSQL.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Start Docker Desktop.</li>
              <li>
                Run <code className="rounded bg-neutral-800 px-1">npm run db:up</code>.
              </li>
              <li>
                Ensure <code className="rounded bg-neutral-800 px-1">.env.local</code> uses port{" "}
                <strong>5433</strong>:
                <pre className="mt-2 overflow-x-auto rounded bg-neutral-950 p-3 text-xs text-neutral-200">
                  DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5433/bizon
                </pre>
              </li>
              <li>Restart the dev server and open /admin again.</li>
            </ol>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-300">{message}</p>
        )}

        <details className="mt-6 rounded border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400">
          <summary className="cursor-pointer font-medium text-neutral-300">Technical details</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words">{message}</pre>
          {error.digest ? <p className="mt-2">Digest: {error.digest}</p> : null}
        </details>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
