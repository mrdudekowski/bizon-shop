"use client";

import type { ReactNode } from "react";

import { contactSurfaceOf, type SiteProfile } from "@/lib/content/siteProfile";

import { ContactCard } from "./ContactCard";
import { useSiteProfile } from "./siteProfileContext";

export function ContactRequest({
  notice,
  className,
  profile,
  children,
}: {
  notice?: string;
  className?: string;
  /** Test seam. The site shell supplies the published profile when this is omitted. */
  profile?: SiteProfile | null;
  children: ReactNode;
}) {
  const published = useSiteProfile();
  const contacts = profile === undefined ? published : profile;
  if (contactSurfaceOf(contacts?.contactSurface) === "card") {
    return <ContactCard profile={contacts} notice={notice} className={className} />;
  }
  return children;
}
