export type SiteDeployStatus = "started" | "failed" | "not_configured";

export type SiteDeployResult = {
  status: SiteDeployStatus;
  message: string;
  deploymentId?: string;
};

export type TimewebDeployStatus =
  | "created"
  | "started"
  | "preparing_environment"
  | "cloning_code"
  | "installing_dependencies"
  | "building_code"
  | "checking_ssl_certs"
  | "cleaning_up"
  | "running_container"
  | "stopping"
  | "stopped"
  | "failure"
  | "success"
  | "access_error";

export type SiteDeployProgress = {
  deploymentId: string;
  status: TimewebDeployStatus;
  commitSha: string | null;
  startedAt: string | null;
  endedAt: string | null;
};

export type SiteDeployLookup =
  | { status: "found"; deploy: SiteDeployProgress; contentStatus: "pending" | "matches" | "mismatch" | "unavailable" }
  | { status: "not_found" | "unavailable" | "not_configured" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const TIMEWEB_DEPLOY_STATUSES = new Set<TimewebDeployStatus>([
  "created",
  "started",
  "preparing_environment",
  "cloning_code",
  "installing_dependencies",
  "building_code",
  "checking_ssl_certs",
  "cleaning_up",
  "running_container",
  "stopping",
  "stopped",
  "failure",
  "success",
  "access_error",
]);

const PUBLIC_SITE_DEPLOY_METHODS = new Set([
  "publishTireDirection",
  "publishTireModel",
  "publishWheelType",
  "publishWheelModel",
  "publishShopCategory",
  "publishShopProduct",
  "publishPage",
  "publishMaterial",
  "publishChangeSet",
  "unpublishDocument",
  "resetPage",
  "hideTireDirection",
  "hideTireModel",
  "hideWheelType",
  "hideWheelModel",
  "hideShopCategory",
  "hideShopProduct",
  "hideMaterial",
  "hidePage",
]);

export function isSiteAffectingPublicationMethod(method: unknown): method is string {
  return typeof method === "string" && PUBLIC_SITE_DEPLOY_METHODS.has(method);
}

export async function triggerStaticSiteDeploy(): Promise<SiteDeployResult> {
  const token = process.env.TIMEWEB_CLOUD_TOKEN?.trim();
  const appId = process.env.TIMEWEB_PUBLIC_SITE_APP_ID?.trim();
  if (!token || !appId) {
    return {
      status: "not_configured",
      message: "Публичный сайт ещё не подключён к автоматической пересборке.",
    };
  }

  try {
    const response = await fetch(
      `https://api.timeweb.cloud/api/v1/apps/${encodeURIComponent(appId)}/deploy`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      console.error(JSON.stringify({ event: "site_deploy.trigger_failed", status: response.status }));
      return { status: "failed", message: "Не удалось запустить пересборку публичного сайта." };
    }
    const payload: unknown = await response.json().catch(() => null);
    const deployment = isRecord(payload) && isRecord(payload.deploy) ? payload.deploy : null;
    const rawId = deployment?.id;
    const deploymentId = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : undefined;
    return {
      status: "started",
      message: "Публикация сохранена. Пересборка публичного сайта запущена.",
      ...(deploymentId ? { deploymentId } : {}),
    };
  } catch (error) {
    console.error(JSON.stringify({
      event: "site_deploy.trigger_failed",
      reason: error instanceof Error ? error.name : "unknown",
    }));
    return { status: "failed", message: "Публикация сохранена, но пересборку сайта запустить не удалось." };
  }
}

async function verifyPublicContentRevision(expectedRevision: string): Promise<"matches" | "mismatch" | "unavailable"> {
  if (!/^sha256:[a-f0-9]{64}$/.test(expectedRevision)) return "unavailable";
  const configuredUrl = process.env.PUBLIC_SITE_URL?.trim();
  if (!configuredUrl) return "unavailable";

  try {
    const siteUrl = new URL(configuredUrl);
    if (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) {
      return "unavailable";
    }
    const markerUrl = new URL("/content-revision.json", siteUrl);
    markerUrl.searchParams.set("expected", expectedRevision.slice("sha256:".length));
    const response = await fetch(markerUrl, {
      cache: "no-store",
      redirect: "error",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return "unavailable";
    const marker: unknown = await response.json();
    if (!isRecord(marker) || marker.schema !== 1 || typeof marker.revision !== "string" || !/^sha256:[a-f0-9]{64}$/.test(marker.revision)) {
      return "unavailable";
    }
    return marker.revision === expectedRevision ? "matches" : "mismatch";
  } catch {
    return "unavailable";
  }
}

export async function getStaticSiteDeployStatus(
  deploymentId: string,
  expectedRevision: string,
): Promise<SiteDeployLookup> {
  const token = process.env.TIMEWEB_CLOUD_TOKEN?.trim();
  const appId = process.env.TIMEWEB_PUBLIC_SITE_APP_ID?.trim();
  if (!token || !appId) return { status: "not_configured" };
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(deploymentId)) return { status: "not_found" };

  try {
    const response = await fetch(
      `https://api.timeweb.cloud/api/v1/apps/${encodeURIComponent(appId)}/deploys?limit=25&offset=0`,
      {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      console.error(JSON.stringify({ event: "site_deploy.status_failed", status: response.status }));
      return { status: "unavailable" };
    }

    const payload: unknown = await response.json();
    const deploys = isRecord(payload) && Array.isArray(payload.deploys) ? payload.deploys : null;
    const deployment = deploys?.find((candidate) =>
      isRecord(candidate) && String(candidate.id ?? "") === deploymentId,
    );
    if (!isRecord(deployment) || typeof deployment.status !== "string" || !TIMEWEB_DEPLOY_STATUSES.has(deployment.status as TimewebDeployStatus)) {
      return { status: deployment == null ? "not_found" : "unavailable" };
    }

    const status = deployment.status as TimewebDeployStatus;
    const contentStatus = status === "success"
      ? await verifyPublicContentRevision(expectedRevision)
      : status === "failure" || status === "stopped" || status === "access_error"
        ? "unavailable"
        : "pending";
    return {
      status: "found",
      deploy: {
        deploymentId,
        status,
        commitSha: typeof deployment.commitSha === "string" ? deployment.commitSha : null,
        startedAt: typeof deployment.startedAt === "string" ? deployment.startedAt : null,
        endedAt: typeof deployment.endedAt === "string" ? deployment.endedAt : null,
      },
      contentStatus,
    };
  } catch (error) {
    console.error(JSON.stringify({
      event: "site_deploy.status_failed",
      reason: error instanceof Error ? error.name : "unknown",
    }));
    return { status: "unavailable" };
  }
}
