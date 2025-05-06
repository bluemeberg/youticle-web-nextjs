import NotFoundPage from "@/editor/[id]/components/NotFound";
import ClientSide from "@/studio/[id]/components/ClientSide";
import { Metadata } from "next";
// import ClientSide from "./components/ClientSide";
import ClientSide2 from "./components/ClientSide2";
// import NotFoundPage from "./components/NotFound";

interface StudioVideoDetailPageProps {
  params: {
    channelHandle: string; // ex) "@YahooFinance"
    videoId: string; // ex) "abc123XYZ"
  };
  searchParams: {
    source?: string;
    task_id?: string;
  };
}

// // (선택) 페이지 <head> 메타데이터 동적 생성
// export async function generateMetadata({
//   params,
// }: StudioVideoDetailPageProps): Promise<Metadata> {
//   const { channelHandle, videoId } = params;
//   // 백엔드 호출로 메타데이터를 받아온다면:
//   // const response = await fetch(`https://youticle.shop/.../${videoId}`);
//   // const data = await response.json();
//   // ... 필요 시 data 기반으로 title/description 구성

//   return {
//     title: `채널 ${channelHandle}의 영상 ${videoId} 상세`,
//     description: `채널 ${channelHandle}의 영상 아티클 상세보기`,
//   };
// }
// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8001";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

// 메인 페이지
export default async function StudioVideoDetailPage({
  params,
  searchParams,
}: StudioVideoDetailPageProps) {
  console.log("heelo");
  const { channelHandle, videoId } = params;
  const { source, task_id } = searchParams;
  console.log(channelHandle);
  console.log(videoId);
  console.log(task_id);
  // task_id가 없는 경우 -> 기존 ClientSide 로직
  if (!task_id) {
    let apiUrl = "";
    console.log(source);
    if (source === "editor") {
      apiUrl = `${NEXT_PUBLIC_API_BASE_URL}/editor/article/${videoId}`;
    } else if (source === "briefing") {
      apiUrl = `${NEXT_PUBLIC_API_BASE_URL}/briefing/top_videos/${videoId}`;
    } else {
      apiUrl = `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/video/${videoId}`;
    }

    const response = await fetch(apiUrl, { cache: "no-store" });
    console.log(response);
    if (!response.ok) {
      return <NotFoundPage />;
    }
    const data = await response.json();

    return <ClientSide detailData={data[0]} id={videoId} />;
  }

  // task_id가 있는 경우 -> ClientSide2
  return <ClientSide2 taskId={task_id} id={videoId} />;
}
