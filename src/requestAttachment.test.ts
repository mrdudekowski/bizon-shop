import { afterEach, describe, expect, it } from "vitest";
import { AttachmentRejected, MAX_ATTACHMENT_BYTES, parseSingleFilePart, storeRequestAttachment } from "./requestAttachment";

const BOUNDARY = "----test";
const PDF = Buffer.from("%PDF-1.4 catalog");
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);

function filePart(name: string, type: string, body: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${type}\r\n\r\n`),
    body,
    Buffer.from("\r\n"),
  ]);
}

const closing = Buffer.from(`--${BOUNDARY}--\r\n`);
const contentType = `multipart/form-data; boundary=${BOUNDARY}`;

function rejectionCode(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    return error instanceof AttachmentRejected ? error.code : "other";
  }
  return undefined;
}

describe("parseSingleFilePart", () => {
  it("returns the original bytes of the only file part", () => {
    const parsed = parseSingleFilePart(Buffer.concat([filePart("a.pdf", "application/pdf", PDF), closing]), contentType);
    expect(parsed.name).toBe("a.pdf");
    expect(parsed.body.equals(PDF)).toBe(true);
  });

  it("rejects a second file", () => {
    const body = Buffer.concat([filePart("a.pdf", "application/pdf", PDF), filePart("b.pdf", "application/pdf", PDF), closing]);
    expect(rejectionCode(() => parseSingleFilePart(body, contentType))).toBe("too_many_files");
  });

  it("rejects a body without a boundary or a file", () => {
    expect(rejectionCode(() => parseSingleFilePart(closing, "multipart/form-data"))).toBe("invalid_multipart");
    expect(rejectionCode(() => parseSingleFilePart(closing, contentType))).toBe("invalid_multipart");
  });
});

describe("storeRequestAttachment", () => {
  const previous = { ...process.env };
  afterEach(() => {
    process.env = { ...previous };
  });

  function configuredStore() {
    process.env.S3_BUCKET = "bucket";
    process.env.S3_ACCESS_KEY_ID = "key";
    process.env.S3_SECRET_ACCESS_KEY = "secret";
    process.env.S3_PUBLIC_URL = "https://cdn.example/bizon";
    const puts: { key: string; body: Buffer; contentType: string }[] = [];
    return {
      puts,
      store: {
        async checkAvailable() {},
        async put(input: { key: string; body: Buffer; contentType: string }) {
          puts.push(input);
        },
        async delete() {},
      },
    };
  }

  it("stores a pdf byte-for-byte under requests/ and returns our public URL", async () => {
    const { store, puts } = configuredStore();
    const { url } = await storeRequestAttachment(store, { name: "a.pdf", mimeType: "application/pdf", body: PDF });
    expect(puts[0].key).toMatch(/^requests\/[0-9a-f-]+\.pdf$/);
    expect(puts[0].body.equals(PDF)).toBe(true);
    expect(url).toBe(`https://cdn.example/bizon/${puts[0].key}`);
  });

  it("accepts zip by its PK signature", async () => {
    const { store, puts } = configuredStore();
    await storeRequestAttachment(store, { name: "c.zip", mimeType: "application/zip", body: ZIP });
    expect(puts[0].key.endsWith(".zip")).toBe(true);
  });

  it("rejects unsupported content, a lying type, empty and oversized files", async () => {
    const { store, puts } = configuredStore();
    const rejects = async (file: { name: string; mimeType: string; body: Buffer }) =>
      storeRequestAttachment(store, file).then(() => "stored", (error) => (error as AttachmentRejected).code);
    expect(await rejects({ name: "a.exe", mimeType: "application/pdf", body: Buffer.from("MZ....") })).toBe("unsupported_type");
    expect(await rejects({ name: "a.pdf", mimeType: "image/png", body: PDF })).toBe("unsupported_type");
    expect(await rejects({ name: "a.pdf", mimeType: "application/pdf", body: Buffer.alloc(0) })).toBe("invalid_multipart");
    expect(
      await rejects({ name: "a.pdf", mimeType: "application/pdf", body: Buffer.concat([PDF, Buffer.alloc(MAX_ATTACHMENT_BYTES)]) }),
    ).toBe("too_large");
    expect(puts).toHaveLength(0);
  });
});
