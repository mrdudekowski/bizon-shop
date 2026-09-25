import type { Field } from "payload";

export const TIRE_POSITION_OPTIONS = [
  { label: "Рулевая ось", value: "steer" },
  { label: "Ведущая ось", value: "drive" },
  { label: "Прицепная ось", value: "trailer" },
] as const;

export const TIRE_APPLICATION_OPTIONS = [
  { label: "Магистральные перевозки", value: "long-haul" },
  { label: "Региональные перевозки", value: "regional" },
  { label: "Городская эксплуатация", value: "urban" },
  { label: "Бездорожье / карьер", value: "off-road" },
  { label: "Зимняя эксплуатация", value: "winter" },
  { label: "Снег и грязь", value: "snow-mud" },
] as const;

export const TIRE_PERFORMANCE_FEATURE_OPTIONS = [
  { label: "Управляемость", value: "handling" },
  { label: "Безопасность", value: "safety" },
  { label: "Высокий пробег", value: "high-mileage" },
  { label: "Экономичность", value: "economy" },
  { label: "Сцепление на мокрой дороге", value: "wet-grip" },
  { label: "Износостойкость", value: "anti-wear" },
  { label: "Стойкость к разрывам", value: "anti-tear" },
  { label: "Короткий тормозной путь", value: "short-braking-distance" },
  { label: "Низкий уровень шума", value: "low-noise" },
  { label: "Высокая грузоподъёмность", value: "heavy-load" },
  { label: "Самоочищение", value: "self-cleaning" },
  { label: "Восстанавливаемость", value: "retreadability" },
  { label: "Удаление камней", value: "stone-ejection" },
  { label: "Низкое сопротивление качению", value: "low-rolling-resistance" },
  { label: "Теплоотвод", value: "heat-dissipation" },
  { label: "Стойкость к порезам", value: "cut-resistance" },
  { label: "Стойкость к проколам", value: "puncture-resistance" },
] as const;

export const TIRE_SPEED_SYMBOL_OPTIONS = [
  { label: "B", value: "B" },
  { label: "F", value: "F" },
  { label: "G", value: "G" },
  { label: "J", value: "J" },
  { label: "K", value: "K" },
  { label: "L", value: "L" },
  { label: "M", value: "M" },
] as const;

export function tireModelTaxonomyFields(): Field[] {
  return [
    {
      name: "positions",
      type: "select",
      label: "Позиции установки",
      hasMany: true,
      options: [...TIRE_POSITION_OPTIONS],
      admin: {
        description: "Контролируемые model-level значения для фильтрации.",
      },
    },
    {
      name: "applicationTypes",
      type: "select",
      label: "Назначения",
      hasMany: true,
      options: [...TIRE_APPLICATION_OPTIONS],
      admin: {
        description: "Канонический справочник из workbook.",
      },
    },
  ];
}

export function tireModelFeaturesField(): Field {
  return {
    name: "features",
    type: "array",
    label: "Характеристики",
    labels: {
      singular: "Характеристика",
      plural: "Характеристики",
    },
    admin: {
      description:
        "Публикуются на карточке модели на сайте. Порядок = порядок на сайте.",
    },
    fields: [
      {
        name: "key",
        type: "select",
        label: "Тип",
        required: true,
        options: [...TIRE_PERFORMANCE_FEATURE_OPTIONS],
      },
      {
        name: "title",
        type: "text",
        label: "Заголовок",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        label: "Описание",
      },
    ],
  };
}

export function tireVariantIdentityFields(): Field[] {
  return [
    {
      name: "sku",
      type: "text",
      label: "SKU",
      unique: true,
      index: true,
    },
    {
      name: "supplierSku",
      type: "text",
      label: "SKU поставщика",
      admin: {
        description: "Заполняется только из подтверждённого коммерческого источника.",
      },
    },
  ];
}

export function tireVariantTechnicalFields(): Field[] {
  return [
    {
      name: "sizeRaw",
      type: "text",
      label: "Исходный размер",
      admin: {
        description: "Например, 315/80R22.5 или 12.00R20.",
      },
    },
    {
      name: "sizeNormalized",
      type: "text",
      label: "Нормализованный размер",
      index: true,
      admin: { readOnly: true },
    },
    {
      name: "sizeFormat",
      type: "select",
      label: "Формат размера",
      options: [
        { label: "Метрический", value: "metric" },
        { label: "Дюймовый", value: "imperial" },
      ],
      admin: { readOnly: true },
    },
    {
      type: "row",
      fields: [
        {
          name: "nominalWidthMm",
          type: "number",
          label: "Номинальная ширина, мм",
          index: true,
          admin: {
            condition: (_, siblingData) => siblingData?.sizeFormat === "metric",
          },
        },
        {
          name: "imperialWidthIn",
          type: "number",
          label: "Ширина, дюймы",
          index: true,
          admin: {
            condition: (_, siblingData) => siblingData?.sizeFormat === "imperial",
          },
        },
        {
          name: "aspectRatioPct",
          type: "number",
          label: "Профиль, %",
          index: true,
          admin: {
            condition: (_, siblingData) => siblingData?.sizeFormat === "metric",
          },
        },
        {
          name: "constructionCode",
          type: "select",
          label: "Конструкция",
          options: [{ label: "Радиальная", value: "R" }],
        },
        {
          name: "rimDiameterIn",
          type: "number",
          label: "Посадочный диаметр, дюймы",
          index: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "plyRatingPr",
          type: "number",
          label: "Слойность, PR",
          index: true,
        },
        {
          name: "treadDepthMm",
          type: "number",
          label: "Глубина протектора, мм",
        },
        {
          name: "standardRimIn",
          type: "number",
          label: "Стандартный обод, дюймы",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "pressureSingleKpa",
          type: "number",
          label: "Давление (одиночное), кПа",
        },
        {
          name: "pressureDualKpa",
          type: "number",
          label: "Давление (сдвоенное), кПа",
        },
        {
          name: "maxLoadSingleKg",
          type: "number",
          label: "Макс. нагрузка (одиночная), кг",
          index: true,
        },
        {
          name: "maxLoadDualKg",
          type: "number",
          label: "Макс. нагрузка (сдвоенная), кг",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "loadIndexSingle",
          type: "number",
          label: "Индекс нагрузки (одиночный)",
          index: true,
        },
        {
          name: "loadIndexDual",
          type: "number",
          label: "Индекс нагрузки (сдвоенный)",
        },
        {
          name: "speedSymbol",
          type: "select",
          label: "Индекс скорости",
          options: [...TIRE_SPEED_SYMBOL_OPTIONS],
          index: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "overallDiameterMm",
          type: "number",
          label: "Наружный диаметр, мм",
        },
        {
          name: "sectionWidthMm",
          type: "number",
          label: "Фактическая ширина профиля, мм",
        },
      ],
    },
  ];
}

export function tireCommercialFields(): Field[] {
  return [
    {
      type: "row",
      fields: [
        {
          name: "price",
          type: "number",
          label: "Цена, ₽",
          min: 0,
          admin: {
            description: "Если не заполнено, используется существующий CTA заявки.",
          },
        },
        {
          name: "availabilityStatus",
          type: "select",
          label: "Коммерческая доступность",
          defaultValue: "on_request",
          options: [
            { label: "Доступно", value: "available" },
            { label: "По запросу", value: "on_request" },
            { label: "Недоступно", value: "unavailable" },
          ],
        },
      ],
    },
  ];
}

export function tireSourceSnapshotField(): Field {
  return {
    name: "sourceSnapshot",
    type: "group",
    label: "Снимок источника",
    admin: {
      readOnly: true,
      description: "Неизменяемый provenance; обновляется только импортом.",
    },
    fields: [
      { name: "sourceDocument", type: "text", label: "Документ" },
      { name: "sourceSheet", type: "text", label: "Лист" },
      { name: "sourcePage", type: "number", label: "Страница" },
      { name: "sourceRowNumber", type: "number", label: "Строка" },
      { name: "sourceDataRaw", type: "json", label: "Исходные данные" },
      { name: "sourceUnitLabels", type: "json", label: "Исходные единицы" },
      { name: "importedAt", type: "date", label: "Импортировано" },
      { name: "importBatchId", type: "text", label: "Пакет импорта" },
    ],
  };
}
