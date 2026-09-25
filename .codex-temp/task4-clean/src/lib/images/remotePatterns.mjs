/**
 * Hostnames allowed for next/image when media is served from S3/CDN.
 * Same-origin Payload /api/media/file URLs need no entry here.
 */
export function buildImageRemotePatterns() {
  /** @type {import('next').NextConfig['images']['remotePatterns']} */
  const patterns = [];
  const seen = new Set();

  const addUrl = (raw) => {
    const value = raw?.trim();
    if (!value) return;

    try {
      const url = new URL(value);
      const key = `${url.protocol}//${url.host}`;
      if (seen.has(key)) return;
      seen.add(key);

      patterns.push({
        protocol: url.protocol.replace(":", ""),
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/**",
      });
    } catch {
      // ponytail: skip invalid env URLs
    }
  };

  addUrl(process.env.S3_PUBLIC_URL);
  addUrl(process.env.S3_ENDPOINT);

  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.S3_REGION?.trim() || "us-east-1";
  if (bucket) {
    addUrl(`https://${bucket}.s3.${region}.amazonaws.com`);
    addUrl(`https://s3.${region}.amazonaws.com/${bucket}`);
  }

  return patterns;
}
