import { describe, expect, it } from "vitest";

import { editorialSaveBlockReason } from "./editorialSaveBlock";

describe("editorialSaveBlockReason", () => {
  it("blocks a service page while a point or section has no heading", () => {
    expect(editorialSaveBlockReason("warranty", { features: [{ title: "" }], sections: [] })).toMatch(/заголовок/i);
    expect(editorialSaveBlockReason("about", { sections: [{ heading: "  " }] })).toMatch(/заголовок/i);
  });

  it("allows a complete service page and ignores other editors", () => {
    expect(editorialSaveBlockReason("about", {
      features: [{ title: "Шаг" }],
      sections: [{ heading: "Срок" }],
    })).toBeNull();
    expect(editorialSaveBlockReason("home", { sections: [{ heading: "" }] })).toBeNull();
    expect(editorialSaveBlockReason("contact", { features: [{ title: "" }] })).toBeNull();
  });
});