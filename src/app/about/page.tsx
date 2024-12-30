// /app/page.tsx (서버사이드 컴포넌트)
import axios from "axios";
import AboutPageClient from "./components/AboutPageClient"; // 클라이언트 컴포넌트

import { Suspense } from "react";

export default async function LandingPage() {
  // Server-side data fetching using fetch with no-store
  const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";
  const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";

  // // Fetch both APIs in parallel using Promise.all
  // const [response1, response2] = await Promise.all([
  //   fetch(EXCEPT_STOCK_API_URL, { method: "GET", cache: "no-store" }),
  //   fetch(STOCK_API_URL, { method: "GET", cache: "no-store" }),
  // ]);

  // // Handle errors
  // if (!response1.ok || !response2.ok) {
  //   throw new Error("API request failed");
  // }

  // // Parse the JSON responses
  // const data1 = await response1.json();
  // const data2 = await response2.json();

  // // Combine the data from both responses
  // const combinedData = [...data1, ...data2];

  // 데이터를 클라이언트 컴포넌트에 전달
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <AboutPageClient />
    </Suspense>
  );
}
