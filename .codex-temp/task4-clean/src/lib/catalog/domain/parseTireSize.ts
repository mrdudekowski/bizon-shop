import type {
  ConstructionCode,
  SizeFormat,
} from "./tireCatalog";

type ParsedSizeBase = {
  sizeRaw: string;
  sizeNormalized: string;
  sizeFormat: SizeFormat;
  constructionCode: ConstructionCode;
  rimDiameterIn: number;
};

export type ParsedMetricSize = ParsedSizeBase & {
  sizeFormat: "metric";
  nominalWidthMm: number;
  aspectRatioPct: number;
};

export type ParsedImperialSize = ParsedSizeBase & {
  sizeFormat: "imperial";
  imperialWidthIn: number;
};

export type ParseTireSizeResult =
  | { ok: true; value: ParsedMetricSize | ParsedImperialSize }
  | {
      ok: false;
      code: "blank" | "unsupported_format" | "invalid_value";
      raw: string;
    };

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function parseTireSize(input: string): ParseTireSizeResult {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, code: "blank", raw };
  }

  const metric = raw.match(
    /^(\d{2,3})\s*\/\s*(\d{1,3})\s*([rRdDbB])\s*(\d{1,2}(?:\.\d+)?)$/,
  );
  if (metric) {
    const nominalWidthMm = Number(metric[1]);
    const aspectRatioPct = Number(metric[2]);
    const constructionCode = metric[3].toLocaleUpperCase(
      "en-US",
    ) as ConstructionCode;
    const rimDiameterIn = Number(metric[4]);

    if (
      !isPositive(nominalWidthMm) ||
      !isPositive(aspectRatioPct) ||
      aspectRatioPct > 100 ||
      !isPositive(rimDiameterIn)
    ) {
      return { ok: false, code: "invalid_value", raw };
    }

    return {
      ok: true,
      value: {
        sizeRaw: raw,
        sizeNormalized: `${nominalWidthMm}/${aspectRatioPct}${constructionCode}${rimDiameterIn}`,
        sizeFormat: "metric",
        nominalWidthMm,
        aspectRatioPct,
        constructionCode,
        rimDiameterIn,
      },
    };
  }

  const imperial = raw.match(
    /^(\d{1,2}\.\d{2})\s*([rRdDbB])\s*(\d{1,2}(?:\.\d+)?)$/,
  );
  if (imperial) {
    const imperialWidthIn = Number(imperial[1]);
    const constructionCode = imperial[2].toLocaleUpperCase(
      "en-US",
    ) as ConstructionCode;
    const rimDiameterIn = Number(imperial[3]);

    if (!isPositive(imperialWidthIn) || !isPositive(rimDiameterIn)) {
      return { ok: false, code: "invalid_value", raw };
    }

    return {
      ok: true,
      value: {
        sizeRaw: raw,
        sizeNormalized: `${imperialWidthIn.toFixed(2)}${constructionCode}${rimDiameterIn}`,
        sizeFormat: "imperial",
        imperialWidthIn,
        constructionCode,
        rimDiameterIn,
      },
    };
  }

  return { ok: false, code: "unsupported_format", raw };
}
