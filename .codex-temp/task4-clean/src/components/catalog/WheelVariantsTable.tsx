import Link from "next/link";
import type { CmsWheelModel, CmsWheelVariant } from "@/lib/cms/types";

type WheelVariantsTableProps = {
  model: CmsWheelModel;
  variants: CmsWheelVariant[];
  modelPath: string;
};

function formatSize(variant: CmsWheelVariant): string {
  if (variant.diameter != null && variant.width != null) {
    return `${variant.diameter}×${variant.width}`;
  }
  return variant.sizeLabel;
}

function formatPrice(variant: CmsWheelVariant): string {
  if (variant.priceOnRequest || variant.price == null) {
    return "По запросу";
  }
  return `${variant.price.toLocaleString("ru-RU")} ₽`;
}

function formatAvailability(available: boolean): string {
  return available ? "В наличии" : "Под заказ";
}

export function WheelVariantsTable({ variants, modelPath }: WheelVariantsTableProps) {
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
      <h2 className="section-title text-xl mb-4">Технические параметры</h2>
      <div className="card-base info-card w-full max-w-full min-w-0 overflow-x-auto">
        <table className="w-full max-w-full min-w-0 text-sm">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="py-2 pr-4 font-medium">Размер</th>
              <th className="py-2 pr-4 font-medium">PCD</th>
              <th className="py-2 pr-4 font-medium">ET</th>
              <th className="py-2 pr-4 font-medium">DIA</th>
              <th className="py-2 pr-4 font-medium">Нагрузка</th>
              <th className="py-2 pr-4 font-medium">Цвет</th>
              <th className="py-2 pr-4 font-medium">Покрытие</th>
              <th className="py-2 pr-4 font-medium">Наличие</th>
              <th className="py-2 pr-4 font-medium">Цена</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id} className="border-b border-border/60 last:border-0">
                <td className="py-3 pr-4 whitespace-nowrap">{formatSize(variant)}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.pcd ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.offsetET ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.centerBore ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.loadRating ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.color ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{variant.finish ?? "—"}</td>
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
