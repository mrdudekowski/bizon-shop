import { MaterialEditor } from "@/admin/materials/MaterialEditor";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MaterialEditor id={id} />;
}
