// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { MaterialList } from "./MaterialList";

afterEach(cleanup);

describe("MaterialList load errors", () => {
  it("shows an error with retry instead of claiming the catalog is empty", async () => {
    const listMaterials = vi.fn().mockRejectedValueOnce(new Error("database unavailable")).mockResolvedValueOnce([]);
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "editor", capabilities: ["edit_site_pages"] }),
      listMaterials,
      listAssets: vi.fn().mockResolvedValue([]),
    };

    render(createElement(MaterialList));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeTruthy();
    expect(screen.queryByText("Материалов пока нет")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Повторить" }));
    await waitFor(() => expect(listMaterials).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Материалов пока нет")).toBeTruthy();
  });
});
