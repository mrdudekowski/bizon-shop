export type ValidationWarning = {
  code: string;
  severity: "warning" | "critical";
  field?: string;
  message: string;
};

export type ModelPublicationInput = {
  name?: string | null;
  slug?: string | null;
  tireType?: string | number | null;
  mainImage?: string | number | null;
  warnings?: readonly ValidationWarning[];
};

export type VariantPublicationInput = {
  sku?: string | null;
  tireModel?: string | number | null;
  parsedSize?: boolean;
  sizeNormalized?: string | null;
  model?: { status?: "draft" | "published" | "archived" | null } | null;
  hasDuplicateSku?: boolean;
  warnings?: readonly ValidationWarning[];
};

export type PublicationValidationResult = {
  canPublish: boolean;
  warnings: ValidationWarning[];
};

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function critical(code: string, message: string, field?: string): ValidationWarning {
  return { code, severity: "critical", field, message };
}

function result(warnings: ValidationWarning[]): PublicationValidationResult {
  return {
    canPublish: !warnings.some((w) => w.severity === "critical"),
    warnings,
  };
}

export function validateModelPublication(
  input: ModelPublicationInput,
): PublicationValidationResult {
  const warnings = [...(input.warnings ?? [])];
  if (isBlank(input.name)) {
    warnings.push(critical("required_field", "Укажите название модели", "name"));
  }
  if (isBlank(input.slug)) {
    warnings.push(critical("required_field", "Укажите slug", "slug"));
  }
  if (input.tireType == null || String(input.tireType).trim() === "") {
    warnings.push(critical("required_field", "Выберите тип шин", "tireType"));
  }
  if (input.mainImage == null || input.mainImage === "") {
    warnings.push(
      critical("required_field", "Добавьте главное изображение", "mainImage"),
    );
  }
  return result(warnings);
}

export function validateVariantPublication(
  input: VariantPublicationInput,
): PublicationValidationResult {
  const warnings = [...(input.warnings ?? [])];
  if (input.tireModel == null || String(input.tireModel).trim() === "") {
    warnings.push(critical("required_field", "Выберите модель шины", "tireModel"));
  }
  if (input.model?.status !== "published") {
    warnings.push(
      critical(
        "model_not_publishable",
        "Сначала опубликуйте модель шины",
        "tireModel",
      ),
    );
  }
  if (isBlank(input.sku)) {
    warnings.push(critical("required_field", "Укажите SKU", "sku"));
  }
  if (input.hasDuplicateSku) {
    warnings.push(critical("duplicate_sku", "SKU уже используется", "sku"));
  }
  if (!input.parsedSize || isBlank(input.sizeNormalized)) {
    warnings.push(
      critical(
        "size_parse_required",
        "Укажите размер, который система может разобрать",
        "sizeRaw",
      ),
    );
  }
  return result(warnings);
}
