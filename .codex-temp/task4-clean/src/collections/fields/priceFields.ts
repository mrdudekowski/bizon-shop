import type { Field } from "payload";

export function priceFieldsRow(): Field {
  return {
    type: "row",
    fields: [
      {
        name: "price",
        type: "number",
        label: "Цена",
        admin: {
          condition: (_, siblingData) => !siblingData?.priceOnRequest,
        },
      },
      {
        name: "priceOnRequest",
        type: "checkbox",
        label: "Цена по запросу",
        defaultValue: true,
      },
    ],
  };
}
