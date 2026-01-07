"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Fragment,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import styled, { keyframes, css } from "styled-components";
import TopicCard from "./TopicCard";
import DomesticStockInsightSection from "./insight/DomesticStockInsightSection";
import CryptoInsightSection from "./insight/CryptoInsightSection";
import { DataProps, StockFeedSlotPhase } from "@/types/dataProps";
import type { StockSlotSection } from "@/utils/stockFeed";
import type { SlotLabel } from "@/utils/briefingSlot";
import TodayIcon from "@/assets/today.svg";
// import { YOUTUBE_TOPICS } from "@/constants/topic";
import GoToTopBtn from "@/common/GoToTopBtn";
import CountdownTimer from "@/common/CountdownTimer";
import SortOptions from "@/common/SortOptions";
import TopicNav from "./TopicNav";
import { topicState } from "@/store/topic";
import { useRecoilValue, useSetRecoilState, useResetRecoilState } from "recoil";
import { unsubscribedDataState } from "@/store/unsubscribeData";
import { userState } from "@/store/user";
import type { MarketInsightCardData } from "@/utils/marketInsight";
import type { InsightSection, InsightSource } from "@/types/insight";
import { removeMarkTags } from "@/utils/formatter";
import StockMarketSection from "./insight/StockMarketSection";

const TODAY_TITLE = "미구독 중인 키워드 아티클";
const SUBS_TODAY_TITLE = "구독 중인 키워드 아티클";
interface YoutubeTodayProps {
  data: DataProps[];
  subjects: string[]; // 추가된 subjects prop
  marketInsightCards?: MarketInsightCardData[];
  integratedSections?: InsightSection[];
  initialTopic?: string | null;
  stockSlotSections?: StockSlotSection[];
  insightSlotLabel?: SlotLabel;
}

const YOUTUBE_TOPICS = [
  { topic: "전체", icon: "🌐" },
  { topic: "주식", icon: "📈" },
  { topic: "국내 주식", icon: "📈" },
  { topic: "해외 주식", icon: "📈" },
  { topic: "부동산", icon: "🏢" },
  { topic: "국내 가상자산", icon: "💰" },
  { topic: "해외 가상자산", icon: "💰" },
  { topic: "경제", icon: "💵" },
  { topic: "정치", icon: "🏛️" },
  { topic: "비즈니스/사업", icon: "💼" },
  { topic: "건강", icon: "🩺" },
  { topic: "피트니스", icon: "🏋️" },
  { topic: "연애/결혼", icon: "❤️" },
  { topic: "육아", icon: "👶" },
  { topic: "뷰티/메이크업", icon: "💄" },
  { topic: "여자 패션", icon: "👗" },
  { topic: "남자 패션", icon: "👔" },
  { topic: "요리", icon: "🍳" },
  { topic: "IT/테크", icon: "💻" },
  { topic: "인공지능", icon: "🤖" },
  { topic: "자동차", icon: "🚗" },
  { topic: "여행", icon: "✈️" },
  { topic: "과학", icon: "🔬" },
  { topic: "역사", icon: "📜" },
];

const OVERSEAS_STOCK_SECTIONS = new Set(["해외 주식"]);
const DOMESTIC_STOCK_SECTIONS = new Set(["국내 주식", "주식"]);
const CRYPTO_SECTIONS = new Set(["국내 가상자산", "해외 가상자산", "가상자산"]);

type MoneySlotLabelDefinition = {
  title: string;
  description: string;
};

type MoneySlotLabelMap = Record<StockFeedSlotPhase, MoneySlotLabelDefinition>;

type MoneyCategory = "domestic_stock" | "overseas_stock" | "crypto" | "other";

const GROUPED_TOPICS: Record<string, string[]> = {
  주식: ["주식", "국내 주식", "해외 주식"],
  가상자산: ["국내 가상자산", "해외 가상자산"],
  // 필요하다면 다른 그룹도 추가
};

const METRIC_KEYS = [
  // "category_relative_views_pct",
  "relative_sub_norm_pct",
  "avg_views_per_hour",
  "like_rate_pct",
  "comment_rate_pct",
] as const;
type MetricKey = (typeof METRIC_KEYS)[number];

const METRIC_LABELS: Record<MetricKey, string> = {
  // category_relative_views_pct: "카테고리 조회수 순위",
  relative_sub_norm_pct: "구독자 대비 조회수 순위",
  avg_views_per_hour: "시간당 조회수 순위",
  like_rate_pct: "좋아요율 순위",
  comment_rate_pct: "댓글율 순위",
};

const metricMeta: Record<MetricKey, { icon: string; name: string }> = {
  avg_views_per_hour: { icon: "👁️", name: "시간당 조회수" },
  // category_relative_views_pct: { icon: "📊", name: "조회수" },
  relative_sub_norm_pct: { icon: "👥", name: "구독자당 조회속도" },
  like_rate_pct: { icon: "👍", name: "좋아요율" },
  comment_rate_pct: { icon: "💬", name: "댓글율" },
};

const MARKET_INSIGHT_TARGET_TOPICS = [
  "국내 주식",
  "해외 주식",
  "국내 가상자산",
  "해외 가상자산",
] as const;

const MARKET_INSIGHT_TOPIC_GROUPS: Record<string, string[]> = {
  주식: ["국내 주식", "해외 주식"],
  가상자산: ["국내 가상자산", "해외 가상자산"],
};

const INTEGRATED_SECTION_MAP: Record<string, string> = {
  "국내 주식": "domestic_stock",
  "해외 주식": "overseas_stock",
  "국내 가상자산": "domestic_crypto",
  "해외 가상자산": "overseas_crypto",
};

const SLOT_DISPLAY_CONFIGS: Array<{
  id: string;
  label: string;
  description: string;
  minutes: number;
  requireNew?: boolean;
}> = [
  {
    id: "slot_0730",
    label: "07:30 선정",
    description: "주식·가상자산 첫 선정",
    minutes: 7 * 60 + 30,
  },
  {
    id: "slot_0830",
    label: "08:30 갱신",
    description: "주식·가상자산 새 영상 선정",
    minutes: 8 * 60 + 30,
  },
  {
    id: "slot_1130",
    label: "11:30 재랭킹",
    description: "오전 랭킹 갱신",
    minutes: 11 * 60 + 30,
  },
  {
    id: "slot_1240",
    label: "12:40 갱신",
    description: "주식·가상자산 두 번째 선정",
    minutes: 12 * 60 + 40,
  },
  {
    id: "slot_1510",
    label: "15:10 갱신",
    description: "주식·가상자산 세 번째 선정",
    minutes: 15 * 60 + 10,
  },
  {
    id: "slot_1530",
    label: "15:30 재랭킹",
    description: "주식·가상자산 오후 랭킹 점검",
    minutes: 15 * 60 + 30,
  },
  {
    id: "slot_1600",
    label: "16:00 재랭킹",
    description: "일반 키워드 오후 랭킹 갱신",
    minutes: 16 * 60,
  },
  {
    id: "slot_1730",
    label: "17:30 재랭킹",
    description: "주식·가상자산 장 마감 직후 랭킹 갱신",
    minutes: 17 * 60 + 30,
  },
  {
    id: "slot_1810",
    label: "18:10 재랭킹",
    description: "주식·가상자산 저녁 랭킹 갱신",
    minutes: 18 * 60 + 10,
  },
  {
    id: "slot_2030",
    label: "20:30 재랭킹",
    description: "일반 키워드 저녁 랭킹 갱신",
    minutes: 20 * 60 + 30,
    requireNew: false,
  },
  {
    id: "slot_2100",
    label: "21:00 재랭킹",
    description: "일반 키워드 밤 랭킹 갱신",
    minutes: 21 * 60,
  },
  {
    id: "slot_2140",
    label: "21:40 갱신",
    description: "주식·가상자산 마지막 선정",
    minutes: 21 * 60 + 40,
  },
];

const SLOT_DISPLAY_PRIORITY = SLOT_DISPLAY_CONFIGS.reduce<
  Record<string, number>
>((acc, config, index) => {
  acc[config.id] = index;
  return acc;
}, {});

const SLOT_DISPLAY_CONFIG_MAP = SLOT_DISPLAY_CONFIGS.reduce<
  Record<string, (typeof SLOT_DISPLAY_CONFIGS)[number]>
>((acc, config) => {
  acc[config.id] = config;
  return acc;
}, {});

const getSlotDisplayPriority = (slotId: string) => {
  if (slotId === "slot_2030") {
    return -1; // evening 재랭킹을 피드 최상단에 고정
  }
  if (slotId === "slot_1530") {
    const target = SLOT_DISPLAY_PRIORITY["slot_1130"];
    if (typeof target === "number") {
      return target - 0.5; // 15:30 재랭킹을 11:30보다 상단에 노출
    }
  }
  return SLOT_DISPLAY_PRIORITY[slotId] ?? Number.MAX_SAFE_INTEGER;
};

type SlotLabelDefinition = {
  title: string;
  description: string;
};

type SlotLabelMap = Record<StockFeedSlotPhase, SlotLabelDefinition>;

const STOCK_SLOT_LABELS: MoneySlotLabelMap = {
  baseline: {
    title: "프리 마켓 1차 브리핑",
    description: "07:30 장 시작 전 베이스라인",
  },
  slot1: {
    title: "프리 마켓 2차 브리핑",
    description: "08:30 장 시작 직전 업데이트",
  },
  slot2: {
    title: "점심장 중간 브리핑",
    description: "12:30 점심장 흐름 점검",
  },
  slot3: {
    title: "장 마감 전 브리핑",
    description: "15:10 장 마감 직전 체크",
  },
  slot4: {
    title: "저녁 리뷰 브리핑",
    description: "21:00 장 마감 리뷰",
  },
};

const CRYPTO_SLOT_LABELS: MoneySlotLabelMap = {
  baseline: {
    title: "새벽·아침 코인 브리핑 1차",
    description: "07:30 새벽/아침 흐름",
  },
  slot1: {
    title: "아침 브리핑 2차",
    description: "08:30 출근 직전 급등락 체크",
  },
  slot2: {
    title: "점심 브리핑",
    description: "점심 시간대 코인 반응",
  },
  slot3: {
    title: "오후 브리핑",
    description: "오후~퇴근 시간대 리듬",
  },
  slot4: {
    title: "심야 브리핑",
    description: "밤 시간대 미국장 반응",
  },
};

const OVERSEAS_STOCK_SLOT_LABELS: MoneySlotLabelMap = {
  baseline: {
    title: "간밤 미국장 1차 요약",
    description: "07:30 미국장 핵심 요약",
  },
  slot1: {
    title: "간밤 미국장 2차 요약",
    description: "08:30 새 소식 업데이트",
  },
  slot2: {
    title: "오늘 밤 미국장 프리뷰 1차",
    description: "12:30 오늘 밤 주목 포인트",
  },
  slot3: {
    title: "오늘 밤 미국장 프리뷰 2차",
    description: "15:10 마감 전 리마인드",
  },
  slot4: {
    title: "미국 프리마켓 체크",
    description: "21:00 프리마켓 동향",
  },
};

const CATEGORY_DISPLAY_NAMES: Record<Exclude<MoneyCategory, "other">, string> = {
  domestic_stock: "국내 주식",
  overseas_stock: "해외 주식",
  crypto: "가상자산",
};

const resolveCategoryLabel = (section?: string | null) => {
  if (!section) return undefined;
  const category = resolveMoneyCategory(section);
  if (category === "other") return undefined;
  return CATEGORY_DISPLAY_NAMES[category as Exclude<MoneyCategory, "other">];
};

type MoneySlotSection = {
  slot: StockFeedSlotPhase;
  priority: number;
  title: string;
  description: string;
  items: DataProps[];
  categoryLabel?: string;
};

type SlotSectionEntry = {
  slotId: string;
  label: string;
  description: string;
  relativeLabel: string;
  items: DataProps[];
  categoryLabel?: string;
};

const resolveMoneyCategory = (section: string): MoneyCategory => {
  if (CRYPTO_SECTIONS.has(section)) return "crypto";
  if (OVERSEAS_STOCK_SECTIONS.has(section)) return "overseas_stock";
  if (DOMESTIC_STOCK_SECTIONS.has(section)) return "domestic_stock";
  return "other";
};

const resolveSlotLabelMapForCategory = (
  category: MoneyCategory
): SlotLabelMap => {
  if (category === "crypto") return CRYPTO_SLOT_LABELS;
  if (category === "overseas_stock") return OVERSEAS_STOCK_SLOT_LABELS;
  return STOCK_SLOT_LABELS;
};

const resolveSlotLabelMapForSection = (section: string): SlotLabelMap => {
  return resolveSlotLabelMapForCategory(resolveMoneyCategory(section));
};

const buildCategorySlotSections = (
  items: DataProps[],
  slot: StockFeedSlotPhase,
  priority: number,
  includeCategoryLabel: boolean
): MoneySlotSection[] => {
  if (items.length === 0) return [];
  const groups = new Map<MoneyCategory, DataProps[]>();
  items.forEach((item) => {
    const category = resolveMoneyCategory(item.section);
    if (category === "other") return;
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(item);
  });

  if (groups.size === 0) {
    const fallbackMap = resolveSlotLabelMapForSection(items[0]?.section ?? "");
    const fallbackMeta = fallbackMap[slot];
    return [
      {
        slot,
        priority,
        title: fallbackMeta.title,
        description: fallbackMeta.description,
        items,
        categoryLabel: resolveCategoryLabel(items[0]?.section),
      },
    ];
  }

  return Array.from(groups.entries()).map(([category, groupedItems]) => {
    const labelMap = resolveSlotLabelMapForCategory(category);
    const meta = labelMap[slot];
    const categoryLabel =
      CATEGORY_DISPLAY_NAMES[category as Exclude<MoneyCategory, "other">];
    const title = includeCategoryLabel
      ? `${meta.title} · ${categoryLabel}`
      : meta.title;
    return {
      slot,
      priority,
      title,
      description: meta.description,
      items: groupedItems,
      categoryLabel,
    };
  });
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const getKstMinutes = (date: Date) => {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return (utcMinutes + 9 * 60) % (24 * 60);
};

const formatMinutesAgo = (diffMinutes: number) => {
  if (diffMinutes <= 0) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const hours = Math.max(1, Math.round(diffMinutes / 60));
  return `${hours}시간 전`;
};

const normalizeTopicKey = (value: string) =>
  value.replace(/[\s_-]+/g, "").toLowerCase();

const TOPIC_LOOKUP_BY_NORMALIZED = new Map<string, string>(
  YOUTUBE_TOPICS.map(({ topic }) => [normalizeTopicKey(topic), topic])
);

const TOPIC_ALIASES: Record<string, string> = {
  domesticstock: "국내 주식",
  overseasstock: "해외 주식",
  domesticcrypto: "국내 가상자산",
  overseascrypto: "해외 가상자산",
};

const resolveTopicFromQuery = (raw?: string | null): string | undefined => {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalizedKey = normalizeTopicKey(trimmed);
  return (
    TOPIC_LOOKUP_BY_NORMALIZED.get(normalizedKey) ??
    TOPIC_ALIASES[normalizedKey]
  );
};

const inferCardTopics = (card: MarketInsightCardData): string[] => {
  if (card.topics.length > 0) {
    return card.topics;
  }

  const normalized = (card.marketKey ?? card.market ?? "").toUpperCase();
  const inferred: string[] = [];

  if (/(KOSPI|KOSDAQ|KRX)/.test(normalized)) {
    inferred.push("국내 주식");
  }
  if (/(NASDAQ|S&P|DOW|NYSE|AMEX)/.test(normalized)) {
    inferred.push("해외 주식");
  }
  if (/(KRW)/.test(normalized)) {
    inferred.push("국내 가상자산");
  }
  if (/(USD|USDT)/.test(normalized)) {
    inferred.push("해외 가상자산");
  }

  return inferred;
};

const YoutubeToday = ({
  data,
  subjects,
  marketInsightCards = [],
  integratedSections = [],
  initialTopic,
  stockSlotSections = [],
  insightSlotLabel,
}: YoutubeTodayProps) => {
  const selectedTopic = useRecoilValue(topicState);
  const setSelectedTopic = useSetRecoilState(topicState);
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortOptionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setUnsubscribedData = useSetRecoilState(unsubscribedDataState);
  const resetUnsubscribedData = useResetRecoilState(unsubscribedDataState);
  const user = useRecoilValue(userState);
  const [isRendered, setIsRendered] = useState(false); // 애니메이션을 위한 상태
  const [showSchedule, setShowSchedule] = useState(false);
  const selectedTopicRef = useRef(selectedTopic);
  const appliedInitialTopicRef = useRef<string | null>(null);

  useEffect(() => {
    selectedTopicRef.current = selectedTopic;
  }, [selectedTopic]);

  useEffect(() => {
    if (!initialTopic) return;
    const resolved = resolveTopicFromQuery(initialTopic);
    if (!resolved) return;
    if (appliedInitialTopicRef.current === resolved) return;
    appliedInitialTopicRef.current = resolved;
    if (selectedTopicRef.current === resolved) {
      return;
    }
    setSelectedTopic(resolved);
  }, [initialTopic, setSelectedTopic]);

  const requestedMarketInsightTopics = useMemo<string[]>(() => {
    if (selectedTopic === "전체") {
      return [...MARKET_INSIGHT_TARGET_TOPICS];
    }

    if (MARKET_INSIGHT_TOPIC_GROUPS[selectedTopic]) {
      return [...MARKET_INSIGHT_TOPIC_GROUPS[selectedTopic]];
    }

    if (
      MARKET_INSIGHT_TARGET_TOPICS.includes(
        selectedTopic as (typeof MARKET_INSIGHT_TARGET_TOPICS)[number]
      )
    ) {
      return [selectedTopic];
    }

    return [];
  }, [selectedTopic]);

  const visibleMarketInsightCards = useMemo(() => {
    if (marketInsightCards.length === 0) return [];
    const desired = new Set<string>(requestedMarketInsightTopics);
    if (desired.size === 0) return [];

    return marketInsightCards.filter((card) => {
      const topics = inferCardTopics(card);
      return topics.some((topic) => desired.has(topic));
    });
  }, [marketInsightCards, requestedMarketInsightTopics]);

  // 미구독 데이터 필터링
  const unsubscribedData = data.filter(
    (item) => !subjects.includes(item.section)
  );
  // sec → nav에서 클릭할 topic 이름으로 변환
  const toNavTopic = (sec: string) => {
    const g = Object.entries(GROUPED_TOPICS).find(([, arr]) =>
      arr.includes(sec)
    );
    return g ? g[0] : sec;
  };

  // 상위 주제 → 하위 토픽 확장 맵
  const SUB_EXPAND_MAP: Record<string, string[]> = {
    주식: ["국내 주식", "해외 주식"],
    가상자산: ["국내 가상자산", "해외 가상자산"],
  };

  // 구독 목록을 확장(원본 + 하위 토픽)
  const expandSubjects = (subs: string[]) => {
    const out = new Set<string>(subs);
    subs.forEach((s) => SUB_EXPAND_MAP[s]?.forEach((t) => out.add(t)));
    return Array.from(out);
  };
  // 구독(상위) → 하위 토픽까지 확장
  const expandedSubjects = useMemo(() => expandSubjects(subjects), [subjects]);
  const expandedSubsSet = useMemo(
    () => new Set(expandedSubjects),
    [expandedSubjects]
  );
  // useEffect(() => {
  //   if (subjects.length > 0) {
  //     setSelectedTopic(subjects[0]);
  //   }
  //   resetUnsubscribedData();
  // }, [subjects, setSelectedTopic, resetUnsubscribedData]);

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    // 피드 영역 세로 스크롤 초기화 (맨 위로)

    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (sortOptionsRef.current) {
      const { top } = sortOptionsRef.current.getBoundingClientRect();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const [clientData, setClientData] = useState<DataProps[]>([]);

  const videoMetaMap = useMemo(() => {
    const map = new Map<string, InsightSource>();
    clientData.forEach((item) => {
      if (!item?.video_id) return;
      const summaryText = removeMarkTags(
        item.summary_data?.short_summary || ""
      ).trim();
      map.set(item.video_id, {
        video_id: item.video_id,
        channel_subscribers: item.channel_details?.channel_subscribers,
        channel_id: item.channel_details?.channel_id,
        title: item.title,
        thumbnail: item.thumbnail,
        upload_date: item.upload_date,
        channel_name: item.channel_details?.channel_name,
        channel_thumbnail: item.channel_details?.channel_thumbnail,
        summary: summaryText.length > 0 ? summaryText : undefined,
        summary_data: item.summary_data,
      });
    });
    return map;
  }, [clientData]);

  const enrichedIntegratedSections = useMemo(() => {
    if (!integratedSections || integratedSections.length === 0) {
      return integratedSections;
    }

    return integratedSections.map((section) => {
      const stocks = section.data?.stocks?.map((stock) => {
        if (!stock || !stock.sources || stock.sources.length === 0)
          return stock;

        const sources = stock.sources.map((source) => {
          if (!source) return source;
          const meta = videoMetaMap.get(source.video_id);
          if (!meta) return source;
          const summary = meta.summary?.trim();

          return {
            ...source,
            channel_subscribers:
              source.channel_subscribers ?? meta.channel_subscribers,
            channel_id: source.channel_id ?? meta.channel_id,
            title: meta.title ?? source.title,
            thumbnail: meta.thumbnail ?? source.thumbnail,
            upload_date: meta.upload_date ?? source.upload_date,
            channel_name: source.channel_name ?? meta.channel_name,
            channel_thumbnail:
              source.channel_thumbnail ?? meta.channel_thumbnail,
            summary: summary && summary.length > 0 ? summary : source.summary,
            summary_data: source.summary_data ?? meta.summary_data,
          };
        });

        return {
          ...stock,
          sources,
        };
      });

      return {
        ...section,
        data: {
          ...section.data,
          stocks,
        },
      };
    });
  }, [integratedSections, videoMetaMap]);

  const integratedMap = useMemo(() => {
    const map = new Map<string, InsightSection>();
    enrichedIntegratedSections.forEach((section) => {
      map.set(section.key, section);
      map.set(section.label, section);
    });
    return map;
  }, [enrichedIntegratedSections]);

  const selectedIntegratedSection = useMemo(() => {
    const key = INTEGRATED_SECTION_MAP[selectedTopic];
    if (key) {
      const byKey = integratedMap.get(key);
      if (byKey) return byKey;
    }
    return integratedMap.get(selectedTopic);
  }, [integratedMap, selectedTopic]);

  useEffect(() => {
    // 클라이언트 측에서만 데이터를 세팅 (서버와 클라이언트의 데이터를 일치시키기 위해 초기 데이터 사용)
    setClientData(data);
    setTimeout(() => setIsRendered(true), 100); // 애니메이션 트리거
  }, [data]);

  // Unsubscribe 페이지로 이동하며 미구독 데이터를 전달하는 함수
  const handleUnsubscribeClick = () => {
    setUnsubscribedData(unsubscribedData);
    router.push("/today/unsubscribe");
  };
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false); // 토글 상태
  const matchesTopicFilter = useCallback(
    (item: DataProps) => {
      if (showSubscribedOnly && expandedSubsSet.size > 0) {
        if (selectedTopic === "전체") {
          return expandedSubsSet.has(item.section);
        }

        const group = GROUPED_TOPICS[selectedTopic];
        if (group) {
          const hasSubscribedChild = group.some((g) => expandedSubsSet.has(g));
          return (
            (group.includes(item.section) && hasSubscribedChild) ||
            expandedSubsSet.has(selectedTopic)
          );
        }

        return (
          expandedSubsSet.has(item.section) && item.section === selectedTopic
        );
      }

      if (selectedTopic === "전체") {
        return true;
      }

      const group = GROUPED_TOPICS[selectedTopic];
      if (group) {
        return group.includes(item.section);
      }

      return item.section === selectedTopic;
    },
    [showSubscribedOnly, expandedSubsSet, selectedTopic]
  );

  const filteredAndSortedData = useMemo(() => {
    const seen = new Set<string>();

    return (
      clientData
        .filter(matchesTopicFilter)
        // 중복 video_id 제거
        .filter((item) => {
          if (seen.has(item.video_id)) return false;
          seen.add(item.video_id);
          return true;
        })
        .sort((a, b) => {
          if (sortCriteria === "engagement") return b.score - a.score;
          return b.views + b.likes * 10 - (a.views + a.likes * 10);
        })
    );
  }, [clientData, matchesTopicFilter, sortCriteria]);

  const preMarketSections = useMemo<MoneySlotSection[]>(() => {
    const baselineSection = stockSlotSections.find(
      (section) => section.slot === "baseline"
    );
    if (!baselineSection) return [];
    const seen = new Set<string>();
    const filteredItems = baselineSection.items
      .filter((item) => item.stock_slot_phase === "baseline")
      .filter((item) => matchesTopicFilter(item))
      .filter((item) => {
        if (seen.has(item.video_id)) return false;
        seen.add(item.video_id);
        return true;
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (filteredItems.length === 0) return [];

    if (selectedTopic === "전체") {
      return buildCategorySlotSections(
        filteredItems,
        "baseline",
        baselineSection.priority,
        true
      );
    }

    const labelMap = resolveSlotLabelMapForSection(
      filteredItems[0]?.section ?? selectedTopic
    );
    const meta = labelMap.baseline;
    return [
      {
        slot: "baseline",
        priority: baselineSection.priority,
        title: meta.title,
        description: meta.description,
        items: filteredItems,
        categoryLabel: resolveCategoryLabel(filteredItems[0]?.section),
      },
    ];
  }, [stockSlotSections, matchesTopicFilter, selectedTopic]);

  const stockSlotSectionsForView = useMemo<MoneySlotSection[]>(() => {
    if (stockSlotSections.length === 0) return [];
    const sections: MoneySlotSection[] = [];
    const totalMinutes = 24 * 60;
    const nowMinutes = getKstMinutes(new Date());

    const sorted = [...stockSlotSections].sort(
      (a, b) => a.priority - b.priority
    );

    sorted.forEach((section) => {
      if (section.slot === "baseline") return;
      const filteredItems = section.items
        .filter(matchesTopicFilter)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      if (filteredItems.length === 0) return;

      let slotItems = filteredItems;
      const categoryLabel = resolveCategoryLabel(filteredItems[0]?.section);

      if (section.slot === "slot3") {
        const highlighted = filteredItems.filter(
          (item) => item.is_new && item.detected_slots?.slot_1730
        );
        if (highlighted.length > 0) {
          const highlightedIds = new Set(
            highlighted.map((item) => item.video_id)
          );
          slotItems = filteredItems.filter(
            (item) => !highlightedIds.has(item.video_id)
          );
          const config = SLOT_DISPLAY_CONFIG_MAP["slot_1730"];
          const highlightMinutes = config?.minutes ?? null;
          const relativeLabel =
            highlightMinutes != null
              ? formatMinutesAgo(
                  (nowMinutes - highlightMinutes + totalMinutes) % totalMinutes
                )
              : "방금 전";
          const highlightCategoryLabel = resolveCategoryLabel(
            highlighted[0]?.section ?? filteredItems[0]?.section
          );
          sections.push({
            slot: section.slot,
            priority: section.priority + 0.01,
            title: `${relativeLabel} 신규 진입`,
            description: config?.label ?? "17:30 재랭킹",
            items: highlighted,
            categoryLabel: highlightCategoryLabel,
          });
        }
      }

      if (slotItems.length === 0) return;

      if (selectedTopic === "전체") {
        sections.push(
          ...buildCategorySlotSections(
            slotItems,
            section.slot,
            section.priority,
            true
          )
        );
        return;
      }

      const labelMap = resolveSlotLabelMapForSection(
        slotItems[0]?.section ?? selectedTopic
      );
      const meta = labelMap[section.slot];
      sections.push({
        slot: section.slot,
        priority: section.priority,
        title: meta.title,
        description: meta.description,
        items: slotItems,
        categoryLabel,
      });
    });

    return sections.sort((a, b) => a.priority - b.priority);
  }, [stockSlotSections, matchesTopicFilter, selectedTopic]);

  const slotSectionGroups = useMemo(() => {
    const slot4 = stockSlotSectionsForView.filter(
      (section) => section.slot === "slot4"
    );
    const others = stockSlotSectionsForView.filter(
      (section) => section.slot !== "slot4"
    );
    return { slot4, others };
  }, [stockSlotSectionsForView]);

  const isMoneyTopic =
    DOMESTIC_STOCK_SECTIONS.has(selectedTopic) ||
    OVERSEAS_STOCK_SECTIONS.has(selectedTopic) ||
    CRYPTO_SECTIONS.has(selectedTopic);

  const persistingVideos = useMemo(() => {
    const nonNew = filteredAndSortedData.filter(
      (item) => !item.is_new && item.stock_slot_phase !== "baseline"
    );
    if (selectedTopic === "전체") {
      return nonNew;
    }
    return nonNew.slice(0, 5);
  }, [filteredAndSortedData, selectedTopic]);

  const slotSections = useMemo<SlotSectionEntry[]>(() => {
    const nowMinutes = getKstMinutes(new Date());
    const totalMinutes = 24 * 60;
    const entries: Array<SlotSectionEntry | null> = SLOT_DISPLAY_CONFIGS.map((config) => {
      if (config.id === "slot_1730") return null; // 머니 섹션 전용으로 중복 노출 방지
      const requireNew = config.requireNew !== false;
      const items = filteredAndSortedData
        .filter((item) => {
          if (!item.detected_slots?.[config.id]) return false;
          if (requireNew && !item.is_new) return false;
          return true;
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      if (items.length === 0) return null;
      const diff = (nowMinutes - config.minutes + totalMinutes) % totalMinutes;
      const relativeLabel = formatMinutesAgo(diff);
      const categoryLabel = resolveCategoryLabel(items[0]?.section);
      return {
        slotId: config.id,
        label: config.label,
        description: config.description,
        relativeLabel,
        items,
        categoryLabel,
      };
    });
    return entries.filter(
      (section): section is SlotSectionEntry => Boolean(section)
    )
      .sort(
        (a, b) =>
          getSlotDisplayPriority(a.slotId) - getSlotDisplayPriority(b.slotId)
      );
  }, [filteredAndSortedData]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollRefTop = scrollRef.current.getBoundingClientRect().top;
        setIsFixed(scrollRefTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 구독중인 주제 서버 불러오기
  // 주제가 있다면

  const handleChangeSubjectClick = () => {
    router.push("/subject/modify");
  };

  const filteredSubjects = showSubscribedOnly
    ? expandedSubjects // 상위 구독시 하위(국내/해외)까지 네비에 노출
    : YOUTUBE_TOPICS.map((t) => t.topic);
  // ① 필터＋정렬된 리스트가 바뀔 때마다, 각 메트릭별 랭킹 맵을 계산

  const metricRanks = useMemo(() => {
    const ranks: Record<MetricKey, Map<string, number>> = {
      // category_relative_views_pct: new Map(),
      relative_sub_norm_pct: new Map(),
      avg_views_per_hour: new Map(),
      like_rate_pct: new Map(),
      comment_rate_pct: new Map(),
    };

    // ① 전체 항목에서 “섹션명” 만 뽑아서 중복 제거
    const sections = Array.from(
      new Set(filteredAndSortedData.map((v) => v.section))
    );

    METRIC_KEYS.forEach((key) => {
      // ② 섹션별로 그룹핑 해서, 해당 그룹 내에서만 순위를 매김
      sections.forEach((sec) => {
        const groupItems = filteredAndSortedData.filter(
          (v) => v.section === sec
        );
        const sortedGroup = [...groupItems].sort(
          (a, b) => (b.summary_data[key] ?? 0) - (a.summary_data[key] ?? 0)
        );
        sortedGroup.forEach((item, idx) => {
          ranks[key].set(item.video_id, idx + 1);
        });
      });
    });

    return ranks;
  }, [filteredAndSortedData]);

  type RenderOptions = {
    compactBadges?: boolean;
    slotTitle?: string;
    slotDescription?: string;
    onJumpToVideos?: () => void;
  };

  const renderTopicCard = useCallback(
    (item: DataProps, keyPrefix = "", options?: RenderOptions) => {
      const topicInfo = YOUTUBE_TOPICS.find(
        (topic) => topic.topic === item.section
      );
      const auxKeys = METRIC_KEYS;
      let bestKey: MetricKey = auxKeys[0];
      let bestRank = metricRanks[bestKey].get(item.video_id) ?? Infinity;

      auxKeys.forEach((key) => {
        const rank = metricRanks[key].get(item.video_id) ?? Infinity;
        if (rank < bestRank) {
          bestKey = key;
          bestRank = rank;
        }
      });

      const metricValue = item.summary_data[bestKey];
      const { icon: metricIcon, name: metricLabel } = metricMeta[bestKey];
      return (
        <TopicCard
          key={`${keyPrefix}${item.video_id}`}
          icon={topicInfo?.icon}
          subjects={subjects}
          metricIcon={metricIcon}
          metricLabel={metricLabel}
          metricValue={metricValue}
          rank={bestRank}
          showTopicLabel={selectedTopic === "전체"}
          compactBadges={options?.compactBadges}
          slotTitle={options?.slotTitle}
          slotDescription={options?.slotDescription}
          onJumpToVideos={options?.onJumpToVideos}
          {...item}
        />
      );
    },
    [metricRanks, selectedTopic, subjects]
  );

  const feedRef = useRef<HTMLDivElement>(null);
  const topVideosRef = useRef<HTMLDivElement>(null);
  const handleJumpToVideos = useCallback(() => {
    topVideosRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const renderIntegratedSection = () => {
    if (!selectedIntegratedSection) return null;

    const key = selectedIntegratedSection.key ?? "";
    const label = selectedIntegratedSection.label ?? "";

    const hasDeltaData = Boolean(
      selectedIntegratedSection.data?.market_delta_insights?.by_market &&
        Object.keys(
          selectedIntegratedSection.data?.market_delta_insights?.by_market ?? {}
        ).length > 0
    );

    const isCryptoSection =
      label.includes("가상자산") || /_crypto$/.test(key) || /crypto/.test(key);
    const isStockSection =
      label.includes("주식") || /_stock/.test(key) || /stock/.test(key);

    let insightContent: ReactNode = null;

    if (isCryptoSection) {
      insightContent = (
        <CryptoInsightSection
          section={selectedIntegratedSection}
          slotLabel={insightSlotLabel}
        />
      );
    } else if (isStockSection && hasDeltaData) {
      insightContent = (
        <StockMarketSection
          section={selectedIntegratedSection}
          slotLabel={insightSlotLabel}
        />
      );
    } else {
      insightContent = (
        <DomesticStockInsightSection
          section={selectedIntegratedSection}
          slotLabel={insightSlotLabel}
        />
      );
    }

    const sectionTitle =
      selectedTopic === "전체"
        ? "오늘 시장 핵심"
        : `오늘 ${selectedTopic} 핵심`;

    return (
      <InsightHeroCard>
        <InsightHeroHeader>
          <InsightHeroEyebrow>💡 {sectionTitle}</InsightHeroEyebrow>
          {insightSlotLabel ? (
            <InsightHeroMeta>
              {insightSlotLabel.title}
              {insightSlotLabel.description
                ? ` · ${insightSlotLabel.description}`
                : ""}
            </InsightHeroMeta>
          ) : null}
        </InsightHeroHeader>
        <InsightHeroBody>{insightContent}</InsightHeroBody>
        {/* <InsightHeroActions>
          <PrimaryInsightButton type="button" onClick={handleJumpToVideos}>
            📌 오늘 핵심 영상 보기
          </PrimaryInsightButton>
        </InsightHeroActions> */}
      </InsightHeroCard>
    );
  };

  return (
    <Container ref={feedRef}>
      <ScheduleSummary>
        <ScheduleHeader>
          <ScheduleHeading>📣 키워드별 갱신 리듬</ScheduleHeading>
          <ScheduleToggle
            type="button"
            onClick={() => setShowSchedule((prev) => !prev)}
            aria-expanded={showSchedule}
          >
            {showSchedule ? "접기" : "자세히 보기"}
            <ScheduleToggleIcon $expanded={showSchedule} />
          </ScheduleToggle>
        </ScheduleHeader>
        <ScheduleSummaryText>
          주식·가상자산 <strong>6회</strong>, 일반 키워드 <strong>4회</strong>로
          하루 내내 랭킹을 점검해요.
        </ScheduleSummaryText>
        <ScheduleCollapse $expanded={showSchedule} aria-hidden={!showSchedule}>
          <ScheduleList>
            <ScheduleItem>
              <ScheduleLabel>주식·가상자산</ScheduleLabel>
              <ScheduleDesc>
                하루 <ScheduleHighlight>6번 모니터링</ScheduleHighlight>해서
                <ScheduleHighlight>지금 반응 좋은 영상</ScheduleHighlight>만
                다시 골라드려요.
              </ScheduleDesc>
              <ScheduleTiming>
                ⏱ 07:30 · 08:30 · 12:40 · 15:10 · 18:10(재랭킹) · 21:40
              </ScheduleTiming>
            </ScheduleItem>
            <ScheduleItem>
              <ScheduleLabel>다른 키워드</ScheduleLabel>
              <ScheduleDesc>
                하루 <ScheduleHighlight>4번 랭킹 갱신</ScheduleHighlight>으로
                핵심 영상만 남겨둡니다.
              </ScheduleDesc>
              <ScheduleTiming>
                ⏱ 07:30 선정 → 11:30 · 16:00 · 21:00 재랭킹
              </ScheduleTiming>
            </ScheduleItem>
          </ScheduleList>
        </ScheduleCollapse>
      </ScheduleSummary>
      <Header>
        {/* {subjects.length > 0 && ( // 구독한 주제가 있을 때만 렌더링
          <ToggleContainer>
            <ToggleLabel>📌 구독중인 키워드 브리핑만 보기</ToggleLabel>
            <ToggleButtonContainer>
              <ToggleButton
                isActive={showSubscribedOnly}
                onClick={() => {
                  setShowSubscribedOnly(true); // 구독 키워드 보기 활성화
                  setSelectedTopic("전체"); // 섹션 초기화
                }}
              >
                ON
              </ToggleButton>
              <ToggleButton
                isActive={!showSubscribedOnly}
                onClick={() => {
                  setShowSubscribedOnly(false); // 구독 키워드 보기 비활성화
                  setSelectedTopic("전체"); // 섹션 초기화
                }}
              >
                OFF
              </ToggleButton>
            </ToggleButtonContainer>
          </ToggleContainer>
        )} */}
      </Header>
      <SubContainer>
        <TopicNavContainer ref={scrollRef}>
          <TopicNav
            $isFixed={isFixed}
            selectedTopic={selectedTopic}
            handleTopicClick={handleTopicClick}
            subjects={filteredSubjects} // 구독 주제 전달
            unSubscribe={[]}
            showSubscribedOnly={showSubscribedOnly}
            subscribedSubjects={expandedSubjects} // 구독 주제 전달 (색상 변경용)
            belowNavContent={<>{renderIntegratedSection()}</>}
          ></TopicNav>
        </TopicNavContainer>
        {/* <CountdownTimer /> */}
      </SubContainer>
      {/* 여기서 Topic별 subtitle 추가 */}

      {/* <SortOptions
        ref={sortOptionsRef}
        isFixed={isFixed}
        sortCriteria={sortCriteria}
        tooltipVisible={tooltipVisible}
        setTooltipVisible={setTooltipVisible}
        handleSortClick={handleSortClick}
        handleClickIcon={handleClickIcon}
        variant="default"
      /> */}
      {/* 🛠 애니메이션 추가 */}
      <TopicCardWrapper $isRendered={isRendered}>
        {slotSectionGroups.slot4.length > 0 && (
          <>
            {[...slotSectionGroups.slot4].reverse().map((section) => (
              <MoneySectionBlock
                key={`stock-slot-${section.slot}-${section.title}`}
              >
                <SectionBadgeBlock
                  emoji="🟥"
                  title={section.title}
                  subtitle={section.description}
                  category={section.categoryLabel}
                />
                <EditorContainer>
                  {section.items.map((item) =>
                    renderTopicCard(item, `stock-${section.slot}-`, {
                      compactBadges: selectedTopic === "전체",
                      slotTitle: section.title,
                      slotDescription: section.description,
                      onJumpToVideos: handleJumpToVideos,
                    })
                  )}
                </EditorContainer>
              </MoneySectionBlock>
            ))}
          </>
        )}

        {slotSections.length > 0 && (
          <>
            {slotSections.map((section) => (
              <MoneySectionBlock key={section.slotId}>
                <SectionBadgeBlock
                  emoji="🔥"
                  title={
                    section.relativeLabel
                      ? `${section.relativeLabel} 진입`
                      : section.label
                  }
                  subtitle={
                    section.description
                      ? `${section.label} · ${section.description}`
                      : section.label
                  }
                  category={section.categoryLabel}
                />
                <EditorContainer>
                  {section.items.map((item) =>
                    renderTopicCard(item, `${section.slotId}-`)
                  )}
                </EditorContainer>
              </MoneySectionBlock>
            ))}
          </>
        )}

        {slotSectionGroups.others.length > 0 && (
          <>
            {[...slotSectionGroups.others].reverse().map((section) => (
              <MoneySectionBlock
                key={`stock-slot-${section.slot}-${section.title}`}
              >
                <SectionBadgeBlock
                  emoji="🎯"
                  title={section.title}
                  subtitle={section.description}
                  category={section.categoryLabel}
                />
                <EditorContainer>
                  {section.items.map((item) =>
                    renderTopicCard(item, `stock-${section.slot}-`, {
                      compactBadges: selectedTopic === "전체",
                      slotTitle: section.title,
                      slotDescription: section.description,
                      onJumpToVideos: handleJumpToVideos,
                    })
                  )}
                </EditorContainer>
              </MoneySectionBlock>
            ))}
          </>
        )}

        {preMarketSections.length > 0 ? (
          <>
            {[...preMarketSections].reverse().map((section, index) => (
              <MoneySectionBlock key={`premarket-${section.title}-${index}`}>
                <SectionBadgeBlock
                  emoji="⏰"
                  title={section.title}
                  subtitle={section.description}
                />
                <EditorContainer>
                  {section.items.map((item) =>
                    renderTopicCard(item, `premarket-${index}-`, {
                      compactBadges: selectedTopic === "전체",
                      slotTitle: section.title,
                      slotDescription: section.description,
                      onJumpToVideos: handleJumpToVideos,
                    })
                  )}
                </EditorContainer>
              </MoneySectionBlock>
            ))}
          </>
        ) : null}

        {/* <StickyCTA>
          <StickyCTAText>
            <strong>관심 종목 급등/급락 영상 놓치지 마세요</strong>
            <span>TOP5에 등장하면 바로 알림으로 보내드릴게요.</span>
          </StickyCTAText>
          <StickyCTAButton type="button" onClick={() => router.push("/subject")}>
            🔔 알림 켜기
          </StickyCTAButton>
        </StickyCTA> */}

        {!isMoneyTopic && persistingVideos.length > 0 ? (
          <MoneySectionBlock id="top-videos" ref={topVideosRef}>
            <SectionBadgeBlock
              emoji="🔥"
              title="계속 상위권 유지 중인 영상"
              subtitle="어제/오늘 내내 TOP5를 지키는 카드"
            />
            <EditorContainer>
              {persistingVideos.map((item) =>
                renderTopicCard(item, "top-", {
                  compactBadges: selectedTopic === "전체",
                })
              )}
            </EditorContainer>
          </MoneySectionBlock>
        ) : null}
      </TopicCardWrapper>

      {/* {subjects.length > 0 && (
        <UnSubsArticleInfo>
          <UnSubsArticleInfoDescription>
            구독중인 아티클을 다 보셨나요? <br /> 미구독중인 키워드의 아티클도
            구경해보세요!
          </UnSubsArticleInfoDescription>
          <UnSubsArticleInfoButton onClick={handleUnsubscribeClick}>
            미구독중인 아티클 확인하러가기
          </UnSubsArticleInfoButton>
        </UnSubsArticleInfo>
      )} */}
      <GoToTopBtn isVisible={isFixed} />
    </Container>
  );
};

export default YoutubeToday;

interface SectionBadgeProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  chip?: string;
  category?: string;
}

const SectionBadgeBlock = ({
  emoji,
  title,
  subtitle,
  chip,
  category,
}: SectionBadgeProps) => (
  <SectionBadge>
    <SectionBadgeTitle>
      {emoji ? <SectionBadgeEmoji>{emoji}</SectionBadgeEmoji> : null}
      <SectionBadgeTitleText>{title}</SectionBadgeTitleText>
      {category ? <SectionBadgeCategory>{category}</SectionBadgeCategory> : null}
      {chip ? <SectionBadgeChip>{chip}</SectionBadgeChip> : null}
    </SectionBadgeTitle>
    {subtitle ? <SectionBadgeSubtitle>{subtitle}</SectionBadgeSubtitle> : null}
  </SectionBadge>
);

/* 🛠 스타일 추가 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const TopicCardWrapper = styled.div<{ $isRendered: boolean }>`
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(10px);
  animation: ${({ $isRendered }) =>
    $isRendered &&
    css`
      ${fadeIn} 0.6s ease-in-out forwards
    `};
`;

const Container = styled.div`
  width: 100%;
  background-color: #ffff;
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  font-family: "Pretendard Variable";
`;

const ScheduleSummary = styled.div`
  width: calc(100% - 32px);
  margin: 16px 16px 8px;
  padding: 16px;
  padding-bottom: 0px;
  background-color: #f5f7fb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #1f2937;
`;

const ScheduleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ScheduleHeading = styled.p`
  margin: 0;
  font-weight: 700;
  color: #0f172a;
`;

const ScheduleToggle = styled.button`
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px;

  &:hover,
  &:focus {
    color: #1d4ed8;
  }

  &:focus {
    outline: 2px solid rgba(37, 99, 235, 0.4);
    outline-offset: 2px;
  }
`;

const ScheduleToggleIcon = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  width: 10px;
  height: 10px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: ${({ $expanded }) =>
    $expanded ? "rotate(-135deg)" : "rotate(45deg)"};
  transition: transform 0.2s ease;
  margin-left: 2px;
`;

const ScheduleSummaryText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;

  strong {
    color: #0b63f6;
  }
`;

const ScheduleList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ScheduleCollapse = styled.div<{ $expanded: boolean }>`
  overflow: hidden;
  max-height: ${({ $expanded }) => ($expanded ? "500px" : "0")};
  opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
  transition: max-height 0.45s ease, opacity 0.3s ease;
  will-change: max-height, opacity;
  margin-top: 4px;
`;

const ScheduleItem = styled.li`
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
`;

const ScheduleLabel = styled.span`
  font-weight: 700;
  color: #0f172a;
`;

const ScheduleDesc = styled.p`
  margin: 0;
  font-size: 14px;
  color: #1f2937;
  line-height: 1.5;
`;

const ScheduleTiming = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b7280;
`;

const ScheduleHighlight = styled.span`
  color: #0b63f6;
  font-weight: 700;
`;

const InsightHeroCard = styled.section`
  margin: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InsightHeroHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InsightHeroEyebrow = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const InsightHeroMeta = styled.small`
  color: #6b7280;
  font-size: 14px;
`;

const InsightHeroBody = styled.div`
  border-top: 1px solid #f3f4f6;
  padding-top: 20px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
`;

const InsightHeroActions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
`;

const PrimaryInsightButton = styled.button`
  background-color: #111827;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  padding: 12px 20px;
  cursor: pointer;
`;

const StickyCTA = styled.div`
  margin: 32px 16px 0;
  padding: 18px 20px;
  border-radius: 14px;
  background: #eef2ff;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #dbe4ff;
`;

const StickyCTAText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #1f2937;

  strong {
    font-size: 18px;
  }

  span {
    font-size: 14px;
    color: #4b5563;
  }
`;

const StickyCTAButton = styled.button`
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const MoneySectionBlock = styled.section`
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
`;

const SectionBadge = styled.div`
  border: 1px solid #e0e7ff;
  background: #f5f7ff;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionBadgeTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-weight: 800;
`;

const SectionBadgeEmoji = styled.span`
  font-size: 18px;
`;

const SectionBadgeTitleText = styled.span`
  font-size: 16px;
`;

const SectionBadgeCategory = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const SectionBadgeChip = styled.span`
  margin-left: auto;
  font-size: 12px;
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.12);
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 600;
`;

const SectionBadgeSubtitle = styled.span`
  font-size: 13px;
  color: #4b5563;
`;

// SubContainer modified to use React.forwardRef
const SubContainer = styled.div.attrs(({ ref }) => ({ ref }))`
  background-color: #fff;
`;

const ChangeSubjectButton = styled.div`
  background-color: #000;
  padding: 12px 16px;
  color: white;
  width: 140px;
  display: flex;
  justify-content: center;
  border-radius: 4px;
  font-weight: 500;
  margin-top: -12px;
  margin-bottom: 32px;
`;
const ToggleButtonContainer = styled.div`
  display: flex;
  gap: 8px; /* 버튼 간 간격 */
`;

const Section = styled.div<{ isSubscribed: boolean }>`
  display: inline-flex; /* 텍스트 크기에 맞게 가로폭을 설정 */
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background-color: #f9fafc;
  padding: 6px 8px; /* 내부 여백 */
  border-radius: 4px; /* 둥근 테두리 */
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 넘치는 텍스트 말줄임표 처리 */
  box-sizing: border-box; /* 패딩 포함한 크기 계산 */
  color: ${({ isSubscribed }) =>
    isSubscribed ? "#007BFF" : "#80858a"}; /* 구독 여부에 따른 색상 */
  height: 32px;
  border: 1px solid
    ${({ isSubscribed }) => (isSubscribed ? "#007BFF" : "#c4c4c4")}; /* 구독 여부에 따른 테두리 */
  margin-left: 8px;
  margin-top: 8px;
  margin-bottom: 4px;
`;

const TodayTitle = styled.span<{
  $isSubs?: boolean;
}>`
  font-size: 24px;
  font-weight: 700;
  line-height: 28.64px;
  color: ${({ $isSubs }) => ($isSubs ? "#007BFF" : "#000")};
  letter-spacing: -1px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 4px;
  margin-top: 12px;
`;

const TopicNavContainer = styled.div.attrs<{ ref?: React.Ref<HTMLDivElement> }>(
  (props) => ({
    ref: props.ref,
  })
)`
  padding: 0;
  background-color: #f8f9fa;
`;

const UnSubsArticleInfo = styled.div`
  background-color: #f0f4ff;
  padding: 20px 20px;
  display: flex;
  flex-direction: column;
  margin: 20px;
  border-radius: 8px;
  border: 1px solid #007bff;
  margin-bottom: 40px;
`;

const UnSubsArticleInfoDescription = styled.div`
  margin-bottom: 24px;
  line-height: 132%;
`;

const UnSubsArticleInfoButton = styled.div`
  background-color: black;
  color: white;
  padding: 12px 40px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  font-weight: 500;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  border: 1px solid #e9e9e9;
  width: 100%;
  margin-left: 16px;
  margin-right: 16px;
  margin-top: 8px;
  border-radius: 4px;
`;

const ToggleLabel = styled.span`
  font-size: 14px;
  font-weight: 400;
`;

const ToggleButton = styled.button<{ isActive: boolean }>`
  width: 60px;
  height: 30px;
  background-color: ${(props) => (props.isActive ? "#007bff" : "#F0F4FF")};
  color: ${(props) => (props.isActive ? "#fff" : "#737373")};
  font-weight: ${(props) => (props.isActive ? 700 : 400)};
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const Subtitle = styled.div`
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  background-color: #f0f4ff;
  border-bottom: 1px solid #e0e0e0;
  margin-top: 8px;
`;
