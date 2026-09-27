import { Suspense } from "react";
import { WheelModelList } from "@/admin/wheels/WheelModelList";

export default function WheelsPage() {
  return <Suspense fallback={<main><h1>Диски</h1><p>Загружаем каталог…</p></main>}><WheelModelList /></Suspense>;
}
