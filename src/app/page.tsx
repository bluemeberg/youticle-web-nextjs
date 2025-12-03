import TodayPageClient from "./components/TodayPageClient"; // 클라이언트 컴포넌트
import type { InsightSection, InsightSectionsResponse } from "@/types/insight";
import {
  buildRefreshMeta,
  formatDateKST,
  getBriefingSlot,
  resolveStockSlot,
  toKst,
} from "@/utils/briefingSlot";

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
  const STOCK_API_V2_URL = "https://youticle.shop/briefing_v2/top_videos/v2/";
  const LOCAL_STOCK_API_URL = "http://0.0.0.0:8001/briefing/top_videos/stock";
  const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";
  const INSIGHTS_SECTION_URL = "https://youticle.shop/insights/sections";
  const LOCAL_INSIGHTS_SECTION_URL = "http://0.0.0.0:8001/insights/sections";
  const now = new Date();
  const dateParam = formatDateKST(now);
  const slotParam = getBriefingSlot(now);
  const refreshMeta = buildRefreshMeta(now);
  const stockSlot = resolveStockSlot(now);
  const stockApiUrl =
    stockSlot == null
      ? STOCK_API_URL
      : `${STOCK_API_V2_URL}?time_slot=${stockSlot}`;
  const kstNow = toKst(now);
  const isMorningBaseline = slotParam === "baseline";
  const isPreBaselineSlot4 =
    slotParam === "slot4" &&
    (kstNow.getUTCHours() < 7 ||
      (kstNow.getUTCHours() === 7 && kstNow.getUTCMinutes() < 30));
  const effectiveDateParam = isPreBaselineSlot4
    ? formatDateKST(new Date(now.getTime() - 24 * 60 * 60 * 1000))
    : dateParam;
  let integratedSections: InsightSectionsResponse | null = null;
  const keywordParam = props.searchParams?.keyword;
  const initialTopicRaw = Array.isArray(keywordParam)
    ? keywordParam[0]
    : keywordParam;
  const initialTopic = initialTopicRaw?.trim();

  try {
    const sectionKeys = [
      "domestic_stock",
      "overseas_stock",
      "domestic_crypto",
      "overseas_crypto",
    ] as const;

    const [response1, response2, sectionResponses] = await Promise.all([
      fetch(EXCEPT_STOCK_API_URL, { method: "GET", cache: "no-store" }),
      fetch(stockApiUrl, { method: "GET", cache: "no-store" }),
      Promise.all(
        sectionKeys.map(async (key) => {
          const encodedSectionKey = encodeURIComponent(key);
          const url = isMorningBaseline
            ? `${INSIGHTS_SECTION_URL}?sections=${encodedSectionKey}`
            : `${INSIGHTS_SECTION_URL}?sections=${encodedSectionKey}&date=${effectiveDateParam}&slot=${slotParam}`;
          const res = await fetch(url, {
            method: "GET",
            cache: "no-store",
          });
          if (!res.ok) {
            throw new Error(
              `Insight section ${key} request failed (${res.status})`
            );
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
          refreshMeta={refreshMeta}
        />
      </>
    );
  } catch (error) {
    console.error("Landing page data fetch failed", error);
    throw error;
  }
}
