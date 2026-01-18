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
  SectionBriefingData,
  SlotPackage,
} from "@/types/briefingLanding";
import type {
  InsightAsset,
  InsightSection,
  InsightSectionsResponse,
  InsightSource,
  InsightStock,
} from "@/types/insight";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://youticle.shop";
const LANDING_ENDPOINT = `${API_BASE_URL}/briefing/landing`;
const TOP_VIDEOS_V2_ENDPOINT = `${API_BASE_URL}/briefing_v2/top_videos/v2`;
const SECTION_VIDEOS_ENDPOINT = `${API_BASE_URL}/briefing/top_videos/section`;
const INSIGHT_SECTIONS_ENDPOINT = `${API_BASE_URL}/insights/sections`;
const KAKAO_CACHE_ENDPOINT = `${API_BASE_URL}/insights/kakao/cache`;

type BriefingLandingQuery = Record<string, string | undefined>;
type SlotPhase = "baseline" | "slot2" | "slot3" | "slot4" | "slot5" | "ranking";
type MoneySectionKey = keyof typeof MONEY_SECTION_CONFIGS;
type GeneralSectionKey = keyof typeof GENERAL_SECTION_CONFIGS;

interface KakaoIntegratedBriefingItem {
  title?: string;
  so_what?: string;
  references?: string[];
}

interface KakaoIntegratedSectionPayload {
  section: string;
  updated_at?: string;
  data?: {
    keywords?: string[];
    briefing?: KakaoIntegratedBriefingItem[];
  };
}

interface KakaoIntegratedResponse {
  sections?: KakaoIntegratedSectionPayload[];
}

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
  all: {
    label: "전체",
    anchor: "topic-all",
    query: "전체",
  },
  stocks_general: {
    label: "주식",
    anchor: "topic-stocks",
    query: "주식",
  },
  realestate: {
    label: "부동산",
    anchor: "topic-realestate",
    query: "부동산",
  },
  crypto_general: {
    label: "가상자산",
    anchor: "topic-crypto",
    query: "가상자산",
  },
  economy: {
    label: "경제",
    anchor: "topic-economy",
    query: "경제",
  },
  politics: {
    label: "정치",
    anchor: "topic-politics",
    query: "정치",
  },
  business: {
    label: "비즈니스/사업",
    anchor: "topic-business",
    query: "비즈니스/사업",
  },
  health: {
    label: "건강",
    anchor: "topic-health",
    query: "건강",
  },
  fitness: {
    label: "피트니스",
    anchor: "topic-fitness",
    query: "피트니스",
  },
  relationship: {
    label: "연애/결혼",
    anchor: "topic-relationship",
    query: "연애/결혼",
  },
  parenting: {
    label: "육아",
    anchor: "topic-parenting",
    query: "육아",
  },
  beauty: {
    label: "뷰티/메이크업",
    anchor: "topic-beauty",
    query: "뷰티/메이크업",
  },
  women_fashion: {
    label: "여자 패션",
    anchor: "topic-fashion-women",
    query: "여자 패션",
  },
  men_fashion: {
    label: "남자 패션",
    anchor: "topic-fashion-men",
    query: "남자 패션",
  },
  cooking: {
    label: "요리",
    anchor: "topic-cooking",
    query: "요리",
  },
  it_tech: {
    label: "IT/테크",
    anchor: "topic-it",
    query: "IT/테크",
  },
  ai: {
    label: "인공지능",
    anchor: "topic-ai",
    query: "인공지능",
  },
  auto: {
    label: "자동차",
    anchor: "topic-auto",
    query: "자동차",
  },
  travel: {
    label: "여행",
    anchor: "topic-travel",
    query: "여행",
  },
  science: {
    label: "과학",
    anchor: "topic-science",
    query: "과학",
  },
  history: {
    label: "역사",
    anchor: "topic-history",
    query: "역사",
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
  전체: "all",
  all: "all",
  "topic-all": "all",
  주식: "stocks_general",
  stocks: "stocks_general",
  "topic-stocks": "stocks_general",
  부동산: "realestate",
  realestate: "realestate",
  "topic-realestate": "realestate",
  가상자산: "crypto_general",
  crypto: "crypto_general",
  "topic-crypto": "crypto_general",
  경제: "economy",
  economy: "economy",
  "topic-economy": "economy",
  정치: "politics",
  politics: "politics",
  "topic-politics": "politics",
  비즈니스: "business",
  사업: "business",
  "비즈니스/사업": "business",
  business: "business",
  "topic-business": "business",
  건강: "health",
  health: "health",
  "topic-health": "health",
  피트니스: "fitness",
  fitness: "fitness",
  "topic-fitness": "fitness",
  "연애/결혼": "relationship",
  relationship: "relationship",
  "topic-relationship": "relationship",
  육아: "parenting",
  parenting: "parenting",
  "topic-parenting": "parenting",
  뷰티: "beauty",
  "뷰티/메이크업": "beauty",
  beauty: "beauty",
  "topic-beauty": "beauty",
  "여자 패션": "women_fashion",
  women_fashion: "women_fashion",
  "topic-fashion-women": "women_fashion",
  "남자 패션": "men_fashion",
  men_fashion: "men_fashion",
  "topic-fashion-men": "men_fashion",
  요리: "cooking",
  cooking: "cooking",
  "topic-cooking": "cooking",
  IT: "it_tech",
  it: "it_tech",
  테크: "it_tech",
  tech: "it_tech",
  "IT/테크": "it_tech",
  it_tech: "it_tech",
  "topic-it": "it_tech",
  인공지능: "ai",
  ai: "ai",
  "topic-ai": "ai",
  자동차: "auto",
  auto: "auto",
  "topic-auto": "auto",
  여행: "travel",
  travel: "travel",
  "topic-travel": "travel",
  과학: "science",
  science: "science",
  "topic-science": "science",
  역사: "history",
  history: "history",
  "topic-history": "history",
};

const buildSectionBriefingEntry = (
  item: KakaoIntegratedBriefingItem,
  index: number
) => {
  const title = (item.title ?? `브리핑 ${index + 1}`).trim();
  const soWhat = (item.so_what ?? "").trim();
  const references = Array.isArray(item.references)
    ? item.references.filter(
        (ref): ref is string => typeof ref === "string" && ref.trim().length > 0
      )
    : [];
  const videoIds = references.filter((ref) => /[A-Za-z0-9_-]+/.test(ref));
  return { title, soWhat, references, videoIds };
};

const fetchIntegratedBriefing = async (
  sectionLabel: string
): Promise<SectionBriefingData | undefined> => {
  try {
    const buildRequestUrl = (variant: string) => {
      const url = new URL(KAKAO_CACHE_ENDPOINT);
      url.searchParams.set("sections", sectionLabel);
      url.searchParams.set("variant", variant);
      return url;
    };

    const primaryUrl = buildRequestUrl("keyword_long");
    let payload =
      (await fetchJson<KakaoIntegratedResponse>(primaryUrl.toString())) ?? {};
    if (!payload.sections?.length) {
      const fallbackUrl = buildRequestUrl("integrated");
      payload =
        (await fetchJson<KakaoIntegratedResponse>(fallbackUrl.toString())) ??
        {};
    }
    const target = payload.sections?.find(
      (entry) => entry.section === sectionLabel
    );
    if (!target?.data) return undefined;
    const keywords = (target.data.keywords ?? []).filter(
      (keyword): keyword is string =>
        typeof keyword === "string" && keyword.trim().length > 0
    );
    const entries = (target.data.briefing ?? [])
      .map((item, idx) => buildSectionBriefingEntry(item, idx))
      .filter((entry) => entry.title || entry.soWhat);
    if (keywords.length === 0 && entries.length === 0) return undefined;
    return {
      keywords,
      entries,
      updatedAt: target.updated_at,
    };
  } catch (error) {
    console.warn("fetchIntegratedBriefing failed", error);
    return undefined;
  }
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
  slot2: { title: "오전 1차", description: "11:00 장 중", time: "11:00" },
  slot3: { title: "오후 2차", description: "14:30 점검", time: "14:30" },
  slot4: { title: "장 마감 전", description: "17:00 체크", time: "17:00" },
  ranking: { title: "장 마감 이후", description: "랭킹 재정렬", time: "18:10" },
  slot5: { title: "저녁 리뷰", description: "21:00 리뷰", time: "21:00" },
};

const ALL_SLOT_PHASES: SlotPhase[] = [
  "baseline",
  "slot2",
  "slot3",
  "slot4",
  "ranking",
  "slot5",
];

const SLOT_TIME_MAP: Record<SlotPhase, number> = {
  baseline: 1,
  slot2: 2,
  slot3: 3,
  slot4: 4,
  slot5: 5,
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
  return videos.filter((video) =>
    targetSet.has(normalizeSectionText(video.section))
  );
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
    changeText:
      typeof payload?.chg_point_str === "string"
        ? payload.chg_point_str
        : typeof payload?.chg_point === "string"
        ? payload.chg_point
        : "-",
    changeRate:
      typeof payload?.chg_pct_str === "string"
        ? payload.chg_pct_str
        : typeof payload?.chg_pct === "string"
        ? payload.chg_pct
        : "-",
    sentiment:
      typeof payload?.chg_pct_str === "string" &&
      payload.chg_pct_str.includes("-")
        ? "down"
        : "up",
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

const toNumericSubscribers = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
};

const extractVideoSummaries = (videos: DataProps[]): RecapVideoSummary[] =>
  videos.map((video) => {
    const headline =
      video.summary_data?.headline_title?.trim() ||
      video.summary_data?.headline_sub_title?.trim() ||
      "";
    const summaryList = (() => {
      const shortSummary = video.summary_data?.short_summary?.trim();
      if (shortSummary) return [shortSummary];
      const keyPoints = video.summary_data?.key_points;
      if (Array.isArray(keyPoints) && keyPoints.length > 0) {
        return keyPoints
          .map((point: any) =>
            typeof point === "string" ? point : point?.point ?? ""
          )
          .filter((line) => line.length > 0);
      }
      return [];
    })();

    return {
      id: video.video_id,
      title: headline || video.title,
      channel: video.channel_details?.channel_name ?? "",
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelThumbnail: video.channel_details?.channel_thumbnail,
      subscriberText: (() => {
        const subs = video.channel_details?.channel_subscribers;
        if (subs == null) return undefined;
        return typeof subs === "string" ? subs : subs.toString();
      })(),
      channelSubscribers:
        toNumericSubscribers(video.channel_details?.channel_subscribers) ??
        null,
      uploadDate: video.upload_date ?? null,
      detectedSlots: video.detected_slots ?? null,
      isNew: typeof video.is_new === "boolean" ? video.is_new : null,
      href: video.video_id ? `/detail/${video.video_id}` : undefined,
      summary: summaryList,
    } satisfies RecapVideoSummary;
  });

const buildVideoMetaMap = (videos: DataProps[]) => {
  const map = new Map<string, DataProps>();
  videos.forEach((video) => {
    if (!video?.video_id) return;
    map.set(video.video_id, video);
  });
  return map;
};

const enrichSourcesWithVideoMeta = (
  sources: InsightSource[] | undefined,
  metaMap: Map<string, DataProps>
): InsightSource[] | undefined => {
  if (!Array.isArray(sources) || metaMap.size === 0) return sources;
  let mutated = false;
  const enriched = sources.map((source) => {
    if (!source?.video_id) return source;
    const meta = metaMap.get(source.video_id);
    if (!meta) return source;
    mutated = true;
    const channel = meta.channel_details ?? {};
    const summaryText = meta.summary_data?.short_summary?.trim();
    const headlineTitle = meta.summary_data?.headline_title?.trim();
    return {
      ...source,
      video_id: source.video_id ?? meta.video_id,
      title: source.title ?? headlineTitle ?? meta.title,
      thumbnail: source.thumbnail ?? meta.thumbnail,
      upload_date: source.upload_date ?? meta.upload_date,
      channel_id: source.channel_id ?? channel.channel_id,
      channel_name: source.channel_name ?? channel.channel_name,
      channel_thumbnail: source.channel_thumbnail ?? channel.channel_thumbnail,
      channel_subscribers:
        source.channel_subscribers ?? channel.channel_subscribers,
      summary_data: source.summary_data ?? meta.summary_data,
      summary: summaryText ?? source.summary,
    } satisfies InsightSource;
  });
  return mutated ? enriched : sources;
};

const enrichStockWithVideoMeta = (
  stock: InsightStock,
  metaMap: Map<string, DataProps>
): InsightStock => {
  const mergedSources = enrichSourcesWithVideoMeta(stock.sources, metaMap);
  if (!mergedSources || mergedSources === stock.sources) return stock;
  return {
    ...stock,
    sources: mergedSources,
  };
};

const enrichAssetWithVideoMeta = (
  asset: InsightAsset,
  metaMap: Map<string, DataProps>
): InsightAsset => {
  const mergedSources = enrichSourcesWithVideoMeta(asset.sources, metaMap);
  if (!mergedSources || mergedSources === asset.sources) return asset;
  return {
    ...asset,
    sources: mergedSources,
  };
};

const enrichInsightSectionWithVideoMeta = (
  section: InsightSection | undefined,
  videos: DataProps[]
): InsightSection | undefined => {
  if (!section || videos.length === 0) return section;
  const metaMap = buildVideoMetaMap(videos);
  if (metaMap.size === 0) return section;
  let stocksChanged = false;
  let assetsChanged = false;
  const stocks = section.data?.stocks?.map((stock) => {
    if (!stock) return stock;
    const next = enrichStockWithVideoMeta(stock, metaMap);
    if (next !== stock) stocksChanged = true;
    return next;
  });
  const assets = section.data?.assets?.map((asset) => {
    if (!asset) return asset;
    const next = enrichAssetWithVideoMeta(asset, metaMap);
    if (next !== asset) assetsChanged = true;
    return next;
  });
  if (!stocksChanged && !assetsChanged) return section;
  return {
    ...section,
    data: {
      ...section.data,
      stocks: stocks ?? section.data?.stocks,
      assets: assets ?? section.data?.assets,
    },
  };
};

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
    const baselineUrl = new URL(`${API_BASE_URL}/briefing/top_videos/stock`);
    if (date) baselineUrl.searchParams.set("date", date);
    const baselineVideos = await fetchJson<DataProps[]>(baselineUrl.toString());
    videos = filterVideosByMoneySection(baselineVideos, sectionKey);
  } else {
    const slotNumber =
      slotPhase === "ranking"
        ? SLOT_TIME_MAP.slot4
        : SLOT_TIME_MAP[slotPhase] ?? SLOT_TIME_MAP.slot5;
    const videoUrl = new URL(TOP_VIDEOS_V2_ENDPOINT);
    videoUrl.searchParams.set("time_slot", String(slotNumber));
    if (date) videoUrl.searchParams.set("date", date);
    const allVideos = await fetchJson<DataProps[]>(videoUrl.toString());
    console.log("check");
    console.log(allVideos);
    console.log(sectionKey);
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

  const enrichedSection = enrichInsightSectionWithVideoMeta(
    insightSection,
    videos
  );

  return buildSlotPackage(slotPhase, videos, enrichedSection);
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
  const summaryBriefing = await fetchIntegratedBriefing(config.label);
  return {
    id: `section-${sectionKey}`,
    type: config.type,
    anchor: config.anchor,
    title: config.label,
    summaryBullets: preferredPackage.tabs.market.commentary,
    summaryBriefing,
    defaultSlotId: preferredPackage.id,
    slotPackages,
  } as RecapSection;
};

const fetchGeneralSection = async (
  generalKey: GeneralSectionKey,
  rawParam: string,
  date?: string
): Promise<RecapSection> => {
  const config = GENERAL_SECTION_CONFIGS[generalKey];
  const sectionQuery = decodeURIComponent(rawParam);
  const videoUrl = new URL(SECTION_VIDEOS_ENDPOINT);
  videoUrl.searchParams.set("section", sectionQuery);
  if (date) videoUrl.searchParams.set("date", date);
  const videos = await fetchJson<DataProps[]>(videoUrl.toString());
  const summaryBriefing = await fetchIntegratedBriefing(sectionQuery);
  const summaryBullets = summaryBriefing?.entries.length
    ? summaryBriefing.entries
        .map((entry) => entry.soWhat || entry.title)
        .filter(
          (line): line is string =>
            typeof line === "string" && line.trim().length > 0
        )
    : ["시간 순으로 TOP 영상을 모았어요"];
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
    summaryBullets,
    summaryBriefing,
    slotPackages: [slotPackage],
    defaultSlotId: slotPackage.id,
  } as RecapSection;
};

export async function fetchBriefingLanding(
  briefingId: string | null,
  query?: BriefingLandingQuery
): Promise<BriefingLandingData | null> {
  const entries = decodeSectionEntries(query?.section);
  const slotQuery = query?.slot?.toLowerCase() as SlotPhase | undefined;
  const slotPhase: SlotPhase =
    slotQuery && SLOT_LABELS[slotQuery] ? slotQuery : "baseline";
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
            await fetchGeneralSection(
              entry.key as GeneralSectionKey,
              entry.raw,
              apiDate
            )
          );
        }
      } catch (error) {
        console.warn(`buildLandingSection failed (${entry.raw})`, error);
      }
    }

    if (sections.length > 0) {
      return {
        briefingId: briefingId ?? "briefing-landing",
        deliveryMeta: {
          deliveredAt: new Date().toISOString(),
          displayLabel: `${displayDate ?? "오늘"}`,
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
      `${LANDING_ENDPOINT}/${encodeURIComponent(briefingId ?? "")}`,
      {
        cache: "no-store",
      }
    );
    if (!response.ok) {
      if (response.status === 404) {
        return briefingId
          ? mockBriefingLandingById[briefingId] ?? mockBriefingLanding
          : mockBriefingLanding;
      }
      throw new Error(`Failed to load briefing landing: ${response.status}`);
    }
    const payload = (await response.json()) as BriefingLandingData;
    return payload;
  } catch (error) {
    console.warn("fetchBriefingLanding fallback", error);
    return briefingId
      ? mockBriefingLandingById[briefingId] ?? mockBriefingLanding
      : mockBriefingLanding;
  }
}
