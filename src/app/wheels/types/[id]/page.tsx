import { WheelTypeEditor } from "@/admin/wheels/WheelTypeEditor";

export default async function WheelTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WheelTypeEditor id={id} />;
}
