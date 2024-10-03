import EditorPageClient from "./components/EditorPageClient"; // 클라이언트 컴포넌트

import { Suspense } from "react";

export default async function Editorpage() {
  // Server-side data fetching using fetch with no-store
  const EDITOR_ARTICLE_API_URL = "https://youticle.shop/editor/all/article";

  // Fetch both APIs in parallel using Promise.all
  const response1 = await fetch(EDITOR_ARTICLE_API_URL, {
    method: "GET",
    cache: "no-store",
  });

  // Handle errors
  if (!response1.ok) {
    throw new Error("API request failed");
  }

  // Parse the JSON responses
  const data1 = await response1.json();
  // 데이터를 클라이언트 컴포넌트에 전달
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <EditorPageClient apiData={data1} />
    </Suspense>
  );
}
