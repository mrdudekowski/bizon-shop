import type { SourceForm } from "@/types/requestItem";

export type ContactSubject =
  | "branding"
  | "supplier"
  | "warranty"
  | "tire-selection"
  | "procurement"
  | "wheel-selection";

export type ContactIntent = {
  subject?: ContactSubject;
  sourceForm: SourceForm;
  title: string;
  description: string;
  formEyebrow: string;
  formHeading: string;
  summaryLabel?: string;
};

const SUBJECT_MAP: Record<ContactSubject, Omit<ContactIntent, "subject">> = {
  branding: {
    sourceForm: "branding",
    title: "Обсудить брендирование",
    description: "Опишите задачу парка — команда BIZON подготовит предметный разговор о маркировке и поставке.",
    formEyebrow: "Индивидуальное брендирование",
    formHeading: "Оставьте контакт для проекта",
    summaryLabel: "Заявка по брендированию",
  },
  supplier: {
    sourceForm: "supplier",
    title: "Стать поставщиком",
    description: "Расскажите о компании и регионе — подготовим следующий шаг по сотрудничеству.",
    formEyebrow: "Партнёрство",
    formHeading: "Оставить заявку на сотрудничество",
    summaryLabel: "Заявка на партнёрство",
  },
  warranty: {
    sourceForm: "warranty",
    title: "Обращение по гарантии",
    description: "Передайте контакт и краткий контекст — специалист уточнит процедуру и необходимые документы.",
    formEyebrow: "Гарантия",
    formHeading: "Связаться по гарантийному вопросу",
    summaryLabel: "Обращение по гарантии",
  },
  "tire-selection": {
    sourceForm: "tire_selection",
    title: "Передать подбор специалисту",
    description: "Параметры подбора уже можно приложить — осталось указать удобный способ связи.",
    formEyebrow: "Подбор шин",
    formHeading: "Оставьте контакт для проверки",
    summaryLabel: "Подбор шин",
  },
  procurement: {
    sourceForm: "procurement",
    title: "Отправить спецификацию",
    description: "Укажите размер и количество — BIZON проверит подходящие модели, наличие и условия поставки.",
    formEyebrow: "Запрос по спецификации",
    formHeading: "Получить наличие и предложение",
    summaryLabel: "Запрос по спецификации",
  },
  "wheel-selection": {
    sourceForm: "wheel_selection",
    title: "Подбор кованых дисков",
    description: "Специалист проверит параметры автомобиля и возможность конфигурации.",
    formEyebrow: "BIZON Forged",
    formHeading: "Заявка на подбор дисков",
    summaryLabel: "Подбор дисков",
  },
};

const GENERIC_INTENT: ContactIntent = {
  sourceForm: "contact",
  title: "Контакты",
  description: "Расчёт, подбор шин и консультация для fleet-операторов.",
  formEyebrow: "Связаться с BIZON",
  formHeading: "Обсудим вашу задачу",
};

function asSubject(value: string | null | undefined): ContactSubject | undefined {
  if (!value) return undefined;
  if (value in SUBJECT_MAP) return value as ContactSubject;
  return undefined;
}

/** Parse contact intent from URL search params. Unknown subjects fall back to generic contact. */
export function resolveContactIntent(
  source: Pick<URLSearchParams, "get">,
  options: { hasSelectionContext?: boolean } = {},
): ContactIntent {
  const subject = asSubject(source.get("subject"));
  if (subject) {
    return { subject, ...SUBJECT_MAP[subject] };
  }
  if (options.hasSelectionContext) {
    return { subject: "tire-selection", ...SUBJECT_MAP["tire-selection"] };
  }
  return GENERIC_INTENT;
}
