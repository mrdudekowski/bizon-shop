export const PUBLIC_OG_IMAGE = "/brand/logo+text.png";
export const PUBLIC_LOGO = "/brand/bizon.svg";

export type PublicSiteReadinessIssue = {
  code:
    | "placeholder_phone"
    | "placeholder_email"
    | "placeholder_site_url"
    | "missing_og_image"
    | "missing_logo";
  message: string;
};

export function findPublicSiteReadinessIssues(input: {
  phone: string;
  email: string;
  siteUrl: string;
  publicAssets: ReadonlySet<string>;
}): PublicSiteReadinessIssue[] {
  const issues: PublicSiteReadinessIssue[] = [];

  if (!/\d/.test(input.phone)) {
    issues.push({
      code: "placeholder_phone",
      message: "Publish a phone number in the CMS site profile",
    });
  }

  if (!input.email.includes("@")) {
    issues.push({
      code: "placeholder_email",
      message: "Publish an email address in the CMS site profile",
    });
  }

  if (/\.example(?:\/|$)/i.test(input.siteUrl)) {
    issues.push({
      code: "placeholder_site_url",
      message: "Configure NEXT_PUBLIC_SITE_URL",
    });
  }

  if (!input.publicAssets.has(PUBLIC_OG_IMAGE)) {
    issues.push({
      code: "missing_og_image",
      message: `Missing ${PUBLIC_OG_IMAGE}`,
    });
  }

  if (!input.publicAssets.has(PUBLIC_LOGO)) {
    issues.push({
      code: "missing_logo",
      message: `Missing ${PUBLIC_LOGO}`,
    });
  }

  return issues;
}

export function assertPublicSiteReadiness(
  issues: readonly PublicSiteReadinessIssue[],
): void {
  if (issues.length === 0) return;

  throw new Error(
    issues.map((issue) => `[${issue.code}] ${issue.message}`).join("\n"),
  );
}
