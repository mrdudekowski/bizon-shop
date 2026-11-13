import { describe, expect, it } from "vitest";

import { ERROR_TEXT } from "./errorText";

describe("admin error copy", () => {
  it("uses neutral copy for database writes and keeps upload copy file-specific", () => {
    expect(ERROR_TEXT["database_write_failed" as keyof typeof ERROR_TEXT]).toMatch(/сохран|публикац/i);
    expect(ERROR_TEXT["database_write_failed" as keyof typeof ERROR_TEXT]).not.toMatch(/файл|загруз/i);
    expect(ERROR_TEXT.database_save_failed).toMatch(/файл|загруз/i);
  });
});
