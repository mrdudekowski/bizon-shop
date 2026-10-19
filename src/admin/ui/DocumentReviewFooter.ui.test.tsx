// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import { DocumentReviewFooter } from "./DocumentReviewFooter";

afterEach(cleanup);

describe("DocumentReviewFooter feedback", () => {
  it("announces a saved draft as a status", async () => {
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "editor", capabilities: [] }),
      listChangeSets: vi.fn().mockResolvedValue([]),
    };
    render(createElement(DocumentReviewFooter, {
      entityType: "page",
      entityId: "about",
      dirty: false,
      saving: false,
      message: "Черновик сохранён",
      onSave: vi.fn().mockResolvedValue(undefined),
    }));

    expect((await screen.findByRole("status")).textContent).toContain("Черновик сохранён");
  });

  it("announces a failed action as an alert", async () => {
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "editor", capabilities: [] }),
      listChangeSets: vi.fn().mockResolvedValue([]),
    };
    render(createElement(DocumentReviewFooter, {
      entityType: "page",
      entityId: "about",
      dirty: false,
      saving: false,
      message: "Ошибка сохранения",
      onSave: vi.fn().mockResolvedValue(undefined),
    }));

    expect((await screen.findByRole("alert")).textContent).toContain("Ошибка сохранения");
  });
});
