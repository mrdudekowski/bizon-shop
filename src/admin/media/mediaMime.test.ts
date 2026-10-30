import { describe, expect, it } from "vitest";

import { mediaMimeFromFile } from "./mediaMime";

describe("mediaMimeFromFile", () => {
  it("maps Windows PNG labels to image/png", () => {
    expect(mediaMimeFromFile({ name: "camp.png", type: "application/octet-stream" })).toBe("image/png");
    expect(mediaMimeFromFile({ name: "camp.PNG", type: "IMAGE/PNG" })).toBe("image/png");
    expect(mediaMimeFromFile({ name: "camp.png", type: "image/x-png" })).toBe("image/png");
    expect(mediaMimeFromFile({ name: "camp.png", type: "image/png; charset=utf-8" })).toBe("image/png");
  });

  it("recognizes a JPEG that Windows named image/jpg even when the file name is not jpg", () => {
    expect(mediaMimeFromFile({ name: "scan.bin", type: "image/jpg" })).toBe("image/jpeg");
    expect(mediaMimeFromFile({ name: "scan.bin", type: "image/pjpeg" })).toBe("image/jpeg");
  });

  it("recognizes jpeg and webp by file name when Windows gives no picture type", () => {
    expect(mediaMimeFromFile({ name: "pic.jpg", type: "" })).toBe("image/jpeg");
    expect(mediaMimeFromFile({ name: "pic.jpeg", type: "application/octet-stream" })).toBe("image/jpeg");
    expect(mediaMimeFromFile({ name: "pic.webp", type: "" })).toBe("image/webp");
  });

  it("still recognizes a PDF by its file name", () => {
    expect(mediaMimeFromFile({ name: "terms.pdf", type: "" })).toBe("application/pdf");
  });

  it("does not call an unrecognized file a PNG", () => {
    expect(mediaMimeFromFile({ name: "notes.txt", type: "" })).toBe("");
  });
});
