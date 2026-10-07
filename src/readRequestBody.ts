import { MediaRejected, MAX_MEDIA_BYTES } from "./storage/putMedia";

export const MAX_JSON_BYTES = 1024 * 1024;

export class RequestBodyTooLarge extends Error {
  constructor() {
    super("request_too_large");
  }
}

export async function readRequestBody(
  req: AsyncIterable<Buffer | string | Uint8Array>,
  limit: number = MAX_MEDIA_BYTES,
): Promise<Buffer> {
  return readLimitedBody(req, limit, () => new MediaRejected("publish_blocked"));
}

export async function readJsonRequestBody(
  req: AsyncIterable<Buffer | string | Uint8Array>,
  limit: number = MAX_JSON_BYTES,
): Promise<unknown> {
  const body = await readLimitedBody(req, limit, () => new RequestBodyTooLarge());
  if (body.length === 0) return {};
  return JSON.parse(body.toString("utf8")) as unknown;
}

async function readLimitedBody(
  req: AsyncIterable<Buffer | string | Uint8Array>,
  limit: number,
  onLimitExceeded: () => Error,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > limit) throw onLimitExceeded();
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}
