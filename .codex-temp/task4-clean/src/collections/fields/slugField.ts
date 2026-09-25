import { slugField as payloadSlugField } from "payload";

type SlugFieldOptions = {
  fieldToUse?: string;
  required?: boolean;
};

export function slugField({ fieldToUse = "name", required = true }: SlugFieldOptions = {}) {
  return payloadSlugField({
    fieldToUse,
    required,
  });
}
