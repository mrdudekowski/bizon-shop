import { WheelModelEditor } from "@/admin/wheels/WheelModelEditor";

export default async function WheelModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WheelModelEditor id={id} />;
}
