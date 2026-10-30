import { describe, expect, it, vi } from "vitest";

const createAsset = vi.hoisted(() => vi.fn());
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => ({ createAsset }) }));

import { firstAllowedFile, uploadLibraryFile } from "./uploadLibraryFile";
import { uploadErrorText } from "./uploadError";

describe("uploadLibraryFile", () => {
  it("creates a jpeg, png, or webp and refuses anything else before the server", async () => {
    createAsset.mockReset();
    createAsset.mockResolvedValue({ id: "asset-1" });
    const png = new File(["image"], "hero.png", { type: "image/png" });
    await expect(uploadLibraryFile(png, ["image/jpeg", "image/png", "image/webp"])).resolves.toEqual({ id: "asset-1" });
    expect(createAsset).toHaveBeenCalledWith(expect.objectContaining({ name: "hero.png", mimeType: "image/png" }));

    createAsset.mockClear();
    const pdf = new File(["pdf"], "policy.pdf", { type: "application/pdf" });
    await expect(uploadLibraryFile(pdf, ["image/jpeg", "image/png", "image/webp"])).rejects.toMatchObject({ code: "publish_blocked" });
    expect(createAsset).not.toHaveBeenCalled();
  });

  it("creates only a pdf when that is the filter", async () => {
    createAsset.mockReset();
    createAsset.mockResolvedValue({ id: "pdf-1" });
    const pdf = new File(["pdf"], "terms.pdf", { type: "application/pdf" });
    await expect(uploadLibraryFile(pdf, ["application/pdf"])).resolves.toEqual({ id: "pdf-1" });
    expect(createAsset).toHaveBeenCalledWith(expect.objectContaining({ name: "terms.pdf", mimeType: "application/pdf" }));

    createAsset.mockClear();
    await expect(uploadLibraryFile(new File(["image"], "hero.png", { type: "image/png" }), ["application/pdf"])).rejects.toMatchObject({ code: "publish_blocked" });
    expect(createAsset).not.toHaveBeenCalled();
  });

  it("keeps the first file whose type is allowed", () => {
    const pdf = new File(["pdf"], "policy.pdf", { type: "application/pdf" });
    const png = new File(["image"], "hero.png", { type: "image/png" });
    const files = { 0: pdf, 1: png, length: 2, *[Symbol.iterator]() { yield pdf; yield png; } } as FileList;
    expect(firstAllowedFile(files, ["image/jpeg", "image/png", "image/webp"])).toBe(png);
    expect(firstAllowedFile(files, ["application/pdf"])).toBe(pdf);
  });

  it("refuses a file that is not a picture and does not store it as a PNG", async () => {
    createAsset.mockReset();
    const notes = new File(["text"], "notes.txt", { type: "" });
    const allowed = ["image/jpeg", "image/png", "image/webp"] as const;
    await expect(uploadLibraryFile(notes, allowed)).rejects.toSatisfy((error: unknown) => {
      return uploadErrorText(error) === "Файл не подошёл. Нужны JPEG, PNG, WebP или PDF до 20 МБ.";
    });
    expect(createAsset).not.toHaveBeenCalled();
  });
});
