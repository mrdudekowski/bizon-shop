import { NextResponse } from "next/server";

import { sendRequestEmailNotification } from "@/lib/notifications/email";
import { isTelegramConfigured, sendTelegramNotification } from "@/lib/notifications/telegram";
import type { Request as BizonRequest } from "@/payload-types";
import {
  createRequestInPayload,
  findDuplicateRequest,
  updateRequestNotifications,
} from "@/lib/requests/createRequest";
import {
  buildAdminRequestUrl,
  formatRequestForTelegram,
} from "@/lib/requests/formatRequestForTelegram";
import { normalizeRequest } from "@/lib/requests/normalizeRequest";
import type { ApiRequestError, ApiRequestSuccess } from "@/lib/requests/types";
import { parseRequestBody, validateRequest } from "@/lib/requests/validateRequest";

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

function errorResponse(error: ApiRequestError["error"], message: string, status: number) {
  return NextResponse.json({ ok: false, error, message } satisfies ApiRequestError, { status });
}

export async function POST(request: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse("invalid_request_body", "Invalid request body", 400);
    }

    const parsed = parseRequestBody(rawBody);
    if (parsed.ok === false) {
      return errorResponse(parsed.error, parsed.message, 400);
    }

    const validated = validateRequest(parsed.body);
    if (validated.ok === false) {
      const status = validated.error === "honeypot_triggered" ? 400 : 422;
      return errorResponse(validated.error, validated.message, status);
    }

    const normalized = normalizeRequest(validated.body, {
      sourceIp: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    if (await findDuplicateRequest(normalized)) {
      return errorResponse(
        "duplicate_request",
        "A similar request was sent recently. Please wait a few minutes.",
        429,
      );
    }

    let created;
    try {
      created = await createRequestInPayload(normalized);
    } catch (error) {
      console.error("[api/requests] Payload create failed:", error);
      return errorResponse("request_create_failed", "Could not create request", 500);
    }

    const requestId = created.id;
    const adminRequestUrl = buildAdminRequestUrl(requestId);
    const telegramText = formatRequestForTelegram(normalized, adminRequestUrl);

    let notificationStatus: BizonRequest["notificationStatus"] = "pending";
    let telegramSentAt: string | undefined;
    let telegramMessageId: string | undefined;
    let telegramError: string | undefined;
    let emailSentAt: string | undefined;
    let emailError: string | undefined;

    if (isTelegramConfigured()) {
      const telegramResult = await sendTelegramNotification(telegramText);
      if (telegramResult.ok === true) {
        notificationStatus = "telegram_sent";
        telegramSentAt = new Date().toISOString();
        telegramMessageId = telegramResult.messageId;
      } else {
        notificationStatus = "telegram_failed";
        telegramError = telegramResult.error;
        console.error("[api/requests] Telegram failed:", telegramResult.error);
      }
    } else {
      notificationStatus = "telegram_failed";
      telegramError = "Telegram is not configured";
      console.warn("[api/requests] Telegram skipped — missing TELEGRAM_* env");
    }

    const emailResult = await sendRequestEmailNotification(normalized, requestId);
    if (emailResult.ok === true) {
      emailSentAt = new Date().toISOString();
      notificationStatus = notificationStatus === "telegram_sent" ? "telegram_sent" : "email_sent";
    } else if (emailResult.skipped !== true) {
      emailError = emailResult.error;
      if (notificationStatus === "telegram_sent") {
        notificationStatus = "partial_failed";
      }
    }

    try {
      await updateRequestNotifications(requestId, {
        notificationStatus,
        telegramSentAt,
        telegramMessageId,
        telegramError,
        emailSentAt,
        emailError,
      });
    } catch (error) {
      console.error("[api/requests] Failed to update notification fields:", error);
    }

    return NextResponse.json({
      ok: true,
      requestId,
      message: "Request created successfully",
    } satisfies ApiRequestSuccess);
  } catch (error) {
    console.error("[api/requests] Unexpected error:", error);
    return errorResponse("unexpected_error", "Unexpected server error", 500);
  }
}
