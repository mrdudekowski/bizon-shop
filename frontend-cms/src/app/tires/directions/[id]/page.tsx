import { TireDirectionEditor } from "@/admin/tires/TireDirectionEditor";

export default async function TireDirectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TireDirectionEditor id={id} />;
}
