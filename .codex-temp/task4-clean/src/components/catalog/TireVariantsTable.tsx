import Link from "next/link";
import type { CmsTireModel, CmsTireVariant } from "@/lib/cms/types";

type TireVariantsTableProps = {
  model: CmsTireModel;
  variants: CmsTireVariant[];
  modelPath: string;
};

function formatPrice(variant: CmsTireVariant): string {
  if (variant.priceOnRequest || variant.price == null) {
    return "По запросу";
  }
  return `${variant.price.toLocaleString("ru-RU")} ₽`;
}

function formatAvailability(available: boolean): string {
  return available ? "В наличии" : "Под заказ";
}

export function TireVariantsTable({ variants, modelPath }: TireVariantsTableProps) {
  if (variants.length === 0) {
    return (
      <p className="section-description mt-6">
        Размеры для этой модели скоро появятся.{" "}
        <Link href="/contact" className="underline">
          Запросить подбор
        </Link>
      </p>
    );
  }

  return (
    <div className="mt-8 w-full max-w-full min-w-0">
      <h2 className="section-title text-xl mb-4">Доступные размеры</h2>
      <div className="card-base info-card w-full max-w-full min-w-0 overflow-x-auto">
        <table className="w-full max-w-full min-w-0 text-sm">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="py-2 pr-4 font-medium">Размер</th>
              <th className="py-2 pr-4 font-medium">Обод</th>
              <th className="py-2 pr-4 font-medium">LI</th>
              <th className="py-2 pr-4 font-medium">SI</th>
              <th className="py-2 pr-4 font-medium">PR</th>
              <th className="py-2 pr-4 font-medium">OD, мм</th>
              <th className="py-2 pr-4 font-medium">Масса, кг</th>
              <th className="py-2 pr-4 font-medium">Рек. обод</th>
              <th className="py-2 pr-4 font-medium">Наличие</th>
              <th className="py-2 pr-4 font-medium">Цена</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id} className="border-b border-border/60 last:border-0">
                <td className="py-3 pr-4 whitespace-nowrap">{variant.size}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.rimDiameter ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.loadIndex ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.speedIndex ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.plyRating ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.overallDiameter ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.weight ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.recommendedRim ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{formatAvailability(variant.available)}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{formatPrice(variant)}</td>
                <td className="py-3 whitespace-nowrap">
                  <Link
                    href={`${modelPath}?variant=${variant.id}#quick-order`}
                    className="btn-glass inline-flex text-xs px-3 py-1"
                  >
                    Запросить
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
