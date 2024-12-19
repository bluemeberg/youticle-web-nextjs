import TodayPageClient from "./components/TodayPageClient"; // 클라이언트 컴포넌트

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
  const STOCK_API_URL = "https://claying.shop/briefing/top_videos/stock";
  const EXCEPT_STOCK_API_URL = "https://claying.shop/briefing/top_videos";
  //   const STOCK_API_URL_LOCAL = "http://0.0.0.0:8000/briefing/top_videos/stock";
  // const EXCEPT_STOCK_API_URL_LOCAL = "http://0.0.0.0:8000/briefing/top_videos";

  const [response1, response2] = await Promise.all([
    fetch(EXCEPT_STOCK_API_URL, { method: "GET", cache: "no-store" }),
    fetch(STOCK_API_URL, { method: "GET", cache: "no-store" }),
  ]);

  if (!response1.ok || !response2.ok) {
    throw new Error("API request failed");
  }

  const data1 = await response1.json();
  const data2 = await response2.json();
  const combinedData = [...data1, ...data2];

  return (
    <>
      <TodayPageClient apiData={combinedData} />
    </>
  );
}
