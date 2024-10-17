// /app/page.tsx (서버사이드 컴포넌트)
import axios from "axios";
import TodayPageClient from "./components/TodayPageClient"; // 클라이언트 컴포넌트

import { Suspense } from "react";

export const metadata = {
  title: "YouTicle",
  description:
    "매일 최신 업로드된 19가지 주제의 유튜브 영상들을 빠르고 편하게 아티클로 읽어보세요!",
  openGraph: {
    title: "YouTicle",
    description:
      "매일 최신 업로드된 19가지 주제의 유튜브 영상들을 빠르고 편하게 아티클로 읽어보세요!",
    images: [
      {
        url: "/images/ogImage.png", // public 폴더 내의 경로
        alt: "Thumbnail Image",
      },
    ],
    icons: {
      icon: "/favicon.png", // favicon 경로
    },
  },
};

export default async function LandingPage() {
  // Server-side data fetching using fetch with no-store
  const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";
  const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";

  // Fetch both APIs in parallel using Promise.all
  const [response1, response2] = await Promise.all([
    fetch(EXCEPT_STOCK_API_URL, { method: "GET", cache: "no-store" }),
    fetch(STOCK_API_URL, { method: "GET", cache: "no-store" }),
  ]);

  // Handle errors
  if (!response1.ok || !response2.ok) {
    throw new Error("API request failed");
  }

  // Parse the JSON responses
  const data1 = await response1.json();
  const data2 = await response2.json();

  // Combine the data from both responses
  const combinedData = [...data1, ...data2];

  // 데이터를 클라이언트 컴포넌트에 전달
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <TodayPageClient apiData={combinedData} />
    </Suspense>
  );
}
