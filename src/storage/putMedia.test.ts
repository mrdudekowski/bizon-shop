import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { MediaCleanupRequired, MediaRejected, putMedia, uploadAndPersistMedia } from "./putMedia";
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
    async checkAvailable() {},
    async put({ key, body }) {
      objects.set(key, body);
    },
    async delete({ key }) {
      objects.delete(key);
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
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const result = await putMedia(store, {
      name: "TBR cover.PNG",
      mimeType: "image/png",
      body: png,
    });
    expect(result.url).toMatch(/^https:\/\/cdn\.example\.test\/bizon\/media\/[0-9a-f-]+\.png$/);
    expect(result.byteSize).toBe(png.length);
    expect(result.sha256).toBe(createHash("sha256").update(png).digest("hex"));
    expect(store.objects.get(result.key)?.length).toBe(png.length);
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

  it("rejects a declared MIME type that does not match the file signature", async () => {
    setEnv("S3_PUBLIC_URL", "https://cdn.example.test");
    setEnv("S3_BUCKET", "bucket");
    setEnv("S3_ACCESS_KEY_ID", "id");
    setEnv("S3_SECRET_ACCESS_KEY", "secret");
    await expect(
      putMedia(memoryStore(), { name: "fake.pdf", mimeType: "application/pdf", body: Buffer.from("not a PDF") }),
    ).rejects.toBeInstanceOf(MediaRejected);
  });

  it("accepts a PNG the browser labelled as octet-stream or IMAGE/PNG", async () => {
    setEnv("S3_PUBLIC_URL", "https://cdn.example.test");
    setEnv("S3_BUCKET", "bucket");
    setEnv("S3_ACCESS_KEY_ID", "id");
    setEnv("S3_SECRET_ACCESS_KEY", "secret");
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    for (const mimeType of ["application/octet-stream", "IMAGE/PNG", "image/x-png", "image/png; charset=utf-8"]) {
      const store = memoryStore();
      const result = await putMedia(store, { name: "camp.png", mimeType, body: png });
      expect(result.mimeType, mimeType).toBe("image/png");
      expect(result.url).toMatch(/\.png$/);
    }
  });

  it("removes the uploaded object when saving its metadata fails", async () => {
    setEnv("S3_PUBLIC_URL", "https://cdn.example.test");
    setEnv("S3_BUCKET", "bucket");
    setEnv("S3_ACCESS_KEY_ID", "id");
    setEnv("S3_SECRET_ACCESS_KEY", "secret");
    const store = memoryStore();
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const failure = new Error("database unavailable");
    await expect(
      uploadAndPersistMedia(store, { name: "camp.png", mimeType: "image/png", body: png }, async () => {
        throw failure;
      }),
    ).rejects.toMatchObject({ code: "database_save_failed", cause: failure });
    expect(store.objects.size).toBe(0);
  });

  it("records cleanup work when compensating deletion fails", async () => {
    setEnv("S3_PUBLIC_URL", "https://cdn.example.test");
    setEnv("S3_BUCKET", "bucket");
    setEnv("S3_ACCESS_KEY_ID", "id");
    setEnv("S3_SECRET_ACCESS_KEY", "secret");
    const store = memoryStore();
    store.delete = async () => {
      throw new Error("storage unavailable");
    };
    const cleanupKeys: string[] = [];
    await expect(
      uploadAndPersistMedia(
        store,
        { name: "camp.png", mimeType: "image/png", body: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) },
        async () => {
          throw new Error("database unavailable");
        },
        async (key) => {
          cleanupKeys.push(key);
        },
      ),
    ).rejects.toMatchObject({ key: expect.stringMatching(/^bizon\/media\//), cleanupRecorded: true });
    expect(cleanupKeys).toHaveLength(1);
  });
});
