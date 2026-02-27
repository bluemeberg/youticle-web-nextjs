import {
  mockBriefingLanding,
  mockBriefingLandingById,
} from "@/data/mockBriefingLanding";
import type { DataProps } from "@/types/dataProps";
import type {
  BriefingLandingData,
  EmailRecapSection,
  MarketIndexCard,
  MoneyRecapSection,
  RecapSection,
  RecapVideoSummary,
  SectionBriefingData,
  SectionBriefingEntry,
  SlotPackage,
} from "@/types/briefingLanding";
import type {
  EmailBriefingKeywordData,
  EmailBriefingVideoMeta,
} from "@/types/emailBriefing";
import { removeMarkTags } from "@/utils/formatter";

import type {
  InsightAsset,
  InsightSection,
  InsightSectionsResponse,
  InsightSource,
  InsightStock,
} from "@/types/insight";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://youticle.shop";
const API_STAGE_BASE_URL = "http://0.0.0.0:8001";
const LANDING_ENDPOINT = `${API_BASE_URL}/briefing/landing`;
const TOP_VIDEOS_V2_ENDPOINT = `${API_BASE_URL}/briefing_v2/top_videos/v2`;
const SECTION_VIDEOS_ENDPOINT = `${API_BASE_URL}/briefing/top_videos/section`;
const INSIGHT_SECTIONS_ENDPOINT = `${API_BASE_URL}/insights/sections`;
const KAKAO_CACHE_ENDPOINT = `${API_BASE_URL}/insights/kakao/cache`;
const EMAIL_DIGEST_ENDPOINT = `${API_BASE_URL}/emails/emails/digest/log`;

type BriefingLandingQuery = Record<string, string | undefined>;
export type SlotPhase =
  | "baseline"
  | "slot2"
  | "slot3"
  | "slot4"
  | "slot5"
  | "ranking";
export type MoneySectionKey = keyof typeof MONEY_SECTION_CONFIGS;
type GeneralSectionKey = keyof typeof GENERAL_SECTION_CONFIGS;

type KakaoSoWhatBullet =
  | string
  | {
      content?: string;
      teaser_question?: string;
      teaserQuestion?: string;
      web_detail?: string;
      webDetail?: string;
    };

interface KakaoIntegratedBriefingItem {
  title?: string;
  so_what?: string;
  so_what_bullets?: KakaoSoWhatBullet[];
  teaser_question?: string;
  web_detail?: string;
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

interface EmailDigestNarrative {
  text?: string;
  video_ids?: string[];
}

interface EmailDigestDriverNarrative {
  text?: string;
  video_ids?: string[];
}

interface EmailDigestMacroDriver {
  name?: string;
  indicator_focus?: string;
  narratives?: EmailDigestDriverNarrative[];
  teaser_questions?: string[];
}

interface EmailDigestVideoDetail {
  title?: string;
  section?: string;
  thumbnail?: string;
  channel_id?: string;
  channel_title?: string;
  channel_thumbnail?: string;
  channel_sub_count?: number;
  upload_date?: string;
  short_summary?: string;
}

interface EmailDigestModelWatchItem {
  model_name?: string;
  provider?: string;
  focus_area?: string;
  implication?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestUseCaseSpotlightItem {
  industry?: string;
  problem_solved?: string;
  result?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestCompetitionWatchItem {
  name?: string;
  detail?: string;
  signals?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestTheme {
  name?: string;
  narratives?: EmailDigestNarrative[];
  what_happened?: string;
  why_important?: string;
}

interface EmailDigestStrategicMove extends EmailDigestTheme {
  whatHappened?: string;
  whyImportant?: string;
}

interface EmailDigestRiskItem {
  title?: string;
  detail?: string | string[];
  impact?: string;
  owner?: string;
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestRiskSection {
  title?: string;
  items?: EmailDigestRiskItem[];
}

interface EmailDigestMarketPulse {
  summary?: string;
  price_trend?: string;
  transaction_trend?: string;
}

interface EmailDigestActionItem {
  title?: string;
  detail?: string[];
  owners?: string[];
  video_ids?: string[];
}

interface EmailDigestActionSection {
  title?: string;
  items?: EmailDigestActionItem[];
}

interface EmailDigestTechSnapshot {
  summary?: string;
  market_signal?: string;
  policy_signal?: string;
  innovation_signal?: string;
}

interface EmailDigestInfraPolicyWatchItem {
  topic?: string;
  detail?: string;
  impact?: string;
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestRiskEthicItem {
  title?: string;
  detail?: string;
  severity?: string;
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestNextStepItem {
  title?: string;
  detail?: string[];
  related_entities?: string[];
  teaser_questions?: string[];
}

interface EmailDigestNextStepsSection {
  title?: string;
  items?: EmailDigestNextStepItem[];
  teaser_questions?: string[];
}

interface EmailDigestEcosystemWatchItem {
  segment?: string;
  signals?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestInnovationTrack {
  name?: string;
  provider?: string;
  focus_area?: string;
  narratives?: EmailDigestNarrative[];
  impact_metrics?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestDemandSupplyItem {
  driver?: string;
  impact?: string[];
  regions?: string[];
  property_types?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestPolicyFinanceItem {
  title?: string;
  detail?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestPolicyWatchItem {
  when?: string;
  title?: string;
  detail?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestPolicyWatchSection {
  title?: string;
  items?: EmailDigestPolicyWatchItem[];
}

interface EmailDigestRegionalSpotlightItem {
  region?: string;
  story?: string[];
  metrics?: Record<string, string | number>;
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestSectorWatchItem {
  segment?: string;
  signals?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestMacroSnapshot {
  summary?: string;
  growth_signal?: string;
  policy_signal?: string;
  inflation_signal?: string;
  liquidity_signal?: string;
}

interface EmailDigestRiskFlagItem {
  title?: string;
  detail?: string;
  probability?: string;
  video_ids?: string[];
}

interface EmailDigestShortTermWatchItem {
  title?: string;
  detail?: string[];
}

interface EmailDigestShortTermWatch {
  title?: string;
  items?: EmailDigestShortTermWatchItem[];
  teaser_questions?: string[];
}

interface EmailDigestChecklistItem {
  title?: string;
  detail?: string[];
  teaser_questions?: string[];
}

interface EmailDigestChecklistSection {
  title?: string;
  items?: EmailDigestChecklistItem[];
  teaser_questions?: string[];
}

interface EmailDigestTickerProfile {
  ticker?: string;
  company_name?: string;
  thesis?: string[];
  signals?: string[];
  video_ids?: string[];
  teaser_questions?: string[];
}

interface EmailDigestMarketMood {
  summary?: string;
  flow_signal?: string;
  price_signal?: string;
}

interface EmailDigestInnovationPulse {
  summary?: string;
}

interface EmailDigestResponse {
  section?: string;
  generated_date?: string;
  llm_response?: {
    tldr?: {
      headline?: string;
      bullets?: string[];
    };
    themes?: EmailDigestTheme[];
    strategic_moves?: EmailDigestStrategicMove[];
    risk_section?: EmailDigestRiskSection;
    execution_risks?: EmailDigestRiskSection;
    drivers?: EmailDigestMacroDriver[];
    action_items?: EmailDigestActionSection;
    tech_snapshot?: EmailDigestTechSnapshot;
    ecosystem_watch?: EmailDigestEcosystemWatchItem[];
    innovation_tracks?: EmailDigestInnovationTrack[];
    market_pulse?: EmailDigestMarketPulse;
    demand_supply?: EmailDigestDemandSupplyItem[];
    policy_finance_watch?: {
      title?: string;
      items?: EmailDigestPolicyFinanceItem[];
    };
    model_watch?: EmailDigestModelWatchItem[];
    use_case_spotlight?: EmailDigestUseCaseSpotlightItem[];
    infra_policy_watch?: {
      title?: string;
      items?: EmailDigestInfraPolicyWatchItem[];
    };
    risk_ethics?: {
      title?: string;
      items?: EmailDigestRiskEthicItem[];
    };
    next_steps?: EmailDigestNextStepsSection;
    competition_watch?: EmailDigestCompetitionWatchItem[];
    regional_spotlight?: EmailDigestRegionalSpotlightItem[];
    policy_watch?: EmailDigestPolicyWatchSection;
    sector_watch?: EmailDigestSectorWatchItem[];
    macro_snapshot?: EmailDigestMacroSnapshot;
    risk_flags?: {
      title?: string;
      items?: EmailDigestRiskFlagItem[];
    };
    next_3day_watch?: EmailDigestShortTermWatch;
    ticker_profiles?: EmailDigestTickerProfile[];
    checklist_section?: EmailDigestChecklistSection;
    market_mood?: EmailDigestMarketMood;
    innovation_pulse?: EmailDigestInnovationPulse;
  };
  video_details?: Record<string, EmailDigestVideoDetail>;
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

const DEFAULT_EMAIL_OUTRO = {
  title: "개선된 브리핑 템플릿, 어떻게 느끼셨나요?",
  description:
    "필요한 모듈을 더 보고 싶거나, 빼고 싶은 영역이 있으면 지금 바로 알려주세요. 다음 브리핑 구성에 바로 반영해 드릴게요.",
  ctaLabel: "내 브리핑 의견 남기기",
  ctaHref: "https://tally.so/r/NpW6vj",
  footnote: "",
};

const mapVideoDetailsToMeta = (
  details: Record<string, EmailDigestVideoDetail> | undefined,
  sectionLabel: string,
): Record<string, EmailBriefingVideoMeta> => {
  if (!details) return {};
  const toSubscriberLabel = (value?: number | string) => {
    if (value == null) return undefined;
    const numeric =
      typeof value === "number"
        ? value
        : Number(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(numeric)) return undefined;
    if (numeric >= 1_000_000) {
      return `${(numeric / 1_000_000).toFixed(1).replace(/\.0$/, "")}M명`;
    }
    if (numeric >= 1_000) {
      return `${(numeric / 1_000).toFixed(1).replace(/\.0$/, "")}K명`;
    }
    return `${numeric}명`;
  };
  const result: Record<string, EmailBriefingVideoMeta> = {};
  Object.entries(details).forEach(([videoId, detail]) => {
    if (!videoId || videoId.startsWith("__")) return;
    const baseMeta = buildVideoMetaFromId(videoId, sectionLabel);
    const summaryText = detail.short_summary?.trim();
    result[videoId] = {
      ...baseMeta,
      title: detail.title?.trim() ? detail.title : baseMeta.title,
      thumbnail: detail.thumbnail ?? baseMeta.thumbnail,
      channelName: detail.channel_title ?? baseMeta.channelName,
      channelThumbnail: detail.channel_thumbnail ?? baseMeta.channelThumbnail,
      subscriberText:
        toSubscriberLabel(detail.channel_sub_count) ?? baseMeta.subscriberText,
      summary: summaryText ? [summaryText] : baseMeta.summary,
    };
  });
  return result;
};

const buildSectionBriefingEntry = (
  item: KakaoIntegratedBriefingItem,
  index: number,
) => {
  const title = (item.title ?? `브리핑 ${index + 1}`).trim();
  const normalizedBullets: SectionBriefingEntry["bullets"] = Array.isArray(
    item.so_what_bullets,
  )
    ? item.so_what_bullets
        .map((bullet) => {
          if (typeof bullet === "string") {
            const content = bullet.trim();
            return content ? { content } : null;
          }
          if (bullet && typeof bullet === "object") {
            const content = (bullet.content ?? "").trim();
            if (!content) return null;
            const teaserRaw =
              bullet.teaser_question ?? bullet.teaserQuestion ?? "";
            const teaser = teaserRaw.trim();
            const webDetailRaw = bullet.web_detail ?? bullet.webDetail ?? "";
            const webDetail = webDetailRaw.trim();
            const base = webDetail ? { content, webDetail } : { content };
            return teaser ? { ...base, teaserQuestion: teaser } : base;
          }
          return null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];
  const soWhat = normalizedBullets.length
    ? normalizedBullets.map((bullet) => bullet.content).join(" ")
    : (item.so_what ?? "").trim();
  const teaserQuestion = item.teaser_question?.trim();
  const webDetail = item.web_detail?.trim();
  const references = Array.isArray(item.references)
    ? item.references.filter(
        (ref): ref is string =>
          typeof ref === "string" && ref.trim().length > 0,
      )
    : [];
  const videoIds = references.filter((ref) => /[A-Za-z0-9_-]+/.test(ref));
  return {
    title,
    soWhat,
    references,
    videoIds,
    bullets: normalizedBullets,
    teaserQuestion,
    webDetail,
  };
};

const buildStaleSummaryNotice = (requestedDate?: string): SectionBriefingData => {
  const dateCopy = requestedDate ? requestedDate.replace(/-/g, ".") : "요청한";
  return {
    keywords: [],
    entries: [
      {
        title: "카카오 요약은 당일 데이터만 제공돼요",
        soWhat: `${dateCopy} 데이터는 요약 카드 없이 근거 영상만 확인할 수 있어요.`,
        references: [],
        videoIds: [],
        bullets: [
          {
            content:
              "카카오톡 브리핑 요약은 매일 아침 발행된 당일판을 기준으로 제공됩니다.",
          },
          {
            content:
              "과거 날짜는 근거 영상/섹션 본문만 확인 가능하며, 요약 카드는 최신 데이터로 확인해 주세요.",
          },
        ],
      },
    ],
    variant: "stale_notice",
    updatedAt: requestedDate ?? undefined,
  };
};

const fetchIntegratedBriefing = async (
  sectionLabel: string,
  options?: { preferLongVariant?: boolean; date?: string },
): Promise<SectionBriefingData | undefined> => {
  try {
    const buildRequestUrl = (variant: string) => {
      const url = new URL(KAKAO_CACHE_ENDPOINT);
      url.searchParams.set("sections", sectionLabel);
      url.searchParams.set("variant", variant);
      if (options?.date) {
        url.searchParams.set("date", options.date);
      }
      return url;
    };

    const variantOrder = options?.preferLongVariant
      ? ["keyword_long_v2", "keyword_long", "integrated"]
      : ["integrated", "keyword_long_v2", "keyword_long"];
    let payload: KakaoIntegratedResponse = {};
    let resolvedVariant: string | undefined;
    for (const variant of variantOrder) {
      const url = buildRequestUrl(variant);
      payload =
        (await fetchJson<KakaoIntegratedResponse>(url.toString())) ?? {};
      if (payload.sections?.length) {
        resolvedVariant = variant;
        break;
      }
    }
    const target = payload.sections?.find(
      (entry) => entry.section === sectionLabel,
    );
    if (!target?.data) return undefined;
    const keywords = (target.data.keywords ?? []).filter(
      (keyword): keyword is string =>
        typeof keyword === "string" && keyword.trim().length > 0,
    );
    const entries = (target.data.briefing ?? [])
      .map((item, idx) => buildSectionBriefingEntry(item, idx))
      .filter((entry) => entry.title || entry.soWhat);
    if (keywords.length === 0 && entries.length === 0) return undefined;
    return {
      keywords,
      entries,
      updatedAt: target.updated_at,
      variant: resolvedVariant,
    };
  } catch (error) {
    console.warn("fetchIntegratedBriefing failed", error);
    return undefined;
  }
};

const mapEmailDigestToBriefing = (
  payload: EmailDigestResponse,
  sectionLabel: string,
  fallbackDate?: string | null,
  sectionTopVideos?: EmailBriefingVideoMeta[],
): EmailBriefingKeywordData | null => {
  const llm = payload.llm_response;
  if (!llm) return null;
  const tldrHeadline = llm.tldr?.headline?.trim() || `${sectionLabel} 인사이트`;
  const tldrBullets = llm.tldr?.bullets ?? [];
  const normalizedTopVideos = (sectionTopVideos ?? [])
    .filter((video): video is EmailBriefingVideoMeta => Boolean(video?.id))
    .slice(0, 5);
  const topVideoMeta: Record<string, EmailBriefingVideoMeta> = {};
  normalizedTopVideos.forEach((video) => {
    if (video.id) {
      topVideoMeta[video.id] = video;
    }
  });
  const detailVideoMeta = mapVideoDetailsToMeta(
    payload.video_details,
    sectionLabel,
  );
  const videos: Record<string, EmailBriefingVideoMeta> = {
    ...topVideoMeta,
  };
  Object.entries(detailVideoMeta).forEach(([videoId, meta]) => {
    if (!videoId) return;
    const existing = videos[videoId];
    const summary =
      meta.summary && meta.summary.length > 0
        ? meta.summary
        : existing?.summary;
    const href = existing?.href ?? meta.href;
    videos[videoId] = {
      ...existing,
      ...meta,
      href,
    };
    if (summary?.length) {
      videos[videoId].summary = summary;
    }
  });
  const ensureVideoMeta = (id?: string) => {
    if (!id) return;
    if (!videos[id]) {
      videos[id] = buildVideoMetaFromId(id, sectionLabel);
    }
  };
  const topVideoIds = normalizedTopVideos
    .map((video) => video.id)
    .filter((id): id is string => Boolean(id));
  topVideoIds.forEach((id) => ensureVideoMeta(id));

  const sanitizeQuestions = (items?: Array<string | null>) =>
    (items ?? [])
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item && item.length > 0));

  const mapThemeEntries = (
    entries: (EmailDigestTheme | EmailDigestStrategicMove)[],
  ) =>
    entries.map((theme) => {
      const narratives = (theme.narratives ?? []).map((narrative) => ({
        text: narrative.text ?? "",
        videoIds: narrative.video_ids ?? [],
      }));
      const whatHappened =
        theme.what_happened ??
        (theme as EmailDigestStrategicMove).whatHappened ??
        narratives[0]?.text ??
        "";
      const whyImportant =
        theme.why_important ??
        (theme as EmailDigestStrategicMove).whyImportant ??
        narratives[1]?.text ??
        whatHappened;
      const teaserRaw =
        (theme as EmailDigestTheme & { teaser_questions?: string[] })
          .teaser_questions ??
        (theme as EmailDigestTheme & { teaserQuestions?: string[] })
          .teaserQuestions ??
        [];
      return {
        name: theme.name ?? sectionLabel,
        whatHappened,
        whyImportant,
        narratives,
        teaserQuestions: sanitizeQuestions(teaserRaw),
      };
    });

  const hasThemeData = (llm.themes?.length ?? 0) > 0;
  const themes = hasThemeData ? mapThemeEntries(llm.themes ?? []) : [];
  const strategicMoves = hasThemeData
    ? []
    : mapThemeEntries(llm.strategic_moves ?? []);

  const riskSection = llm.risk_section ?? llm.execution_risks;
  const riskItems = riskSection?.items ?? [];
  const executionRisks = {
    title: riskSection?.title ?? "실행 리스크",
    items: riskItems.map((item) => {
      const detailsArray = Array.isArray(item.detail)
        ? item.detail
        : item.detail
          ? [item.detail]
          : [];
      return {
        title: item.title ?? "",
        detail: detailsArray.join(" "),
        details: detailsArray,
        owner:
          item.owner ?? (item.impact ? item.impact.toUpperCase() : undefined),
        videoIds: item.video_ids ?? [],
      };
    }),
  };

  const modelWatch = (llm.model_watch ?? []).map((item) => ({
    modelName: item.model_name ?? "",
    provider: item.provider ?? "",
    focusArea: item.focus_area ?? "",
    implication: item.implication ?? [],
    videoIds: item.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(item.teaser_questions),
  }));
  const useCaseSpotlight = (llm.use_case_spotlight ?? []).map((item) => ({
    industry: item.industry ?? "",
    problemSolved: item.problem_solved ?? "",
    result: item.result ?? [],
    videoIds: item.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(item.teaser_questions),
  }));
  const infraPolicyWatch = {
    title: llm.infra_policy_watch?.title,
    items: (llm.infra_policy_watch?.items ?? []).map((item) => ({
      topic: item.topic ?? "",
      detail: item.detail ?? "",
      impact: item.impact,
      videoIds: item.video_ids ?? [],
      teaserQuestions: sanitizeQuestions(item.teaser_questions),
    })),
  };
  const riskEthics = {
    title: llm.risk_ethics?.title,
    items: (llm.risk_ethics?.items ?? []).map((item) => ({
      title: item.title ?? "",
      detail: item.detail ?? "",
      severity: item.severity,
      videoIds: item.video_ids ?? [],
      teaserQuestions: sanitizeQuestions(item.teaser_questions),
    })),
  };
  const nextSteps = {
    title: llm.next_steps?.title,
    items: (llm.next_steps?.items ?? []).map((item) => ({
      title: item.title ?? "",
      detail: item.detail ?? [],
      relatedEntities: item.related_entities ?? [],
      teaserQuestions: sanitizeQuestions(item.teaser_questions),
    })),
    teaserQuestions: sanitizeQuestions(llm.next_steps?.teaser_questions),
  };

  const innovationTracks = (llm.innovation_tracks ?? []).map((track) => {
    const narratives = (track.narratives ?? []).map((narrative) => ({
      text: narrative.text ?? "",
      videoIds: narrative.video_ids ?? [],
    }));
    return {
      name: track.name ?? sectionLabel,
      provider: track.provider ?? "",
      focusArea: track.focus_area ?? "",
      narratives,
      impactMetrics: track.impact_metrics ?? [],
      videoIds: track.video_ids ?? [],
      teaserQuestions: sanitizeQuestions(track.teaser_questions),
    };
  });

  const techSnapshot = llm.tech_snapshot
    ? {
        summary: llm.tech_snapshot.summary ?? "",
        marketSignal: llm.tech_snapshot.market_signal,
        policySignal: llm.tech_snapshot.policy_signal,
        innovationSignal: llm.tech_snapshot.innovation_signal,
      }
    : undefined;

  const ecosystemWatch = (llm.ecosystem_watch ?? []).map((item) => ({
    segment: item.segment ?? "",
    signals: item.signals ?? [],
    videoIds: item.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(item.teaser_questions),
  }));

  const actionItems = llm.action_items
    ? {
        title: llm.action_items.title,
        items: (llm.action_items.items ?? []).map((item) => ({
          title: item.title ?? "",
          detail: Array.isArray(item.detail)
            ? item.detail
            : item.detail
              ? [item.detail]
              : [],
          owners: item.owners ?? [],
          videoIds: item.video_ids ?? [],
        })),
      }
    : undefined;

  const marketPulse = llm.market_pulse
    ? {
        summary: llm.market_pulse.summary ?? "",
        priceTrend: llm.market_pulse.price_trend,
        transactionTrend: llm.market_pulse.transaction_trend,
      }
    : undefined;

  const demandSupply = (llm.demand_supply ?? []).map((item) => ({
    driver: item.driver ?? "",
    impact: item.impact ?? [],
    regions: item.regions ?? [],
    propertyTypes: item.property_types ?? [],
    videoIds: item.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(item.teaser_questions),
  }));

  const policyFinanceWatch = llm.policy_finance_watch
    ? {
        title: llm.policy_finance_watch.title,
        items: (llm.policy_finance_watch.items ?? []).map((item) => ({
          title: item.title ?? "",
          detail: Array.isArray(item.detail)
            ? item.detail
            : item.detail
              ? [item.detail]
              : [],
          videoIds: item.video_ids ?? [],
          teaserQuestions: sanitizeQuestions(item.teaser_questions),
        })),
      }
    : undefined;

  const competitionWatch = (llm.competition_watch ?? []).map((item) => ({
    name: item.name ?? sectionLabel,
    detail: Array.isArray(item.detail)
      ? item.detail.join(" ")
      : (item.detail ?? ""),
    signals: item.signals ?? [],
    videoIds: item.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(item.teaser_questions),
  }));

  const regionalSpotlight = (llm.regional_spotlight ?? []).map((spot) => ({
    region: spot.region ?? sectionLabel,
    story: spot.story ?? [],
    videoIds: spot.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(spot.teaser_questions),
  }));

  const riskFlags = llm.risk_flags
    ? {
        title: llm.risk_flags.title,
        items: (llm.risk_flags.items ?? []).map((item) => ({
          title: item.title ?? "",
          detail: item.detail ?? "",
          probability: item.probability,
          videoIds: item.video_ids ?? [],
        })),
      }
    : undefined;

  const shortTermWatch = llm.next_3day_watch
    ? {
        title: llm.next_3day_watch.title,
        items: (llm.next_3day_watch.items ?? []).map((item) => ({
          title: item.title ?? "",
          detail: item.detail ?? [],
        })),
        teaserQuestions: sanitizeQuestions(
          llm.next_3day_watch.teaser_questions,
        ),
      }
    : undefined;

  const macroDrivers = (llm.drivers ?? []).map((driver) => ({
    name: driver.name ?? sectionLabel,
    indicatorFocus: driver.indicator_focus,
    narratives: (driver.narratives ?? []).map((narrative) => ({
      text: narrative.text ?? "",
      videoIds: narrative.video_ids ?? [],
    })),
    teaserQuestions: sanitizeQuestions(driver.teaser_questions),
  }));

  const macroPolicyWatch = llm.policy_watch
    ? {
        title: llm.policy_watch.title,
        items: (llm.policy_watch.items ?? []).map((item) => ({
          title: item.title ?? "",
          detail: item.detail ?? [],
          when: item.when,
          videoIds: item.video_ids ?? [],
          teaserQuestions: sanitizeQuestions(item.teaser_questions),
        })),
      }
    : undefined;

  const macroRiskSection = llm.risk_section
    ? {
        title: llm.risk_section.title,
        items: (llm.risk_section.items ?? []).map((item) => ({
          title: item.title ?? "",
          detail: Array.isArray(item.detail)
            ? item.detail
            : item.detail
              ? [item.detail]
              : [],
          impact: item.impact,
          videoIds: item.video_ids ?? [],
          teaserQuestions: sanitizeQuestions(item.teaser_questions),
        })),
      }
    : undefined;

  const macroSectorWatch = (llm.sector_watch ?? []).map((item) => ({
    segment: item.segment ?? "",
    signals: item.signals ?? [],
    videoIds: item.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(item.teaser_questions),
  }));

  const macroSnapshot = llm.macro_snapshot
    ? {
        summary: llm.macro_snapshot.summary,
        growthSignal: llm.macro_snapshot.growth_signal,
        policySignal: llm.macro_snapshot.policy_signal,
        inflationSignal: llm.macro_snapshot.inflation_signal,
        liquiditySignal: llm.macro_snapshot.liquidity_signal,
      }
    : undefined;

  const macroChecklist = llm.checklist_section
    ? {
        title: llm.checklist_section.title,
        items: (llm.checklist_section.items ?? []).map((item) => ({
          title: item.title ?? "",
          detail: item.detail ?? [],
          teaserQuestions: sanitizeQuestions(item.teaser_questions),
        })),
        teaserQuestions: sanitizeQuestions(
          llm.checklist_section.teaser_questions,
        ),
      }
    : undefined;

  themes.forEach((move) => {
    move.narratives.forEach((narrative) =>
      (narrative.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
    );
  });
  executionRisks.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  (llm.ticker_profiles ?? []).forEach((profile) =>
    (profile.video_ids ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  modelWatch.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  useCaseSpotlight.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  infraPolicyWatch.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  riskEthics.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  innovationTracks.forEach((track) => {
    (track.videoIds ?? []).forEach((id) => ensureVideoMeta(id));
    track.narratives.forEach((narrative) =>
      (narrative.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
    );
  });
  ecosystemWatch.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  actionItems?.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  demandSupply.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  policyFinanceWatch?.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  competitionWatch.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  regionalSpotlight.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  riskFlags?.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  macroDrivers.forEach((driver) =>
    driver.narratives.forEach((narrative) =>
      (narrative.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
    ),
  );
  macroPolicyWatch?.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  macroRiskSection?.items.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );
  macroSectorWatch.forEach((item) =>
    (item.videoIds ?? []).forEach((id) => ensureVideoMeta(id)),
  );

  const tickerProfiles = (llm.ticker_profiles ?? []).map((profile) => ({
    ticker: profile.ticker,
    companyName: profile.company_name,
    thesis: profile.thesis ?? [],
    signals: profile.signals ?? [],
    videoIds: profile.video_ids ?? [],
    teaserQuestions: sanitizeQuestions(profile.teaser_questions),
  }));
  const checklist = (llm.checklist_section?.items ?? []).map((item) => ({
    title: item.title ?? "",
    detail: item.detail ?? [],
  }));

  return {
    topicLabel: `Youticle 브리핑 · ${sectionLabel}`,
    dateBadge:
      formatEmailDateBadge(payload.generated_date) ||
      formatEmailDateBadge(fallbackDate) ||
      "",
    preheader: tldrHeadline,
    summaryBadge: "요약",
    tldr: {
      headline: tldrHeadline,
      bullets: tldrBullets,
    },
    strategicMoves,
    executionRisks,
    videos,
    topVideoIds,
    outro: DEFAULT_EMAIL_OUTRO,
    marketMood: llm.market_mood
      ? {
          summary: llm.market_mood.summary,
          flowSignal: llm.market_mood.flow_signal,
          priceSignal: llm.market_mood.price_signal,
        }
      : undefined,
    themes,
    tickerProfiles,
    checklist,
    checklistTeaserQuestions: sanitizeQuestions(
      llm.checklist_section?.teaser_questions,
    ),
    modelWatch,
    useCaseSpotlight,
    infraPolicyWatch,
    riskEthics,
    nextSteps,
    innovationTracks,
    techSnapshot,
    ecosystemWatch,
    actionItems,
    competitionWatch,
    marketPulse,
    demandSupply,
    policyFinanceWatch,
    regionalSpotlight,
    riskFlags,
    shortTermWatch,
    innovationPulseSummary: llm.innovation_pulse?.summary,
    macroDrivers,
    macroPolicyWatch,
    macroRiskSection,
    macroSectorWatch,
    macroSnapshot,
    macroChecklist,
  };
};

export const fetchEmailDigestSection = async (
  sectionLabel: string,
  generatedDate?: string | null,
  options?: {
    sectionKey?: MoneySectionKey | GeneralSectionKey;
    slotPhase?: SlotPhase;
    date?: string | null;
  },
): Promise<EmailBriefingKeywordData | null> => {
  try {
    const url = new URL(EMAIL_DIGEST_ENDPOINT);
    url.searchParams.set("section", sectionLabel);
    if (generatedDate) {
      url.searchParams.set("generated_date", generatedDate);
    }

    const topVideoPromise = (async () => {
      try {
        if (options?.sectionKey && isMoneySectionKey(options.sectionKey)) {
          const pkg = await fetchMoneySlotPackage(
            options.sectionKey,
            options.slotPhase ?? "baseline",
            options.date ?? generatedDate ?? undefined,
          );
          const recapVideos = pkg.tabs?.videos ?? [];
          return recapVideos.map((video) =>
            mapRecapSummaryToEmailMeta(video, sectionLabel),
          );
        }
        const videos = await fetchSectionTopVideos(
          sectionLabel,
          options?.date ?? generatedDate ?? undefined,
        );
        return videos.map((video) =>
          mapDataPropsToEmailMeta(video, sectionLabel),
        );
      } catch (error) {
        console.warn(
          `fetchSectionTopVideos failed (email/${sectionLabel})`,
          error,
        );
        return [] as EmailBriefingVideoMeta[];
      }
    })();

    const [payload, topVideoMetas] = await Promise.all([
      fetchJson<EmailDigestResponse>(url.toString()),
      topVideoPromise,
    ]);
    if (!payload) return null;
    return mapEmailDigestToBriefing(
      payload,
      sectionLabel,
      generatedDate,
      topVideoMetas,
    );
  } catch (error) {
    console.warn(`fetchEmailDigestSection failed (${sectionLabel})`, error);
    return null;
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

const SLOT_PHASE_SET = new Set<SlotPhase>(ALL_SLOT_PHASES);
const MONEY_SECTION_KEYS = Object.keys(
  MONEY_SECTION_CONFIGS,
) as MoneySectionKey[];

export const isSlotPhase = (value: string): value is SlotPhase =>
  SLOT_PHASE_SET.has(value as SlotPhase);

export const isMoneySectionKey = (value: string): value is MoneySectionKey =>
  MONEY_SECTION_KEYS.includes(value as MoneySectionKey);

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

export const toApiDate = (value?: string) => {
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

const buildEmailAnchorId = (label: string, index: number) => {
  const base = label
    .trim()
    .replace(/[^\w가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const suffix = base || `section-${index + 1}`;
  return `email-${suffix}-${index + 1}`;
};

const formatEmailDateBadge = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
  }
  return value;
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

const formatSubscriberLabel = (value: unknown): string | undefined => {
  const numeric = toNumericSubscribers(value);
  if (numeric == null) return undefined;
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1).replace(/\.0$/, "")}M명`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1).replace(/\.0$/, "")}K명`;
  }
  return `${numeric}명`;
};

const mapDataPropsToEmailMeta = (
  video: DataProps,
  sectionLabel: string,
): EmailBriefingVideoMeta => {
  const fallbackId = video.video_id ?? video.id ?? "";
  const safeHref = fallbackId
    ? `https://youticle.io/detail/${fallbackId}`
    : "https://youticle.io";
  const summaryList = (() => {
    const shortSummary = video.summary_data?.short_summary?.trim();
    if (shortSummary) {
      return [removeMarkTags(shortSummary)];
    }
    const keyPoints = video.summary_data?.key_points;
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      return keyPoints
        .map((point: any) =>
          typeof point === "string" ? point : (point?.point ?? ""),
        )
        .filter((line) => line.length > 0)
        .map((line) => removeMarkTags(line));
    }
    return [];
  })();
  return {
    id: video.video_id,
    title:
      video.summary_data?.headline_title?.trim() ||
      video.summary_data?.headline_sub_title?.trim() ||
      video.title ||
      video.video_id,
    thumbnail: video.thumbnail,
    channelName: video.channel_details?.channel_name || sectionLabel,
    channelThumbnail: video.channel_details?.channel_thumbnail,
    subscriberText: formatSubscriberLabel(
      video.channel_details?.channel_subscribers,
    ),
    href: safeHref,
    summary: summaryList,
  };
};

const mapRecapSummaryToEmailMeta = (
  video: RecapVideoSummary,
  fallbackLabel: string,
): EmailBriefingVideoMeta => ({
  id: video.id,
  title: video.title,
  thumbnail: video.thumbnail,
  channelName: video.channel || fallbackLabel,
  channelThumbnail: video.channelThumbnail,
  subscriberText: video.subscriberText,
  href:
    video.href || (video.id ? `/detail/${video.id}` : "https://youticle.io"),
});

const buildEmailVideoMetaLookup = (
  videos: DataProps[],
  sectionLabel: string,
) => {
  const lookup: Record<string, EmailBriefingVideoMeta> = {};
  videos.forEach((video) => {
    const videoId = video?.video_id;
    if (!videoId) return;
    lookup[videoId] = mapDataPropsToEmailMeta(video, sectionLabel);
  });
  return lookup;
};

const buildVideoMetaFromId = (
  videoId: string,
  sectionLabel: string,
): EmailBriefingVideoMeta => ({
  id: videoId,
  title: videoId,
  thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  channelName: sectionLabel || "YouTube",
  href: `https://youticle.io/detail/${videoId}`,
});

const filterVideosByMoneySection = (
  videos: DataProps[],
  sectionKey: MoneySectionKey,
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
    targetSet.has(normalizeSectionText(video.section)),
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
    section?.data?.market_insights?.by_market ?? {},
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
        stock.metrics?.chg_pct ?? stock.metrics?.price_info?.change_pct,
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
            typeof point === "string" ? point : (point?.point ?? ""),
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
  metaMap: Map<string, DataProps>,
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
  metaMap: Map<string, DataProps>,
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
  metaMap: Map<string, DataProps>,
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
  videos: DataProps[],
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
  insightSection?: InsightSection,
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

const buildLazySlotPlaceholder = (slotPhase: SlotPhase): SlotPackage => {
  const slotConfig = SLOT_LABELS[slotPhase] ?? SLOT_LABELS.slot4;
  return {
    id: slotPhase,
    label: slotConfig.title,
    displayTime: slotConfig.time,
    description: slotConfig.description,
    tabs: undefined,
    isPrefetched: false,
  };
};

export const fetchMoneySlotPackage = async (
  sectionKey: MoneySectionKey,
  slotPhase: SlotPhase,
  date?: string,
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
        : (SLOT_TIME_MAP[slotPhase] ?? SLOT_TIME_MAP.slot5);
    const videoUrl = new URL(TOP_VIDEOS_V2_ENDPOINT);
    videoUrl.searchParams.set("time_slot", String(slotNumber));
    if (date) videoUrl.searchParams.set("date", date);
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
    insightsUrl.toString(),
  );
  const insightSection = insightPayload.sections?.find(
    (section) =>
      section.key === config.insightKey || section.label === config.label,
  );

  const enrichedSection = enrichInsightSectionWithVideoMeta(
    insightSection,
    videos,
  );

  return buildSlotPackage(slotPhase, videos, enrichedSection);
};

const buildMoneySection = async (
  sectionKey: MoneySectionKey,
  slotPhase: SlotPhase,
  date?: string,
  options?: {
    preloadAllSlots?: boolean;
    preferLongVariant?: boolean;
    allowSummary?: boolean;
    summaryDate?: string;
  },
): Promise<RecapSection> => {
  const config = MONEY_SECTION_CONFIGS[sectionKey];
  const targetPhases = options?.preloadAllSlots ? ALL_SLOT_PHASES : [slotPhase];
  const slotResults = await Promise.all(
    targetPhases.map((phase) =>
      fetchMoneySlotPackage(sectionKey, phase, date)
        .then((pkg) => ({ phase, pkg }))
        .catch((error) => {
          console.warn(
            `fetchMoneySlotPackage failed (${sectionKey}/${phase})`,
            error,
          );
          return { phase, pkg: buildSlotPackage(phase, []) };
        }),
    ),
  );

  const fetchedMap = new Map<SlotPhase, SlotPackage>();
  slotResults.forEach(({ phase, pkg }) => {
    if (pkg) {
      fetchedMap.set(phase, { ...pkg, isPrefetched: true });
    }
  });

  const slotPackages = ALL_SLOT_PHASES.map((phase) => {
    const fetched = fetchedMap.get(phase);
    return fetched ?? buildLazySlotPlaceholder(phase);
  });

  const preferredPackage =
    fetchedMap.get(slotPhase) ??
    slotPackages.find((pkg) => pkg.tabs) ??
    slotPackages[0];

  const summaryDateParam = options?.summaryDate ?? date;
  let summaryBriefing: SectionBriefingData | undefined;
  if (options?.allowSummary === false && !summaryDateParam) {
    summaryBriefing = buildStaleSummaryNotice(options?.summaryDate);
  } else {
    summaryBriefing = await fetchIntegratedBriefing(config.label, {
      preferLongVariant: options?.preferLongVariant,
      date: summaryDateParam,
    });
    if (!summaryBriefing && options?.allowSummary === false) {
      summaryBriefing = buildStaleSummaryNotice(options?.summaryDate);
    }
  }
  return {
    id: `section-${sectionKey}`,
    type: config.type,
    anchor: config.anchor,
    title: config.label,
    summaryBullets: preferredPackage?.tabs?.market.commentary ?? [],
    summaryBriefing,
    defaultSlotId: preferredPackage?.id,
    slotPackages,
    sourceKey: sectionKey,
  } as RecapSection;
};

async function fetchSectionTopVideos(
  sectionQuery: string,
  date?: string,
): Promise<DataProps[]> {
  const videoUrl = new URL(SECTION_VIDEOS_ENDPOINT);
  videoUrl.searchParams.set("section", sectionQuery);
  if (date) videoUrl.searchParams.set("date", date);
  return fetchJson<DataProps[]>(videoUrl.toString());
}

const fetchGeneralSection = async (
  generalKey: GeneralSectionKey,
  rawParam: string,
  date?: string,
  options?: {
    preferLongVariant?: boolean;
    allowSummary?: boolean;
    summaryDate?: string;
  },
): Promise<RecapSection> => {
  const config = GENERAL_SECTION_CONFIGS[generalKey];
  const sectionQuery = decodeURIComponent(rawParam);
  const videos = await fetchSectionTopVideos(sectionQuery, date);
  const summaryDateParam = options?.summaryDate ?? date;
  let summaryBriefing: SectionBriefingData | undefined;
  if (options?.allowSummary === false && !summaryDateParam) {
    summaryBriefing = buildStaleSummaryNotice(options?.summaryDate);
  } else {
    summaryBriefing = await fetchIntegratedBriefing(sectionQuery, {
      preferLongVariant: options?.preferLongVariant,
      date: summaryDateParam,
    });
    if (!summaryBriefing && options?.allowSummary === false) {
      summaryBriefing = buildStaleSummaryNotice(options?.summaryDate);
    }
  }
  const summaryBullets = summaryBriefing?.entries.length
    ? summaryBriefing.entries
        .map((entry) => entry.soWhat || entry.title)
        .filter(
          (line): line is string =>
            typeof line === "string" && line.trim().length > 0,
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
  query?: BriefingLandingQuery,
): Promise<BriefingLandingData | null> {
  const entries = decodeSectionEntries(query?.section);
  const slotQuery = query?.slot?.toLowerCase() as SlotPhase | undefined;
  const slotPhase: SlotPhase =
    slotQuery && SLOT_LABELS[slotQuery] ? slotQuery : "baseline";
  const dateParam = query?.date ?? query?.data;
  const generatedDateParam = query?.generated_date ?? dateParam;
  const apiDate = toApiDate(dateParam);
  const displayDate = toDisplayDate(dateParam);
  const emailGeneratedDate = toApiDate(generatedDateParam);
  const sourceParam = query?.source?.toLowerCase();
  const tagParam = query?.tag?.toLowerCase();
  const preferLongVariant = tagParam === "long";
  const todayToken = new Date().toISOString().slice(0, 10);
  const isCurrentDate = !apiDate || apiDate === todayToken;

  if (sourceParam === "email" && entries.length > 0) {
    const emailSections = (
      await Promise.all(
        entries.map(async (entry, index) => {
          const briefing = await fetchEmailDigestSection(
            entry.raw,
            emailGeneratedDate,
            { sectionKey: entry.key, slotPhase, date: apiDate },
          );
          console.log(briefing);
          if (!briefing) return null;
          const anchor = buildEmailAnchorId(entry.raw, index);
          return {
            id: anchor,
            type: "email" as const,
            title: entry.raw,
            anchor,
            summaryBullets: briefing.tldr.bullets.slice(0, 3),
            emailBriefing: briefing,
            sourceKey: entry.key,
          } satisfies EmailRecapSection;
        }),
      )
    ).filter(Boolean) as EmailRecapSection[];

    if (emailSections.length > 0) {
      const displayLabel =
        emailSections[0].emailBriefing.dateBadge ||
        formatEmailDateBadge(emailGeneratedDate) ||
        displayDate ||
        "이메일 브리핑";
      return {
        briefingId:
          briefingId ?? `email-landing-${emailGeneratedDate ?? "today"}`,
        deliveryMeta: {
          deliveredAt: new Date().toISOString(),
          displayLabel,
          description: "이메일 브리핑",
          tagline: "이메일 브리핑",
          backHref: "/briefing",
          backLabel: "전체 브리핑",
          source: "email",
        },
        keywordNav: emailSections.map((section) => ({
          id: section.id,
          label: section.title,
          anchor: section.anchor,
        })),
        sections: emailSections,
        exploreTabs: [],
      } satisfies BriefingLandingData;
    }
  }

  if (entries.length > 0) {
    const sections: RecapSection[] = [];
    for (const entry of entries) {
      try {
        if (entry.key in MONEY_SECTION_CONFIGS) {
          sections.push(
            await buildMoneySection(
              entry.key as MoneySectionKey,
              slotPhase,
              apiDate,
              {
                preferLongVariant,
                allowSummary: isCurrentDate,
                summaryDate: apiDate,
              },
            ),
          );
        } else if (entry.key in GENERAL_SECTION_CONFIGS) {
          sections.push(
            await fetchGeneralSection(
              entry.key as GeneralSectionKey,
              entry.raw,
              apiDate,
              {
                preferLongVariant,
                allowSummary: isCurrentDate,
                summaryDate: apiDate,
              },
            ),
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
      },
    );
    if (!response.ok) {
      if (response.status === 404) {
        return briefingId
          ? (mockBriefingLandingById[briefingId] ?? mockBriefingLanding)
          : mockBriefingLanding;
      }
      throw new Error(`Failed to load briefing landing: ${response.status}`);
    }
    const payload = (await response.json()) as BriefingLandingData;
    return payload;
  } catch (error) {
    console.warn("fetchBriefingLanding fallback", error);
    return briefingId
      ? (mockBriefingLandingById[briefingId] ?? mockBriefingLanding)
      : mockBriefingLanding;
  }
}
