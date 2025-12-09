"use client"; // 클라이언트 컴포넌트임을 명시

import { useRouter, usePathname } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { useSetRecoilState } from "recoil";
import { detailDataState } from "@/store/detailData";
import { DataProps, StockFeedSlotPhase, StockMention } from "@/types/dataProps";
import {
  parseSubscribersCount,
  timeAgo,
  removeMarkTags,
  parseVideoCountcribersCount,
  timeAgoUTC,
} from "@/utils/formatter";
import LikeIcon from "@/assets/like_icon.svg";
import ViewIcon from "@/assets/view_icon.svg";
import { useEffect, useMemo, useState, MouseEvent } from "react";
import type { ReactNode } from "react";

interface TopicCardProps extends DataProps {
  icon: ReactNode;
  subjects: string[]; // 구독 키워드 전달
  metricLabel: string;
  metricValue: number;
  metricIcon: string;
  rank: number;
  showTopicLabel?: boolean;
  compactBadges?: boolean;
  slotTitle?: string;
  slotDescription?: string;
  onJumpToVideos?: () => void;
}

const YOUTUBE_TOPICS = [
  { topic: "전체", icon: "🌐" },
  { topic: "주식", icon: "📈" },
  { topic: "국내 주식", icon: "📈" },
  { topic: "해외 주식", icon: "📈" },
  { topic: "부동산", icon: "🏢" },
  { topic: "가상자산", icon: "💰" },
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


const DETECTED_SLOT_MAP: Record<string, { label: string; minutes: number }> = {
  slot_0730: { label: '07:30 선정', minutes: 7 * 60 + 30 },
  slot_0830: { label: '08:30 갱신', minutes: 8 * 60 + 30 },
  slot_1130: { label: '11:30 재랭킹', minutes: 11 * 60 + 30 },
  slot_1240: { label: '12:40 갱신', minutes: 12 * 60 + 40 },
  slot_1510: { label: '15:10 갱신', minutes: 15 * 60 + 10 },
  slot_1530: { label: '15:30 재랭킹', minutes: 15 * 60 + 30 },
  slot_1600: { label: '16:00 재랭킹', minutes: 16 * 60 },
  slot_1730: { label: '17:30 재랭킹', minutes: 17 * 60 + 30 },
  slot_1810: { label: '18:10 재랭킹', minutes: 18 * 60 + 10 },
  slot_2030: { label: '20:30 재랭킹', minutes: 20 * 60 + 30 },
  slot_2100: { label: '21:00 재랭킹', minutes: 21 * 60 },
  slot_2140: { label: '21:40 갱신', minutes: 21 * 60 + 40 },
};

const MINUTES_PER_DAY = 24 * 60;

const STOCK_SLOT_PHASE_LABELS: Record<StockFeedSlotPhase, string> = {
  baseline: "프리 마켓 1차",
  slot1: "프리 마켓 2차",
  slot2: "점심 브리핑",
  slot3: "오후 브리핑",
  slot4: "저녁 브리핑",
};

const getKstMinutes = (date: Date) => {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return (utcMinutes + 9 * 60) % MINUTES_PER_DAY;
};

const formatMinutesAgo = (diffMinutes: number) => {
  if (diffMinutes <= 0) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const hours = Math.max(1, Math.round(diffMinutes / 60));
  return `${hours}시간 전`;
};

const getLatestDetectedSlot = (
  detected?: Record<string, boolean> | null
): ({ label: string; minutes: number }) | null => {
  if (!detected) return null;
  const entries = Object.entries(detected)
    .filter(([key, value]) => value && DETECTED_SLOT_MAP[key])
    .sort(
      (a, b) =>
        DETECTED_SLOT_MAP[b[0]].minutes - DETECTED_SLOT_MAP[a[0]].minutes
    );
  if (entries.length === 0) return null;
  return DETECTED_SLOT_MAP[entries[0][0]];
};

const TopicCard = (props: TopicCardProps) => {
  const router = useRouter();
  const pathname = usePathname(); // 현재 경로 가져오기

  const setTopicState = useSetRecoilState(detailDataState);
  const {
    section,
    summary_data, // 새로운 summary_data 객체
    thumbnail,
    upload_date,
    channel_details, // 새로운 channel_details 객체
    icon,
    video_id,
    views,
    likes,
    showTopicLabel,
    compactBadges,
  } = props;
  const handleNavigate = () => {
    if (isLoading) return; // 중복 클릭 방지

    setIsLoading(true);
    setTopicState(props);

    // 현재 경로 확인 및 동적 라우팅
    console.log("Current Path:", pathname); // 현재 경로 디버깅 로그
    setTimeout(() => {
      if (pathname === "/editor") {
        router.push(`/editor/${video_id}`);
      } else {
        router.push(`/detail/${video_id}`);
      }
    }, 800); // 로딩 인터랙션을 위한 지연 (UI에서 확인 가능)
  };
  const short_summary = removeMarkTags(summary_data?.short_summary || "");
  const uploadAgo = timeAgoUTC(upload_date);
  const detectedSlotInfo = useMemo(
    () => getLatestDetectedSlot(props.detected_slots),
    [props.detected_slots]
  );
  const slotRelativeText = useMemo(() => {
    if (!detectedSlotInfo) return null;
    const nowMinutes = getKstMinutes(new Date());
    const diff =
      (nowMinutes - detectedSlotInfo.minutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    return formatMinutesAgo(diff);
  }, [detectedSlotInfo]);
  const displayScore = useMemo(() => {
    if (typeof props.score === "number" && Number.isFinite(props.score)) {
      return props.score;
    }
    if (
      typeof summary_data?.score === "number" &&
      Number.isFinite(summary_data.score)
    ) {
      return summary_data.score;
    }
    return null;
  }, [props.score, summary_data?.score]);
  const specialSections = ["주식"]; // 특정 주제 섹션 목록
  // 해당 섹션이 특정 주제인지 확인
  const isSpecialSection = specialSections.includes(section);

  // YOUTUBE_TOPICS에서 해당 섹션에 맞는 icon과 topic 가져오기
  const topicInfo = YOUTUBE_TOPICS.find((topic) => topic.topic === section);
  const isSubscribed = props.subjects.includes(section);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const [isExpanded, setIsExpanded] = useState(false);
  const newBadge = (
    <MetricBadge bg="#FFF4E5" color="#C92A2A">
      {slotRelativeText
        ? `✨ NEW · ${slotRelativeText}`
        : `✨ NEW · ${uploadAgo}`}
    </MetricBadge>
  );
  const slotPhaseLabel =
    props.slotTitle ??
    (props.stock_slot_phase
      ? STOCK_SLOT_PHASE_LABELS[props.stock_slot_phase as StockFeedSlotPhase]
      : detectedSlotInfo?.label);
  const slotMetaDescription = props.slotDescription ?? null;
  const summaryPreview =
    short_summary.length > 140 ? `${short_summary.slice(0, 140)}…` : short_summary;
  const displaySummary = isExpanded ? short_summary : summaryPreview;
  const canToggleSummary = short_summary.length > summaryPreview.length;
  const handleToggleSummary = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsExpanded((prev) => !prev);
  };
  const handleRelatedVideos = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    props.onJumpToVideos?.();
  };

  const relatedMentions: StockMention[] = useMemo(() => {
    const fromProps = Array.isArray(props.stock_mentions)
      ? props.stock_mentions
      : [];
    const fromSummary = Array.isArray(summary_data?.stock_mentions)
      ? summary_data.stock_mentions
      : [];
    return [...fromProps, ...fromSummary];
  }, [props.stock_mentions, summary_data?.stock_mentions]);

  const relatedStocks = useMemo(() => {
    return relatedMentions
      .map((mention) => mention.stock_name || mention.ticker)
      .filter((value): value is string => Boolean(value))
      .slice(0, 2);
  }, [relatedMentions]);

  const primaryTicker = relatedMentions.find((mention) => mention.ticker)?.ticker;

  const handleStockAlert = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const params = new URLSearchParams();
    if (primaryTicker) params.set("ticker", primaryTicker);
    router.push(`/subject?${params.toString()}`);
  };

  const likeRate = summary_data?.like_rate_pct;
  const likeRateText =
    typeof likeRate === "number" && Number.isFinite(likeRate)
      ? `${likeRate.toFixed(1)}%`
      : "―";
  const metricLine = `${parseVideoCountcribersCount(views)} 조회 · 👍 ${likeRateText} · ${uploadAgo}`;

  return (
    <Container onClick={handleNavigate}>
      {isLoading && (
        <LoadingOverlay>
          <Spinner />
        </LoadingOverlay>
      )}
      <CardHeader>
        {/* <MetricBadge bg="#FFF4E5" color="#302d28">
          <Value>{metrics[0].label}</Value>
        </MetricBadge> */}
        {/* {section === "주식" &&
        (summary_data?.key_points ||
          summary_data?.headline_sub_title === "") ? (
          <Title>
            {summary_data?.headline_title}
            {summary_data?.headline_sub_title}
          </Title>
        ) : (
          section !== "주식" && (
            <Title>
              {summary_data?.headline_title}
              {summary_data?.headline_sub_title}
            </Title>
          )
        )} */}
        {/* 카드 상단: 메트릭 배지 */}
        <MetricsContainer>
          {props.is_new && showTopicLabel ? (
            <PrimaryBadgeRow>
              <Section isSubscribed={isSubscribed}>
                {topicInfo?.icon}
                <span>{topicInfo?.topic || section}</span>
              </Section>
              {newBadge}
            </PrimaryBadgeRow>
          ) : null}
          <BadgeRow $compact={compactBadges}>
            {props.is_new && !showTopicLabel ? newBadge : null}
            {!props.is_new && showTopicLabel ? (
              <Section isSubscribed={isSubscribed}>
                {topicInfo?.icon}
                <span>{topicInfo?.topic || section}</span>
              </Section>
            ) : null}
            {displayScore !== null ? (
              <MetricBadge bg="#EAF4FF" color="#007BFF">
                🔥 Hot Score {displayScore}
                ↑
              </MetricBadge>
            ) : null}
            <MetricBadge bg="#EAF4FF" color="#007BFF">
              {props.metricIcon} 키워드 내 {props.metricLabel} {props.rank}위
            </MetricBadge>
          </BadgeRow>
        </MetricsContainer>

        {/* {slotPhaseLabel ? (
          <SlotMeta>
            <strong>{slotPhaseLabel}</strong>
            {slotMetaDescription ? <small>{slotMetaDescription}</small> : null}
          </SlotMeta>
        ) : null} */}

      </CardHeader>
        <BodyContainer>
          <ChannelInfoContainer>
            <Thumbnail src={thumbnail} />

          {/* <VideoInfo>
            <ViewIcon /> <span>{parseVideoCountcribersCount(views)}</span>
            <LikeIcon /> <span>{parseVideoCountcribersCount(likes)}</span>
          </VideoInfo> */}
        </ChannelInfoContainer>
        <Body>
          {isSpecialSection ? (
            <Summary>
              {summary_data?.headline_sub_title === "" ? (
                <SummaryText $expanded={isExpanded}>{displaySummary}</SummaryText>
              ) : (
                <>
                  <BodyTitle>
                    {summary_data?.headline_title}...
                    {summary_data?.headline_sub_title}
                  </BodyTitle>
                  <SummaryText $expanded={isExpanded}>{displaySummary}</SummaryText>
                </>
              )}
              {/* {canToggleSummary ? (
                <SummaryToggle type="button" onClick={handleToggleSummary}>
                  {isExpanded ? "간단히" : "더 보기"}
                </SummaryToggle>
              ) : null} */}
            </Summary>
          ) : (
            <Summary>
              <Title>{removeMarkTags(summary_data?.headline_title)}</Title>
              <SummaryText $expanded={isExpanded}>{displaySummary}</SummaryText>
              {/* {canToggleSummary ? (
                <SummaryToggle type="button" onClick={handleToggleSummary}>
                  {isExpanded ? "간단히" : "더 보기"}
                </SummaryToggle>
              ) : null} */}
            </Summary>
          )}
        </Body>
      </BodyContainer>

      {/* <MetaRow>
        <MetaBadge>{`🔥 ${props.metricLabel} ${props.rank}위`}</MetaBadge>
        {relatedStocks.length > 0 ? (
          <MetaBadge>{`⊚ 관련 종목: ${relatedStocks.join(", ")}`}</MetaBadge>
        ) : null}
      </MetaRow>
      <MetricLineText>{metricLine}</MetricLineText> */}

      <ChannelInfo>
        <ProfileImage src={channel_details.channel_thumbnail} />
        <ProfileInfo>
          <Name>{channel_details.channel_name}</Name>
          <SubsUpload>
            <Subscriber>
              {parseSubscribersCount(channel_details.channel_subscribers)}
            </Subscriber>
            <UploadTime>{timeAgoUTC(upload_date)}</UploadTime>
          </SubsUpload>
        </ProfileInfo>
      </ChannelInfo>
      {summary_data.comment_social_proof?.comment?.trim() ? (
        <CommentSection>
          <Comment>
            <CommentIcon>💬</CommentIcon>
            <CommentText>
              {summary_data.comment_social_proof.comment}
            </CommentText>
            {/* <LikeCount>
              👍🏻 {summary_data.comment_social_proof.likeCount || 0}
            </LikeCount> */}
          </Comment>
        </CommentSection>
      ) : null}
      {/* <ActionRow>
        <PrimaryActionButton type="button" onClick={handleToggleSummary}>
          핵심 요약 보기
        </PrimaryActionButton>
        <SecondaryActionButton
          type="button"
          disabled={!primaryTicker}
          onClick={handleStockAlert}
        >
          ⭐ 종목 알림
        </SecondaryActionButton>
      </ActionRow> */}
    </Container>
  );
};

export default TopicCard;

// 스타일 정의
const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e0e0e0; /* 경계 테두리 */
  border-radius: 8px; /* 둥근 모서리 */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* 그림자 추가 */
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  /* margin-left: 8px;
  margin-right: 8px; */
  &:hover {
    transform: translateY(-4px); /* 호버 시 위로 살짝 이동 */
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15); /* 호버 시 그림자 강조 */
  }
`;

/* 🛠 로딩 스타일 추가 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Spinner = styled.div`
  width: 30px;
  height: 30px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingOverlay = styled.div`
  /* background: rgba(234, 234, 234, 0.5); */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  animation: ${fadeIn} 0.3s ease-in-out;
  padding: 4px;
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
  align-items: flex-start; /* Section을 왼쪽 정렬 */
  width: 100%; /* 부모의 가로폭을 채움 */
`;

const SummaryText = styled.div<{ $expanded: boolean }>`
  font-size: 14px;
  line-height: 150%;
  display: ${({ $expanded }) => ($expanded ? "block" : "-webkit-box")};
  -webkit-line-clamp: ${({ $expanded }) => ($expanded ? "unset" : 2)};
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(60, 60, 61);
  text-overflow: ${({ $expanded }) => ($expanded ? "initial" : "ellipsis")};
  margin-top: 4px;
`;

const SummaryToggle = styled.button`
  margin-top: 6px;
  background: none;
  border: none;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
`;

const SlotMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  gap: 8px;
`;

const PrimaryActionButton = styled.button`
  background-color: #111827;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  padding: 8px 14px;
  cursor: pointer;
`;

const SecondaryActionButton = styled.button`
  background-color: #fff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  font-size: 13px;
  padding: 8px 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const BodyContainer = styled.div`
  display: flex;
  width: 100%;
`;

const SubsUpload = styled.div`
  display: flex;
`;

const Section = styled.div<{ isSubscribed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background-color: #f9fafc;
  padding: 6px 8px;
  border-radius: 4px;
  box-sizing: border-box;
  color: ${({ isSubscribed }) => (isSubscribed ? "#007BFF" : "#80858a")};
  border: 1px solid
    ${({ isSubscribed }) => (isSubscribed ? "#007BFF" : "#c4c4c4")};
  gap: 4px;
`;
const Body = styled.div`
  display: flex;
  max-width: 56%; /* Body 영역을 60%로 설정 */
  min-width: 56%;
  margin-left: 12px;
`;

const Title = styled.span`
  font-size: 18px;
  font-weight: 700;
  line-height: 132%;
  margin-top: 4px;
`;

const BodyTitle = styled.span`
  font-size: 18px;
  font-weight: 700;
  line-height: 28px;
  margin-top: -8px;
`;

const SummaryContainer = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const MetaBadge = styled.span`
  font-size: 12px;
  color: #374151;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 999px;
`;

const MetricLineText = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: #4b5563;
`;

const Divider = styled.div<{ height: string }>`
  min-height: ${(props) => props.height};
  max-height: ${(props) => props.height};

  min-width: 6px;
  max-width: 6px;
  border-radius: 100%;
  margin-top: 4px;
  background-color: #000;
`;

const SummaryContent = styled.div<{ fontSize: string }>`
  margin-left: 4px;
  font-size: ${(props) => props.fontSize};
  line-height: 120%;
  font-weight: 400;
`;

const Summary = styled.div`
  border-radius: 4px;
  /* margin-right: 12px; */
`;

const Thumbnail = styled.img`
  object-fit: cover;
  border-radius: 4px;
  width: 100%;
  height: auto;
  aspect-ratio: 140/80;
`;

const UploadTime = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
`;

const VideoInfo = styled.div`
  display: flex;
  font-size: 12px;
  align-items: center;
  margin-top: 4px;
  color: #696868;
  span {
    margin-left: 4px;
    margin-right: 8px;
  }
  svg {
    color: #696868;
  }
`;

const ChannelInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-basis: 52%; /* ChannelInfoContainer의 너비를 BodyContainer의 40%로 설정 */
  max-width: 52%;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  margin-top: 12px;
  /* margin-bottom: 24px; */
`;

const ProfileImage = styled.img`
  width: 32px;
  border-radius: 50%;
  background: rgba(217, 217, 217, 1);
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Name = styled.span`
  font-size: 14px;
  line-height: 128%;
  /* display: inline-block; */
  /* max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; */
`;

const Subscriber = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
  margin-right: 8px;
`;
const MetricsBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
`;
const Metric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Badge = styled.span`
  font-size: 10px;
  color: #555;
`;
const Value = styled.span`
  font-size: 14px;
  font-weight: bold;
`;
const CommentSection = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
`;

const Comment = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between; /* 본문과 좋아요 카운트 사이 간격 확보 */
`;

const CommentIcon = styled.span`
  margin-right: 8px;
`;

const CommentText = styled.span`
  flex: 1; /* 본문이 길어져도 자리를 차지하도록 */
  font-size: 14px;
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
  font-size: 14px;
  color: #888;
`;

const MetricsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const BadgeRow = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-wrap: ${({ $compact }) => ($compact ? "wrap" : "wrap")};
  gap: 6px;
  width: 100%;
  align-items: center;
`;

const PrimaryBadgeRow = styled(BadgeRow)`
  align-items: center;
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
  /* margin-left: 8px; */
  margin-right: 4px;
  /* margin-bottom: 8px; */
`;
