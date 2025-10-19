import TodayPageClient from "./components/TodayPageClient"; // 클라이언트 컴포넌트
import type { InsightSection, InsightSectionsResponse } from "@/types/insight";

type LandingPageProps = {
  searchParams?: {
    keyword?: string | string[];
  };
};

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

export default async function LandingPage(props: LandingPageProps) {
  const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";
  const LOCAL_STOCK_API_URL = "http://0.0.0.0:8001/briefing/top_videos/stock"
  const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";
  const INSIGHTS_SECTION_URL = "https://youticle.shop/insights/sections";
  const LOCAL_INSIGHTS_SECTION_URL = "http://0.0.0.0:8001/insights/sections"
  let integratedSections: InsightSectionsResponse | null = null;
  const keywordParam = props.searchParams?.keyword;
  const initialTopicRaw = Array.isArray(keywordParam)
    ? keywordParam[0]
    : keywordParam;
  const initialTopic = initialTopicRaw?.trim();

  try {
    const sectionKeys = ["domestic_stock", "overseas_stock", "domestic_crypto", "overseas_crypto"] as const;

    const [response1, response2, sectionResponses] = await Promise.all([
      fetch(EXCEPT_STOCK_API_URL, { method: "GET", cache: "no-store" }),
      fetch(STOCK_API_URL, { method: "GET", cache: "no-store" }),
      Promise.all(
        sectionKeys.map(async (key) => {
          const res = await fetch(`${INSIGHTS_SECTION_URL}?sections=${key}`, {
            method: "GET",
            cache: "no-store",
          });
          if (!res.ok) {
            throw new Error(`Insight section ${key} request failed (${res.status})`);
          }
          return res.json() as Promise<InsightSectionsResponse>;
        })
      ),
    ]);

    if (!response1.ok || !response2.ok) {
      throw new Error("API request failed");
    }

    const data1 = await response1.json();
    const data2 = await response2.json();
    const combinedData = [...data1, ...data2];

    const sections: InsightSection[] = sectionResponses
      .flatMap((payload) => payload.sections ?? [])
      .filter(Boolean);
    integratedSections = { sections, missing: [] };

    return (
      <>
        <TodayPageClient
          apiData={combinedData}
          integratedSections={integratedSections?.sections ?? []}
          initialTopic={initialTopic}
        />
      </>
    );
  } catch (error) {
    console.error("Landing page data fetch failed", error);
    throw error;
  }
}
