import { DataProps } from "@/types/dataProps";
import ClientSide from "./components/ClientSide";

// Main page component
export default async function DetailPage() {
  const response = await fetch(
    `https://claying.shop/briefing/top_videos/HULbCjTw3tw`
  );
  const data = await response.json();
  const detailData: DataProps | null = data[0] || null;

  return <ClientSide detailData={detailData} id="HULbCjTw3tw" />;
}
