import { afterEach, describe, expect, it } from "vitest";
import { insertRequest } from "../insertRequest";
import { answersFromFields, pageFormFieldsAreValid, readPageFormDraft, requestFromAnswers, trustedAttachmentUrl, writePageForm } from "./pageForm";

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

describe("writePageForm", () => {
  const form = {
    successMessage: "Спасибо",
    fields: [
      { id: "companyName", label: "Название компании", type: "text" as const, required: true },
      { id: "catalogFile", label: "Файл", type: "file" as const, required: false },
    ],
  };

  it("upserts the form and replaces its fields in order", async () => {
    const calls: { sql: string; params?: unknown[] }[] = [];
    await writePageForm({ query: async (sql, params) => (calls.push({ sql, params }), []) }, "become-a-supplier", form);
    expect(calls[0].sql).toContain("INSERT INTO page_forms");
    expect(calls[0].params).toEqual(["become-a-supplier", "Спасибо"]);
    expect(calls[1].sql).toContain("DELETE FROM page_form_fields");
    expect(calls.slice(2).map((call) => call.params)).toEqual([
      ["become-a-supplier", "companyName", 0, "Название компании", "text", true],
      ["become-a-supplier", "catalogFile", 1, "Файл", "file", false],
    ]);
  });

  it("rejects a field type outside the six, a blank id, and a duplicate id", () => {
    const bad = (field: object) => pageFormFieldsAreValid([{ ...form.fields[0], ...field }] as never);
    expect(bad({ type: "number" })).toBe(false);
    expect(bad({ id: " " })).toBe(false);
    expect(pageFormFieldsAreValid([form.fields[0], form.fields[0]])).toBe(false);
    expect(pageFormFieldsAreValid(form.fields)).toBe(true);
  });
});

describe("readPageFormDraft", () => {
  it("returns an empty form when the page has no stored form", async () => {
    await expect(readPageFormDraft({ query: async () => [] }, "become-a-supplier")).resolves.toEqual({ successMessage: "", fields: [] });
  });
});