import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { MediaRejected } from "./storage/putMedia";
import { readRequestBody } from "./readRequestBody";

describe("readRequestBody", () => {
  it("stops after MAX_MEDIA_BYTES + 1", async () => {
    const stream = Readable.from([Buffer.alloc(4), Buffer.alloc(4)]);
    await expect(readRequestBody(stream, 6)).rejects.toBeInstanceOf(MediaRejected);
  });

  it("returns the body under the limit", async () => {
    const stream = Readable.from([Buffer.from("ab"), Buffer.from("cd")]);
    await expect(readRequestBody(stream, 10)).resolves.toEqual(Buffer.from("abcd"));
  });
});
