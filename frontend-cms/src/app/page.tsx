import { Suspense } from "react";
import { TireModelList } from "@/admin/tires/TireModelList";

export default function HomePage() {
  return <Suspense fallback={<main><h1>Шины</h1><p>Загружаем каталог…</p></main>}><TireModelList /></Suspense>;
}
