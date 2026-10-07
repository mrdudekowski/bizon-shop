import { PublicationDetail } from "@/admin/publications/PublicationDetail";

export default async function PublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicationDetail id={id} />;
}
