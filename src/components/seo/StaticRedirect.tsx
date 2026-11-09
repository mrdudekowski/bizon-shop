import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/metadata";

export function staticRedirectMetadata(targetPath: string, title: string, description: string): Metadata {
  return createPageMetadata({
    title,
    description,
    path: targetPath,
    noIndex: true,
  });
}

export function StaticRedirect({ href, label }: { href: string; label: string }) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${href}`} />
      <p>
        <a href={href}>{label}</a>
      </p>
    </>
  );
}
