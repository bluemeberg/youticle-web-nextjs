import AdminPageClient from "./components/AdminPageClient"; // 클라이언트 컴포넌트
import { Suspense } from "react";

export const metadata = {
  title: "YouTicle",
  description:
    "구독 채널의 개별 영상 즉시 요약부터 신규 영상의 자동 요약 & 카톡알림까지, 나만의 유튜브 AI비서 - 유티클",
  openGraph: {
    title: "YouTicle",
    description:
      "구독 채널의 개별 영상 즉시 요약부터 신규 영상의 자동 요약 & 카톡알림까지, 나만의 유튜브 AI비서 - 유티클",
    images: [
      {
        url: "/images/YouTicleOGThumbnail2.png", // public 폴더 내의 경로
        alt: "Thumbnail Image",
      },
    ],
    icons: {
      icon: "/favicon.png", // favicon 경로
    },
  },
};

export default async function AdminPage() {
  // Server-side data fetching using fetch with no-store
  //   const EDITOR_ARTICLE_API_LOCAL_URL = "http://0.0.0.0:8000/editor/all/article";
  const EDITOR_ARTICLE_LOCAL_API_URL = "http://0.0.0.0:8000/editor/all/article";
  const EDITOR_ARTICLE_API_URL = "https://youticle.shop/editor/all/article";

  // // Fetch both APIs in parallel using Promise.all
  // const response1 = await fetch(EDITOR_ARTICLE_API_URL, {
  //   method: "GET",
  //   cache: "no-store",
  // });

  // // Handle errors
  // if (!response1.ok) {
  //   throw new Error("API request failed");
  // }

  // // Parse the JSON responses
  // const data1 = await response1.json();
  // // 데이터를 클라이언트 컴포넌트에 전달

  return (
    <Suspense>
      <AdminPageClient />
    </Suspense>
  );
}
