import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createStaticExportServer } from "../../scripts/serve-static-export.mjs";

describe("static export runtime server", () => {
  let directory: string;
  let server: ReturnType<typeof createStaticExportServer>;
  let origin: string;

  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "bizon-cms-static-"));
    await writeFile(path.join(directory, "index.html"), "<h1>CMS home</h1>");
    await mkdir(path.join(directory, "admin"));
    await writeFile(path.join(directory, "admin", "index.html"), "<h1>CMS admin</h1>");
    await writeFile(path.join(directory, "404.html"), "<h1>Not found</h1>");

    server = createStaticExportServer({ directory });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
    origin = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  });

  it.each(["/", "/admin", "/admin/"])("serves exported route %s", async (route) => {
    const response = await fetch(new URL(route, origin));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain(route === "/" ? "CMS home" : "CMS admin");
  });

  it("returns the generated 404 page with a 404 status", async () => {
    const response = await fetch(new URL("/missing/", origin));
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Not found");
  });

  it("rejects methods that cannot be served from a static export", async () => {
    const response = await fetch(new URL("/", origin), { method: "POST" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
  });
});
