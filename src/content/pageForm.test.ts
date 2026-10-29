import { afterEach, describe, expect, it } from "vitest";
import { insertRequest } from "../insertRequest";
import { answersFromFields, requestFromAnswers, trustedAttachmentUrl } from "./pageForm";

const fields = [
  { id: "companyName", label: "Название компании", type: "text" as const, required: true },
  { id: "companySite", label: "Сайт компании", type: "url" as const, required: false },
];

describe("answersFromFields", () => {
  it("requires the marked fields and keeps companySite off the honeypot key", () => {
    expect(answersFromFields(fields, { companySite: "https://mill.ru" }).missing).toEqual(["companyName"]);
    expect(
      answersFromFields(fields, { companyName: "Мил", companySite: "https://mill.ru" }).answers.companySite,
    ).toBe("https://mill.ru");
  });

  it("never copies the honeypot key into answers and treats blank required values as missing", () => {
    const { answers, missing } = answersFromFields(fields, {
      website: "https://bot.example",
      companyName: "   ",
      companySite: "https://mill.ru",
      unknownField: "dropped",
    });
    expect(answers).toEqual({ companySite: "https://mill.ru" });
    expect(answers).not.toHaveProperty("website");
    expect(missing).toEqual(["companyName"]);
  });
});

describe("trustedAttachmentUrl", () => {
  const base = "https://cdn.example/bizon/requests/";

  it("keeps only URLs under the configured public media base", () => {
    expect(trustedAttachmentUrl(`${base}a.pdf`, base)).toBe(`${base}a.pdf`);
    expect(trustedAttachmentUrl("https://evil.example/file.pdf", base)).toBeNull();
    expect(trustedAttachmentUrl("https://cdn.example/bizon/requests.evil.example/a.pdf", base)).toBeNull();
    expect(trustedAttachmentUrl(undefined, base)).toBeNull();
    expect(trustedAttachmentUrl(`${base}a.pdf`, null)).toBeNull();
  });
});

describe("requestFromAnswers", () => {
  it("fills the legacy request columns from supplier answers", () => {
    const stored = requestFromAnswers(
      {
        contactName: "Иван",
        companyName: "Мил",
        phone: "+7000",
        email: "a@b.ru",
        region: "Казань",
        category: "Шины",
      },
      { sourceForm: "supplier", sourcePage: "/become-a-supplier" },
    );
    expect(stored).toMatchObject({
      name: "Иван",
      companyName: "Мил",
      phone: "+7000",
      email: "a@b.ru",
      city: "Казань",
      sourceForm: "supplier",
      formAnswers: { category: "Шины" },
    });
  });

  it("lets a geography answer called name fill the name column", () => {
    expect(requestFromAnswers({ name: "Пётр" }, { sourceForm: "delivery_quote" }).name).toBe("Пётр");
  });
});

describe("insertRequest attachment guard", () => {
  const previousPublicUrl = process.env.S3_PUBLIC_URL;
  afterEach(() => {
    if (previousPublicUrl === undefined) delete process.env.S3_PUBLIC_URL;
    else process.env.S3_PUBLIC_URL = previousPublicUrl;
  });

  async function storedAttachment(attachmentUrl: string): Promise<unknown> {
    process.env.S3_PUBLIC_URL = "https://cdn.example/bizon";
    let params: unknown[] | undefined;
    await insertRequest(
      {
        async query(sql, queryParams) {
          if (sql.includes("INSERT INTO requests (")) params = queryParams;
          return [{ id: 1 }];
        },
      },
      { name: "Иван", sourceForm: "supplier", formAnswers: { catalogFile: attachmentUrl }, attachmentUrl },
    );
    return params?.at(-1);
  }

  it("stores our own URL and nulls any other", async () => {
    expect(await storedAttachment("https://cdn.example/bizon/requests/a.pdf")).toBe(
      "https://cdn.example/bizon/requests/a.pdf",
    );
    expect(await storedAttachment("https://evil.example/file.pdf")).toBeNull();
  });
});
