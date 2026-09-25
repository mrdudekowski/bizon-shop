import type { Request } from "@/payload-types";
import { getPayload } from "@/lib/payload/getPayload";

import { toPayloadRequestData } from "./normalizeRequest";
import type { NormalizedRequest } from "./types";

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

type NotificationPatch = Pick<
  Request,
  | "notificationStatus"
  | "telegramSentAt"
  | "telegramMessageId"
  | "telegramError"
  | "emailSentAt"
  | "emailError"
>;

export async function findDuplicateRequest(data: NormalizedRequest): Promise<boolean> {
  if (!data.phone && !data.email) return false;

  const payload = await getPayload();
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();

  const orConditions = [];
  if (data.phone) {
    orConditions.push({ phone: { equals: data.phone } });
  }
  if (data.email) {
    orConditions.push({ email: { equals: data.email } });
  }

  const existing = await payload.find({
    collection: "requests",
    where: {
      and: [
        { createdAt: { greater_than: since } },
        { sourceForm: { equals: data.sourceForm } },
        { or: orConditions },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });

  return existing.docs.length > 0;
}

export async function createRequestInPayload(data: NormalizedRequest) {
  const payload = await getPayload();

  const doc = await payload.create({
    collection: "requests",
    data: toPayloadRequestData(data),
    overrideAccess: true,
  });

  return doc;
}

export async function updateRequestNotifications(
  requestId: string | number,
  patch: NotificationPatch,
) {
  const payload = await getPayload();

  return payload.update({
    collection: "requests",
    id: requestId,
    data: patch,
    overrideAccess: true,
  });
}
