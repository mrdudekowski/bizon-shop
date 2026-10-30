import { describe, expect, it } from "vitest";

import { editorialSaveBlockReason } from "./editorialSaveBlock";

describe("editorialSaveBlockReason", () => {
  it("allows a chapter that is only a paragraph", () => {
    expect(editorialSaveBlockReason("warranty", { features: [{ title: "" }], sections: [{ heading: "" }] })).toBeNull();
    expect(editorialSaveBlockReason("about", { sections: [{ heading: "  " }] })).toBeNull();
    expect(editorialSaveBlockReason("home", { sections: [{ heading: "" }] })).toBeNull();
  });
});
