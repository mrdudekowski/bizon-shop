// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: null as { login: string; role: string; capabilities: string[] } | null,
  listRequests: vi.fn(async () => []),
  updateRequestStatus: vi.fn(),
}));

vi.mock("@/admin/client/localStore", () => ({
  browserAdminClient: () => ({ listRequests: mocks.listRequests, updateRequestStatus: mocks.updateRequestStatus }),
}));
vi.mock("@/admin/ui/DocumentUI", () => ({ useAdminSession: () => mocks.session }));

import { RequestsList } from "./RequestsList";

afterEach(cleanup);
beforeEach(() => {
  mocks.session = null;
  mocks.listRequests.mockClear();
  mocks.updateRequestStatus.mockClear();
  mocks.listRequests.mockResolvedValue([]);
});

describe("RequestsList access", () => {
  it("does not load request PII for a viewer", () => {
    mocks.session = { login: "read-only", role: "viewer", capabilities: [] };
    render(<RequestsList />);

    expect(screen.getByText("Раздел доступен администраторам и менеджерам продаж.")).toBeTruthy();
    expect(mocks.listRequests).not.toHaveBeenCalled();
  });

  it("loads requests for a sales manager", async () => {
    mocks.session = { login: "sales", role: "sales_manager", capabilities: [] };
    render(<RequestsList />);

    await waitFor(() => expect(mocks.listRequests).toHaveBeenCalledOnce());
  });
});