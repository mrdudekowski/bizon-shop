export type TelegramSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
}

export async function sendTelegramNotification(text: string): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return { ok: false, error: "Telegram is not configured" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };

    if (!response.ok || !payload.ok) {
      return {
        ok: false,
        error: payload.description ?? `Telegram API HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      messageId: String(payload.result?.message_id ?? ""),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram request failed";
    return { ok: false, error: message };
  }
}
