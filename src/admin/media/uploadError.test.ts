import { describe, expect, it } from "vitest";

import { AdminClientError } from "@/admin/client/errors";
import { uploadErrorText } from "./uploadError";

describe("uploadErrorText", () => {
  it("explains an unavailable file store without exposing S3 terminology", () => {
    const text = uploadErrorText(new AdminClientError("storage_unavailable"));
    expect(text).toMatch(/Хранилище файлов.*недоступно/i);
    expect(text).not.toMatch(/S3|бакет/i);
  });

  it("explains when the database is unavailable before upload", () => {
    expect(uploadErrorText(new AdminClientError("database_unavailable"))).toMatch(/база.*недоступна/i);
  });

  it("explains when saving file details fails and upload is cancelled", () => {
    expect(uploadErrorText(new AdminClientError("database_save_failed"))).toMatch(/не удалось сохранить.*загрузка отменена/i);
  });

  it("says the server is unreachable on a network error", () => {
    const text = uploadErrorText(new AdminClientError("network"));
    expect(text).toMatch(/связ|сервер/i);
    expect(text).not.toMatch(/S3/);
  });

  it("explains when failed upload cleanup is pending", () => {
    expect(uploadErrorText(new AdminClientError("media_cleanup_pending"))).toMatch(/очистк/);
  });

  it("explains a rejected file without calling it a publish block", () => {
    const text = uploadErrorText(new AdminClientError("publish_blocked"));
    expect(text).toMatch(/JPEG|PNG|WebP|PDF|20/);
    expect(text).not.toMatch(/Публикация закрыта/);
  });

  it("falls back when the failure is unknown", () => {
    expect(uploadErrorText(new Error("nope"))).toMatch(/Не удалось загрузить/);
  });
});
