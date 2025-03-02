import AdminPageClient from "./components/AdminPageClient"; // 클라이언트 컴포넌트
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
        url: "/images/YouTicleOGImage.png", // public 폴더 내의 경로
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
