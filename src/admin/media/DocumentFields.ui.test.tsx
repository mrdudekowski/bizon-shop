// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ createAsset: vi.fn(), listAssets: vi.fn() }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => client }));

import { DocumentFields } from "./DocumentFields";

afterEach(cleanup);

describe("DocumentFields", () => {
  it("uploads a PDF and returns its media id and editable title", async () => {
    const onChange = vi.fn();
    client.createAsset.mockResolvedValue({ id: "pdf-1" });
    client.listAssets.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<DocumentFields value={[]} onChange={onChange} />);

    await user.upload(screen.getByLabelText("Загрузить PDF"), new File(["pdf"], "terms.pdf", { type: "application/pdf" }));

    expect(onChange).toHaveBeenCalledWith([{ assetId: "pdf-1", title: "terms.pdf" }]);
  });

  it("selects an unused PDF from media without offering image assets", async () => {
    const onChange = vi.fn();
    client.listAssets.mockResolvedValue([
      { id: "pdf-2", name: "manual.pdf", mimeType: "application/pdf", dataUrl: "https://cdn.test/manual.pdf", usedBy: [] },
      { id: "image-1", name: "photo.png", mimeType: "image/png", dataUrl: "https://cdn.test/photo.png", usedBy: [] },
    ]);
    const user = userEvent.setup();
    render(<DocumentFields value={[]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Выбрать PDF из галереи" }));
    expect(await screen.findByRole("heading", { name: "Выбрать PDF-документ" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Выбрать manual.pdf" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Выбрать photo.png" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Выбрать manual.pdf" }));

    expect(onChange).toHaveBeenCalledWith([{ assetId: "pdf-2", title: "manual.pdf" }]);
  });
});
