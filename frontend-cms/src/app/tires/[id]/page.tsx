import { TireModelEditor } from "@/admin/tires/TireModelEditor";

export default async function TireModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TireModelEditor id={id} />;
}
