import { afterEach, describe, expect, it } from "vitest";
import { putMedia, MediaRejected } from "./putMedia";
import type { ObjectStore } from "./objectStore";

const ENV_KEYS = [
  "S3_PUBLIC_URL",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

function memoryStore(): ObjectStore & { objects: Map<string, Buffer> } {
  const objects = new Map<string, Buffer>();
  return {
    objects,
    async put({ key, body }) {
      objects.set(key, body);
    },
  };
}

describe("putMedia", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (key in saved) {
        const value = saved[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
        delete saved[key];
      }
    }
  });

  function setEnv(key: (typeof ENV_KEYS)[number], value: string) {
    saved[key] = process.env[key];
    process.env[key] = value;
  }

  it("stores bytes and returns a public https URL", async () => {
    setEnv("S3_PUBLIC_URL", "https://cdn.example.test");
    setEnv("S3_BUCKET", "bucket");
    setEnv("S3_ACCESS_KEY_ID", "id");
    setEnv("S3_SECRET_ACCESS_KEY", "secret");
    const store = memoryStore();
    const result = await putMedia(store, {
      name: "TBR cover.PNG",
      mimeType: "image/png",
      body: Buffer.from([137, 80, 78, 71]),
    });
    expect(result.url).toMatch(/^https:\/\/cdn\.example\.test\/bizon\/media\/[0-9a-f-]+\.png$/);
    expect(store.objects.get(result.key)?.length).toBe(4);
  });

  it("rejects oversize and unknown mime", async () => {
    setEnv("S3_PUBLIC_URL", "https://cdn.example.test");
    setEnv("S3_BUCKET", "bucket");
    setEnv("S3_ACCESS_KEY_ID", "id");
    setEnv("S3_SECRET_ACCESS_KEY", "secret");
    const store = memoryStore();
    await expect(
      putMedia(store, { name: "x.bin", mimeType: "application/octet-stream", body: Buffer.from([1]) }),
    ).rejects.toBeInstanceOf(MediaRejected);
  });
});
