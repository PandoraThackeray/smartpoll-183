import { PollDetailPage } from "@/components/pages/poll-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PollDetailPage pollKey={id} />;
}
