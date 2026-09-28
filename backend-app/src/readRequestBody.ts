import { MediaRejected, MAX_MEDIA_BYTES } from "./storage/putMedia";

export async function readRequestBody(
  req: AsyncIterable<Buffer | string | Uint8Array>,
  limit: number = MAX_MEDIA_BYTES,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > limit) throw new MediaRejected("publish_blocked");
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}
