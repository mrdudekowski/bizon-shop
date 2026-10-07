// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { MaterialEditor } from "./MaterialEditor";

afterEach(cleanup);

describe("MaterialEditor load errors", () => {
  it("shows a recoverable error when the material cannot be loaded", async () => {
    const getMaterial = vi.fn()
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockRejectedValueOnce(new Error("still unavailable"));
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "editor", capabilities: ["edit_site_pages"] }),
      getMaterial,
    };

    render(createElement(MaterialEditor, { id: "article-1" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Повторить" }));
    await waitFor(() => expect(getMaterial).toHaveBeenCalledTimes(2));
  });
});
