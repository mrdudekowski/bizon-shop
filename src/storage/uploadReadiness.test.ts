import { afterEach, describe, expect, it, vi } from "vitest";
import type { ObjectStore } from "./objectStore";
import { assertMediaUploadReady, MediaRejected } from "./putMedia";

const ENV_KEYS = ["S3_PUBLIC_URL", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;
const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (!(key in saved)) continue;
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
    delete saved[key];
  }
});

function configureS3() {
  for (const [key, value] of Object.entries({
    S3_PUBLIC_URL: "https://cdn.example.test",
    S3_BUCKET: "bucket",
    S3_ACCESS_KEY_ID: "id",
    S3_SECRET_ACCESS_KEY: "secret",
  })) {
    const typedKey = key as (typeof ENV_KEYS)[number];
    saved[typedKey] = process.env[typedKey];
    process.env[typedKey] = value;
  }
}

function storeWithAvailability(checkAvailable: () => Promise<void>): ObjectStore {
  return {
    async checkAvailable() {
      await checkAvailable();
    },
    async put() {},
    async delete() {},
  };
}

describe("assertMediaUploadReady", () => {
  it("checks database and S3 in order when both are available", async () => {
    configureS3();
    const events: string[] = [];

    await expect(
      assertMediaUploadReady(
        storeWithAvailability(async () => {
          events.push("s3");
        }),
        async () => {
          events.push("database");
        },
      ),
    ).resolves.toBeUndefined();

    expect(events).toEqual(["database", "s3"]);
  });

  it("blocks before checking S3 when the database is unavailable", async () => {
    const checkS3 = vi.fn(async () => {});

    await expect(
      assertMediaUploadReady(storeWithAvailability(checkS3), async () => {
        throw new Error("database unavailable");
      }),
    ).rejects.toMatchObject<Partial<MediaRejected>>({ code: "database_unavailable" });

    expect(checkS3).not.toHaveBeenCalled();
  });

  it("blocks the upload when S3 is unavailable", async () => {
    configureS3();
    const checkDatabase = vi.fn(async () => {});
    const checkS3 = vi.fn(async () => {
      throw new Error("S3 unavailable");
    });

    await expect(
      assertMediaUploadReady(
        storeWithAvailability(checkS3),
        checkDatabase,
      ),
    ).rejects.toMatchObject<Partial<MediaRejected>>({ code: "storage_unavailable" });

    expect(checkDatabase).toHaveBeenCalledOnce();
    expect(checkS3).toHaveBeenCalledOnce();
  });
});
