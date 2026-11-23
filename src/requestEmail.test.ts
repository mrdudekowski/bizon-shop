import { describe, expect, it } from "vitest";
import { buildRequestEmail } from "./requestEmail";

describe("buildRequestEmail", () => {
  it("includes submitted answers and items as text and escaped HTML", () => {
    const email = buildRequestEmail({
      id: 42,
      name: "<script>alert(1)</script>",
      email: "buyer@example.com",
      form_answers: { project: "Карьер <Север>" },
      items: [{ item_name: "Шина", variant_label: "315/80", quantity: 4 }],
    }, { to: "info@bizontop.ru", from: "Bizon <noreply@bizontop.ru>" });

    expect(email.to).toBe("info@bizontop.ru");
    expect(email.replyTo).toBe("buyer@example.com");
    expect(email.text).toContain("Карьер <Север>");
    expect(email.text).toContain("1. Шина · 315/80 · количество: 4");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });

  it("does not turn unsafe attachment schemes into clickable links", () => {
    const email = buildRequestEmail({ id: 7, attachment_url: "javascript:alert(1)" }, { to: "info@bizontop.ru", from: "noreply@bizontop.ru" });
    expect(email.html).not.toContain('href="javascript:');
    expect(email.html).toContain("javascript:alert(1)");
  });
});
