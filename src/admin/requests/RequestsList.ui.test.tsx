// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeadRequestRecord } from "@/admin/domain/types";

const mocks = vi.hoisted(() => ({
  session: null as { login: string; role: string; capabilities: string[] } | null,
  listRequests: vi.fn(async (): Promise<LeadRequestRecord[]> => []),
  updateRequestStatus: vi.fn(),
  retryRequestEmailNotification: vi.fn(),
}));

vi.mock("@/admin/client/localStore", () => ({
  browserAdminClient: () => ({ listRequests: mocks.listRequests, updateRequestStatus: mocks.updateRequestStatus, retryRequestEmailNotification: mocks.retryRequestEmailNotification }),
}));
vi.mock("@/admin/ui/DocumentUI", () => ({ useAdminSession: () => mocks.session }));

import { RequestsList } from "./RequestsList";

afterEach(cleanup);
beforeEach(() => {
  mocks.session = null;
  mocks.listRequests.mockClear();
  mocks.updateRequestStatus.mockClear();
  mocks.retryRequestEmailNotification.mockClear();
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

  it("shows saved answers and lets a request manager requeue a final email failure", async () => {
    mocks.session = { login: "sales", role: "sales_manager", capabilities: [] };
    mocks.listRequests.mockResolvedValue([{
      id: "42", status: "new", clientType: "company", name: "Анна", phone: "+7000000",
      sourceForm: "shop_supplier", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
      items: [], formAnswers: { "Название компании": "ООО Ромашка" }, attachmentUrl: "https://media.bizontop.ru/request.pdf",
      emailNotificationStatus: "failed_final",
    }]);
    mocks.retryRequestEmailNotification.mockResolvedValue(undefined);
    render(<RequestsList />);

    expect(await screen.findByText("ООО Ромашка")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Открыть файл заявки" }).getAttribute("href")).toBe("https://media.bizontop.ru/request.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Повторить email" }));

    await waitFor(() => expect(mocks.retryRequestEmailNotification).toHaveBeenCalledWith("42"));
    await waitFor(() => expect(mocks.listRequests).toHaveBeenCalledTimes(2));
  });
});
