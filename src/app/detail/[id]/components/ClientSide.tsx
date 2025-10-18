"use client";
import { Search, HelpCircle } from "lucide-react";
import { BarChart2, BellRing } from "lucide-react";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type RefObject,
} from "react";
import styled, { keyframes } from "styled-components";
import YouTube, { YouTubeProps } from "react-youtube";
import { useRecoilValue, useSetRecoilState } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import Contents from "./Contents";
import VideoCard from "./VideoCard";
import {
  DataProps,
  StockAnalysis,
  RealEstateAnalysis,
  RecommendedTool,
  EconomicTrend,
  MarketAnalysisEconomy,
  InvestmentStrategyEconomy,
  RelatedTechnology,
  StrategicInsight,
  BusinessTrend,
  ApplicationTip,
  RelatedTool,
  StockMention,
  StockMentionSegment,
} from "@/types/dataProps";
import type {
  InsightVideoMentionsResponse,
  InsightVideoMention,
  InsightVideoMentionSegmentApi,
  InsightVideoOutlineResponse,
  InsightVideoOutlineEntry,
} from "@/types/insight";
import { playerState } from "@/store/player";
import { base64ToBlobUrl } from "@/utils/base64";
import {
  formatSecondsToMmSs,
  formatSummary,
  getOrCreateAnonId,
  parseTimeStringToSeconds,
  removeMarkTags,
} from "@/utils/formatter";
import { timeAgo } from "@/utils/formatter";
import { isDesktop } from "react-device-detect";
// import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import { userState } from "@/store/user";
import {
  fetchSubscribedSubjects,
  getUserByEmail,
  logCtaClick,
  upsertNotificationRequest,
} from "@/api/apiClient";
import CommentsInsightSection from "@/editor/[id]/components/CommentInsightSection";
import CommentsInsightSectionDimmed from "@/editor/[id]/components/CommentInsightDimmed";
import Recommend from "./Recommend";
import { DailyTop5PreferenceSurvey } from "./DailyTop5PreferenceSurvey";
import GoogleLogin from "@/common/RegisterEmailByGoogle";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/ko";
export interface ClientContext {
  country: string;
  acceptLanguage: string;
  userAgent: string;
  referer: string;
}

const INSIGHTS_API_ORIGIN =
  process.env.NEXT_PUBLIC_INSIGHTS_API_ORIGIN ?? "https://youticle.shop";

const STOCK_MENTION_SEGMENT_KEYS = [
  "segments",
  "timeline",
  "timeline_items",
  "occurrences",
  "highlights",
  "transcript_segments",
  "transcript_mentions",
  "mention_segments",
  "reference_points",
];

const ITEM_SEGMENT_KEYS = [
  "segments",
  "timeline",
  "timeline_items",
  "occurrences",
  "highlights",
];

const ISO_DURATION_REGEX = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i;

const normaliseKeyValue = (value?: string | number | null) => {
  if (value == null) return null;
  return String(value).trim().toLowerCase() || null;
};

const normaliseSegmentStart = (
  raw: unknown
): { value?: string | number; seconds: number | null } => {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { value: raw, seconds: raw };
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return { value: undefined, seconds: null };
    if (trimmed.includes(":")) {
      return {
        value: trimmed,
        seconds: parseTimeStringToSeconds(trimmed) ?? null,
      };
    }
    const isoMatch = trimmed.match(ISO_DURATION_REGEX);
    if (isoMatch) {
      const hours = Number(isoMatch[1] ?? 0);
      const minutes = Number(isoMatch[2] ?? 0);
      const secs = Number(isoMatch[3] ?? 0);
      const totalSeconds = hours * 3600 + minutes * 60 + secs;
      return {
        value: trimmed,
        seconds: totalSeconds,
      };
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      return { value: trimmed, seconds: numeric };
    }
    return { value: trimmed, seconds: null };
  }

  return { value: undefined, seconds: null };
};

const mergeSegmentsUnique = (
  primary: StockMentionSegment[],
  secondary: StockMentionSegment[]
): StockMentionSegment[] => {
  const result: StockMentionSegment[] = [];
  const dedupe = new Set<string>();

  const addSegment = (segment?: StockMentionSegment) => {
    if (!segment) return;

    const { value, seconds } = normaliseSegmentStart(segment.start_time);
    const normalizedSeconds =
      segment.seconds != null && Number.isFinite(segment.seconds)
        ? (segment.seconds as number)
        : seconds;
    const normalizedStart =
      segment.start_time != null ? segment.start_time : value;
    const normalizedLabel = segment.label?.trim();
    const normalizedSummary = segment.summary?.trim();
    const normalizedConfidence = segment.confidence?.trim();

    const dedupeKey = [
      normalizedSeconds != null ? `s:${normalizedSeconds}` : undefined,
      normalizedStart != null ? `v:${String(normalizedStart)}` : undefined,
      normalizedLabel ? `l:${normalizedLabel}` : undefined,
      normalizedSummary ? `m:${normalizedSummary}` : undefined,
    ]
      .filter(Boolean)
      .join("|");

    if (dedupe.has(dedupeKey)) return;
    dedupe.add(dedupeKey);

    result.push({
      start_time: normalizedStart,
      seconds: normalizedSeconds ?? null,
      label: normalizedLabel,
      summary: normalizedSummary ?? normalizedLabel,
      confidence: normalizedConfidence,
    });
  };

  primary.forEach(addSegment);
  secondary.forEach(addSegment);

  if (result.length <= 1) return result;

  return result.sort((a, b) => {
    const aSeconds = a.seconds ?? Number.MAX_SAFE_INTEGER;
    const bSeconds = b.seconds ?? Number.MAX_SAFE_INTEGER;
    return aSeconds - bSeconds;
  });
};

const extractSegmentsFromMention = (
  mention: InsightVideoMention
): StockMentionSegment[] => {
  const candidates: InsightVideoMentionSegmentApi[] = [];

  const mentionSource = mention as unknown as Record<string, unknown>;

  STOCK_MENTION_SEGMENT_KEYS.forEach((key) => {
    const candidate = mentionSource?.[key];
    if (Array.isArray(candidate)) {
      candidates.push(...(candidate as InsightVideoMentionSegmentApi[]));
    }
  });

  if (mention.item) {
    const itemSource = mention.item as unknown as Record<string, unknown>;
    ITEM_SEGMENT_KEYS.forEach((key) => {
      const candidate = itemSource?.[key];
      if (Array.isArray(candidate)) {
        candidates.push(...(candidate as InsightVideoMentionSegmentApi[]));
      }
    });
  }

  if (candidates.length === 0) return [];

  const converted = candidates.map((entry) => {
    if (!entry) return null;
    const rawStart =
      entry.start_time ??
      entry.start ??
      entry.timestamp ??
      entry.offset_seconds ??
      entry.offset ??
      (entry as Record<string, unknown>).time;
    const { value, seconds } = normaliseSegmentStart(rawStart);

    const labelSource =
      entry.label ??
      entry.title ??
      entry.topic ??
      entry.text ??
      entry.summary ??
      entry.description;
    const summarySource =
      entry.summary ?? entry.description ?? entry.text ?? entry.title;

    const label =
      typeof labelSource === "string" && labelSource.trim()
        ? labelSource.trim()
        : undefined;
    const summary =
      typeof summarySource === "string" && summarySource.trim()
        ? summarySource.trim()
        : label;

    return {
      start_time: value,
      seconds: seconds ?? null,
      label,
      summary,
    } as StockMentionSegment;
  });

  return mergeSegmentsUnique(
    converted.filter(Boolean) as StockMentionSegment[],
    []
  );
};

interface OutlineSegmentsRecord {
  stockName?: string;
  ticker?: string;
  segments: StockMentionSegment[];
}

interface OutlineSegmentsIndex {
  byKey: Map<string, OutlineSegmentsRecord>;
  ordered: OutlineSegmentsRecord[];
}

const buildOutlineSegmentsIndex = (
  payload?: InsightVideoOutlineResponse | null
): OutlineSegmentsIndex => {
  const index: OutlineSegmentsIndex = {
    byKey: new Map<string, OutlineSegmentsRecord>(),
    ordered: [],
  };

  if (!payload) return index;

  const outlineArray: InsightVideoOutlineEntry[] = Array.isArray(
    payload.outline
  )
    ? (payload.outline as InsightVideoOutlineEntry[])
    : Array.isArray(payload.outline?.outline)
    ? payload.outline.outline ?? []
    : [];

  outlineArray.forEach((entry) => {
    if (!entry) return;
    const rawSegments = entry.segments ?? [];
    if (!Array.isArray(rawSegments) || rawSegments.length === 0) return;

    const segments = rawSegments
      .map((segment) => {
        if (!segment) return null;
        const { value, seconds } = normaliseSegmentStart(segment.start_time);
        const summarySource =
          segment.key_point ?? segment.summary ?? segment.description;
        const summary =
          typeof summarySource === "string" && summarySource.trim()
            ? summarySource.trim()
            : undefined;
        const confidence =
          typeof segment.confidence === "string" && segment.confidence.trim()
            ? segment.confidence.trim()
            : undefined;

        return {
          start_time: segment.start_time ?? value,
          seconds: seconds ?? null,
          label: summary,
          summary,
          confidence,
        } as StockMentionSegment;
      })
      .filter(Boolean) as StockMentionSegment[];

    if (segments.length === 0) return;

    const sortedSegments = mergeSegmentsUnique(segments, []);

    const record: OutlineSegmentsRecord = {
      stockName: entry.stock_name ?? undefined,
      ticker: entry.ticker ?? undefined,
      segments: sortedSegments,
    };

    index.ordered.push(record);

    const keyCandidates = new Set<string>();
    const byName = normaliseKeyValue(entry.stock_name);
    if (byName) keyCandidates.add(byName);
    const byTicker = normaliseKeyValue(entry.ticker);
    if (byTicker) keyCandidates.add(byTicker);

    if (keyCandidates.size === 0 && record.stockName) {
      const fallbackKey = normaliseKeyValue(record.stockName);
      if (fallbackKey) keyCandidates.add(fallbackKey);
    }

    keyCandidates.forEach((key) => {
      if (!key) return;
      const existing = index.byKey.get(key);
      if (existing) {
        existing.segments = mergeSegmentsUnique(
          existing.segments,
          record.segments
        );
      } else {
        index.byKey.set(key, record);
      }
    });
  });

  return index;
};

const adaptStockMentionsFromResponse = (
  payload: InsightVideoMentionsResponse | null,
  outlineIndex?: OutlineSegmentsIndex
): StockMention[] => {
  const outlineRecordsUsed = new Set<OutlineSegmentsRecord>();
  const result: StockMention[] = [];

  const mentions = payload?.mentions?.filter(
    (mention) =>
      mention && (mention.kind === undefined || mention.kind === "stock")
  );

  if (mentions && mentions.length > 0) {
    mentions.forEach((mention) => {
      if (!mention) return;

      const stockNameRaw =
        mention.name ??
        mention.item?.stock_name ??
        mention.ticker ??
        mention.item?.ticker ??
        "";
      const stockName = stockNameRaw.trim();
      if (!stockName) return;

      const ticker = mention.ticker ?? mention.item?.ticker;

      const keyCandidates = [
        normaliseKeyValue(stockName),
        normaliseKeyValue(ticker),
      ].filter(Boolean) as string[];

      let outlineRecord: OutlineSegmentsRecord | undefined;
      if (outlineIndex) {
        for (const key of keyCandidates) {
          const candidate = outlineIndex.byKey.get(key);
          if (candidate) {
            outlineRecord = candidate;
            break;
          }
        }
      }

      const outlineSegments = outlineRecord
        ? outlineRecord.segments.map((segment) => ({ ...segment }))
        : [];
      const fallbackSegments = extractSegmentsFromMention(mention);
      const segments = mergeSegmentsUnique(outlineSegments, fallbackSegments);

      if (outlineRecord) {
        outlineRecordsUsed.add(outlineRecord);
      }

      const mentionCount =
        mention.mention_count ??
        (segments.length > 0 ? segments.length : undefined) ??
        (Array.isArray(mention.item?.sources)
          ? mention.item?.sources?.length
          : undefined);

      const actionIdea =
        mention.action_idea ?? mention.item?.action_idea ?? undefined;

      const companyDescription = mention.item?.company_description;
      const commentBody =
        mention.metric_insight?.comment_body ??
        mention.item?.metric_insight?.comment_body;

      result.push({
        stock_name: stockName,
        ticker,
        mention_count: mentionCount,
        segments,
        actionIdea,
        companyDescription,
        commentBody,
      });
    });
  }

  if (outlineIndex) {
    outlineIndex.ordered.forEach((record) => {
      if (!record || outlineRecordsUsed.has(record)) return;
      if (!record.segments || record.segments.length === 0) return;

      const stockName = record.stockName?.trim() || record.ticker?.trim();
      if (!stockName) return;

      result.push({
        stock_name: stockName,
        ticker: record.ticker,
        mention_count: record.segments.length,
        segments: record.segments.map((segment) => ({ ...segment })),
      });
    });
  }

  return result;
};

interface ClientSideProps {
  id: string;
  detailData: DataProps;
  clientContext: ClientContext;
}

const ClientSide = ({ id, detailData, clientContext }: ClientSideProps) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.locale("ko");
  const [videoPlayer, setVideoPlayer] = useState<any>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isPlayerVisible = useRecoilValue(playerState);
  const setIsPlayerVisible = useSetRecoilState(playerState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stockMentionsRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToMentionsRef = useRef(false);
  const searchParams = useSearchParams();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    setVideoPlayer(event.target);
    setIsLoading(false);
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    if (!event.data) {
      const player = event.target;
      player.playVideo();
    }
  };

  const [isClientDesktop, setIsClientDesktop] = useState(false);
  useEffect(() => {
    // 클라이언트에서만 isDesktop 값을 설정
    setIsClientDesktop(isDesktop);
  }, []);

  const [stockMentions, setStockMentions] = useState<StockMention[]>([]);
  const [stockMentionsLoading, setStockMentionsLoading] = useState(false);
  const [stockMentionsError, setStockMentionsError] = useState<string | null>(
    null
  );
  const rawSections = detailData.section;
  const sections = useMemo(() => {
    if (Array.isArray(rawSections)) {
      return rawSections.filter((item): item is string => typeof item === "string");
    }
    return typeof rawSections === "string" && rawSections.trim()
      ? [rawSections.trim()]
      : [];
  }, [rawSections]);
  const shouldFetchStockMentions = useMemo(() => {
    const eligibleSections = new Set([
      "국내 주식",
      "해외 주식",
      "국내 가상자산",
      "해외 가상자산",
    ]);
    return sections.some((section) => eligibleSections.has(section));
  }, [sections]);
  const hasStockMentions =
    stockMentionsLoading ||
    stockMentions.length > 0 ||
    Boolean(stockMentionsError);
  const hasStockMentionsReady =
    !stockMentionsLoading &&
    (stockMentions.length > 0 || Boolean(stockMentionsError));

  useEffect(() => {
    if (hasScrolledToMentionsRef.current) return;
    if (typeof window === "undefined") return;
    if (searchParams?.get("focus") !== "stock-mentions") return;
    if (!hasStockMentionsReady) return;
    if (!stockMentionsRef.current) return;

    hasScrolledToMentionsRef.current = true;
    requestAnimationFrame(() => {
      const element = stockMentionsRef.current;
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: "smooth" });
    });
  }, [searchParams, hasStockMentionsReady]);

  useEffect(() => {
    if (!shouldFetchStockMentions) {
      setStockMentions([]);
      setStockMentionsError(null);
      setStockMentionsLoading(false);
      return;
    }

    let canceled = false;

    const fetchMentions = async () => {
      setStockMentions([]);
      setStockMentionsLoading(true);
      setStockMentionsError(null);

      try {
        const mentionsPromise = fetch(
          `${INSIGHTS_API_ORIGIN}/insights/videos/${id}/mentions`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        const outlinePromise = fetch(
          `${INSIGHTS_API_ORIGIN}/insights/videos/${id}/outline?refresh=false`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        ).catch(() => null);

        const [mentionsResponse, outlineResponse] = await Promise.all([
          mentionsPromise,
          outlinePromise,
        ]);

        if (
          mentionsResponse.status === 404 &&
          (!outlineResponse || outlineResponse?.status === 404)
        ) {
          if (!canceled) {
            setStockMentions([]);
            setStockMentionsError(null);
          }
          return;
        }

        if (!mentionsResponse.ok && mentionsResponse.status !== 404) {
          throw new Error(
            `Mentions request failed (${mentionsResponse.status})`
          );
        }

        const mentionsPayload =
          mentionsResponse.status === 404
            ? null
            : ((await mentionsResponse.json()) as InsightVideoMentionsResponse);

        let outlinePayload: InsightVideoOutlineResponse | null = null;
        if (outlineResponse) {
          if (outlineResponse.status === 404) {
            outlinePayload = null;
          } else if (outlineResponse.ok) {
            outlinePayload =
              (await outlineResponse.json()) as InsightVideoOutlineResponse;
          } else {
            throw new Error(
              `Outline request failed (${outlineResponse.status})`
            );
          }
        }

        if (canceled) return;

        const outlineIndex = buildOutlineSegmentsIndex(outlinePayload);
        const adapted = adaptStockMentionsFromResponse(
          mentionsPayload,
          outlineIndex
        );
        setStockMentions(adapted);
      } catch (error) {
        console.error("Failed to fetch stock mentions", error);
        if (canceled) return;
        setStockMentionsError("종목 정보를 불러오지 못했습니다.");
      } finally {
        if (!canceled) {
          setStockMentionsLoading(false);
        }
      }
    };

    fetchMentions().catch(() => {
      /* already handled */
    });

    return () => {
      canceled = true;
    };
  }, [id, shouldFetchStockMentions]);

  const handleTocItemClick = (start: number) => {
    logCtaClick(
      "player_item_click",
      user?.id,
      user?.email,
      getOrCreateAnonId()
    );
    if (!isPlayerVisible) setIsPlayerVisible(true);

    if (videoPlayer) {
      videoPlayer.seekTo(start, true);
      videoPlayer.playVideo();
    }
  };

  const opts: YouTubeProps["opts"] = {
    height: "202",
    playerVars: {
      autoplay: 0,
      rel: 0,
      disablekb: 1,
    },
  };

  const handleStockAnchorClick = useCallback(() => {
    const target = document.getElementById("stock-mentions");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollRefTop = scrollRef.current.getBoundingClientRect().top;
        setIsFixed(scrollRefTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();
    setIsLoading(true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // useEffect(() => {
  //   const fetchThumbnails = async () => {
  //     try {
  //       // API 호출
  //       // const thumbnailResponse = await fetch(
  //       //   `https://youticle.shop/briefing/images/${id}`
  //       // );

  //       const thumbnailResponse = await fetch(
  //         `https://youticle.shop/briefing/capture_frames/${id}`
  //       );

  //       if (!thumbnailResponse.ok) {
  //         throw new Error("Failed to fetch thumbnails");
  //       }

  //       // // JSON 데이터 파싱
  //       // const thumbnailData: string[] = await thumbnailResponse.json();

  //       // // 파일 이름을 숫자 기준으로 정렬
  //       // const sortedThumbnails = thumbnailData.sort((a, b) => {
  //       //   const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
  //       //   const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
  //       //   return numA - numB;
  //       // });

  //       const thumbnailData = await thumbnailResponse.json();
  //       const sortedThumbnails = thumbnailData
  //         .sort((a: any, b: any) => {
  //           const numA = parseInt(a.filename.match(/\d+/)?.[0] || "0", 10);
  //           const numB = parseInt(b.filename.match(/\d+/)?.[0] || "0", 10);
  //           return numA - numB;
  //         })
  //         .map(({ content }: any) => base64ToBlobUrl(content));

  //       // 정렬된 파일 이름을 상태로 설정
  //       setThumbnails(sortedThumbnails);
  //     } catch (error) {
  //       console.error("Error fetching thumbnails:", error);
  //       setThumbnails([]);
  //     }
  //   };
  //   fetchThumbnails();
  // }, [id]);
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false); // 페이지 전환 중 여부
  const [isLeavingHome, setIsLeavingHome] = useState(false); // 페이지 전환 중 여부
  const [isInsightVisible, setIsInsightVisible] = useState(false);
  const user = useRecoilValue(userState);
  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  useEffect(() => {
    const fetchSubjects = async () => {
      if (user.name !== "") {
        const subjects = await fetchSubscribedSubjects(user.email, user.name);
        console.log("로그인 후 구독한 키워드", subjects);
        setSubscribedSubjects(subjects); // 구독한 주제 설정
        // if (subjects.length === 0) {
        //   setShowPopup(true); // Show popup if no subscribed subjects
        // }
      }
    };
    fetchSubjects();
  }, [user]);
  const [isArticleVisible, setIsArticleVisible] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const [articleHeight, setArticleHeight] = useState(0);

  // 요약 섹션 높이 재계산
  useEffect(() => {
    if (articleRef.current) {
      setArticleHeight(articleRef.current.scrollHeight);
    }
  }, [detailData, isArticleVisible]);
  const [hideStickyOnScroll, setHideStickyOnScroll] = useState(false);
  const STICKY_HIDE_OFFSET = 1000; // 원하는 만큼 조절

  useEffect(() => {
    const onScroll = () => {
      if (!articleRef.current) return;

      const { top } = articleRef.current.getBoundingClientRect();
      // articleRef가 화면 상단을 지나치면 true
      setHideStickyOnScroll(top <= STICKY_HIDE_OFFSET);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // 마운트 시에도 한 번 실행
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // // a,b 테스트 버전
  // const getVariant = () => {
  //   const match = document.cookie.match(/detailVariant=(a|b)/);
  //   return match ? match[1] : "unknown";
  // };
  // const variant = getVariant();
  // console.log(variant, "옵션");

  // 1) 페이지 오픈 로깅
  useEffect(() => {
    const { country, acceptLanguage, userAgent, referer } = clientContext;
    logCtaClick(
      "page_open",
      user?.id ?? null,
      detailData.video_id ?? null,
      getOrCreateAnonId(),
      {
        country,
        accept_language: acceptLanguage,
        user_agent: userAgent,
        referer,
        ab_variant: "", // <-- 여기
      }
    );
  }, []);

  const handleMoreClick = () => {
    const next = !isArticleVisible;
    setIsArticleVisible(next);
    logCtaClick(
      isArticleVisible ? "summary_collapse" : "summary_expand",
      user?.id ?? null,
      detailData.video_id ?? null,
      getOrCreateAnonId()
    );
    if (next) {
      // 펼칠 때만 스크롤
      setTimeout(() => {
        articleRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        window.scrollBy({ top: -76, behavior: "smooth" });
      }, 0);
    }
  };
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  // calculate split for TOC sections
  const summarySections = detailData.summary_data.section ?? [];
  const sectionCount = summarySections.length;
  const isMultiPart = sectionCount >= 8;
  const midIndex = Math.ceil(sectionCount / 2);

  // 1) refs
  const previewRef = useRef<HTMLDivElement>(null);

  // 2) thresholds fire-once 관리
  const firedCollapsed = useRef<Set<number>>(new Set());
  const firedExpanded = useRef<Set<number>>(new Set());
  const THRESHOLDS = [30, 50, 70, 90];

  useEffect(() => {
    const handleScroll = () => {
      let percent = 0;

      if (!isArticleVisible) {
        // ● 접힌 상태: 페이지 전체 scroll 기준
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const viewH = window.innerHeight;
        const maxScroll = docHeight - viewH;
        if (maxScroll <= 0) return;
        percent = (scrollY / maxScroll) * 100;
      } else {
        // ● 펼친 상태: 상세 요약 영역 기준
        const el = articleRef.current;
        if (!el) return;
        const scrollY = window.scrollY;
        const elTop = el.getBoundingClientRect().top + window.scrollY;
        const relativeY = scrollY - elTop;
        const maxScroll = el.scrollHeight - window.innerHeight;
        if (relativeY < 0 || maxScroll <= 0) return;
        percent = (relativeY / maxScroll) * 100;
      }

      // 0~100 clamp
      percent = Math.min(Math.max(percent, 0), 100);
      const firedSet = isArticleVisible
        ? firedExpanded.current
        : firedCollapsed.current;

      THRESHOLDS.forEach((threshold) => {
        if (percent >= threshold && !firedSet.has(threshold)) {
          firedSet.add(threshold);
          const eventName = isArticleVisible
            ? `summary_expanded_${threshold}`
            : `summary_collapsed_${threshold}`;
          logCtaClick(
            eventName,
            user?.id ?? null,
            detailData.video_id ?? null,
            getOrCreateAnonId()
          );
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isArticleVisible, detailData.video_id, user]);

  const [showChannelInputSection, setShowChannelInputSection] = useState(false);

  // 📣 설문 응답 핸들러: like가 boolean 으로 들어옵니다.
  const handleSurveyAnswer = (like: boolean): void => {
    const answer = like ? "yes" : "no";
    // 1) 비동기 설문 전송
    if (!like) {
      setShowChannelInputSection(true);
    }
  };
  // useState
  const [channelInput, setChannelInput] = useState("");
  const [notifyPref, setNotifyPref] = useState<"on" | "off">("on");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [customTime, setCustomTime] = useState("");

  // 모달 확인 핸들러
  const handleModalSubmit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (!(digits.length === 10 || digits.length === 11)) {
      alert("전화번호는 숫자 10자리 또는 11자리여야 합니다.");
      return;
    }
    try {
      logCtaClick(
        "kakao_apply",
        user?.id ?? null,
        detailData.video_id,
        getOrCreateAnonId()
      );
      const nr = await upsertNotificationRequest({
        anon_id: getOrCreateAnonId(),
        user_id: user?.id, // or omit if anonymous
        phone, // your phone state
        schedule, // your schedule state (e.g. "08")
        channel_name: channelInput, // your channel name state
      });
      console.log("saved notification request:", nr);
      setSubmitted(true);
      setIsModalOpen(false);
      setIsCompleteModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("알림 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [schedule, setSchedule] = useState<
    "08" | "08_18" | "08_18_22" | "08_13_18_22"
  >("08");

  // 시간 선택 옵션
  const TIME_OPTIONS = [
    { value: "08", label: "매일 08:00 1회" },
    { value: "08_18", label: "매일 08:00, 18:00 2회" },
    { value: "08_18_22", label: "매일 08:00, 18:00, 22:00 3회" },
    { value: "08_13_18_22", label: "매일 08:00, 13:00, 18:00, 22:00 4회" },
  ];

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isEmailCompleteModalOpen, setIsEmailCompleteModalOpen] =
    useState(false);

  const [extraChannel, setExtraChannel] = useState("");

  // 2) 채널 등록 핸들러
  const handleRegisterChannel = async () => {
    logCtaClick(
      "register_priority_channel",
      user?.id ?? null,
      detailData.video_id,
      getOrCreateAnonId()
    );
    if (!channelInput.trim()) {
      alert("유튜브 채널명을 입력해주세요.");
      return;
    }
    try {
      await upsertNotificationRequest({
        anon_id: getOrCreateAnonId(),
        user_id: user?.id,
        channel_name: channelInput,
        // you can also pass phone/schedule if already set in state
        phone,
        schedule,
      });
      alert(`"${channelInput}" 채널이 등록되었습니다! 앞으로 우선 반영돼요 😊`);
      setShowChannelInputSection(false);
      setIsCompleteModalOpen(false);
      setIsEmailCompleteModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("채널 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const sortedSections = [...summarySections].sort(
    (a, b) =>
      parseTimeStringToSeconds(a.start_time) -
      parseTimeStringToSeconds(b.start_time)
  );

  // 로그인 성공 콜백
  const handleLoginSuccess = async (loginUser: {
    email: string;
    displayName: string;
    photoURL: string;
  }) => {
    logCtaClick(
      "email_login_success",
      user?.id,
      user?.email,
      getOrCreateAnonId()
    );
    setIsEmailModalOpen(false);
    if (!loginUser.email) return;
    const data = await getUserByEmail(loginUser.email, loginUser.displayName);
    setIsEmailCompleteModalOpen(true);
  };

  const isAnyModalOpen =
    isModalOpen ||
    isEmailModalOpen ||
    isCompleteModalOpen ||
    isEmailCompleteModalOpen;

  const moreBtnRef = useRef<HTMLButtonElement>(null);

  // sticky 바를 숨겼는지 여부
  const [stickyDismissed, setStickyDismissed] = useState(false);

  useEffect(() => {
    if (!moreBtnRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 버튼이 보이기 시작하면 한 번만 dismiss 처리
        if (entry.isIntersecting) {
          setStickyDismissed(true);
          observer.disconnect();
        }
      },
      { root: null, threshold: 0 }
    );
    observer.observe(moreBtnRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Container $isFixed={isFixed}>
      <LogoHeader
        title={isFixed ? `${detailData.summary_data.headline_title}` : ""}
        onBack={() => {
          setIsLeaving(true); // 로딩 유지
          setTimeout(() => {
            router.push("/");
          }, 500);
        }}
        onBackHome={() => {
          setIsLeavingHome(true); // 로딩 유지
          setTimeout(() => {
            router.push("/");
          }, 500);
        }}
      />

      {/* 로딩 오버레이 */}
      {isLeaving && (
        <LoaderOverlay>
          <Spinner />
          <LoadingText>이전 페이지로 이동 중...</LoadingText>
        </LoaderOverlay>
      )}
      {/* 로딩 오버레이 */}
      {isLeavingHome && (
        <LoaderOverlay>
          <Spinner />
          <LoadingText>홈으로 이동 중..</LoadingText>
        </LoaderOverlay>
      )}
      <PageInfo ref={scrollRef}>
        <Category>
          {dayjs().tz("Asia/Seoul").format("M/D(dd)")},{detailData.section} TOP5
          유튜브 영상
        </Category>
        <Title>{removeMarkTags(detailData.summary_data.headline_title)}</Title>
        <UploadContainer>
          <Upload>업로드 {timeAgo(detailData.upload_date)} </Upload> *
          <Upload>{detailData.duration}</Upload>
        </UploadContainer>
        {hasStockMentions ? (
          <AnchorLinkRow>
            <AnchorButton type="button" onClick={handleStockAnchorClick}>
              📈 언급 종목 바로가기
            </AnchorButton>
          </AnchorLinkRow>
        ) : null}
      </PageInfo>
      <VideoContainer
        ref={videoContainerRef}
        $isFixed={isFixed}
        $isDesktop={isDesktop}
      >
        {isLoading && <Loader />}
        <YouTube
          videoId={id}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          style={{
            display: isLoading ? "none" : isPlayerVisible ? "block" : "none",
          }}
        />
      </VideoContainer>
      {/* Conditionally render overview based on the section */}
      {/* 채널 소개 */}
      <VideoCard
        thumbnail={detailData.thumbnail}
        title={detailData.title}
        channelName={detailData.channel_details.channel_name}
        subscriber={detailData.channel_details.channel_subscribers}
        upload_date={detailData.upload_date}
        description={detailData.summary_data.channel_overview}
        channel_thumbnail={detailData.channel_details.channel_thumbnail}
      />
      <OverviewTitle>📹 영상 소개</OverviewTitle>
      <Preview $isFixed={isFixed}>
        {formatSummary(detailData.summary_data.short_summary)}
      </Preview>
      {detailData.summary_data.comment_insight_front &&
      Object.keys(detailData.summary_data.comment_insight_front).length > 0 ? (
        <>
          <SectionTitle>💬 시청자 반응 요약</SectionTitle>
          <InsightContainer>
            {(["1st"] as const).map((key) => {
              const title = detailData.summary_data.comment_insight_front![key];
              const comments = detailData.summary_data.comment_insight_front![
                `${key}_comments`
              ] as { comment: string; likeCount: string; updatedAt: string }[];

              return (
                <InsightCard key={key}>
                  {/* <InsightHeader dangerouslySetInnerHTML={{ __html: title }} /> */}
                  <CommentList>
                    {comments.map((c, i) => (
                      <CommentItem key={i}>
                        <CommentText>{c.comment}</CommentText>
                        <CommentMeta>
                          👍 {c.likeCount} · {timeAgo(c.updatedAt)}
                        </CommentMeta>
                      </CommentItem>
                    ))}
                  </CommentList>
                </InsightCard>
              );
            })}
          </InsightContainer>
        </>
      ) : (
        <></>
        // <EmptyState>👥 아직 시청자 댓글 인사이트가 없습니다.</EmptyState>
      )}
      <MainBodyTitle>📝 영상 목차</MainBodyTitle>
      <TOC>
        <ContentWrapper
          fullPadding={summarySections.length < 8}
        >
          {isMultiPart ? (
            <>
              <PartCard>
                {/* <PartHeader>1부</PartHeader> */}
                {sortedSections.slice(0, midIndex).map((sec, i) => (
                  <PartCardBox key={i}>
                    <Timeline
                      onClick={() =>
                        handleTocItemClick(
                          parseTimeStringToSeconds(sec.start_time)
                        )
                      }
                    >
                      {/* <PlayIcon width={16} height={16} /> */}
                      <span>
                        {formatSecondsToMmSs(
                          parseTimeStringToSeconds(sec.start_time)
                        )}
                      </span>
                    </Timeline>
                    <Item key={`part1-${i}`}>{removeMarkTags(sec.title)}</Item>
                  </PartCardBox>
                ))}
              </PartCard>
              <Divider />
              <PartCard>
                {/* <PartHeader>2부</PartHeader> */}
                {sortedSections.slice(midIndex).map((sec, i) => (
                  <PartCardBox key={i}>
                    <Timeline
                      onClick={() =>
                        handleTocItemClick(
                          parseTimeStringToSeconds(sec.start_time)
                        )
                      }
                    >
                      {/* <PlayIcon width={16} height={16} /> */}
                      <span>
                        {formatSecondsToMmSs(
                          parseTimeStringToSeconds(sec.start_time)
                        )}
                      </span>
                    </Timeline>
                    <Item key={`part2-${i}`}>{removeMarkTags(sec.title)}</Item>
                  </PartCardBox>
                ))}
              </PartCard>
            </>
          ) : (
            <PartCard>
              {/* <PartHeader>1부</PartHeader> */}
              {sortedSections.slice(0, 6).map((sec, i) => (
                <PartCardBox key={i}>
                  <Timeline
                    onClick={() =>
                      handleTocItemClick(
                        parseTimeStringToSeconds(sec.start_time)
                      )
                    }
                  >
                    {/* <PlayIcon width={16} height={16} /> */}
                    <span>
                      {formatSecondsToMmSs(
                        parseTimeStringToSeconds(sec.start_time)
                      )}
                    </span>
                  </Timeline>
                  <Item key={`part1-${i}`}>{removeMarkTags(sec.title)}</Item>
                </PartCardBox>
              ))}
            </PartCard>
          )}
        </ContentWrapper>
      </TOC>
      <MoreButton onClick={handleMoreClick} ref={moreBtnRef}>
        {isArticleVisible ? "간단히 보기" : `즉시 상세 요약 확인하기 👇`}
      </MoreButton>
      <ArticleWrapper
        expanded={isArticleVisible}
        maxHeight={articleHeight + 1500}
        ref={articleRef}
      >
        <Contents
          detailData={detailData}
          thumbnails={thumbnails.length > 0 ? thumbnails : []}
          handleTocItemClick={handleTocItemClick}
        />
      </ArticleWrapper>
      {hasStockMentions ? (
        <StockMentionsSection
          id="stock-mentions"
          mentions={stockMentions}
          loading={stockMentionsLoading}
          error={stockMentionsError}
          onSegmentClick={handleTocItemClick}
          containerRef={stockMentionsRef}
        />
      ) : null}
      {/* ─── Hook for Daily Top5 Survey ─── */}
      <HookSection>
        <HookingCopy>
          🤔 매일 수십개 씩 쏟아지는 <br /> 유튜브 영상 속에서
          <br />
          <span>{detailData.section}</span> 핵심 정보를 <br />
          놓치지 않으려면?
          <br />
          <br />
          <strong>
            📢 매일 {detailData.section} 분야의 <br /> 유튜브 TOP5 영상 요약만{" "}
            <br />
            카톡으로 편하게 받아보세요!
          </strong>
        </HookingCopy>
        <ButtonGroup>
          <SurveyButton
            primary
            onClick={async () => {
              logCtaClick(
                "daily_top5_survey_like_kakako",
                user?.id,
                user?.email,
                getOrCreateAnonId()
              );
              setIsModalOpen(true);
            }}
          >
            카톡 알림 무료로 신청하기
          </SurveyButton>
          {/* <SurveyButton
            onClick={async () => {
              logCtaClick(
                "daily_top5_survey_dislike",
                user?.id,
                user?.email,
                getOrCreateAnonId()
              );
              handleSurveyAnswer(false);
            }}
          >
            관심 없어요
          </SurveyButton> */}
        </ButtonGroup>
        <Caption>{`[주식 분야 카카오톡 알림 예시]`}</Caption>
        <Thumbnail
          src="/images/TOP5알림톡3.png"
          alt="오늘의 주식 TOP5 알림톡 예시"
        />
        {/* ── 이메일 신청 섹션 ── */}
        <EmailSection>
          <EmailHookingCopy>
            카톡 알림을 놓치셨나요?
            <br />
            📧 이메일로도 편하게 TOP5 영상 요약을 받아보실 수 있습니다!
          </EmailHookingCopy>
          <ButtonGroup>
            <SurveyButton
              primary
              onClick={async () => {
                logCtaClick(
                  "daily_top5_survey_like_email",
                  user?.id ?? null,
                  detailData.video_id,
                  getOrCreateAnonId()
                );
                setIsEmailModalOpen(true);
              }}
            >
              이메일 알림으로 신청하기
            </SurveyButton>
          </ButtonGroup>
          {/* (선택) 이메일 예시 썸네일이 있다면 아래에 추가 */}
          {/* <Caption>📧 이메일 요약 예시</Caption>
    <Thumbnail src="/images/email_example.png" alt="이메일 요약 예시" /> */}
        </EmailSection>
      </HookSection>
      {/* 설문 아래, 관심 없어요 눌렀을 때만 보이는 섹션 */}
      {showChannelInputSection && (
        <ChannelPrioritySection>
          <h4>
            {" "}
            🤔 잠깐! <br /> 관심 채널을 등록해 보셨나요?
          </h4>
          <p>
            등록하신 채널의 새 영상은
            <br />
            TOP5 영상 리스트 최상단에 먼저 보여 드려요!
          </p>
          <Input
            placeholder="예) 삼프로TV"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
          />
          <FooterResiter style={{ justifyContent: "center", gap: "12px" }}>
            <SurveyButton primary onClick={handleRegisterChannel}>
              채널 등록하기
            </SurveyButton>{" "}
            <SurveyButton
              onClick={async () => {
                logCtaClick(
                  "hide_priority_channel_section",
                  user?.id ?? null,
                  detailData.video_id,
                  getOrCreateAnonId()
                );
                setShowChannelInputSection(false);
              }}
            >
              다시 숨기기{" "}
            </SurveyButton>{" "}
          </FooterResiter>
        </ChannelPrioritySection>
      )}
      <RecommendWrapper
        $hasDimmedItem={false}
        $tocItemHeight={0}
        $isUnsubscribedSection={false} // 새로운 속성 추가
      >
        <Recommend
          section={detailData.section}
          videoId={detailData.video_id}
          isUnsubscribedSection={false}
        />
      </RecommendWrapper>
      {/* <Preview $isFixed={isFixed}>
        <div>
          <span>🔎 미리보기</span>
          {formatSummary(detailData.summary_data.short_summary)}
        </div>
      </Preview> */}
      {isModalOpen && (
        <ModalOverlay style={{ background: "rgba(0, 0, 0, 0.4)" }}>
          <ModalContent>
            <Header>🎉 TOP5 요약 알림 무료 체험하기!</Header>
            <Body>
              매일 <strong>{detailData.section}</strong> 분야 최고 인기 영상
              <br />
              TOP5 영상 내용 핵심만 요약해 드려요.
              <br />
              지금 바로 편하게 경험해 보세요!
            </Body>

            <Form>
              <Label htmlFor="phone">카톡 받으실 번호</Label>
              <Input
                id="phone"
                placeholder="예) 010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <PrivacyNote>
                입력하신 번호는 알림 발송 외 다른 용도로 사용되지 않으며,
                안전하게 관리됩니다.
              </PrivacyNote>
              <Label>알림 받을 시간</Label>
              <RadioGroup>
                {TIME_OPTIONS.map((o) => (
                  <RadioLabel key={o.value}>
                    <input
                      type="radio"
                      name="schedule"
                      value={o.value}
                      checked={schedule === o.value}
                      onChange={() => setSchedule(o.value as any)}
                    />
                    {o.label}
                  </RadioLabel>
                ))}
                {/* <RadioLabel>
                  <input
                    type="radio"
                    name="schedule"
                    value="custom"
                    checked={schedule === "custom"}
                    onChange={() => setSchedule("custom")}
                  />
                  다른 시간 직접 입력
                </RadioLabel> */}
              </RadioGroup>

              {/* {schedule === "custom" && (
                <>
                  <Label htmlFor="customTime">원하는 시간 (HH:MM)</Label>
                  <Input
                    id="customTime"
                    placeholder="예) 14:30"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </>
              )} */}
            </Form>

            <FooterKaKaoEmail>
              <PrimaryButton onClick={handleModalSubmit}>
                신청하고 카톡 알림 받기
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  logCtaClick(
                    "kakao_apply_later",
                    user?.id ?? null,
                    detailData.video_id,
                    getOrCreateAnonId()
                  );
                  setIsModalOpen(false); // 1) 알림 모달 닫기
                  setShowChannelInputSection(true); // 2) 채널 우선 반영 섹션 활성화
                }}
              >
                {" "}
                나중에 할게요
              </SecondaryButton>
            </FooterKaKaoEmail>
          </ModalContent>
        </ModalOverlay>
      )}
      {isEmailModalOpen && (
        <ModalOverlay style={{ background: "rgba(0,0,0,0.4)" }}>
          <ModalContent>
            <Header>📧 이메일 알림 기능 준비 중</Header>
            <Body>
              현재 이메일 알림 기능은 준비 중입니다.
              <br />
              기능 오픈 즉시, 연동된 Google 계정 이메일로
              <br />
              TOP5 영상 요약을 보내드립니다!
            </Body>
            <FooterKaKaoEmail>
              <GoogleLogin onLoginSuccess={handleLoginSuccess} />
              <SecondaryButton
                onClick={() => {
                  logCtaClick(
                    "email_apply_later",
                    user?.id ?? null,
                    detailData.video_id,
                    getOrCreateAnonId()
                  );
                  setIsEmailModalOpen(false);
                  setShowChannelInputSection(true); // 2) 채널 우선 반영 섹션 활성화
                }}
              >
                나중에 신청하기
              </SecondaryButton>
            </FooterKaKaoEmail>
          </ModalContent>
        </ModalOverlay>
      )}
      {isCompleteModalOpen && (
        <ModalOverlay style={{ background: "rgba(0, 0, 0, 0.4)" }}>
          <ModalContent>
            <Header style={{ marginBottom: "24px" }}>
              🎉 신청이 완료되었습니다!
            </Header>
            <Body style={{ marginBottom: "32px" }}>
              TOP5 영상 요약 카톡 알림 기능의 오픈 즉시 <br /> 등록하신 번호로
              가장 먼저 안내해드립니다.
            </Body>
            {/* 2. 채널 우선 반영 upsell with new hook */}
            <SubHeader style={{ margin: "24px 0 12px", color: "#007bff" }}>
              🤔 혹시 TOP5 영상 요약에서 <br />
              우선 반영하고 싶은 채널이 있으신가요?
            </SubHeader>
            <SubBody style={{ marginBottom: "24px" }}>
              관심 채널을 등록하면 매일 TOP5 선정 시
              <br />
              해당 채널의 신규 영상이 있다면 우선 노출됩니다.
              {/* <br />
              <br /> */}
              {/* 예) 즐겨보는 <strong>@YouticleLab</strong> 채널이
              <br />
              항상 최상위 리스트에 오르게 돼요. */}
            </SubBody>

            <Form>
              <Label htmlFor="channel">등록할 채널명</Label>
              <Input
                id="channel"
                placeholder="예) 삼프로TV"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
              />
            </Form>

            <FooterResiter style={{ gap: "12px" }}>
              <PrimaryButton onClick={handleRegisterChannel}>
                채널 등록하기
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsCompleteModalOpen(false)}>
                건너뛰기
              </SecondaryButton>
            </FooterResiter>
          </ModalContent>
        </ModalOverlay>
      )}
      {isEmailCompleteModalOpen && (
        <ModalOverlay style={{ background: "rgba(0, 0, 0, 0.4)" }}>
          <ModalContent>
            <Header style={{ marginBottom: "24px" }}>
              🎉 신청이 완료되었습니다!
            </Header>
            <Body style={{ marginBottom: "32px" }}>
              TOP5 영상 요약 이메일 알림 기능의 오픈 즉시 <br /> 연동한 구글
              이메일로 가장 먼저 안내해드립니다.
            </Body>
            {/* 2. 채널 우선 반영 upsell with new hook */}
            <SubHeader style={{ margin: "24px 0 12px", color: "#007bff" }}>
              🤔 혹시 TOP5 영상 요약에서 <br />
              우선 반영하고 싶은 채널이 있으신가요?
            </SubHeader>
            <SubBody style={{ marginBottom: "24px" }}>
              관심 채널을 등록하면 매일 TOP5 선정 시
              <br />
              해당 채널의 신규 영상이 있다면 우선 노출됩니다.
              {/* <br />
              <br /> */}
              {/* 예) 즐겨보는 <strong>@YouticleLab</strong> 채널이
              <br />
              항상 최상위 리스트에 오르게 돼요. */}
            </SubBody>

            <Form>
              <Label htmlFor="channel">등록할 채널명</Label>
              <Input
                id="channel"
                placeholder="예) 삼프로TV"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
              />
            </Form>

            <FooterResiter style={{ gap: "12px" }}>
              <PrimaryButton onClick={handleRegisterChannel}>
                채널 등록하기
              </PrimaryButton>
              <SecondaryButton
                onClick={() => setIsEmailCompleteModalOpen(false)}
              >
                건너뛰기
              </SecondaryButton>
            </FooterResiter>
          </ModalContent>
        </ModalOverlay>
      )}
      {!isAnyModalOpen && !stickyDismissed && (
        <StickyBar>
          <BarText>👇 오늘 TOP5 유튜브 영상 요약 편하게 확인하세요!</BarText>
          <BarButtons>
            <BarButton
              primary
              onClick={() => {
                logCtaClick(
                  "sticky_kakao",
                  user?.id ?? null,
                  detailData.video_id,
                  getOrCreateAnonId()
                );
                setIsModalOpen(true);
              }}
            >
              카카오톡 알림받기
            </BarButton>
            <BarButton
              onClick={() => {
                logCtaClick(
                  "sticky_email",
                  user?.id ?? null,
                  detailData.video_id,
                  getOrCreateAnonId()
                );
                setIsEmailModalOpen(true);
              }}
            >
              이메일 알림받기
            </BarButton>
          </BarButtons>
        </StickyBar>
      )}
    </Container>
  );
};

const StockMentionsSection = ({
  id,
  mentions,
  loading,
  error,
  onSegmentClick,
  containerRef,
}: {
  id: string;
  mentions: StockMention[];
  loading: boolean;
  error?: string | null;
  onSegmentClick: (start: number) => void;
  containerRef?: RefObject<HTMLDivElement>;
}) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggle = useCallback((key: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const resolveSegmentSeconds = useCallback((segment: StockMentionSegment) => {
    if (
      typeof segment.seconds === "number" &&
      Number.isFinite(segment.seconds)
    ) {
      return segment.seconds;
    }
    return normaliseSegmentStart(segment.start_time).seconds;
  }, []);
const user = useRecoilValue(userState);

  const shouldShowEmptyState =
    !loading && !error && (!mentions || mentions.length === 0);

  return (
    <StockMentionsContainer id={id} ref={containerRef}>
      <StockMentionsHeader>
        <StockMentionsTitle>📈 이 영상에서 언급된 종목</StockMentionsTitle>
        <StockMentionsSubtitle>
          관심 종목 구간을 바로 선택해 핵심 내용을 확인해 보세요.
        </StockMentionsSubtitle>
      </StockMentionsHeader>
      {loading ? (
        <StockMentionsState>종목 정보를 불러오는 중이에요…</StockMentionsState>
      ) : null}
      {error ? (
        <StockMentionsState $variant="error">{error}</StockMentionsState>
      ) : null}
      {shouldShowEmptyState ? (
        <StockMentionsState>
          현재 추출된 종목이 확인되지 않았습니다.
        </StockMentionsState>
      ) : null}
      {mentions && mentions.length > 0 ? (
        <StockMentionList>
          {mentions.map((mention, index) => {
            if (!mention) return null;
            const key = `${mention.stock_name ?? "stock"}-${
              mention.ticker ?? index
            }`;
            const isExpanded = expandedMap[key] ?? false;
            const occurrences =
              mention.mention_count ??
              (mention.segments ? mention.segments.length : 0) ??
              0;
            const occurrenceLabel =
              occurrences > 0 ? `언급 ${occurrences}회` : "언급 정보 없음";
            const sanitizedReason = mention.actionIdea?.reason
              ? removeMarkTags(mention.actionIdea.reason)
              : undefined;
            const sanitizedCompany = mention.companyDescription
              ? removeMarkTags(mention.companyDescription)
              : undefined;
            const sanitizedComment = mention.commentBody
              ? removeMarkTags(mention.commentBody)
              : undefined;

            return (
              <StockMentionItem key={key}>
                <StockMentionButton
  type="button"
  onClick={() => {
    // 1) CTA 로그 (비동기여도 기다리지 않음)
    void logCtaClick(
      "stock_mention",
      user?.id,
      mention.stock_name ?? null,
      getOrCreateAnonId()
    ).catch(() => {}); // 에러 무시(선택)

    // 2) 상태 토글
    toggle(key);
  }}
>
                  <StockMentionTitleGroup>
                    <span>{mention.stock_name}</span>
                    {mention.ticker ? (
                      <TickerBadge>{mention.ticker}</TickerBadge>
                    ) : null}
                  </StockMentionTitleGroup>
                  <StockMentionMeta>{occurrenceLabel}</StockMentionMeta>
                  <StockMentionCaret $expanded={isExpanded}>
                    ›
                  </StockMentionCaret>
                </StockMentionButton>
                {isExpanded ? (
                  <StockMentionPanel>
                    {mention.segments && mention.segments.length > 0 ? (
                      mention.segments.map((segment, segIndex) => {
                        if (!segment) return null;
                        const seconds = resolveSegmentSeconds(segment);
                        const timeLabel =
                          seconds != null
                            ? formatSecondsToMmSs(seconds)
                            : typeof segment.start_time === "string"
                            ? segment.start_time
                            : "--:--";
                        const rawLabel =
                          segment.label ??
                          segment.summary ??
                          `구간 ${segIndex + 1}`;
                        const sanitizedLabel = removeMarkTags(rawLabel);
                        const summarySource =
                          segment.summary && segment.summary !== rawLabel
                            ? removeMarkTags(segment.summary)
                            : undefined;
                        const confidenceLabel = segment.confidence
                          ? segment.confidence.toUpperCase()
                          : undefined;

                        return (
                          <StockMentionSegmentButton
                            key={`${key}-${segIndex}`}
                            type="button"
                            disabled={seconds == null}
                            onClick={() => {
                              if (seconds != null) {
                                onSegmentClick(seconds);
                              }
                            }}
                          >
                            <StockMentionSegmentTime>
                              {timeLabel}
                            </StockMentionSegmentTime>
                            <StockMentionSegmentBody>
                              <StockMentionSegmentLabel>
                                {sanitizedLabel}
                              </StockMentionSegmentLabel>
                              {confidenceLabel ? (
                                <StockMentionSegmentConfidence
                                  $level={segment.confidence}
                                >
                                  {confidenceLabel}
                                </StockMentionSegmentConfidence>
                              ) : null}
                              {summarySource ? (
                                <StockMentionSegmentSummary>
                                  {summarySource}
                                </StockMentionSegmentSummary>
                              ) : null}
                            </StockMentionSegmentBody>
                          </StockMentionSegmentButton>
                        );
                      })
                    ) : (
                      <StockMentionEmpty>
                        아직 타임라인이 준비되지 않았습니다.
                      </StockMentionEmpty>
                    )}
                    {mention.actionIdea?.stance || sanitizedReason ? (
                      <StockMentionAction>
                        {mention.actionIdea?.stance ? (
                          <strong>{mention.actionIdea.stance}</strong>
                        ) : null}
                        {sanitizedReason ? <p>{sanitizedReason}</p> : null}
                      </StockMentionAction>
                    ) : null}
                    {!sanitizedReason && sanitizedCompany ? (
                      <StockMentionAction>
                        <p>{sanitizedCompany}</p>
                      </StockMentionAction>
                    ) : null}
                    {sanitizedComment ? (
                      <StockMentionComment>
                        {sanitizedComment}
                      </StockMentionComment>
                    ) : null}
                  </StockMentionPanel>
                ) : null}
              </StockMentionItem>
            );
          })}
        </StockMentionList>
      ) : null}
    </StockMentionsContainer>
  );
};

export default ClientSide;

const Container = styled.div<{ $isFixed: boolean }>`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: white;
  /* height: fit-content;
  min-height: calc(100vh + 813px); // 기본 100vh + 추가 813px */
`;

const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  margin-bottom: 16px;
`;

const Category = styled.span`
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  color: #007bff;
  margin-bottom: 12px;
`;

const Analysis = styled.p`
  font-size: 16px;
  line-height: 140%;
  background-color: #f9f9f9;
  padding: 16px 12px;
  border-radius: 4px;
  margin-top: 12px;
  margin-left: 16px;
  margin-right: 16px;
  margin-bottom: 40px;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 800;
  line-height: 24px;
  margin-bottom: 4px;
`;

const UploadContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const Upload = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 14.4px;
  margin-right: 4px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;

const Preview = styled.div<{ $isFixed: boolean }>`
  padding: 20px;
  background-color: #f9f9f9;
  margin-top: ${(props) => (props.$isFixed ? "12px" : "12px")};
  margin-left: 16px;
  margin-right: 16px;
  margin-bottom: 60px;
  div {
    display: flex;
    flex-direction: column;
    background-color: #f2f2f2;
    padding: 20px;
    gap: 12px;
  }

  span {
    display: block;
    font-family: "Pretendard Variable";
    font-size: 16px;
  }

  span:first-child {
    font-weight: 600;
  }

  span.line-break {
    font-weight: 400;
    line-height: 160%;
    margin-bottom: 8px;
  }
`;

const TOC = styled.div`
  margin-top: 20px;
  padding: 0 16px;
  .toc-header {
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: #000;
    color: #fff;
    font-size: 20px;
    font-weight: 800;
    border-radius: 4px;
    margin-bottom: 8px;
  }
`;
// 1) ContentWrapper: 세로 스택
const ContentWrapper = styled.div<{ fullPadding: boolean }>`
  overflow: hidden;
  padding: ${({ fullPadding }) => (fullPadding ? "0px" : "0px")};
  transition: max-height 0.3s ease;
  display: flex;
  flex-direction: column; /* ← 가로가 아니라 세로로 */
  gap: 8px;
  background: ${({ fullPadding }) =>
    fullPadding ? "#transparent" : "transparent"};
`;

const VideoContainer = styled.div<{ $isFixed: boolean; $isDesktop: boolean }>`
  position: ${(props) => (props.$isFixed ? "fixed" : "static")};
  top: ${(props) => (props.$isFixed ? "52px" : "auto")};
  left: ${(props) => (props.$isFixed ? "0" : "auto")};
  z-index: ${(props) => (props.$isFixed ? 1000 : 0)};
  display: flex;

  div {
    width: 100vw;

    iframe {
      width: 100vw;
      max-width: ${({ $isDesktop }) => ($isDesktop ? "420px" : "none")};
    }
  }
`;

const LoaderAnimation = keyframes`
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: 200px 0;
    }
`;

const Loader = styled.div`
  width: 360px;
  height: 202px;
  background: #f0f0f0;
  background-image: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${LoaderAnimation} 1.5s infinite;
`;

const AnchorLinkRow = styled.div`
  margin-top: 8px;
  display: flex;
`;

const AnchorButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #0b63f6;
  background: rgba(11, 99, 246, 0.12);
  border-radius: 999px;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(11, 99, 246, 0.2);
  }
`;

const StockMentionsContainer = styled.section`
  margin-top: 40px;
  padding: 24px 20px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StockMentionsHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StockMentionsTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
`;

const StockMentionsSubtitle = styled.span`
  font-size: 13px;
  color: #475569;
`;

const StockMentionsState = styled.div<{ $variant?: "error" | "info" }>`
  font-size: 12px;
  color: ${({ $variant }) => ($variant === "error" ? "#dc2626" : "#475569")};
  background: ${({ $variant }) =>
    $variant === "error"
      ? "rgba(220, 38, 38, 0.08)"
      : "rgba(148, 163, 184, 0.12)"};
  border-radius: 12px;
  padding: 10px 12px;
`;

const StockMentionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StockMentionItem = styled.div`
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
`;

const StockMentionButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: transparent;
  border: none;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }
`;

const StockMentionTitleGroup = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-weight: 700;
  color: #1f2937;
`;

const TickerBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  padding: 2px 6px;
`;

const StockMentionMeta = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #0b63f6;
  background: rgba(11, 99, 246, 0.12);
  border-radius: 999px;
  padding: 2px 8px;
  margin-left: 8px;
`;

const StockMentionCaret = styled.span<{ $expanded: boolean }>`
  margin-left: auto;
  font-size: 18px;
  color: #94a3b8;
  transform: rotate(${({ $expanded }) => ($expanded ? "90deg" : "0deg")});
  transition: transform 0.2s ease;
`;

const StockMentionPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 16px;
  background: #fff;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
`;

const StockMentionSegmentButton = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(241, 245, 249, 0.7);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  text-align: left;
  cursor: pointer;
  transition: border 0.2s ease, transform 0.15s ease;

  &:hover:not(:disabled) {
    border-color: rgba(11, 99, 246, 0.35);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const StockMentionSegmentTime = styled.span`
  min-width: 48px;
  font-size: 12px;
  font-weight: 700;
  color: #0b63f6;
`;

const StockMentionSegmentBody = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #1f2937;
`;

const StockMentionSegmentLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
`;

const confidenceColorMap = ($level?: string) => {
  const level = ($level ?? "").toLowerCase();
  switch (level) {
    case "high":
    case "높음":
      return { bg: "rgba(34, 197, 94, 0.18)", color: "#166534" };
    case "medium":
    case "중간":
      return { bg: "rgba(234, 179, 8, 0.22)", color: "#854d0e" };
    case "low":
    case "낮음":
      return { bg: "rgba(147, 197, 253, 0.24)", color: "#1d4ed8" };
    default:
      return { bg: "rgba(148, 163, 184, 0.2)", color: "#475569" };
  }
};

const StockMentionSegmentConfidence = styled.span<{ $level?: string }>`
  align-self: flex-start;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 2px 6px;
  border-radius: 999px;
  text-transform: uppercase;
  background: ${({ $level }) => confidenceColorMap($level).bg};
  color: ${({ $level }) => confidenceColorMap($level).color};
`;

const StockMentionSegmentSummary = styled.span`
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
`;

const StockMentionEmpty = styled.div`
  padding: 16px;
  font-size: 12px;
  color: #94a3b8;
  background: #fff;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
`;

const StockMentionAction = styled.div`
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.08);
  font-size: 12px;
  color: #1f2937;
  line-height: 1.5;

  strong {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    color: #0b63f6;
    text-transform: uppercase;
  }

  p {
    margin: 0;
    white-space: pre-line;
  }
`;

const StockMentionComment = styled.div`
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.16);
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
`;

const OverviewTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-top: 40px;
  margin-left: 16px;
`;
// 로딩 오버레이 스타일
const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  /* 스크롤 할 필요가 없다면 오버레이 내부만 overflow: hidden; 가능 */
`;
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 5px solid white;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
const LoadingText = styled.div`
  color: white;
  margin-top: 10px;
  font-size: 16px;
`;

/* 🔹 스타일 */
const CommentAnalysisWrapper = styled.div`
  background-color: #f9f9f9;
  padding: 20px;
  /* border-radius: 8px; */
  margin-bottom: 16px;
  margin-left: 16px;
  margin-right: 16px;
`;

const AnalysisTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
`;

const AnalysisDesc = styled.p`
  font-size: 14px;
  line-height: 1.2;
  color: #444;
  margin-top: 12px;
  strong {
    font-weight: 700;
  }
`;

const ToggleButton2 = styled.button`
  background-color: #007bff;
  color: #fff;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  font-size: 14px;
  &:hover {
    background-color: #0056b3;
  }
`;

/** ⬇️ 5줄 핵심 요약 섹션 추가 */
const FiveLineSummarySection = styled.div`
  margin: 0 16px 32px 16px;
  /* padding: 20px;
  background-color: #f7faff; */
  /* border-radius: 8px; */
  /* border: 1px solid #b4c2ff; */
`;

const Divider = styled.div`
  /* 굵은 구분선 */
  height: 2px;
  background-color: #e0e0e0;
  margin-bottom: 16px;
`;

const FiveLineTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  margin-top: 20px;
`;

const FiveLineList = styled.ul`
  /* list-style-type: "• "; */
  li {
    font-size: 16px;
    margin-bottom: 12px;
    line-height: 1.4;
  }
`;

/** 본문 시작 타이틀 추가 */
const MainBodyTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin: 48px 16px 4px;
`;

const FiveLineListWrapper = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const FiveLineListWrapperIndex = styled.div`
  margin-top: 4px;
  margin-right: 4px;
`;

const Timeline = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  /* padding: 12px 0px 12px 8px; */
  /* border: 1px solid #007bff; */
  border-radius: 4px;
  background-color: #eaf4ff;
  /* margin-left: 4px; */
  cursor: pointer;
  transition: all 0.3s ease;
  max-height: 32px;
  margin-right: 8px;
  padding: 16px 8px;
  border: 1px solid #007bff;
  &:hover {
    background-color: #007bff;
    span {
      color: white;
    }
  }

  svg {
    width: 14px;
    height: 14px;
    fill: #007bff;
    transition: fill 0.2s ease;
  }

  span {
    font-size: 14px;
    font-weight: 600;
    color: #007bff;
    transition: color 0.2s ease;
    min-width: 56px;
  }
`;
const MoreButton = styled.button`
  position: relative;
  z-index: 10;
  display: block;
  margin: 40px 16px 24px;
  width: calc(100% - 32px);
  padding: 16px 0;
  background-color: #007bff;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  &:hover {
    background-color: #0056b3;
  }
`;
const ArticleWrapper = styled.div<{ expanded: boolean; maxHeight: number }>`
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.3s ease;
  max-height: ${(p) => (p.expanded ? `${p.maxHeight}px` : "0px")};
  opacity: ${(p) => (p.expanded ? 1 : 0)};
  margin-top: 32px;
`;

const RecommendWrapper = styled.div<{
  $hasDimmedItem: boolean;
  $isUnsubscribedSection: boolean;
  $tocItemHeight: number;
}>`
  margin-top: ${(props) =>
    props.$hasDimmedItem && props.$isUnsubscribedSection
      ? `240px`
      : props.$hasDimmedItem
      ? `${(360 / props.$tocItemHeight) * props.$tocItemHeight}px`
      : `0px`};
  z-index: ${(props) => (props.$hasDimmedItem ? `500` : "0")};
  padding-left: 16px;
  padding-right: 16px;
`;

// 2) PartCard: full-width 카드
const PartCard = styled.div`
  width: 100%; /* ← 전체 폭 차지 */
  /* background: #f9f9f9; */
  /* border: 1px solid #ddd; */
  border-radius: 8px;
  /* padding: 16px; */
  line-height: 160%;
`;

const PartCardBox = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 20px;
  align-items: center;
`;

// 부 제목 강조
const PartHeader = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 12px;
  display: inline-block;
  background: #969696;
  color: #fff;
  padding: 4px 20px;
  border-radius: 4px;
`;

// 기존 ul/li 대신 쓸 아이템
const Item = styled.div`
  position: relative;
  /* margin-bottom: 16px; */
  /* line-height: 1.4; */
  font-size: 18px;
  font-weight: 600;
`;
const InsightBlock = styled.div`
  border-top: 1px solid #eee;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InsightTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #444;
`;
const InsightContainer = styled.div`
  margin: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InsightCard = styled.div`
  background: #ffffff;
  /* padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); */
`;

const InsightHeader = styled.h3`
  font-size: 16px;
  font-weight: 400;
  color: #000;
  line-height: 140%;
  margin-bottom: 8px;
  /* mark 태그 기본 스타일 제거 & font-weight만 강조 */
  mark {
    background: none;
    color: inherit;
    padding: 0;
    font-weight: 700;
  }
`;
const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CommentItem = styled.div`
  background: #f2f8ff;
  border-left: 4px solid #007bff;
  padding: 16px;
  border-radius: 4px;
`;

const CommentText = styled.div`
  font-size: 14px;
  line-height: 140%;
`;

const CommentMeta = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 8px;
`;
const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin: 0px 16px;
  /* color: #007bff; */
`;
const EmptyState = styled.div`
  font-size: 16px;
  color: #888;
  text-align: center;
  margin: 24px 16px;
`;

const Callout = styled.div`
  margin: 0 16px 8px;
  padding: 12px 16px;
  background: #f0f8ff;
  border-radius: 8px;
  font-size: 14px;
  color: #0056b3;
  font-weight: 600;
  &::before {
    content: "💬";
    margin-right: 8px;
  }
`;

// 1) bounce keyframes 정의 (작은 범위로 자연스럽게)
const bounceY = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
`;

const InfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 16px 12px;
  padding: 12px 16px;
  background: #eef6ff;
  border: 1px solid #007bff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #0056b3;
  /* 여기에 bounceY 넣기 */
  animation: ${bounceY} 2s ease-in-out infinite;
  line-height: 140%;
  svg {
    flex-shrink: 0;
  }
`;
// ─── Styled-components ───
const ActionSection = styled.section`
  max-width: 600px;
  margin: 32px auto;
  padding: 32px 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

// const HookingCopy = styled.div`
//   font-size: 18px;
//   font-weight: 700;
//   line-height: 1.5;
//   text-align: center;
//   color: #111;
// `;

const SectionHeader = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CardTitle = styled.h4`
  font-size: 16px;
  margin: 0;
`;

const UserDescription = styled.p`
  font-size: 14px;
  color: #444;
  margin: 0;
`;

const InputLabel = styled.label`
  font-size: 12px;
  color: #666;
`;

const ChannelInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ButtonBase = styled.button`
  border-radius: 4px;
  cursor: pointer;
  padding: 12px 16px;
  font-size: 14px;
  width: 100%;
  border: none;
`;

// const PrimaryButton = styled(ButtonBase)`
//   background: #007bff;
//   color: #fff;
//   &:hover {
//     background: #0056b3;
//   }
// `;
const HookSection = styled.section`
  background: #f5f7ff;
  padding: 32px 24px;
  padding-bottom: 0px;
  margin: 24px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  text-align: center;
  margin-top: 100px;
`;

const HookingCopy = styled.div`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  color: #1f2937;
  margin-bottom: 24px;
  strong {
    color: #007bff;
    font-size: 18px;
    font-weight: 800;
  }
  span {
    font-weight: 900;
  }
`;

const SurveyWrapper = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e0e7ff;
  display: inline-block;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  svg {
    color: #007bff;
    margin-bottom: 16px;
  }
`;

const PromptText = styled.p`
  font-size: 16px;
  color: #374151;
  margin-bottom: 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
`;

const SurveyButton = styled.button<{ primary?: boolean }>`
  flex: 1;
  padding: 16px 0;
  font-size: 18px;
  font-weight: ${({ primary }) => (primary ? 700 : 0)};

  border-radius: 4px;
  border: none;
  cursor: pointer;

  background: ${({ primary }) => (primary ? "#007bff" : "#e0e0e0")};
  color: ${({ primary }) => (primary ? "#fff" : "#555")};

  &:hover {
    background: ${({ primary }) => (primary ? "#0056b3" : "#5a6268")};
  }
`;

const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;
const Label = styled.label`
  font-size: 16px;
  font-weight: 700;
  color: #444;
`;
const Input = styled.input`
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 12px;
  width: 100%;
`;
const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const RadioLabel = styled.label`
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  input {
    transform: scale(1.1);
  }
`;

const Thumbnail = styled.img`
  width: 80%;
  max-width: 320px;
  border-radius: 8px;
  margin: 0 auto 16px;
  display: block;
`;

const Caption = styled.p`
  font-size: 14px;
  color: #666;
  font-weight: 700;
  text-align: center;
  margin-top: 60px;
  margin-bottom: 12px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

// Header 아래 여백 강화
const Header = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
`;

// Body 여백 강화
const Body = styled.p`
  font-size: 16px;
  color: #000;
  line-height: 1.4;
  text-align: center;
  margin-bottom: 32px;
`;

// SubHeader 강조 스타일 (색상, 굵기)
const SubHeader = styled.h4`
  font-size: 18px;
  font-weight: 700;
  color: #007bff;
  text-align: center;
  margin: 24px 0 12px;
  line-height: 1.4;
`;

// SubBody 기본 여백 유지
const SubBody = styled.p`
  font-size: 16px;
  color: #000;
  line-height: 1.4;
  text-align: center;
  margin-bottom: 24px;
`;

// Footer 버튼 비율 유지
const FooterResiter = styled.div`
  display: flex;
  gap: 12px;
`;

const FooterKaKaoEmail = styled.div`
  display: flex;
  flex-direction: column;
`;

const PrimaryButton = styled.button`
  flex: 0 0 60%;
  background: #007bff;
  color: #fff;
  padding: 16px 0;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  flex: 0 0 40%;
  background: #e0e0e0;
  color: #555;
  padding: 12px 0;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  margin-bottom: 12px;

  cursor: pointer;
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(8px); }
  to   { opacity: 0; transform: translateY(0); }
`;
const ChannelPrioritySection = styled.div`
  margin: 24px 16px;
  padding: 20px;
  background: #f5f7ff;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.3s ease-out forwards;

  h4 {
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }
  p {
    font-size: 16px;
    color: #555;
    line-height: 1.4;
    margin-bottom: 20px;
  }
`;

const RegisterButton = styled.button`
  background: #007bff;
  color: #fff;
  padding: 16px 0;
  width: 100%;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #0056b3;
  }
`;

const PrivacyNote = styled.p`
  font-size: 12px;
  color: #555;
  margin-top: -18px;
  margin-bottom: 16px;
  line-height: 1.4;
  text-align: left;
  span {
    font-weight: 600;
  }
`;
const EmailSection = styled.div`
  margin-top: 32px;
  padding: 24px;
  background: #eef6ff;
  border: 1px solid #007bff;
  border-radius: 8px;
  text-align: center;
`;

const EmailHookingCopy = styled.div`
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: #0056b3;
  margin-bottom: 16px;
`;
const StickyBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #ffffff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 12px 16px;
  z-index: 10000;
  flex-direction: column;

  /* PC(데스크탑) 모드일 때 */
  @media (min-width: 768px) {
    max-width: 420px; /* 컨테이너 너비와 동일하게 */
    left: 50%; /* 화면 중앙으로 옮기고 */
    transform: translateX(-50%);
    padding: 12px; /* 여백 조절 (선택) */
    border-radius: 8px 8px 0 0; /* 양끝에 둥근 모서리 주기 (선택) */
  }
`;

const BarText = styled.span`
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
`;

const BarButtons = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const BarButton = styled.button<{ primary?: boolean }>`
  padding: 12px 12px;
  font-size: 14px;
  font-weight: 600;
  width: 100%;
  color: ${({ primary }) => (primary ? "#fff" : "#007bff")};
  background: ${({ primary }) => (primary ? "#007bff" : "transparent")};
  border: 1px solid #007bff;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ primary }) =>
      primary ? "#0056b3" : "rgba(0,123,255,0.1)"};
  }
`;
const slideIn = keyframes`
  from { transform: translateY(-100%); }
  to   { transform: translateY(0); }
`;

const Banner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0056b3;
  color: #fff;
  padding: 12px 16px;
  animation: ${slideIn} 0.3s ease-out;
  z-index: 1001;
`;

const BannerText = styled.span`
  font-weight: 600;
  font-size: 14px;
`;

const BannerButton = styled.button`
  background: #fff;
  color: #0056b3;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
`;

const Close = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  margin-left: 12px;
`;
