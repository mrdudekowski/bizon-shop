// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

const createAsset = vi.hoisted(() => vi.fn());
vi.mock("@/admin/client/localStore", () => ({
  browserAdminClient: () => ({ createAsset, listAssets: vi.fn().mockResolvedValue([]) }),
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => createElement("a", props, children),
}));

import { TextPageCanvas } from "@/admin/pages/TextPageCanvas";

const deliveryDraft = {
  id: "delivery" as const,
  seoTitle: "Доставка",
  seoDescription: "",
  hero: { eyebrow: "", title: "Доставка", lead: "" },
  documents: [],
};

describe("shared library upload", () => {
  it("shows Загрузить in the file modal and sends a header drop through that upload", async () => {
    createAsset.mockResolvedValue({ id: "asset-dropped" });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(createElement(TextPageCanvas, {
      draft: deliveryDraft,
      onChange,
      canPublish: false,
      publishing: false,
      dirty: false,
      onPublish: vi.fn(),
    }));

    await user.click(screen.getByRole("button", { name: "Изображение шапки" }));
    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    expect(screen.getByRole("button", { name: "Загрузить" })).toBeTruthy();

    const css = readFileSync("src/admin/pages/TextPageCanvas.module.css", "utf8");
    expect(css).toMatch(/\.imageButton\s*\{[^}]*dashed/);
    expect(css).toMatch(/\.imageButton\s*\{[^}]*border-radius/);

    const slot = screen.getByRole("button", { name: "Изображение шапки" });
    const dragOver = new Event("dragover", { bubbles: true, cancelable: true });
    slot.dispatchEvent(dragOver);
    expect(dragOver.defaultPrevented).toBe(true);

    fireEvent.drop(slot, { dataTransfer: { files: [new File(["pdf"], "policy.pdf", { type: "application/pdf" })] } });
    expect(createAsset).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toBeTruthy();

    fireEvent.drop(slot, {
      dataTransfer: {
        files: [
          new File(["pdf"], "skip.pdf", { type: "application/pdf" }),
          new File(["image"], "hero.png", { type: "image/x-png" }),
        ],
      },
    });
    await waitFor(() => expect(createAsset).toHaveBeenCalledWith(expect.objectContaining({ name: "hero.png", mimeType: "image/png" })));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      hero: expect.objectContaining({ image: expect.objectContaining({ assetId: "asset-dropped" }) }),
    }));
  });
});
