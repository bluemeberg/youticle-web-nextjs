"use client"; // Ensure this is a client component

import styled, { keyframes } from "styled-components";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { DataProps, StockFeedSlotPhase } from "@/types/dataProps";
import { useRecoilValue } from "recoil";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import RecommendCard from "./RecommendCard";
import CountdownTimer from "@/common/CountdownTimer";

import {
  fetchEditorArticle,
  fetchStockVideo,
  fetchTopVideosBySection,
  logCtaClick,
} from "@/api/apiClient";
import { useRouter, usePathname } from "next/navigation";
import {
  getOrCreateAnonId,
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
  timeAgoUTC,
} from "@/utils/formatter";
import { userState } from "@/store/user";
import {
  buildStockSlotRequests,
  buildStockSlotSections,
  type StockSlotPayload,
  type StockSlotSection,
} from "@/utils/stockFeed";
import {
  resolveStockSlot,
  getSlotLabelInfo,
  type BriefingSlot,
} from "@/utils/briefingSlot";
import { resolveInsightSlotCopy } from "@/utils/insightSlotCopy";

interface RecommendProps {
  isUnsubscribedSection: boolean;
  section: string;
  videoId: string;
}

interface Editor {
  id: string;
  name: string;
  image: string;
  keywords: string[];
}

// DataProps.summary_data 에서 뽑아올 키들 + top-level 키
const METRIC_KEYS = [
  "score", // Hot Score
  "avg_views_per_hour", // 시간당 조회수
  // "category_relative_views_pct", // 섹션 대비 조회↑
  "relative_sub_norm_pct", // 구독자당 조회↑
  "like_rate_pct", // 좋아요율
  "comment_rate_pct", // 댓글율
] as const;
type MetricKey = (typeof METRIC_KEYS)[number];
type AuxKey = Exclude<MetricKey, "score">;
type VideoPayload = {
  videos: DataProps[];
  slotSections?: StockSlotSection[];
};

// 1) metric key → 아이콘·이름 매핑
const metricMeta: Record<MetricKey, { icon: string; name: string }> = {
  score: { icon: "🔥", name: "Hot Score" },
  avg_views_per_hour: { icon: "👁️", name: "시간당 조회수" },
  // category_relative_views_pct: { icon: "", name: "섹션 대비 조회수" },
  relative_sub_norm_pct: { icon: "👥", name: "구독자당 조회속도" },
  like_rate_pct: { icon: "👍", name: "좋아요율" },
  comment_rate_pct: { icon: "💬", name: "댓글율" },
};

type MetricRankings = Record<MetricKey, string[]>;

const MONEY_SECTIONS = new Set([
  "국내 주식",
  "해외 주식",
  "국내 가상자산",
  "해외 가상자산",
]);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://youticle.shop";
const STOCK_BASELINE_URL = `${API_BASE_URL}/briefing/top_videos/stock`;
const STOCK_V2_URL = `${API_BASE_URL}/briefing_v2/top_videos/v2/`;

const SLOT_PHASE_META: Record<
  StockFeedSlotPhase,
  { label: string; short: string }
> = {
  baseline: { label: "07:30 베이스라인", short: "베이스라인" },
  slot1: { label: "08:30 1차 갱신", short: "1차 갱신" },
  slot2: { label: "12:40 2차 갱신", short: "2차 갱신" },
  slot3: { label: "15:10 3차 갱신", short: "3차 갱신" },
  slot4: { label: "21:40 마감", short: "저녁 재랭킹" },
};

const SLOT_PHASE_COLORS: Record<
  StockFeedSlotPhase,
  { bg: string; color: string }
> = {
  baseline: { bg: "#fef3c7", color: "#92400e" },
  slot1: { bg: "#dbeafe", color: "#1d4ed8" },
  slot2: { bg: "#dcfce7", color: "#047857" },
  slot3: { bg: "#f3e8ff", color: "#7e22ce" },
  slot4: { bg: "#e0e7ff", color: "#4338ca" },
};

const SLOT_EMOJI: Record<StockFeedSlotPhase, string> = {
  baseline: "⏰",
  slot1: "🎯",
  slot2: "🎯",
  slot3: "🎯",
  slot4: "🟥",
};

const DETECTED_SLOT_MAP: Record<string, { label: string; minutes: number }> = {
  slot_0730: { label: "07:30 선정", minutes: 7 * 60 + 30 },
  slot_0830: { label: "08:30 갱신", minutes: 8 * 60 + 30 },
  slot_1130: { label: "11:30 재랭킹", minutes: 11 * 60 + 30 },
  slot_1240: { label: "12:40 갱신", minutes: 12 * 60 + 40 },
  slot_1510: { label: "15:10 갱신", minutes: 15 * 60 + 10 },
  slot_1530: { label: "15:30 재랭킹", minutes: 15 * 60 + 30 },
  slot_1600: { label: "16:00 재랭킹", minutes: 16 * 60 },
  slot_1730: { label: "17:30 재랭킹", minutes: 17 * 60 + 30 },
  slot_1810: { label: "18:10 재랭킹", minutes: 18 * 60 + 10 },
  slot_2030: { label: "20:30 재랭킹", minutes: 20 * 60 + 30 },
  slot_2100: { label: "21:00 재랭킹", minutes: 21 * 60 },
  slot_2140: { label: "21:40 갱신", minutes: 21 * 60 + 40 },
};

const MINUTES_PER_DAY = 24 * 60;

const getKstMinutes = (date: Date) => {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return (utcMinutes + 9 * 60) % MINUTES_PER_DAY;
};

const formatMinutesAgo = (diffMinutes: number) => {
  if (diffMinutes <= 0) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const hours = Math.max(1, Math.round(diffMinutes / 60));
  return `${hours}시간 전`;
};

const getLatestDetectedSlot = (
  detected?: Record<string, boolean> | null
): { key: string; label: string; minutes: number } | null => {
  if (!detected) return null;
  const entries = Object.entries(detected)
    .filter(([key, value]) => value && DETECTED_SLOT_MAP[key])
    .sort(
      (a, b) =>
        DETECTED_SLOT_MAP[b[0]].minutes - DETECTED_SLOT_MAP[a[0]].minutes
    );
  if (entries.length === 0) return null;
  const [key] = entries[0];
  return { key, ...DETECTED_SLOT_MAP[key] };
};

const Recommend = ({
  isUnsubscribedSection,
  section,
  videoId,
}: RecommendProps) => {
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [videos, setVideos] = useState<DataProps[]>([]);
  const [editorVideos, setEditorVideos] = useState<DataProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [slotSections, setSlotSections] = useState<StockSlotSection[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const isMoneySection = MONEY_SECTIONS.has(section?.trim() ?? "");

  // console.log("recommend", detailData.section);
  useEffect(() => {
    let canceled = false;

    const fetchMoneyVideos = async (): Promise<VideoPayload> => {
      const slotCount = resolveStockSlot(new Date());
      const requests = buildStockSlotRequests({
        currentSlot: slotCount,
        baselineUrl: STOCK_BASELINE_URL,
        v2BaseUrl: STOCK_V2_URL,
      });
      const payloads = await Promise.all(
        requests.map(async (request) => {
          const response = await fetch(request.url, {
            method: "GET",
            cache: "no-store",
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch slot ${request.slot}`);
          }
          const data = (await response.json()) as DataProps[];
          return {
            ...request,
            data: data.filter((item) => item.section === section),
          } satisfies StockSlotPayload;
        })
      );
      const filteredPayloads = payloads.filter(
        (payload) => payload.data.length > 0
      );
      const slotSectionPayloads = buildStockSlotSections(filteredPayloads);
      const mergedVideos = slotSectionPayloads.flatMap(
        (slotSection) => slotSection.items
      );
      return {
        videos: mergedVideos,
        slotSections: slotSectionPayloads,
      };
    };

    const fetchDefaultVideos = async (): Promise<VideoPayload> => {
      if (section === "국내 주식" || section === "국내 가상자산") {
        const data = await fetchStockVideo();
        return {
          videos: Array.isArray(data)
            ? data.filter((item) => item.section === section)
            : [],
        };
      }
      const data = await fetchTopVideosBySection(section);
      return { videos: Array.isArray(data) ? data : [] };
    };

    const loadVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const videoPayloadPromise: Promise<VideoPayload> = isMoneySection
          ? fetchMoneyVideos()
          : fetchDefaultVideos();
        const [videoPayload, editorPayload] = await Promise.all([
          videoPayloadPromise,
          fetchEditorArticle(),
        ]);
        if (canceled) return;
        setEditorVideos(Array.isArray(editorPayload) ? editorPayload : []);
        if (isMoneySection) {
          setSlotSections(videoPayload.slotSections ?? []);
        } else {
          setSlotSections([]);
        }
        setVideos(videoPayload.videos);
      } catch (error) {
        console.error("Error fetching videos", error);
        if (!canceled) {
          setError("Error fetching videos");
          setVideos([]);
          setSlotSections([]);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    loadVideos();

    return () => {
      canceled = true;
    };
  }, [section, isMoneySection]);

  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const filteredAndSortedData = useMemo(() => {
    const filteredData = videos.filter(
      (item) => item.section === section && item.video_id !== videoId
    );
    const sortedData = filteredData.sort((a, b) => {
      const aScore =
        typeof a.score === "number"
          ? a.score
          : (a.summary_data?.score as number | undefined) ?? 0;
      const bScore =
        typeof b.score === "number"
          ? b.score
          : (b.summary_data?.score as number | undefined) ?? 0;
      if (sortCriteria === "engagement") {
        return bScore - aScore;
      }
      const aComposite =
        ((typeof a.summary_data?.score === "number" && a.summary_data.score) ||
          aScore) ??
        0;
      const bComposite =
        ((typeof b.summary_data?.score === "number" && b.summary_data.score) ||
          bScore) ??
        0;
      return bComposite - aComposite;
    });
    return sortedData;
  }, [videos, sortCriteria]);

  const newVideos = useMemo(() => {
    return filteredAndSortedData.filter((item) => item.is_new);
  }, [filteredAndSortedData]);

  const newVideoIds = useMemo(() => {
    return new Set(newVideos.map((video) => video.video_id));
  }, [newVideos]);

  const topVideos = useMemo(() => {
    return filteredAndSortedData
      .filter((item) => !newVideoIds.has(item.video_id))
      .sort((a, b) => {
        const aScore =
          typeof a.score === "number"
            ? a.score
            : (a.summary_data?.score as number | undefined) ?? 0;
        const bScore =
          typeof b.score === "number"
            ? b.score
            : (b.summary_data?.score as number | undefined) ?? 0;
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [filteredAndSortedData, newVideoIds]);

  const getDisplayHotScore = useCallback((raw?: number) => {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }
    return undefined;
  }, []);

  const filteredAndSortedEditorData = useMemo(() => {
    const source = Array.isArray(editorVideos) ? editorVideos : [];
    const filteredData = source.filter(
      (item) =>
        item.section === section &&
        item.video_id !== videoId &&
        Object.keys(item.summary_data).length !== 0 // summary_data가 빈 객체인 경우 제외
    );

    const sortedData = filteredData.sort((a, b) => {
      // upload_date를 Date 객체로 변환 후 비교
      const dateA = new Date(a.upload_date).getTime();
      const dateB = new Date(b.upload_date).getTime();
      return dateB - dateA;
    });

    return sortedData;
  }, [editorVideos, section, videoId]);

  const editors: Editor[] = [
    {
      id: "1",
      name: "유썸 스톡",
      image: "/images/유썸스톡.png",
      keywords: ["주식"],
    },
    {
      id: "2",
      name: "유썸 비즈",
      image: "/images/유썸비즈.png",
      keywords: ["비즈니스/사업"],
    },
    {
      id: "3",
      name: "유썸 메디컬",
      image: "/images/유썸메디컬.png",
      keywords: ["건강"],
    },
    {
      id: "4",
      name: "유썸 로맨틱",
      image: "/images/유썸로맨틱.png",
      keywords: ["연애/결혼"],
    },
    {
      id: "5",
      name: "유썸 AI/테크",
      image: "/images/유썸테크.png",
      keywords: ["인공지능", "IT/테크", "IT/Tech"],
    },
  ];

  // section과 일치하는 editor를 찾기
  const matchedEditor = editors.find((editor) =>
    editor.keywords.includes(section)
  );

  const RECOMMEND_TITLE = pathname.includes("/editor")
    ? `<span class='highlight'>유티클 투데이</span>에서&nbsp;<span class='highlight'>${section}</span>&nbsp;아티클도 확인하기!`
    : `<span class='highlight'>유티클 투데이</span>에서&nbsp;다음 <span class='highlight'>${section}</span>&nbsp;아티클 확인하기!`;
  const SECTION_TITLE = `오늘의 ${section} TOP5 영상`;

  let EDITOR_TITLE = "";

  if (pathname.includes("/studio")) {
    // 관리자 페이지: 여러 에디터들 관련 안내
    EDITOR_TITLE = `<span class='highlight'>다른 에디터</span>가 업로드한 <span class='highlight'>${section} 아티클</span>도 확인해보세요!`;
  } else if (pathname.includes("/editor")) {
    // 에디터 페이지
    EDITOR_TITLE = matchedEditor
      ? `<span class='highlight'>${matchedEditor.name}</span>&nbsp;에디터의 다른 <span class='highlight'>${section}</span> 아티클 확인하기`
      : "다른 에디터의 아티클을 확인해보세요.";
  } else {
    // default = detail 등
    EDITOR_TITLE = matchedEditor
      ? `<span class='highlight'>${matchedEditor.name}</span>&nbsp;에디터가 업로드한 <span class='highlight'>${section}</span> 아티클도 확인해보세요!`
      : "다른 에디터의 아티클을 확인해보세요.";
  }
  // console.log(filteredAndSortedData);

  // DataProps.summary_data 에서 뽑아올 키들 + top-level 키
  const METRIC_KEYS = [
    "score", // Hot Score
    "avg_views_per_hour", // 시간당 조회수
    // "category_relative_views_pct", // 섹션 대비 조회↑
    "relative_sub_norm_pct", // 구독자당 조회↑
    "like_rate_pct", // 좋아요율
    "comment_rate_pct", // 댓글율
  ] as const;
  type MetricKey = (typeof METRIC_KEYS)[number];

  // 1) useMemo에서 metricRankings 생성 시
  const metricRankings = useMemo<MetricRankings>(() => {
    const rankings = {} as MetricRankings;

    // 'score' 제외
    const auxKeys = METRIC_KEYS.filter((k) => k !== "score");

    auxKeys.forEach((key) => {
      // 각 지표별 값으로 내림차순 정렬한 video_id 배열 생성
      const sorted = [...filteredAndSortedData]
        .sort((a, b) => {
          const aVal = (a.summary_data as any)[key] ?? (a as any)[key];
          const bVal = (b.summary_data as any)[key] ?? (b as any)[key];
          return bVal - aVal;
        })
        .map((v) => v.video_id);
      rankings[key] = sorted;
    });

    rankings.score = filteredAndSortedData
      .slice()
      .sort((a, b) => {
        const aScore =
          typeof a.score === "number"
            ? a.score
            : (a.summary_data?.score as number | undefined) ?? 0;
        const bScore =
          typeof b.score === "number"
            ? b.score
            : (b.summary_data?.score as number | undefined) ?? 0;
        return bScore - aScore;
      })
      .map((v) => v.video_id);

    return rankings;
  }, [filteredAndSortedData]);

  // 3) Hot Score 순위 계산 (높을수록 인기)
  const scoreRanking = useMemo(
    () => filteredAndSortedData.map((v) => v.video_id),
    [filteredAndSortedData]
  );

  const user = useRecoilValue(userState);
  const handleCardClick = useCallback(
    (videoId: string) => {
      logCtaClick(
        "recommend_card_click",
        user?.id,
        user?.email,
        getOrCreateAnonId()
      );
      router.push(`/detail/${videoId}`);
    },
    [router, user?.email, user?.id]
  );

  const renderSlotPhaseBadge = useCallback(
    (phase?: StockFeedSlotPhase | null) => {
      if (!isMoneySection || !phase) return null;
      const meta = SLOT_PHASE_META[phase];
      const palette = SLOT_PHASE_COLORS[phase];
      if (!meta || !palette) return null;
      return (
        <SlotPhaseBadge $bg={palette.bg} $color={palette.color}>
          {meta.short}
          <BadgeLabel>{meta.label}</BadgeLabel>
        </SlotPhaseBadge>
      );
    },
    [isMoneySection]
  );

  const buildSlotMetricRankings = useCallback(
    (items: DataProps[]): MetricRankings => {
      const rankings = {} as MetricRankings;
      const auxKeys = METRIC_KEYS.filter((k) => k !== "score");
      auxKeys.forEach((key) => {
        rankings[key] = items
          .slice()
          .sort((a, b) => {
            const aVal =
              (a.summary_data as any)?.[key] ?? (a as any)?.[key] ?? -Infinity;
            const bVal =
              (b.summary_data as any)?.[key] ?? (b as any)?.[key] ?? -Infinity;
            return Number(bVal) - Number(aVal);
          })
          .map((video) => video.video_id);
      });
      rankings.score = items
        .slice()
        .sort((a, b) => {
          const aScore =
            typeof a.score === "number"
              ? a.score
              : (a.summary_data?.score as number | undefined) ?? 0;
          const bScore =
            typeof b.score === "number"
              ? b.score
              : (b.summary_data?.score as number | undefined) ?? 0;
          return bScore - aScore;
        })
        .map((video) => video.video_id);
      return rankings;
    },
    []
  );

  const renderVideoCard = useCallback(
    (item: DataProps, slotMetricRanks?: MetricRankings) => {
      const ranks = slotMetricRanks ?? metricRankings;
      const rawHotScore =
        typeof item.score === "number"
          ? item.score
          : (item.summary_data?.score as number | undefined);
      const displayHotScore =
        getDisplayHotScore(rawHotScore) ?? item.summary_data.score;
      const auxKeys = METRIC_KEYS.filter((k) => k !== "score") as AuxKey[];
      const bestKey = auxKeys.reduce(
        (best, key) =>
          (ranks[key]?.indexOf(item.video_id) ?? Infinity) <
          (ranks[best]?.indexOf(item.video_id) ?? Infinity)
            ? key
            : best,
        auxKeys[0]
      );
      const auxRankIndex = ranks[bestKey]?.indexOf(item.video_id) ?? -1;
      const auxRankLabel =
        auxRankIndex >= 0 ? `${auxRankIndex + 1}위` : "순위 확인 중";
      const hotRankIndex = ranks.score?.indexOf(item.video_id) ?? -1;
      const hotRankLabel = hotRankIndex >= 0 ? ` · ${hotRankIndex + 1}위` : "";
      const { icon: metricIcon, name: metricName } = metricMeta[bestKey];
      const badgeItems = [
        displayHotScore != null ? (
          <MetricBadge key="hot" bg="#EAF4FF" color="#007BFF">
            🔥 Hot Score {displayHotScore}
            {hotRankLabel}
          </MetricBadge>
        ) : null,
        <MetricBadge key="aux" bg="#EAF4FF" color="#007BFF">
          {metricIcon} {metricName} {auxRankLabel}
        </MetricBadge>,
      ].filter(Boolean);

      return (
        <Card
          key={item.video_id}
          onClick={() => handleCardClick(item.video_id)}
        >
          <MetricsContainer>{badgeItems}</MetricsContainer>
          <VideoItem onClick={() => handleCardClick(item.video_id)}>
            <ThumbWrapper>
              <Thumbnail src={item.thumbnail} />
            </ThumbWrapper>
            <Info>
              <VideoTitle>
                {removeMarkTags(item.summary_data.headline_title)}
              </VideoTitle>
              <Meta>{removeMarkTags(item.summary_data.short_summary)}</Meta>
            </Info>
          </VideoItem>
          <ChannelFooter>
            <ChannelThumb src={item.channel_details.channel_thumbnail} />
            <ChannelInfo>
              <ChannelName>{item.channel_details.channel_name}</ChannelName>
              <ChannelMeta>
                {parseSubscribersCount(
                  item.channel_details.channel_subscribers
                )}{" "}
                · {timeAgoUTC(item.upload_date)}
              </ChannelMeta>
            </ChannelInfo>
          </ChannelFooter>
          {item.summary_data.comment_social_proof?.comment?.trim() ? (
            <CommentSection>
              <Comment>
                <CommentIcon>💬</CommentIcon>
                <CommentText>
                  {item.summary_data.comment_social_proof.comment}
                </CommentText>
              </Comment>
            </CommentSection>
          ) : null}
        </Card>
      );
    },
    [handleCardClick, renderSlotPhaseBadge, getDisplayHotScore, metricRankings]
  );

  const topVideosList = useMemo(() => {
    return (
      <VideoList>{topVideos.map((item) => renderVideoCard(item))}</VideoList>
    );
  }, [topVideos, renderVideoCard]);

  const hasSlotTimeline = isMoneySection && slotSections.length > 0;

  const moneySlotBlocks = useMemo(() => {
    if (!hasSlotTimeline) return null;
    const nowMinutes = getKstMinutes(new Date());

    const sortByScore = (items: DataProps[]) =>
      items.slice().sort((a, b) => {
        const aScore =
          typeof a.score === "number"
            ? a.score
            : (a.summary_data?.score as number | undefined) ?? 0;
        const bScore =
          typeof b.score === "number"
            ? b.score
            : (b.summary_data?.score as number | undefined) ?? 0;
        return bScore - aScore;
      });

    const groups = slotSections
      .map((section) => {
        const primarySectionLabel =
          section.items[0]?.section ?? section.label;
        const emoji = SLOT_EMOJI[section.slot] ?? "🎯";
        const slotInfo = getSlotLabelInfo(section.slot as BriefingSlot);
        const slotLabelMeta = resolveInsightSlotCopy(
          primarySectionLabel ?? section.label,
          slotInfo
        );
        const sortedItems = sortByScore(section.items);
        const highlightItems =
          section.slot === "slot3"
            ? sortedItems.filter(
                (item) => item.is_new && item.detected_slots?.slot_1730
              )
            : [];
        const mainItems =
          highlightItems.length > 0
            ? sortedItems.filter((item) => !highlightItems.includes(item))
            : sortedItems;
        const metricRanks = buildSlotMetricRankings(mainItems);
        const highlight = (() => {
          if (highlightItems.length === 0) return null;
          const info = DETECTED_SLOT_MAP["slot_1730"];
          const diff =
            (nowMinutes - info.minutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
          return {
            title: `${formatMinutesAgo(diff)} 진입`,
            subtitle: `${info.label} · 신규 진입`,
            items: highlightItems,
            metricRanks: buildSlotMetricRankings(highlightItems),
          };
        })();
        return {
          section,
          sortedItems: mainItems,
          metricRanks,
          highlight,
          emoji,
          badgeTitle: slotLabelMeta?.title ?? slotInfo.title,
          badgeSubtitle: slotLabelMeta?.description ?? slotInfo.description,
          category: primarySectionLabel,
        };
      })
      .filter(
        (entry) => entry.sortedItems.length > 0 || entry.highlight !== null
      )
      .sort((a, b) => b.section.priority - a.section.priority);

    if (groups.length === 0) return null;

    return groups.flatMap((entry) => {
      const nodes: ReactNode[] = [];
      if (entry.highlight) {
        nodes.push(
          <MoneySectionBlock
            key={`slot-${entry.section.slot}-${entry.section.label}-highlight`}
          >
            <SectionBadgeBlock
              emoji="✳️"
              title={entry.highlight.title}
              subtitle={entry.highlight.subtitle}
              category={entry.category}
            />
            <EditorContainer>
              {entry.highlight.items.slice(0, 5).map((item) =>
                renderVideoCard(item, entry.highlight!.metricRanks)
              )}
            </EditorContainer>
          </MoneySectionBlock>
        );
      }
      if (entry.sortedItems.length > 0) {
        nodes.push(
          <MoneySectionBlock
            key={`slot-${entry.section.slot}-${entry.section.label}`}
          >
            <SectionBadgeBlock
              emoji={entry.emoji}
              title={entry.badgeTitle}
              subtitle={entry.badgeSubtitle}
              category={entry.category}
            />
            <EditorContainer>
              {entry.sortedItems.slice(0, 5).map((item) =>
                renderVideoCard(item, entry.metricRanks)
              )}
            </EditorContainer>
          </MoneySectionBlock>
        );
      }
      return nodes;
    });
  }, [
    hasSlotTimeline,
    slotSections,
    renderVideoCard,
    buildSlotMetricRankings,
  ]);
  const generalDetectedBlocks = useMemo(() => {
    if (isMoneySection) return null;
    const nowMinutes = getKstMinutes(new Date());
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        minutes: number;
        relativeLabel: string;
        items: DataProps[];
      }
    >();

    filteredAndSortedData.forEach((item) => {
      const hasDetectedSlot =
        item.detected_slots && Object.values(item.detected_slots).some(Boolean);
      if (!item.is_new && !hasDetectedSlot) return;
      const info = getLatestDetectedSlot(item.detected_slots);
      if (!info) return;
      const diff =
        (nowMinutes - info.minutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      const relativeLabel = formatMinutesAgo(diff);
      const group = groups.get(info.key) ?? {
        key: info.key,
        label: info.label,
        minutes: info.minutes,
        relativeLabel,
        items: [],
      };
      group.items.push(item);
      groups.set(info.key, group);
    });

    if (groups.size === 0) return null;

    const entries = Array.from(groups.values()).sort(
      (a, b) => b.minutes - a.minutes
    );

    return entries.map((entry) => (
      <MoneySectionBlock key={`detected-${entry.key}`}>
        <SectionBadgeBlock
          emoji="⏱"
          title={`${entry.relativeLabel} 진입`}
          subtitle={`${entry.label} · 신규 진입`}
          category={section}
        />
        <EditorContainer>
          {entry.items
            .sort((a, b) => {
              const aScore =
                typeof a.score === "number"
                  ? a.score
                  : (a.summary_data?.score as number | undefined) ?? 0;
              const bScore =
                typeof b.score === "number"
                  ? b.score
                  : (b.summary_data?.score as number | undefined) ?? 0;
              return bScore - aScore;
            })
            .slice(0, 5)
            .map((item) => renderVideoCard(item))}
        </EditorContainer>
      </MoneySectionBlock>
    ));
  }, [filteredAndSortedData, isMoneySection, renderVideoCard, section]);

  const generalPersistingBlock = useMemo(() => {
    if (isMoneySection) return null;
    const items = filteredAndSortedData.filter((item) => {
      const hasDetectedSlot =
        item.detected_slots && Object.values(item.detected_slots).some(Boolean);
      return !item.is_new && !hasDetectedSlot;
    });
    if (items.length === 0) return null;
    return (
      <MoneySectionBlock key="persisting-general">
        <SectionBadgeBlock
          emoji="🔥"
          title="계속 상위권 유지 중인 영상"
          subtitle="어제·오늘 TOP5를 꾸준히 지키는 카드"
          category={section}
        />
        <EditorContainer>
          {items.slice(0, 5).map((item) => renderVideoCard(item))}
        </EditorContainer>
      </MoneySectionBlock>
    );
  }, [filteredAndSortedData, isMoneySection, renderVideoCard, section]);

  const slotBlocks =
    (() => {
      if (moneySlotBlocks) return moneySlotBlocks;
      const generalBlocks: ReactNode[] = [];
      if (generalDetectedBlocks) generalBlocks.push(...generalDetectedBlocks);
      if (generalPersistingBlock) generalBlocks.push(generalPersistingBlock);
      if (generalBlocks.length > 0) return generalBlocks;
      return null;
    })() ?? topVideosList;

  if (loading) {
    return (
      <Container $isUnsubscribed={isUnsubscribedSection}>
        <LoadingState>
          <LoadingSpinner />
          <span>추천 영상을 불러오는 중입니다…</span>
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container $isUnsubscribed={isUnsubscribedSection}>
      {pathname.includes("/studio") ? (
        <>
          <Header>
            <SectionTitle>🔥 오늘의 {section} TOP5 영상</SectionTitle>
            <TimerWrapper>
              {/* <TimerIcon>👀</TimerIcon>
              <span>다음 업데이트까지</span> */}
              <CountdownTimer />
            </TimerWrapper>
          </Header>

          {slotBlocks}
        </>
      ) : pathname.includes("/detail") ? (
        <>
          <Header>
            <SectionTitle>🔥 오늘의 {section} TOP5 영상</SectionTitle>
            <TimerWrapper>
              {/* <TimerIcon>👀</TimerIcon>
              <span>다음 업데이트까지</span> */}
              {/* <CountdownTimer /> */}
            </TimerWrapper>
          </Header>

          {/* {!hasSlotTimeline && newVideos.length > 0 ? (
            <SubSectionTitle>
              ✨ 이번 갱신에서 새롭게 진입한 영상
            </SubSectionTitle>
          ) : null} */}

          {/* <SubSectionTitle>🔥 오늘의 TOP5 영상</SubSectionTitle> */}
          {slotBlocks}
          {/* <SubContainer>
            <RecommendTitle
              dangerouslySetInnerHTML={{ __html: RECOMMEND_TITLE }}
            />
            <CountdownTimer />
          </SubContainer>
          <SubRecommendTitle>
            <span>📌 유티클 투데이란? </span> <br />
            유티클 AI 알고리즘을 통해 오늘 업로드된 {section} 영상 중 참여도
            높은 영상을 선정하여 자동 요약된 아티클로 제공합니다.
          </SubRecommendTitle>
          {filteredAndSortedData.slice(0, 4).map((item, index) => {
            const topicIcon = YOUTUBE_TOPICS.find(
              (topic) => topic.topic === item.section
            )?.icon;
            return (
              <RecommendCard
                key={index}
                icon={topicIcon}
                path="detail"
                source=""
                {...item}
              />
            );
          })}
          <ButtonContainer>
            <ServiceButton
              $variant="secondary"
              onClick={() => {
                router.push("/");
              }}
            >
              유티클 투데이 더 알아보기
            </ServiceButton>
          </ButtonContainer> */}
          {/* {matchedEditor ? (
            <>
              <SubEditorContainer>
                {!pathname.includes("/studio") ? (
                  <EditorImage
                    src={matchedEditor.image}
                    alt={matchedEditor.name}
                    isSelected={false} // 선택 여부는 필요에 따라 수정
                  />
                ) : (
                  <></>
                )}
                <EditorRecommendTitle
                  dangerouslySetInnerHTML={{ __html: EDITOR_TITLE }}
                />
              </SubEditorContainer>
              {filteredAndSortedEditorData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="editor"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/editor");
                  }}
                >
                  에디터 픽 아티클 더 알아보기
                </ServiceButton>
              </ButtonContainer>
            </>
          ) : (
            <></>
          )} */}
        </>
      ) : (
        <>
          {matchedEditor ? (
            <>
              <SubEditorContainer>
                {!pathname.includes("/studio") ? (
                  <EditorImage
                    src={matchedEditor.image}
                    alt={matchedEditor.name}
                    isSelected={false} // 선택 여부는 필요에 따라 수정
                  />
                ) : (
                  <></>
                )}
                <EditorRecommendTitle
                  dangerouslySetInnerHTML={{ __html: EDITOR_TITLE }}
                />
              </SubEditorContainer>
              {filteredAndSortedEditorData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="editor"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/editor");
                  }}
                >
                  에디터 픽 아티클 더 알아보기
                </ServiceButton>
              </ButtonContainer>
              <SubContainer>
                <RecommendTitle
                  dangerouslySetInnerHTML={{ __html: RECOMMEND_TITLE }}
                />
                <CountdownTimer />
              </SubContainer>
              <SubRecommendTitle>
                <span>📌 유티클 투데이란? </span>
                유티클 AI 알고리즘을 통해 오늘 업로드된 {section} 영상 중 참여도
                높은 영상을 선정하여 자동 요약된 아티클로 제공합니다.
              </SubRecommendTitle>
              {filteredAndSortedData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="detail"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/");
                  }}
                >
                  유티클 투데이 더 알아보기
                </ServiceButton>
              </ButtonContainer>
            </>
          ) : (
            <>
              <SubContainer>
                <RecommendTitle
                  dangerouslySetInnerHTML={{ __html: RECOMMEND_TITLE }}
                />
                <CountdownTimer />
              </SubContainer>
              <SubRecommendTitle>
                <span>📌 유티클 투데이란? </span>
                <br />
                유티클 AI 알고리즘을 통해 오늘 업로드된 {section} 영상 중 참여도
                높은 영상을 선정하여 자동 요약된 아티클로 제공합니다.
              </SubRecommendTitle>
              {filteredAndSortedData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="detail"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/");
                  }}
                >
                  유티클 투데이 더 알아보기
                </ServiceButton>
              </ButtonContainer>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default Recommend;

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
      {category ? (
        <SectionBadgeCategory>{category}</SectionBadgeCategory>
      ) : null}
      {chip ? <SectionBadgeChip>{chip}</SectionBadgeChip> : null}
    </SectionBadgeTitle>
    {subtitle ? <SectionBadgeSubtitle>{subtitle}</SectionBadgeSubtitle> : null}
  </SectionBadge>
);

// Add the prop type for $isUnsubscribed
// const Container = styled.div<{ $isUnsubscribed: boolean }>`
//   margin-top: ${"100px"};
// `;

const SubContainer = styled.div`
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  padding-top: 32px;
  margin-top: 72px;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 16px;
  color: #475569;
  font-size: 15px;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  animation: ${spin} 0.9s linear infinite;
`;

const SubEditorContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const EditorRecommendTitle = styled.div`
  align-items: center;
  font-size: 16px;
  font-weight: 400;
  line-height: 132%;
  margin-left: 16px;
  .highlight {
    font-weight: 700;
    color: black;
  }
`;

const RecommendTitle = styled.div`
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 32px;
  line-height: 132%;
  .highlight {
    font-weight: 700;
    color: black;
  }
`;

const SubRecommendTitle = styled.div`
  font-size: 14px;
  margin-bottom: 32px;
  line-height: 132%;
  span {
    font-weight: 700;
  }
`;

const EditorImage = styled.img<{ isSelected: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-bottom: 8px;
  border: ${({ isSelected }) =>
    isSelected
      ? "2px solid #007bff"
      : "2px solid #ddd"}; /* 선택된 경우 파란색 테두리 */
  transition: border 0.3s ease-in-out;
`;

const ServiceButton = styled.button<{ $variant?: string }>`
  width: 100%;
  height: ${({ $variant }) =>
    $variant === "secondary"
      ? "52px"
      : $variant === "secondaryBlack"
      ? "60px"
      : "60px"};
  background-color: ${({ $variant }) =>
    $variant === "secondary"
      ? "#fff"
      : $variant === "secondaryBlack"
      ? "#000"
      : "#007bff"};
  color: ${({ $variant }) =>
    $variant === "secondary"
      ? "#007bff"
      : $variant === "secondaryBlack"
      ? "#fff"
      : "#fff"};
  border: ${({ $variant }) =>
    $variant === "secondary"
      ? "1px solid #007bff"
      : $variant === "secondaryBlack"
      ? ""
      : ""};
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  margin-top: ${({ $variant }) =>
    $variant === "secondary"
      ? "0px"
      : $variant === "secondaryBlack"
      ? "20px"
      : "0px"};
  margin-bottom: ${({ $variant }) =>
    $variant === "secondary"
      ? "20px"
      : $variant === "secondaryBlack"
      ? "20px"
      : "0px"};
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 100px;
`;
const Container = styled.div<{ $isUnsubscribed: boolean }>`
  margin: 24px auto;
  /* padding: 0 16px; */
  max-width: 500px;
`;

const Header = styled.div`
  /* background: #fff; */
  border-radius: 8px;
  padding: 32px 16px 8px 16px;
  display: flex;
  /* align-items: center; */
  justify-content: space-between;
  gap: 16px; // 아이템 간 간격 확보
  margin-bottom: 24px;
  /* box-shadow: -1px 2px 4px 4px rgba(0, 0, 0, 0.05); */
  /* flex 아이템이 최소 너비를 0으로 가질 수 있도록 해야 텍스트가 잘립니다 */
  min-width: 0;
  flex-direction: column;
  background: #f9f9f9;
`;

const SectionTitle = styled.h2`
  flex: 1 1 auto; // 남은 공간 모두 차지
  min-width: 240px; // flex-shrink 시 최소 너비 제한 해제+
  font-size: 18px;
  font-weight: 700;
  color: #222;
  white-space: nowrap; // 한 줄로 고정
  overflow: hidden;
  text-overflow: ellipsis; // 말줄임표 처리
`;

const TimerWrapper = styled.div`
  display: flex;
  flex-shrink: 0; // 크기가 줄어들지 않도록
  /* align-items: center; */
  gap: 8px;
  background: #f9f9f9;
  /* padding: 16px; */
  margin-top: 20px;
  border-radius: 8px;
  flex-direction: column;
`;

const TimerIcon = styled.span`
  font-size: 16px;
`;

const VideoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MoneySectionBlock = styled.section`
  /* padding: 20px; */
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  margin-bottom: 24px;
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

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VideoItem = styled.li`
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  /* border-bottom: 1px solid #eee; */
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
`;

const ThumbWrapper = styled.div`
  flex: 0 0 120px;
  margin-right: 12px;
  min-width: 148px;
`;

const Thumbnail = styled.img`
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 4px;
`;

// const Info = styled.div`
//   flex: 1;
// `;

const VideoTitle = styled.p`
  font-size: 16px;
  font-weight: 600;
  line-height: 1.32;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 6px;
`;

const Meta = styled.div`
  font-size: 13px;
  line-height: 1.32;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 최대 5줄 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(60, 60, 61);
  text-overflow: ellipsis;
`;

const MetricsContainer = styled.div`
  display: flex;
  /* padding: 8px;
  border-radius: 8px;
  min-width: 80px;
  margin-top: 12px; */
`;

const SubSectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 24px 0 8px;
`;

const MetricBadge = styled.span<{ bg?: string; color?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${({ bg }) => bg};
  color: ${({ color }) => color};
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  /* margin-bottom: 8px; */
  margin-left: 4px;
`;
const BadgeLabel = styled.span`
  margin-left: 4px;
  font-size: 10px;
  font-weight: 400;
  opacity: 0.7;
`;

const SlotPhaseBadge = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: 12px;
  font-weight: 600;
`;
const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// 카드 하단 채널 정보 래퍼
const ChannelFooter = styled.div`
  display: flex;
  align-items: center;
  /* margin-top: auto;  */
  /* padding-top: 12px;
  border-bottom: 1px solid #eee; */
`;

const ChannelThumb = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
`;

const ChannelInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #222;
  line-height: 1.2;
`;

const ChannelMeta = styled.span`
  font-size: 12px;
  color: #666;
  line-height: 1.2;
  margin-top: 2px;
`;
const CommentSection = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  display: flex;
  align-items: center;
`;

const Comment = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between; /* 본문과 좋아요 카운트 사이 간격 확보 */
`;

const CommentIcon = styled.span`
  margin-right: 8px;
  font-size: 13px;
`;

const CommentText = styled.span`
  flex: 1; /* 본문이 길어져도 자리를 차지하도록 */
  font-size: 13px;
  color: #000;
  line-height: 1.4;
  margin-right: 8px;

  /* ─── 2줄 클램프 ─── */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LikeCount = styled.span`
  font-size: 13px;
  color: #888;
`;

const Card = styled.li`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.08);
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
`;
