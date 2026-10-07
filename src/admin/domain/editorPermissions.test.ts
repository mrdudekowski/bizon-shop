import { describe, expect, it } from "vitest";

import { canEditorPerform, type EditorAction } from "./editorPermissions";
import type { AdminSession } from "./types";

const ALL_ACTIONS: EditorAction[] = [
  "edit_catalog",
  "create_catalog_items",
  "edit_site_pages",
  "create_catalog_structure",
  "publish",
  "hide",
  "delete",
  "manage_users",
  "review_queue",
];

function session(role: AdminSession["role"], capabilities: AdminSession["capabilities"] = []): AdminSession {
  return { login: role === "admin" ? "admin" : "editor", role, capabilities };
}

describe("canEditorPerform", () => {
  it("allows an administrator every action", () => {
    for (const action of ALL_ACTIONS) {
      expect(canEditorPerform(session("admin"), action)).toBe(true);
    }
  });

  it("lets a basic editor edit the catalog and nothing else", () => {
    const editor = session("editor");
    expect(canEditorPerform(editor, "edit_catalog")).toBe(true);
    expect(canEditorPerform(editor, "create_catalog_items")).toBe(false);
    expect(canEditorPerform(editor, "edit_site_pages")).toBe(false);
    expect(canEditorPerform(editor, "create_catalog_structure")).toBe(false);
    expect(canEditorPerform(editor, "publish")).toBe(false);
    expect(canEditorPerform(editor, "hide")).toBe(false);
    expect(canEditorPerform(editor, "delete")).toBe(false);
    expect(canEditorPerform(editor, "manage_users")).toBe(false);
    expect(canEditorPerform(editor, "review_queue")).toBe(false);
  });

  it("honours create_catalog_items and edit_site_pages without unlocking publish", () => {
    const editor = session("editor", ["create_catalog_items", "edit_site_pages"]);
    expect(canEditorPerform(editor, "create_catalog_items")).toBe(true);
    expect(canEditorPerform(editor, "edit_site_pages")).toBe(true);
    expect(canEditorPerform(editor, "edit_catalog")).toBe(true);
    expect(canEditorPerform(editor, "publish")).toBe(false);
    expect(canEditorPerform(editor, "create_catalog_structure")).toBe(false);
    expect(canEditorPerform(editor, "manage_users")).toBe(false);
  });
});
