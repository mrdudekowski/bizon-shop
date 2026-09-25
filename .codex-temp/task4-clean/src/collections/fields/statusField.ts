import type { Field } from "payload";

import { PUBLICATION_STATUSES } from "./constants";

type StatusFieldOptions = {
  sidebar?: boolean;
};

export function statusField({ sidebar = true }: StatusFieldOptions = {}): Field {
  return {
    name: "status",
    type: "select",
    label: "Статус публикации",
    required: true,
    defaultValue: "draft",
    options: [...PUBLICATION_STATUSES],
    admin: {
      position: sidebar ? "sidebar" : undefined,
    },
  };
}

export function publishedAtField(): Field {
  return {
    name: "publishedAt",
    type: "date",
    label: "Дата публикации",
    admin: {
      position: "sidebar",
      readOnly: true,
      date: {
        pickerAppearance: "dayAndTime",
      },
    },
  };
}
