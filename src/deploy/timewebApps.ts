export type SiteDeployStatus = "started" | "failed" | "not_configured";

export type SiteDeployResult = {
  status: SiteDeployStatus;
  message: string;
};

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
  "hideTireDirection",
  "hideTireModel",
  "hideWheelType",
  "hideWheelModel",
  "hideShopCategory",
  "hideShopProduct",
  "hideMaterial",
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
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      console.error(JSON.stringify({ event: "site_deploy.trigger_failed", status: response.status }));
      return { status: "failed", message: "Не удалось запустить пересборку публичного сайта." };
    }
    return { status: "started", message: "Публикация сохранена. Пересборка публичного сайта запущена." };
  } catch (error) {
    console.error(JSON.stringify({
      event: "site_deploy.trigger_failed",
      reason: error instanceof Error ? error.name : "unknown",
    }));
    return { status: "failed", message: "Публикация сохранена, но пересборку сайта запустить не удалось." };
  }
}
