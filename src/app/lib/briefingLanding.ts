import {
  mockBriefingLanding,
  mockBriefingLandingById,
} from "@/data/mockBriefingLanding";
import type { DataProps } from "@/types/dataProps";
import type {
  BriefingLandingData,
  MarketIndexCard,
  MoneyRecapSection,
  RecapSection,
  RecapVideoSummary,
  SlotPackage,
} from "@/types/briefingLanding";
import type { InsightSection, InsightSectionsResponse } from "@/types/insight";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://youticle.shop";
const LANDING_ENDPOINT = `${API_BASE_URL}/briefing/landing`;
const TOP_VIDEOS_V2_ENDPOINT = `${API_BASE_URL}/briefing_v2/top_videos/v2`;
const SECTION_VIDEOS_ENDPOINT = `${API_BASE_URL}/briefing/top_videos/section`;
const INSIGHT_SECTIONS_ENDPOINT = `${API_BASE_URL}/insights/sections`;

type BriefingLandingQuery = Record<string, string | undefined>;
type SlotPhase = "baseline" | "slot1" | "slot2" | "slot3" | "slot4" | "ranking";
type MoneySectionKey = keyof typeof MONEY_SECTION_CONFIGS;
type GeneralSectionKey = keyof typeof GENERAL_SECTION_CONFIGS;

const MONEY_SECTION_CONFIGS = {
  domestic_stock: {
    label: "국내 주식",
    insightKey: "domestic_stock",
    type: "stocks" as MoneyRecapSection["type"],
    anchor: "stocks-kr",
  },
  overseas_stock: {
    label: "해외 주식",
    insightKey: "overseas_stock",
    type: "stocks" as MoneyRecapSection["type"],
    anchor: "stocks-global",
  },
  domestic_crypto: {
    label: "국내 가상자산",
    insightKey: "domestic_crypto",
    type: "crypto" as MoneyRecapSection["type"],
    anchor: "crypto-kr",
  },
  overseas_crypto: {
    label: "해외 가상자산",
    insightKey: "overseas_crypto",
    type: "crypto" as MoneyRecapSection["type"],
    anchor: "crypto-global",
  },
} as const;

const GENERAL_SECTION_CONFIGS = {
  beauty: {
    label: "뷰티/메이크업",
    anchor: "beauty",
    query: "뷰티/메이크업",
  },
} as const;

const formatSectionQuery = (label: string) =>
  encodeURIComponent(label).replace(/%20/g, "+");

const SECTION_ALIAS_MAP: Record<string, MoneySectionKey | GeneralSectionKey> = {
  "국내 주식": "domestic_stock",
  "해외 주식": "overseas_stock",
  "국내 가상자산": "domestic_crypto",
  "해외 가상자산": "overseas_crypto",
  domestic_stock: "domestic_stock",
  overseas_stock: "overseas_stock",
  domestic_crypto: "domestic_crypto",
  overseas_crypto: "overseas_crypto",
  뷰티: "beauty",
  "뷰티/메이크업": "beauty",
};

const SLOT_LABELS: Record<
  SlotPhase,
  { title: string; description: string; time: string }
> = {
  baseline: {
    title: "프리 마켓 1차",
    description: "07:30 장 시작 전",
    time: "07:30",
  },
  slot1: { title: "프리 마켓 2차", description: "08:30 직전", time: "08:30" },
  slot2: { title: "점심장 브리핑", description: "12:30 점검", time: "12:30" },
  slot3: { title: "장 마감 전", description: "15:10 체크", time: "15:10" },
  ranking: { title: "장 마감 이후", description: "랭킹 재정렬", time: "18:10" },
  slot4: { title: "저녁 리뷰", description: "21:00 리뷰", time: "21:00" },
};

const ALL_SLOT_PHASES: SlotPhase[] = [
  "baseline",
  "slot1",
  "slot2",
  "slot3",
  "ranking",
  "slot4",
];

const SLOT_TIME_MAP: Record<SlotPhase, number> = {
  baseline: 1,
  slot1: 1,
  slot2: 2,
  slot3: 3,
  slot4: 4,
  ranking: 4,
};

const toDisplayDate = (value?: string) => {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return null;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
};

const toApiDate = (value?: string) => {
  if (!value) return undefined;
  if (value.includes("-")) return value;
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return undefined;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const decodeSectionEntries = (raw?: string) => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((token) => token.trim())
    .map((token) => token.replace(/\+/g, "%20"))
    .map((token) => {
      const decoded = decodeURIComponent(token);
      return { raw: decoded, key: SECTION_ALIAS_MAP[decoded] };
    })
    .filter((entry) => entry.key) as Array<{
    raw: string;
    key: MoneySectionKey | GeneralSectionKey;
  }>;
};

const normalizeSectionText = (value?: string | null) =>
  value ? value.replace(/[\s/_-]+/g, "").toLowerCase() : "";

const filterVideosByMoneySection = (
  videos: DataProps[],
  sectionKey: MoneySectionKey
) => {
  const config = MONEY_SECTION_CONFIGS[sectionKey];
  const normalizedTargets = [
    normalizeSectionText(config.label),
    normalizeSectionText(config.insightKey),
    normalizeSectionText(sectionKey),
  ].filter((token): token is string => Boolean(token));
  if (normalizedTargets.length === 0) return videos;
  const targetSet = new Set(normalizedTargets);
  const filtered = videos.filter((video) =>
    targetSet.has(normalizeSectionText(video.section))
  );
  return filtered.length > 0 ? filtered : videos;
};

const extractSummaryLines = (section?: InsightSection) => {
  const quick = section?.data?.market_insights?.quick ?? [];
  if (quick.length > 0) return quick.slice(0, 3);
  const delta = section?.data?.market_delta_insights?.quick ?? [];
  if (delta.length > 0) return delta.slice(0, 3);
  const overview = section?.data?.overview?.market_snapshot;
  if (overview) return [overview];
  return ["슬롯을 바꾸면 최신 인사이트가 갱신돼요"];
};

const buildMarketIndexes = (section?: InsightSection): MarketIndexCard[] => {
  const entries = Object.entries(
    section?.data?.market_insights?.by_market ?? {}
  );
  return entries.slice(0, 3).map(([market, payload], index) => ({
    id: `${section?.key ?? "market"}-${index}`,
    label: payload?.market ?? market,
    value: payload?.price_str ?? "-",
    changeText: payload?.chg_point_str ?? payload?.chg_point ?? "",
    changeRate: payload?.chg_pct_str ?? payload?.chg_pct ?? "",
    sentiment: payload?.chg_pct_str?.includes("-") ? "down" : "up",
  }));
};

const toPercentText = (value?: number | string | null) => {
  if (value == null) return "";
  if (typeof value === "number") return `${value.toFixed(2)}%`;
  const trimmed = `${value}`.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("%") ? trimmed : `${trimmed}%`;
};

const buildInsightItems = (section?: InsightSection) => {
  const stocks = section?.data?.stocks ?? [];
  if (stocks.length > 0) {
    return stocks.slice(0, 5).map((stock) => ({
      id: stock.ticker ?? stock.stock_name,
      name: stock.stock_name,
      ticker: stock.ticker ?? "",
      changeText: toPercentText(
        stock.metrics?.chg_pct ?? stock.metrics?.price_info?.change_pct
      ),
      detailHref: stock.ticker ? `/detail/${stock.ticker}` : "#",
    }));
  }

  const assets = section?.data?.assets ?? [];
  if (assets.length > 0) {
    return assets.slice(0, 5).map((asset) => {
      const changeValue =
        asset.crypto_metrics?.chg_pct ??
        asset.realtime?.change_rate ??
        asset.realtime?.signed_change_rate;
      const tickerSlug = asset.ticker?.replace(/[\/:]/g, "-") ?? "";
      return {
        id: asset.ticker ?? asset.asset_name,
        name: asset.asset_name,
        ticker: asset.ticker ?? "",
        changeText: toPercentText(changeValue),
        detailHref: tickerSlug ? `/crypto/${tickerSlug}` : "#",
      };
    });
  }

  return [];
};

const extractVideoSummaries = (videos: DataProps[]): RecapVideoSummary[] =>
  videos.map((video) => ({
    id: video.video_id,
    title: video.title,
    channel: video.channel_details?.channel_name ?? "",
    thumbnail: video.thumbnail,
    duration: video.duration,
    summary:
      video.summary_data?.key_points
        ?.map((point: any) =>
          typeof point === "string" ? point : point?.point ?? ""
        )
        .filter((line) => line.length > 0) ?? [],
  }));

const fetchJson = async <T>(url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }
  return (await response.json()) as T;
};

const buildSlotPackage = (
  slotPhase: SlotPhase,
  videos: DataProps[],
  insightSection?: InsightSection
): SlotPackage => {
  const slotConfig = SLOT_LABELS[slotPhase] ?? SLOT_LABELS.slot4;
  return {
    id: slotPhase,
    label: slotConfig.title,
    displayTime: slotConfig.time,
    description: slotConfig.description,
    tabs: {
      market: {
        indexes: buildMarketIndexes(insightSection),
        commentary: extractSummaryLines(insightSection),
      },
      insight: {
        title: slotConfig.title,
        items: buildInsightItems(insightSection),
      },
      videos: extractVideoSummaries(videos),
      insightSection,
    },
  };
};

const fetchMoneySlotPackage = async (
  sectionKey: MoneySectionKey,
  slotPhase: SlotPhase,
  date?: string
) => {
  const config = MONEY_SECTION_CONFIGS[sectionKey];

  let videos: DataProps[] = [];
  if (slotPhase === "baseline") {
    const baselineUrl = `${API_BASE_URL}/briefing/top_videos/stock`;
    const baselineVideos = await fetchJson<DataProps[]>(baselineUrl);
    videos = filterVideosByMoneySection(baselineVideos, sectionKey);
  } else {
    const slotNumber =
      slotPhase === "ranking"
        ? 3
        : SLOT_TIME_MAP[slotPhase] ?? SLOT_TIME_MAP.slot4;
    const videoUrl = new URL(TOP_VIDEOS_V2_ENDPOINT);
    videoUrl.searchParams.set("time_slot", String(slotNumber));
    const allVideos = await fetchJson<DataProps[]>(videoUrl.toString());
    let filteredVideos = filterVideosByMoneySection(allVideos, sectionKey);
    if (slotPhase === "ranking") {
      filteredVideos = filteredVideos.filter((video) => video.is_new);
    } else if (slotPhase === "slot3") {
      filteredVideos = filteredVideos.filter((video) => video.is_new !== true);
    }
    videos = filteredVideos;
  }

  const insightsUrl = new URL(INSIGHT_SECTIONS_ENDPOINT);
  insightsUrl.searchParams.set("sections", config.insightKey);
  if (slotPhase !== "baseline") {
    insightsUrl.searchParams.set("slot", slotPhase);
  }
  if (date) insightsUrl.searchParams.set("date", date);
  const insightPayload = await fetchJson<InsightSectionsResponse>(
    insightsUrl.toString()
  );
  const insightSection = insightPayload.sections?.find(
    (section) =>
      section.key === config.insightKey || section.label === config.label
  );

  return buildSlotPackage(slotPhase, videos, insightSection);
};

const buildMoneySection = async (
  sectionKey: MoneySectionKey,
  slotPhase: SlotPhase,
  date?: string
): Promise<RecapSection> => {
  const config = MONEY_SECTION_CONFIGS[sectionKey];
  const slotResults = await Promise.all(
    ALL_SLOT_PHASES.map((phase) =>
      fetchMoneySlotPackage(sectionKey, phase, date).catch((error) => {
        console.warn(
          `fetchMoneySlotPackage failed (${sectionKey}/${phase})`,
          error
        );
        return buildSlotPackage(phase, []);
      })
    )
  );
  const slotPackages = slotResults.filter((pkg): pkg is SlotPackage =>
    Boolean(pkg)
  );
  if (slotPackages.length === 0) {
    throw new Error(`No slot packages for ${sectionKey}`);
  }
  const preferredPackage =
    slotPackages.find((pkg) => pkg.id === slotPhase) ??
    slotPackages[slotPackages.length - 1];
  return {
    id: `section-${sectionKey}`,
    type: config.type,
    anchor: config.anchor,
    title: config.label,
    summaryBullets: preferredPackage.tabs.market.commentary,
    defaultSlotId: preferredPackage.id,
    slotPackages,
  } as RecapSection;
};

const fetchGeneralSection = async (
  generalKey: GeneralSectionKey,
  rawParam: string
): Promise<RecapSection> => {
  const config = GENERAL_SECTION_CONFIGS[generalKey];
  const sectionQuery = decodeURIComponent(rawParam);
  const videoUrl = new URL(SECTION_VIDEOS_ENDPOINT);
  videoUrl.searchParams.set("section", sectionQuery);
  const videos = await fetchJson<DataProps[]>(videoUrl.toString());
  const slotPackage: SlotPackage = {
    id: "general",
    label: config.label,
    displayTime: new Date().toLocaleTimeString("ko", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    description: `${config.label} 최신 영상`,
    tabs: {
      market: { indexes: [], commentary: [] },
      insight: { title: config.label, items: [] },
      videos: extractVideoSummaries(videos),
    },
  };

  return {
    id: `section-${generalKey}`,
    type: "stocks",
    anchor: config.anchor,
    title: config.label,
    summaryBullets: ["시간 순으로 TOP 영상을 모았어요"],
    slotPackages: [slotPackage],
    defaultSlotId: slotPackage.id,
  } as RecapSection;
};

export async function fetchBriefingLanding(
  briefingId: string,
  query?: BriefingLandingQuery
): Promise<BriefingLandingData | null> {
  const entries = decodeSectionEntries(query?.section);
  const slotQuery = query?.slot?.toLowerCase() as SlotPhase | undefined;
  const slotPhase = SLOT_LABELS[slotQuery ?? ""] ? slotQuery! : "baseline";
  const dateParam = query?.date ?? query?.data;
  const apiDate = toApiDate(dateParam);
  const displayDate = toDisplayDate(dateParam);

  if (entries.length > 0) {
    const sections: RecapSection[] = [];
    for (const entry of entries) {
      try {
        if (entry.key in MONEY_SECTION_CONFIGS) {
          sections.push(
            await buildMoneySection(
              entry.key as MoneySectionKey,
              slotPhase,
              apiDate
            )
          );
        } else if (entry.key in GENERAL_SECTION_CONFIGS) {
          sections.push(
            await fetchGeneralSection(entry.key as GeneralSectionKey, entry.raw)
          );
        }
      } catch (error) {
        console.warn(`buildLandingSection failed (${entry.raw})`, error);
      }
    }

    if (sections.length > 0) {
      return {
        briefingId,
        deliveryMeta: {
          deliveredAt: new Date().toISOString(),
          displayLabel: `${displayDate ?? "오늘"} · ${
            SLOT_LABELS[slotPhase].time
          }`,
          description: SLOT_LABELS[slotPhase].description,
          tagline: SLOT_LABELS[slotPhase].title,
          backHref: "/today",
          backLabel: "카톡 브리핑 보기",
          source: "kakao",
        },
        keywordNav: sections.map((section) => ({
          id: section.anchor,
          label: section.title,
          anchor: section.anchor,
        })),
        sections,
        exploreTabs: sections.map((section) => ({
          id: section.anchor,
          label: section.title,
          href: `/today?keyword=${encodeURIComponent(section.title)}`,
        })),
      } satisfies BriefingLandingData;
    }
  }

  try {
    const response = await fetch(
      `${LANDING_ENDPOINT}/${encodeURIComponent(briefingId)}`,
      {
        cache: "no-store",
      }
    );
    if (!response.ok) {
      if (response.status === 404) {
        return mockBriefingLandingById[briefingId] ?? mockBriefingLanding;
      }
      throw new Error(`Failed to load briefing landing: ${response.status}`);
    }
    const payload = (await response.json()) as BriefingLandingData;
    return payload;
  } catch (error) {
    console.warn("fetchBriefingLanding fallback", error);
    return mockBriefingLandingById[briefingId] ?? mockBriefingLanding;
  }
}
