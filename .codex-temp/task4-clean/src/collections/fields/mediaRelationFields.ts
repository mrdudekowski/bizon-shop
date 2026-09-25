import type { Field } from "payload";

type MediaFieldOptions = {
  name?: string;
  label?: string;
  required?: boolean;
};

export function mainImageField({
  name = "mainImage",
  label = "Главное изображение",
  required = false,
}: MediaFieldOptions = {}): Field {
  return {
    name,
    type: "upload",
    relationTo: "media",
    label,
    required,
  };
}

export function galleryField({
  name = "gallery",
  label = "Галерея",
}: MediaFieldOptions = {}): Field {
  return {
    name,
    type: "upload",
    relationTo: "media",
    label,
    hasMany: true,
  };
}

export function documentsField({
  name = "documents",
  label = "Документы",
}: MediaFieldOptions = {}): Field {
  return {
    name,
    type: "upload",
    relationTo: "media",
    label,
    hasMany: true,
  };
}
