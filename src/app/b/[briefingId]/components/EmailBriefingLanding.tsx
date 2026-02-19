"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import { logCtaClick } from "@/api/apiClient";
import { userState } from "@/store/user";
import { getOrCreateAnonId, removeMarkTags } from "@/utils/formatter";
import type { DeliveryMeta } from "@/types/briefingLanding";
import type {
  EmailBriefingKeywordData,
  EmailBriefingVideoMeta,
} from "@/types/emailBriefing";
import {
  ChannelAvatarImage,
  VideoMetaRow,
  VideoMetaRowContainer,
  VideoMetaRowSubContainer,
  VideoSourceBody,
  VideoSourceCard,
  VideoSourceContainer,
  VideoSourceList,
  VideoSummaryText,
  VideoThumbnailImage,
  VideoThumbnailWrapper,
} from "./LandingDomesticStockInsightSection";

const ECONOMY_BRIEFING_INTRO =
  "최근 100일 동안 업로드된 국내·글로벌 경제 영상만으로 성장/물가/정책, 산업별 수요를 정리했습니다.";

const EMAIL_FEEDBACK_SURVEY = {
  title: "브리핑에 대한 의견을 남겨주세요!",
  description:
    "어떤 모듈을 더 강화하고 싶은지, 필요 없는 영역은 무엇인지 남겨주시면 다음 브리핑부터 바로 반영해 드릴게요.",
  ctaLabel: "내 브리핑 의견 남기기",
  ctaHref: "https://tally.so/r/NpW6vj",
  footnote: "* 구독자 피드백을 우선 반영해 템플릿을 다듬고 있어요",
};

const SUBSCRIPTION_SUMMARY_COPY =
  "유티클은 구독 키워드별로 매일 핵심 영상만 골라 요약해 드리는 AI 브리핑 서비스예요.\n현재 20개의 키워드를 운영 중이며, 관심사가 바뀌면 구독 키워드를 조정해 최신 브리핑을 받아보세요.";

interface EmailBriefingLandingProps {
  hideSummary?: boolean;
  briefing: EmailBriefingKeywordData;
  deliveryMeta: DeliveryMeta;
  standalone?: boolean;
  keywords?: string[];
}

const InlineVideoList = styled.div`
  margin-top: 16px;
`;

const InlineVideoTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const InlineVideoThumbnailFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  text-align: center;
  padding: 8px;
`;

const splitSentences = (text: string) => {
  const parts = text.split(/(?<=\.)\s+/);
  const nodes: Array<string | JSX.Element> = [];
  parts.forEach((part, idx) => {
    nodes.push(part);
    if (idx < parts.length - 1) {
      nodes.push(<br key={`br-${idx}-${part}`} />);
    }
  });
  return nodes;
};

export type EmailBriefingLayoutKey =
  | "macro"
  | "realestate"
  | "innovation"
  | "money"
  | "business"
  | "legacy";

export const resolveEmailBriefingLayout = (
  briefing: EmailBriefingKeywordData,
): EmailBriefingLayoutKey => {
  const hasMoneyLayout = Boolean(
    briefing.marketMood ||
      (briefing.themes?.length ?? 0) > 0 ||
      (briefing.tickerProfiles?.length ?? 0) > 0 ||
      (briefing.checklist?.length ?? 0) > 0,
  );
  const hasMacroLayout = Boolean(
    (briefing.macroDrivers?.length ?? 0) > 0 ||
      (briefing.macroPolicyWatch?.items?.length ?? 0) > 0 ||
      (briefing.macroSectorWatch?.length ?? 0) > 0 ||
      briefing.macroSnapshot,
  );
  const hasRealEstateLayout = Boolean(
    briefing.marketPulse ||
      (briefing.demandSupply?.length ?? 0) > 0 ||
      (briefing.policyFinanceWatch?.items?.length ?? 0) > 0 ||
      (briefing.regionalSpotlight?.length ?? 0) > 0 ||
      (briefing.riskFlags?.items?.length ?? 0) > 0 ||
      (briefing.shortTermWatch?.items?.length ?? 0) > 0,
  );
  const hasInnovationLayout = Boolean(
    briefing.techSnapshot ||
      briefing.innovationPulseSummary ||
      (briefing.modelWatch?.length ?? 0) > 0 ||
      (briefing.useCaseSpotlight?.length ?? 0) > 0 ||
      (briefing.innovationTracks?.length ?? 0) > 0 ||
      (briefing.ecosystemWatch?.length ?? 0) > 0 ||
      (briefing.infraPolicyWatch?.items?.length ?? 0) > 0 ||
      (briefing.riskEthics?.items?.length ?? 0) > 0 ||
      (briefing.nextSteps?.items?.length ?? 0) > 0,
  );
  const hasBusinessLayout = Boolean(
    (briefing.strategicMoves?.length ?? 0) > 0 ||
      (briefing.competitionWatch?.length ?? 0) > 0 ||
      (briefing.executionRisks?.items?.length ?? 0) > 0 ||
      (briefing.actionItems?.items?.length ?? 0) > 0,
  );

  if (hasMacroLayout) return "macro";
  if (hasRealEstateLayout) return "realestate";
  if (hasInnovationLayout) return "innovation";
  if (hasMoneyLayout) return "money";
  if (hasBusinessLayout) return "business";
  return "legacy";
};

const EmailBriefingLanding = ({
  briefing,
  deliveryMeta,
  standalone = true,
  keywords: providedKeywords,
  hideSummary = false,
}: EmailBriefingLandingProps) => {
  const isLandingEmbed = !standalone;
  const user = useRecoilValue(userState);
  const router = useRouter();
  const routeSearchParams = useSearchParams();
  const userEmailFromQuery =
    routeSearchParams?.get("user_email")?.trim() || undefined;
  const userEmailForLogging = userEmailFromQuery ?? user?.email ?? undefined;
  const generatedDateFromQuery =
    routeSearchParams?.get("generated_date")?.trim() || undefined;
  const userIdFromQuery = routeSearchParams?.get("user_id") ?? undefined;
  const parsedUserId = userIdFromQuery ? Number(userIdFromQuery) : NaN;
  const userIdForLogging =
    user?.id ?? (Number.isFinite(parsedUserId) ? parsedUserId : undefined);
  const [feedbackChoice, setFeedbackChoice] = useState<
    "good" | "meh" | "bad" | null
  >(null);
  const anonIdRef = useRef<string | null>(null);
  const videoObserverRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const loggedVideoViewsRef = useRef(new Set<string>());
  const loggedViewThresholdsRef = useRef<Record<string, Set<number>>>({});
  const VIDEO_VIEW_THRESHOLDS = [0.3, 0.5, 0.8];

  const layoutNavKey = useMemo(
    () => resolveEmailBriefingLayout(briefing),
    [briefing],
  );

  const ensureAnonId = useCallback(() => {
    if (anonIdRef.current) return anonIdRef.current;
    if (typeof window === "undefined") return null;
    try {
      const id = getOrCreateAnonId();
      anonIdRef.current = id;
      return id;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    ensureAnonId();
  }, [ensureAnonId]);

  type VideoInteractionAction =
    | "video_card_click"
    | `video_card_view_${number}`;

  const logVideoInteraction = useCallback(
    (action: VideoInteractionAction, videoId: string, section?: string) => {
      const anonId = ensureAnonId();
      const dateSuffix =
        (generatedDateFromQuery || deliveryMeta.displayLabel || "")?.replace(
          /[^0-9]/g,
          "",
        ) || "";
      const baseAction =
        action.startsWith("video_card_view") && layoutNavKey
          ? `${layoutNavKey}_${action}`
          : action;
      const actionWithSuffix =
        dateSuffix && action === "video_card_click"
          ? `${baseAction}_${videoId}_${dateSuffix}`
          : baseAction;
      const context: Record<string, string> = {
        video_id: videoId,
        topic: briefing.topicLabel || "",
        layout: isLandingEmbed ? "landing_embed" : "email_full",
      };
      if (section) context.section = section;
      if (layoutNavKey) context.nav_key = layoutNavKey;
      if (generatedDateFromQuery || deliveryMeta.displayLabel) {
        context.generated_date =
          generatedDateFromQuery || deliveryMeta.displayLabel || "";
      }
      void logCtaClick(
        actionWithSuffix,
        userIdForLogging,
        userEmailForLogging,
        anonId ?? undefined,
        context,
      ).catch(() => {});
    },
    [
      briefing.topicLabel,
      ensureAnonId,
      isLandingEmbed,
      layoutNavKey,
      userEmailForLogging,
      userIdForLogging,
      generatedDateFromQuery,
      deliveryMeta.displayLabel,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          const videoId = target.dataset.videoId;
          if (!videoId) return;
          const sectionKey = target.dataset.videoContext || undefined;
          const observerKey = target.dataset.observerKey || videoId;
          const ratio = entry.intersectionRatio;
          if (typeof window !== "undefined") {
            const docHeight =
              document.documentElement?.scrollHeight ||
              document.body?.scrollHeight ||
              1;
            const viewportBottom = window.scrollY + window.innerHeight;
            const elementBottom =
              window.scrollY + entry.boundingClientRect.bottom;
            const pageProgress = Math.min(1, viewportBottom / docHeight);
            const elementProgress = Math.min(1, elementBottom / docHeight);
            if (
              pageProgress >= elementProgress &&
              !loggedVideoViewsRef.current.has(observerKey)
            ) {
              loggedVideoViewsRef.current.add(observerKey);
              logVideoInteraction("video_card_view_100", videoId, sectionKey);
            }
          }
          const loggedSet =
            loggedViewThresholdsRef.current[observerKey] ?? new Set<number>();
          VIDEO_VIEW_THRESHOLDS.forEach((threshold) => {
            if (ratio >= threshold && !loggedSet.has(threshold)) {
              loggedSet.add(threshold);
              loggedViewThresholdsRef.current[observerKey] = loggedSet;
              const label = Math.round(threshold * 100);
              logVideoInteraction(
                `video_card_view_${label}` as const,
                videoId,
                sectionKey,
              );
            }
          });
        });
      },
      { threshold: VIDEO_VIEW_THRESHOLDS },
    );
    videoObserverRef.current = observer;
    Object.values(videoRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });
    return () => {
      observer.disconnect();
      videoObserverRef.current = null;
    };
  }, [logVideoInteraction]);

  const attachVideoObserver = useCallback(
    (videoId: string, section?: string, observerKeyOverride?: string) => {
      const observerKey =
        observerKeyOverride || (section ? `${section}-${videoId}` : videoId);
      return (node: HTMLDivElement | null) => {
        const prev = videoRefs.current[observerKey];
        if (prev && videoObserverRef.current) {
          videoObserverRef.current.unobserve(prev);
        }
        if (node) {
          node.dataset.videoId = videoId;
          node.dataset.videoContext = section || "";
          node.dataset.observerKey = observerKey;
          videoRefs.current[observerKey] = node;
          videoObserverRef.current?.observe(node);
        } else if (videoRefs.current[observerKey]) {
          videoObserverRef.current?.unobserve(videoRefs.current[observerKey]!);
          delete videoRefs.current[observerKey];
        }
      };
    },
    [],
  );
  const renderMarked = (text?: string | number | null) => {
    const safeText = text == null ? "" : String(text);
    const segments = safeText.split(/(<mark>.*?<\/mark>)/g).filter(Boolean);
    return segments.map((segment, idx) => {
      if (segment.startsWith("<mark>") && segment.endsWith("</mark>")) {
        const content = segment.replace(/<\/?mark>/g, "");
        return (
          <Mark key={`mark-${content}-${idx}`}>{splitSentences(content)}</Mark>
        );
      }
      return <span key={`text-${idx}`}>{splitSentences(segment)}</span>;
    });
  };

  const getVideos = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => briefing.videos[id])
      .filter((video): video is EmailBriefingVideoMeta => Boolean(video));

  const renderVideoCard = (
    video: EmailBriefingVideoMeta,
    sectionContext?: string,
  ) => {
    const observerKey = sectionContext
      ? `${sectionContext}-${video.id}`
      : video.id;
    const handleClick = () => {
      logVideoInteraction("video_card_click", video.id, sectionContext);
    };
    return (
      <VideoCardObserver
        key={observerKey}
        ref={attachVideoObserver(video.id, sectionContext, observerKey)}
      >
        <VideoCard
          href={video.href}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
        >
          <VideoThumb>
            <img src={video.thumbnail} alt={video.title} loading="lazy" />
          </VideoThumb>
          <VideoBody>
            <VideoTitle>{video.title}</VideoTitle>
            <VideoMeta>
              {video.channelThumbnail ? (
                <VideoAvatar>
                  <img
                    src={video.channelThumbnail}
                    alt={video.channelName}
                    loading="lazy"
                  />
                </VideoAvatar>
              ) : null}
              <VideoChannelText>
                <strong>{video.channelName}</strong>
                {video.subscriberText ? (
                  <span>{video.subscriberText}</span>
                ) : null}
              </VideoChannelText>
            </VideoMeta>
          </VideoBody>
        </VideoCard>
      </VideoCardObserver>
    );
  };

  const renderInlineVideoCard = (
    video: EmailBriefingVideoMeta,
    idx: number,
    sectionContext?: string,
  ) => {
    const observerKey = sectionContext
      ? `${sectionContext}-${video.id}-${idx}`
      : `${video.id}-${idx}`;
    const handleClick = () => {
      logVideoInteraction("video_card_click", video.id, sectionContext);
    };
    return (
      <VideoCardObserver
        key={observerKey}
        ref={attachVideoObserver(video.id, sectionContext, observerKey)}
      >
        <VideoSourceCard
          href={video.href}
          target="_blank"
          rel="noreferrer"
          prefetch={false}
          onClick={handleClick}
        >
          <VideoSourceContainer>
            <VideoThumbnailWrapper>
              {video.thumbnail ? (
                <VideoThumbnailImage
                  src={video.thumbnail}
                  alt={video.title}
                  width={120}
                  height={68}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <InlineVideoThumbnailFallback>
                  <span>근거 영상</span>
                </InlineVideoThumbnailFallback>
              )}
            </VideoThumbnailWrapper>
            <VideoSourceBody>
              <InlineVideoTitle>{video.title}</InlineVideoTitle>
              {(() => {
                const summaryText = video.summary?.length
                  ? removeMarkTags(video.summary[0]).trim()
                  : "";
                const fallbackText = summaryText || video.subscriberText || "";
                return fallbackText ? (
                  <VideoSummaryText>{fallbackText}</VideoSummaryText>
                ) : null;
              })()}
            </VideoSourceBody>
          </VideoSourceContainer>
          {video.channelThumbnail ||
          video.channelName ||
          video.subscriberText ? (
            <VideoMetaRow>
              {video.channelThumbnail ? (
                <ChannelAvatarImage
                  src={video.channelThumbnail}
                  alt={video.channelName || "채널"}
                  width={40}
                  height={40}
                  style={{ width: 40, height: 40 }}
                />
              ) : null}
              <VideoMetaRowContainer>
                {video.channelName ? <span>{video.channelName}</span> : null}
                {video.subscriberText ? (
                  <VideoMetaRowSubContainer>
                    {video.subscriberText}
                  </VideoMetaRowSubContainer>
                ) : null}
              </VideoMetaRowContainer>
            </VideoMetaRow>
          ) : null}
        </VideoSourceCard>
      </VideoCardObserver>
    );
  };

  const renderVideoGrid = (ids?: string[], sectionContext?: string) => {
    const list = getVideos(ids);
    if (!list.length) return null;
    const limitedList = list.slice(0, 2);
    if (isLandingEmbed) {
      return (
        <InlineVideoList>
          <VideoSourceList>
            {limitedList.map((video, idx) =>
              renderInlineVideoCard(video, idx, sectionContext),
            )}
          </VideoSourceList>
        </InlineVideoList>
      );
    }
    return (
      <VideoGrid>
        {limitedList.map((video) => renderVideoCard(video, sectionContext))}
      </VideoGrid>
    );
  };

  const renderSurveyFeedbackCard = () => {
    const { title, description, ctaHref, ctaLabel, footnote } =
      EMAIL_FEEDBACK_SURVEY;
    return (
      <SurveyCtaSection>
        <SurveyCtaCard>
          <SurveyCtaBadge>FEEDBACK</SurveyCtaBadge>
          <SurveyCtaTitle>{title}</SurveyCtaTitle>
          <SurveyCtaDescription>{description}</SurveyCtaDescription>
          <SurveyCtaButton
            href={ctaHref}
            target="_blank"
            rel="noreferrer"
            prefetch={false}
            onClick={() => logFeedbackClick("email_survey_card")}
          >
            {ctaLabel}
          </SurveyCtaButton>
          <SurveyCtaFootnote>{footnote}</SurveyCtaFootnote>
        </SurveyCtaCard>
      </SurveyCtaSection>
    );
  };

  const logFeedbackClick = (origin: string) => {
    const anonId = ensureAnonId();
    const actionSuffix =
      (generatedDateFromQuery || deliveryMeta.displayLabel || "")?.replace(
        /[^0-9]/g,
        "",
      ) || "";
    const actionName = actionSuffix
      ? `briefing_feedback_click_${actionSuffix}`
      : "briefing_feedback_click";
    const context: Record<string, string> = {
      topic: briefing.topicLabel,
      origin,
    };
    if (generatedDateFromQuery || deliveryMeta.displayLabel) {
      context.generated_date =
        generatedDateFromQuery || deliveryMeta.displayLabel || "";
    }
    void logCtaClick(
      actionName,
      userIdForLogging,
      userEmailForLogging,
      anonId ?? undefined,
      context,
    ).catch(() => {});
  };

  const logFirstImpression = useCallback(
    (rating: "good" | "meh" | "bad") => {
      const sectionKey = layoutNavKey || "legacy";
      const emailKey = userEmailForLogging || "anonymous";
      const dateKey = generatedDateFromQuery || deliveryMeta.displayLabel || "";
      const videoIdentifier = `${sectionKey}:${emailKey}:${dateKey}`;
      void fetch("https://youticle.shop/editor/first-impressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoIdentifier,
          reaction: rating,
        }),
      }).catch((error) => {
        console.warn("Failed to post email inline feedback", error);
      });
    },
    [
      layoutNavKey,
      userEmailForLogging,
      generatedDateFromQuery,
      deliveryMeta.displayLabel,
    ],
  );

  const handleInlineFeedback = (rating: "good" | "meh" | "bad") => {
    setFeedbackChoice(rating);
    logFeedbackClick(`email_inline_${rating}`);
    logFirstImpression(rating);
  };

  const renderInlineFeedback = () => {
    const keywordLabel = (() => {
      const rawLabel = briefing.topicLabel?.trim();
      if (!rawLabel) return "오늘";
      const segments = rawLabel
        .split("·")
        .map((segment) => segment.trim())
        .filter(Boolean);
      const preferred = segments[segments.length - 1] || rawLabel;
      const sanitized = preferred.replace(/브리핑/g, "").trim();
      return sanitized || "오늘";
    })();
    return (
      <FeedbackSection>
        <FeedbackQuestion>
          {`오늘 ${keywordLabel} 브리핑 구성은 어땠나요?`}
        </FeedbackQuestion>
        <FeedbackActions>
          {[
            { key: "good" as const, label: "최고였어요", emoji: "😀" },
            { key: "meh" as const, label: "괜찮아요", emoji: "😐" },
            { key: "bad" as const, label: "별로였어요", emoji: "😞" },
          ].map((option) => (
            <FeedbackButton
              key={option.key}
              type="button"
              aria-label={option.label}
              $active={feedbackChoice === option.key}
              onClick={() => handleInlineFeedback(option.key)}
            >
              <span aria-hidden>{option.emoji}</span>
              <small>{option.label}</small>
            </FeedbackButton>
          ))}
        </FeedbackActions>
      </FeedbackSection>
    );
  };

  const renderSubscriptionSummary = () => {
    if (hideSummary) return null;
    const keywordsParam = routeSearchParams?.get("keywords")?.trim();
    const keywords =
      keywordsParam
        ?.split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean) ??
      (providedKeywords?.length
        ? providedKeywords
        : briefing.keywords?.length
          ? briefing.keywords
          : briefing.topicLabel
            ? [briefing.topicLabel]
            : []);
    const manageHref =
      routeSearchParams?.get("manage_href")?.trim() || "/subject/modify";
    const subscriptionCopy = SUBSCRIPTION_SUMMARY_COPY;
    if (!keywords.length && !subscriptionCopy) return null;
    return (
      <ContentCard>
        <SectionLabel>📥 내 구독 정보</SectionLabel>
        {/* <SectionHeading>현재 구독한 키워드</SectionHeading> */}
        {keywords.length ? (
          <SubscriptionList>
            {keywords.map((keyword) => (
              <SubscriptionChip key={keyword}>{keyword}</SubscriptionChip>
            ))}
          </SubscriptionList>
        ) : null}
        {subscriptionCopy ? (
          <SubscriptionDescription>{subscriptionCopy}</SubscriptionDescription>
        ) : null}
        <SubscriptionButton
          href={manageHref}
          target="_blank"
          rel="noreferrer"
          prefetch={false}
        >
          구독 키워드 변경하기
        </SubscriptionButton>
      </ContentCard>
    );
  };

  const renderStrategicMovesSection = () => {
    if (!briefing.strategicMoves?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🧭 전략적 움직임</SectionLabel>
        <SectionHeading>핵심 전략</SectionHeading>
        <DemandGrid>
          {briefing.strategicMoves.map((move, idx) => {
            const moveVideoIds = Array.from(
              new Set(
                move.narratives.flatMap(
                  (narrative) => narrative.videoIds || [],
                ),
              ),
            );
            return (
              <DemandCard key={`${move.name}-${idx}`}>
                <MacroInfoTitle>{move.name}</MacroInfoTitle>
                <SectionSubheading>무슨 일?</SectionSubheading>
                <BusinessSectionParagraph>
                  {renderMarked(move.whatHappened)}
                </BusinessSectionParagraph>
                <SectionSubheading>왜 중요한가?</SectionSubheading>
                <BusinessSectionParagraph>
                  {renderMarked(move.whyImportant)}
                </BusinessSectionParagraph>
                {move.narratives.length ? (
                  <BulletList>
                    {move.narratives.map((narrative, narrativeIdx) => (
                      <li key={`${move.name}-narrative-${narrativeIdx}`}>
                        {renderMarked(narrative.text)}
                      </li>
                    ))}
                  </BulletList>
                ) : null}
                {renderVideoGrid(moveVideoIds, "strategic_moves")}
              </DemandCard>
            );
          })}
        </DemandGrid>
      </ContentCard>
    );
  };

  const renderMoneyStrategySection = () => {
    const themes = briefing.themes ?? [];
    if (!themes.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🧭 전략적 움직임</SectionLabel>
        <SectionHeading>전략 스포트라이트</SectionHeading>
        <DemandGrid>
          {themes.map((theme, idx) => {
            const narratives = theme.narratives ?? [];
            const videoIds = Array.from(
              new Set(
                narratives.flatMap((narrative) => narrative.videoIds || []),
              ),
            );
            return (
              <DemandCard key={`${theme.name}-${idx}`}>
                <MacroInfoTitle>{theme.name}</MacroInfoTitle>
                {narratives.length ? (
                  <>
                    <SectionSubheading>핵심 내러티브</SectionSubheading>
                    <NarrativeList>
                      {narratives.map((narrative, narrativeIdx) => (
                        <li key={`${theme.name}-narrative-${narrativeIdx}`}>
                          {renderMarked(narrative.text)}
                        </li>
                      ))}
                    </NarrativeList>
                  </>
                ) : null}
                {renderVideoGrid(videoIds, "money_strategy")}
              </DemandCard>
            );
          })}
        </DemandGrid>
      </ContentCard>
    );
  };

  const renderExecutionRisksSection = () => {
    const section = briefing.executionRisks;
    if (!section?.items?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>⚠️ 실행 리스크</SectionLabel>
        <SectionHeading>{section.title || "핵심 위험 요인"}</SectionHeading>
        <MacroInfoGrid>
          {section.items.map((item, idx) => {
            const details = Array.isArray(item.detail)
              ? item.detail
              : item.detail
                ? [item.detail]
                : (item.details ?? []);
            return (
              <MacroRiskCard key={`${item.title}-${idx}`}>
                <MacroInfoTitle>{item.title}</MacroInfoTitle>
                {item.owner ? (
                  <MacroImpactBadge>{item.owner}</MacroImpactBadge>
                ) : null}
                <MacroList>
                  {details.map((line, lineIdx) => (
                    <li key={`${item.title}-exec-${lineIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </MacroList>
                {renderVideoGrid(item.videoIds, "execution_risks")}
              </MacroRiskCard>
            );
          })}
        </MacroInfoGrid>
      </ContentCard>
    );
  };

  const renderCompetitionWatchSection = () => {
    if (!briefing.competitionWatch?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>⚔️ 경쟁 구도</SectionLabel>
        <SectionHeading>핵심 경쟁 이슈</SectionHeading>
        <PolicyGrid>
          {briefing.competitionWatch.map((item, idx) => (
            <PolicyCard key={`${item.name}-${idx}`}>
              <MacroInfoTitle>{item.name}</MacroInfoTitle>
              {item.detail ? (
                <BusinessSectionParagraph>
                  {renderMarked(item.detail)}
                </BusinessSectionParagraph>
              ) : null}
              {item.signals?.length ? (
                <BulletList>
                  {item.signals.map((signal, signalIdx) => (
                    <li key={`${item.name}-signal-${signalIdx}`}>
                      {renderMarked(signal)}
                    </li>
                  ))}
                </BulletList>
              ) : null}
              {renderVideoGrid(item.videoIds, "competition_watch")}
            </PolicyCard>
          ))}
        </PolicyGrid>
      </ContentCard>
    );
  };

  const renderEvidenceGallery = (
    ids?: string[],
    options?: { title?: string; landingTitle?: string },
    sectionContext = "evidence_gallery",
  ) => {
    const list = getVideos(ids);
    if (!list.length) return null;
    if (isLandingEmbed) {
      return (
        <>
          {renderInlineFeedback()}
          <LandingEvidenceSection>
            <LandingEvidenceHeader>
              <LandingEvidenceTitle>
                {options?.landingTitle || "오늘 갱신된 TOP5 근거영상 모아보기"}
              </LandingEvidenceTitle>
            </LandingEvidenceHeader>
            <LandingEvidenceList>
              {list.map((video, idx) =>
                renderInlineVideoCard(video, idx, sectionContext),
              )}
            </LandingEvidenceList>
          </LandingEvidenceSection>
        </>
      );
    }
    return (
      <ContentCard>
        <SectionHeading>{options?.title || "근거 영상"}</SectionHeading>
        <VideoGrid>
          {list.map((video) => renderVideoCard(video, sectionContext))}
        </VideoGrid>
        {renderInlineFeedback()}
      </ContentCard>
    );
  };

  const referencedVideos =
    (briefing.topVideoIds && briefing.topVideoIds.length > 0
      ? briefing.topVideoIds
      : Object.keys(briefing.videos)) ?? [];

  const renderTickerProfiles = () => {
    if (!briefing.tickerProfiles?.length) return null;
    return briefing.tickerProfiles.map((profile, idx) => (
      <TickerCard key={`${profile.ticker || profile.companyName || idx}`}>
        <TickerHeading>
          <TickerLabel>{profile.companyName || profile.ticker}</TickerLabel>
          {profile.ticker ? <TickerBadge>{profile.ticker}</TickerBadge> : null}
        </TickerHeading>
        {profile.thesis?.length ? (
          <TickerSubheading>핵심 논지</TickerSubheading>
        ) : null}
        {profile.thesis?.length ? (
          <BulletList>
            {profile.thesis.map((line, thesisIdx) => (
              <li key={`thesis-${thesisIdx}`}>{renderMarked(line)}</li>
            ))}
          </BulletList>
        ) : null}
        {profile.signals?.length ? (
          <TickerSubheading>주요 시그널</TickerSubheading>
        ) : null}
        {profile.signals?.length ? (
          <BulletList>
            {profile.signals.map((line, signalIdx) => (
              <li key={`signal-${signalIdx}`}>{renderMarked(line)}</li>
            ))}
          </BulletList>
        ) : null}
        {renderVideoGrid(profile.videoIds, "ticker_profiles")}
      </TickerCard>
    ));
  };

  const renderRiskItems = () => {
    if (!briefing.executionRisks.items.length) return null;
    return briefing.executionRisks.items.map((item, idx) => (
      <RiskCard key={`${item.title}-${idx}`}>
        <RiskHeader>
          <MacroInfoTitle>{item.title}</MacroInfoTitle>
          {item.owner ? <RiskBadge>{item.owner}</RiskBadge> : null}
        </RiskHeader>
        <RiskList>
          {(item.details && item.details.length
            ? item.details
            : item.detail
              ? [item.detail]
              : []
          ).map((line, lineIdx) => (
            <li key={`${item.title}-detail-${lineIdx}`}>
              {renderMarked(line)}
            </li>
          ))}
        </RiskList>
        {renderVideoGrid(item.videoIds, "risk_items")}
      </RiskCard>
    ));
  };

  const renderChecklist = () => {
    if (!briefing.checklist?.length) return null;
    return briefing.checklist.map((item, idx) => (
      <ChecklistCard key={`${item.title}-${idx}`}>
        <ChecklistTitle>{item.title}</ChecklistTitle>
        <ChecklistList>
          {item.detail.map((line, lineIdx) => (
            <li key={`${item.title}-${lineIdx}`}>{renderMarked(line)}</li>
          ))}
        </ChecklistList>
      </ChecklistCard>
    ));
  };

  const renderOutroSection = () => {
    if (!briefing.outro) return null;
    const { title, description, ctaHref, ctaLabel, footnote } = briefing.outro;
    const handleCtaClick = () => {
      logFeedbackClick("email_outro");
    };
    return (
      <OutroSection>
        <OutroCard>
          <OutroBadge>FEEDBACK</OutroBadge>
          <OutroTitle>{title}</OutroTitle>
          <OutroDescription>{renderMarked(description)}</OutroDescription>
          {ctaHref && ctaLabel ? (
            <OutroButton
              href={ctaHref}
              target="_blank"
              rel="noreferrer"
              prefetch={false}
              onClick={handleCtaClick}
            >
              {ctaLabel}
            </OutroButton>
          ) : null}
          {footnote ? (
            <OutroFootnote>{renderMarked(footnote)}</OutroFootnote>
          ) : null}
        </OutroCard>
      </OutroSection>
    );
  };

  const renderTechSnapshot = () => {
    const snapshot = briefing.techSnapshot;
    if (!snapshot) return null;
    const signalEntries = [
      {
        title: "혁신 시그널",
        value: snapshot.innovationSignal,
        variant: "innovation" as const,
      },
      {
        title: "시장/수요 시그널",
        value: snapshot.marketSignal,
        variant: "market" as const,
      },
      {
        title: "정책·규제 시그널",
        value: snapshot.policySignal,
        variant: "policy" as const,
      },
    ].filter((entry) => entry.value && entry.value.trim().length > 0);

    return (
      <ContentCard>
        <SectionHeading>📊 Tech Snapshot</SectionHeading>
        {snapshot.summary ? (
          <SectionParagraph>{renderMarked(snapshot.summary)}</SectionParagraph>
        ) : null}
        {signalEntries.length ? (
          <SnapshotSignalGrid>
            {signalEntries.map((entry) => (
              <SnapshotSignalCard key={entry.title} $variant={entry.variant}>
                <SignalLabel>{entry.title}</SignalLabel>
                <SignalBody>{renderMarked(entry.value ?? "")}</SignalBody>
              </SnapshotSignalCard>
            ))}
          </SnapshotSignalGrid>
        ) : null}
      </ContentCard>
    );
  };

  const renderInnovationTracksSection = () => {
    if (!briefing.innovationTracks?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🚀 Innovation Track</SectionLabel>
        <SectionHeading>핵심 혁신 루트</SectionHeading>
        <PolicyGrid>
          {briefing.innovationTracks.map((track, idx) => {
            const videoIds = Array.from(
              new Set([
                ...(track.videoIds ?? []),
                ...track.narratives.flatMap(
                  (narrative) => narrative.videoIds ?? [],
                ),
              ]),
            );
            return (
              <PolicyCard key={`${track.name}-${idx}`}>
                <MacroInfoTitle>{track.name}</MacroInfoTitle>
                {track.provider || track.focusArea ? (
                  <TrackMeta>
                    {track.provider ? <span>{track.provider}</span> : null}
                    {track.focusArea ? (
                      <TrackFocus>{renderMarked(track.focusArea)}</TrackFocus>
                    ) : null}
                  </TrackMeta>
                ) : null}
                {track.narratives.length ? (
                  <>
                    <SectionSubheading>핵심 내러티브</SectionSubheading>
                    <NarrativeList>
                      {track.narratives.map((narrative, narrativeIdx) => (
                        <li key={`${track.name}-story-${narrativeIdx}`}>
                          {renderMarked(narrative.text)}
                        </li>
                      ))}
                    </NarrativeList>
                  </>
                ) : null}
                {track.impactMetrics?.length ? (
                  <>
                    <SectionSubheading>주요 지표</SectionSubheading>
                    <BulletList>
                      {track.impactMetrics.map((metric, metricIdx) => (
                        <li key={`${track.name}-metric-${metricIdx}`}>
                          {renderMarked(metric)}
                        </li>
                      ))}
                    </BulletList>
                  </>
                ) : null}
                {renderVideoGrid(videoIds, "innovation_tracks")}
              </PolicyCard>
            );
          })}
        </PolicyGrid>
      </ContentCard>
    );
  };

  const renderEcosystemWatchSection = () => {
    if (!briefing.ecosystemWatch?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🤝 생태계/파트너십</SectionLabel>
        <SectionHeading>핵심 협력 시그널</SectionHeading>
        <EcosystemGrid>
          {briefing.ecosystemWatch.map((item, idx) => (
            <EcosystemCard key={`${item.segment}-${idx}`}>
              <MacroInfoTitle>{item.segment}</MacroInfoTitle>
              <BulletList>
                {item.signals.map((signal, signalIdx) => (
                  <li key={`${item.segment}-signal-${signalIdx}`}>
                    {renderMarked(signal)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(item.videoIds, "ecosystem_watch")}
            </EcosystemCard>
          ))}
        </EcosystemGrid>
      </ContentCard>
    );
  };

  const renderActionItemsSection = () => {
    const section = briefing.actionItems;
    if (!section?.items?.length) return null;
    return (
      <ContentCard>
        <SectionHeading>🧭 {section.title || "실행 체크포인트"}</SectionHeading>
        <ActionGrid>
          {section.items.map((item, idx) => (
            <ActionCard key={`${item.title}-${idx}`}>
              <ActionTitleRow>
                <ChecklistTitle>{item.title}</ChecklistTitle>
                {item.owners?.length ? (
                  <ActionOwnerPill>{item.owners.join(", ")}</ActionOwnerPill>
                ) : null}
              </ActionTitleRow>
              <ChecklistList>
                {(Array.isArray(item.detail)
                  ? item.detail
                  : item.detail
                    ? [item.detail]
                    : []
                ).map((line, detailIdx) => (
                  <li key={`${item.title}-action-${detailIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </ChecklistList>
              {renderVideoGrid(item.videoIds, "action_items")}
            </ActionCard>
          ))}
        </ActionGrid>
      </ContentCard>
    );
  };

  const renderLegacyLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        {briefing.summaryBadge ? (
          <SummaryBadge>{briefing.summaryBadge}</SummaryBadge>
        ) : null}
        <HeroHeadline>{removeMarkTags(briefing.tldr.headline)}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`legacy-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderStrategicMovesSection()}

      {renderExecutionRisksSection()}
      {renderEvidenceGallery(referencedVideos, undefined, "legacy_evidence")}

      {renderOutroSection()}
    </>
  );

  const renderBusinessLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge>
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{removeMarkTags(briefing.tldr.headline)}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`business-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderStrategicMovesSection()}
      {renderCompetitionWatchSection()}
      {renderExecutionRisksSection()}
      {renderActionItemsSection()}

      {renderEvidenceGallery(referencedVideos, undefined, "business_evidence")}

      {renderOutroSection()}
    </>
  );

  const renderMoneyLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`money-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {briefing.marketMood ? (
        <ContentCard>
          <SectionHeading>🌡️ 시장 분위기</SectionHeading>
          <SectionParagraph>
            {renderMarked(briefing.marketMood.summary || "")}
          </SectionParagraph>
          <MoodSignalGrid>
            {briefing.marketMood.priceSignal ? (
              <MoodSignalCard $variant="warning">
                <p>가격 시그널</p>
                <span>{renderMarked(briefing.marketMood.priceSignal)}</span>
              </MoodSignalCard>
            ) : null}
            {briefing.marketMood.flowSignal ? (
              <MoodSignalCard $variant="info">
                <p>수급/유동성 시그널</p>
                <span>{renderMarked(briefing.marketMood.flowSignal)}</span>
              </MoodSignalCard>
            ) : null}
          </MoodSignalGrid>
        </ContentCard>
      ) : null}

      {renderMoneyStrategySection()}

      {briefing.tickerProfiles?.length ? (
        <ContentCard>
          <SectionHeading>🏅 종목 스포트라이트</SectionHeading>
          <TickerGrid>{renderTickerProfiles()}</TickerGrid>
        </ContentCard>
      ) : null}

      {briefing.executionRisks.items.length ? (
        <ContentCard>
          <SectionHeading>⚠️ 리스크</SectionHeading>
          <RiskGrid>{renderRiskItems()}</RiskGrid>
        </ContentCard>
      ) : null}

      {briefing.checklist?.length ? (
        <ContentCard>
          <SectionHeading>🔭 앞으로 2~3일 체크</SectionHeading>
          <ChecklistGrid>{renderChecklist()}</ChecklistGrid>
        </ContentCard>
      ) : null}

      {renderEvidenceGallery(referencedVideos, undefined, "money_evidence")}

      {renderOutroSection()}
    </>
  );

  const renderMacroLayout = () => {
    const driverList = briefing.macroDrivers ?? [];
    const policyItems = briefing.macroPolicyWatch?.items ?? [];
    const riskItems = briefing.macroRiskSection?.items ?? [];
    const sectorWatch = briefing.macroSectorWatch ?? [];
    const checklistItems = briefing.macroChecklist?.items ?? [];
    const videoSet = new Set<string>();
    const appendIds = (ids?: string[]) => {
      (ids ?? []).forEach((id) => {
        if (id) videoSet.add(id);
      });
    };
    driverList.forEach((driver) =>
      driver.narratives.forEach((narrative) => appendIds(narrative.videoIds)),
    );
    policyItems.forEach((item) => appendIds(item.videoIds));
    riskItems.forEach((item) => appendIds(item.videoIds));
    sectorWatch.forEach((item) => appendIds(item.videoIds));
    appendIds(briefing.topVideoIds);
    const macroVideoIds = Array.from(videoSet);

    return (
      <>
        <HeroCard>
          <HeroMeta>
            <span>{briefing.topicLabel}</span>
            {/* <HeroBadge>
              {briefing.dateBadge || deliveryMeta.displayLabel}
            </HeroBadge> */}
          </HeroMeta>
          <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
          <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
          <HeroList>
            {briefing.tldr.bullets.map((bullet, idx) => (
              <li key={`macro-tldr-${idx}`}>{renderMarked(bullet)}</li>
            ))}
          </HeroList>
        </HeroCard>

        {/* <ContentCard>
          <SectionHeading>브리핑 안내</SectionHeading>
          <SectionParagraph>{ECONOMY_BRIEFING_INTRO}</SectionParagraph>
        </ContentCard> */}

        {briefing.macroSnapshot ? (
          <ContentCard>
            <SectionLabel>🌍 거시 스냅샷</SectionLabel>
            <SectionHeading>핵심 거시 시그널</SectionHeading>
            {briefing.macroSnapshot.summary ? (
              <SectionParagraph>
                {renderMarked(briefing.macroSnapshot.summary)}
              </SectionParagraph>
            ) : null}
            <MacroSnapshotGrid>
              {briefing.macroSnapshot.growthSignal ? (
                <MacroSnapshotCard $variant="growth">
                  <MacroSnapshotLabel>성장/활동 시그널</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.growthSignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
              {briefing.macroSnapshot.inflationSignal ? (
                <MacroSnapshotCard $variant="inflation">
                  <MacroSnapshotLabel>물가/가격 압력</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.inflationSignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
              {briefing.macroSnapshot.policySignal ? (
                <MacroSnapshotCard $variant="policy">
                  <MacroSnapshotLabel>정책·금리</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.policySignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
              {briefing.macroSnapshot.liquiditySignal ? (
                <MacroSnapshotCard $variant="liquidity">
                  <MacroSnapshotLabel>유동성·수급</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.liquiditySignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
            </MacroSnapshotGrid>
          </ContentCard>
        ) : null}

        {driverList.map((driver, idx) => {
          const narrativeVideoIds = driver.narratives.flatMap(
            (narrative) => narrative.videoIds ?? [],
          );
          return (
            <ContentCard key={`${driver.name}-${idx}`}>
              <SectionLabel>📊 거시 드라이버</SectionLabel>
              <SectionHeading>
                {`#${idx + 1} · ${driver.name ?? "드라이버"}`}
              </SectionHeading>
              {driver.indicatorFocus ? (
                <SectionParagraph>
                  {renderMarked(driver.indicatorFocus)}
                </SectionParagraph>
              ) : null}
              <SectionSubheading>핵심 내러티브</SectionSubheading>
              <MacroList>
                {driver.narratives.map((narrative, narrativeIdx) => (
                  <li key={`${driver.name}-narrative-${narrativeIdx}`}>
                    {renderMarked(narrative.text)}
                  </li>
                ))}
              </MacroList>
              {renderVideoGrid(narrativeVideoIds, "macro_drivers")}
            </ContentCard>
          );
        })}

        {sectorWatch.length ? (
          <ContentCard>
            <SectionLabel>🏭 산업/지역 시그널</SectionLabel>
            <SectionHeading>핵심 산업 뷰</SectionHeading>
            <MacroInfoGrid>
              {sectorWatch.map((sector, idx) => (
                <MacroInfoCard key={`${sector.segment}-${idx}`}>
                  <MacroInfoTitle>{sector.segment}</MacroInfoTitle>
                  <MacroList>
                    {sector.signals.map((signal, signalIdx) => (
                      <li key={`${sector.segment}-signal-${signalIdx}`}>
                        {renderMarked(signal)}
                      </li>
                    ))}
                  </MacroList>
                  {renderVideoGrid(sector.videoIds, "macro_sector_watch")}
                </MacroInfoCard>
              ))}
            </MacroInfoGrid>
          </ContentCard>
        ) : null}

        {policyItems.length ? (
          <ContentCard>
            <SectionLabel>🗓️ 정책·이벤트 캘린더</SectionLabel>
            <SectionHeading>주요 일정</SectionHeading>
            <MacroInfoGrid>
              {policyItems.map((item, idx) => (
                <MacroInfoCard key={`${item.title}-${idx}`}>
                  <MacroInfoTitle>{item.title}</MacroInfoTitle>
                  {item.when ? (
                    <MacroInfoMeta>{item.when}</MacroInfoMeta>
                  ) : null}
                  <MacroList>
                    {item.detail.map((line, lineIdx) => (
                      <li key={`${item.title}-detail-${lineIdx}`}>
                        {renderMarked(line)}
                      </li>
                    ))}
                  </MacroList>
                  {renderVideoGrid(item.videoIds, "macro_policy_watch")}
                </MacroInfoCard>
              ))}
            </MacroInfoGrid>
          </ContentCard>
        ) : null}

        {riskItems.length ? (
          <ContentCard>
            <SectionLabel>⚠️ 리스크</SectionLabel>
            <SectionHeading>핵심 위험 요인</SectionHeading>
            <MacroInfoGrid>
              {riskItems.map((item, idx) => (
                <MacroRiskCard key={`${item.title}-${idx}`}>
                  <MacroInfoTitle>{item.title}</MacroInfoTitle>
                  {item.impact ? (
                    <MacroImpactBadge>{item.impact}</MacroImpactBadge>
                  ) : null}
                  <MacroList>
                    {item.detail.map((line, lineIdx) => (
                      <li key={`${item.title}-risk-${lineIdx}`}>
                        {renderMarked(line)}
                      </li>
                    ))}
                  </MacroList>
                  {renderVideoGrid(item.videoIds, "macro_risks")}
                </MacroRiskCard>
              ))}
            </MacroInfoGrid>
          </ContentCard>
        ) : null}

        {checklistItems.length ? (
          <ContentCard>
            <SectionLabel>📌 향후 체크포인트</SectionLabel>
            <SectionHeading>체크 리스트</SectionHeading>
            <ChecklistGrid>
              {checklistItems.map((item, idx) => (
                <ChecklistCard key={`${item.title}-${idx}`}>
                  <ChecklistTitle>{item.title}</ChecklistTitle>
                  <ChecklistList>
                    {item.detail.map((line, lineIdx) => (
                      <li key={`${item.title}-check-${lineIdx}`}>
                        {renderMarked(line)}
                      </li>
                    ))}
                  </ChecklistList>
                </ChecklistCard>
              ))}
            </ChecklistGrid>
          </ContentCard>
        ) : null}

        {renderEvidenceGallery(macroVideoIds, undefined, "macro_evidence")}

        {renderOutroSection()}
      </>
    );
  };

  const renderMarketPulseSection = () => {
    const pulse = briefing.marketPulse;
    if (!pulse) return null;
    const hasSignals = pulse.priceTrend || pulse.transactionTrend;
    return (
      <ContentCard>
        <SectionLabel>📌 시장 펄스</SectionLabel>
        <SectionHeading>핵심 흐름</SectionHeading>
        {pulse.summary ? (
          <PulseSummaryCard>{renderMarked(pulse.summary)}</PulseSummaryCard>
        ) : null}
        {hasSignals ? (
          <PulseHighlightGrid>
            {pulse.priceTrend ? (
              <PulseHighlightCard $variant="price">
                <SignalLabel>가격 흐름</SignalLabel>
                <SignalBody>{renderMarked(pulse.priceTrend)}</SignalBody>
              </PulseHighlightCard>
            ) : null}
            {pulse.transactionTrend ? (
              <PulseHighlightCard $variant="transaction">
                <SignalLabel>거래 흐름</SignalLabel>
                <SignalBody>{renderMarked(pulse.transactionTrend)}</SignalBody>
              </PulseHighlightCard>
            ) : null}
          </PulseHighlightGrid>
        ) : null}
      </ContentCard>
    );
  };

  const renderDemandSupplySection = () => {
    if (!briefing.demandSupply?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>⚖️ 수요·공급 포인트</SectionLabel>
        <SectionHeading>핵심 드라이버</SectionHeading>
        <DemandGrid>
          {briefing.demandSupply.map((item, idx) => (
            <DemandCard key={`${item.driver}-${idx}`}>
              <MacroInfoTitle>{item.driver}</MacroInfoTitle>
              {(item.regions?.length ?? 0) > 0 ||
              (item.propertyTypes?.length ?? 0) > 0 ? (
                <DemandMeta>
                  {item.regions?.length ? (
                    <MetaBadge>{item.regions.join(", ")}</MetaBadge>
                  ) : null}
                  {item.propertyTypes?.length ? (
                    <MetaBadge>{item.propertyTypes.join(", ")}</MetaBadge>
                  ) : null}
                </DemandMeta>
              ) : null}
              <BulletList>
                {item.impact.map((line, impactIdx) => (
                  <li key={`${item.driver}-impact-${impactIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(item.videoIds, "demand_supply")}
            </DemandCard>
          ))}
        </DemandGrid>
      </ContentCard>
    );
  };

  const renderPolicyFinanceSection = () => {
    if (!briefing.policyFinanceWatch?.items?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🏛️ 정책·자금 환경</SectionLabel>
        <SectionHeading>
          {briefing.policyFinanceWatch.title || "핵심 정책 포인트"}
        </SectionHeading>
        <PolicyGrid>
          {briefing.policyFinanceWatch.items.map((item, idx) => (
            <PolicyCard key={`${item.title}-${idx}`}>
              <MacroInfoTitle>{item.title}</MacroInfoTitle>
              <BulletList>
                {item.detail.map((line, detailIdx) => (
                  <li key={`${item.title}-policy-${detailIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(item.videoIds, "policy_finance_watch")}
            </PolicyCard>
          ))}
        </PolicyGrid>
      </ContentCard>
    );
  };

  const renderRegionalSpotlightSection = () => {
    if (!briefing.regionalSpotlight?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>📍 지역 스포트라이트</SectionLabel>
        <SectionHeading>핵심 지역 동향</SectionHeading>
        <EcosystemGrid>
          {briefing.regionalSpotlight.map((region, idx) => (
            <EcosystemCard key={`${region.region}-${idx}`}>
              <MacroInfoTitle>{region.region}</MacroInfoTitle>
              <BulletList>
                {region.story.map((line, storyIdx) => (
                  <li key={`${region.region}-story-${storyIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(region.videoIds, "regional_spotlight")}
            </EcosystemCard>
          ))}
        </EcosystemGrid>
      </ContentCard>
    );
  };

  const renderRiskFlagsSection = () => {
    if (!briefing.riskFlags?.items?.length) return null;
    return (
      <ContentCard>
        <SectionHeading>
          ⚠️ {briefing.riskFlags.title || "리스크 플래그"}
        </SectionHeading>
        <RiskGrid>
          {briefing.riskFlags.items.map((flag, idx) => (
            <RiskCard key={`${flag.title}-${idx}`}>
              <RiskHeader>
                <MacroInfoTitle>{flag.title}</MacroInfoTitle>
                {flag.probability ? (
                  <RiskBadge>{flag.probability}</RiskBadge>
                ) : null}
              </RiskHeader>
              <RiskList>
                <li>{renderMarked(flag.detail)}</li>
              </RiskList>
              {renderVideoGrid(flag.videoIds, "risk_flags")}
            </RiskCard>
          ))}
        </RiskGrid>
      </ContentCard>
    );
  };

  const renderShortTermWatchSection = () => {
    const section = briefing.shortTermWatch;
    if (!section?.items?.length) return null;
    return (
      <ContentCard>
        <SectionHeading>
          🔭 {section.title || "앞으로 2~3일 체크"}
        </SectionHeading>
        <ChecklistGrid>
          {section.items.map((item, idx) => (
            <ChecklistCard key={`${item.title}-${idx}`}>
              <ChecklistTitle>{item.title}</ChecklistTitle>
              <ChecklistList>
                {item.detail.map((line, detailIdx) => (
                  <li key={`${item.title}-watch-${detailIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </ChecklistList>
            </ChecklistCard>
          ))}
        </ChecklistGrid>
      </ContentCard>
    );
  };

  const renderInnovationLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`ai-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderTechSnapshot()}

      {!briefing.techSnapshot && briefing.innovationPulseSummary ? (
        <ContentCard>
          <SectionHeading>⚡ 핵심 동향</SectionHeading>
          <SectionParagraph>
            {renderMarked(briefing.innovationPulseSummary)}
          </SectionParagraph>
        </ContentCard>
      ) : null}

      {briefing.modelWatch?.length ? (
        <ContentCard>
          <SectionHeading>🧠 주목 모델</SectionHeading>
          <ModelGrid>
            {briefing.modelWatch.map((item, idx) => (
              <ModelCard key={`${item.modelName}-${idx}`}>
                <ModelTitle>
                  {item.modelName}
                  {item.provider ? (
                    <ProviderBadge>{item.provider}</ProviderBadge>
                  ) : null}
                </ModelTitle>
                <ModelFocus>{item.focusArea}</ModelFocus>
                <BulletList>
                  {item.implication.map((line, impIdx) => (
                    <li key={`${item.modelName}-implication-${impIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </BulletList>
                {renderVideoGrid(item.videoIds, "model_watch")}
              </ModelCard>
            ))}
          </ModelGrid>
        </ContentCard>
      ) : null}

      {briefing.useCaseSpotlight?.length ? (
        <ContentCard>
          <SectionHeading>🛠️ 산업별 활용 사례</SectionHeading>
          <UseCaseGrid>
            {briefing.useCaseSpotlight.map((useCase, idx) => (
              <UseCaseCard key={`${useCase.industry}-${idx}`}>
                <UseCaseTitle>{useCase.industry}</UseCaseTitle>
                <UseCaseSubtitle>
                  {renderMarked(useCase.problemSolved)}
                </UseCaseSubtitle>
                <BulletList>
                  {useCase.result.map((line, resultIdx) => (
                    <li key={`${useCase.industry}-result-${resultIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </BulletList>
                {renderVideoGrid(useCase.videoIds, "use_case_spotlight")}
              </UseCaseCard>
            ))}
          </UseCaseGrid>
        </ContentCard>
      ) : null}

      {renderInnovationTracksSection()}
      {renderEcosystemWatchSection()}

      {(briefing.infraPolicyWatch?.items?.length ?? 0) > 0 ? (
        <ContentCard>
          <SectionLabel>🏛️ 인프라·정책 체크</SectionLabel>
          <SectionHeading>
            {briefing.infraPolicyWatch?.title || "핵심 인프라 이슈"}
          </SectionHeading>
          <PolicyGrid>
            {briefing.infraPolicyWatch?.items.map((policy, idx) => (
              <PolicyCard key={`${policy.topic}-${idx}`}>
                <MacroInfoTitle>{policy.topic}</MacroInfoTitle>
                <SectionParagraph>
                  {renderMarked(policy.detail)}
                </SectionParagraph>
                {policy.impact ? (
                  <PolicyImpact>
                    <strong>임팩트</strong>
                    <span>{renderMarked(policy.impact)}</span>
                  </PolicyImpact>
                ) : null}
                {renderVideoGrid(policy.videoIds, "infra_policy_watch")}
              </PolicyCard>
            ))}
          </PolicyGrid>
        </ContentCard>
      ) : null}

      {(briefing.riskEthics?.items?.length ?? 0) > 0 ? (
        <ContentCard>
          <SectionHeading>
            ⚠️ {briefing.riskEthics?.title || "리스크·윤리"}
          </SectionHeading>
          <RiskGrid>
            {briefing.riskEthics?.items.map((item, idx) => (
              <RiskCard key={`${item.title}-${idx}`}>
                <RiskHeader>
                  <MacroInfoTitle>{item.title}</MacroInfoTitle>
                  {item.severity ? (
                    <RiskBadge>{item.severity}</RiskBadge>
                  ) : null}
                </RiskHeader>
                <RiskList>
                  <li>{renderMarked(item.detail)}</li>
                </RiskList>
                {renderVideoGrid(item.videoIds, "risk_ethics")}
              </RiskCard>
            ))}
          </RiskGrid>
        </ContentCard>
      ) : null}

      {renderActionItemsSection()}

      {(briefing.nextSteps?.items?.length ?? 0) > 0 ? (
        <ContentCard>
          <SectionHeading>
            🔭 {briefing.nextSteps?.title || "앞으로 2~3일 체크"}
          </SectionHeading>
          <ChecklistGrid>
            {briefing.nextSteps?.items.map((item, idx) => (
              <ChecklistCard key={`${item.title}-${idx}`}>
                <ChecklistTitle>{item.title}</ChecklistTitle>
                <ChecklistList>
                  {item.detail.map((line, detailIdx) => (
                    <li key={`${item.title}-detail-${detailIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </ChecklistList>
                {item.relatedEntities?.length ? (
                  <RelatedEntities>
                    {item.relatedEntities.join(", ")}
                  </RelatedEntities>
                ) : null}
              </ChecklistCard>
            ))}
          </ChecklistGrid>
        </ContentCard>
      ) : null}

      {renderEvidenceGallery(
        referencedVideos,
        undefined,
        "innovation_evidence",
      )}

      {renderOutroSection()}
    </>
  );

  const renderRealEstateLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`realestate-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderMarketPulseSection()}
      {renderDemandSupplySection()}
      {renderPolicyFinanceSection()}
      {renderRegionalSpotlightSection()}
      {renderRiskFlagsSection()}
      {renderShortTermWatchSection()}

      {renderEvidenceGallery(
        referencedVideos,
        { title: "🎬 근거 영상" },
        "realestate_evidence",
      )}

      {renderOutroSection()}
    </>
  );

  const renderedLayout =
    layoutNavKey === "macro"
      ? renderMacroLayout()
      : layoutNavKey === "realestate"
        ? renderRealEstateLayout()
        : layoutNavKey === "innovation"
          ? renderInnovationLayout()
          : layoutNavKey === "money"
            ? renderMoneyLayout()
            : layoutNavKey === "business"
              ? renderBusinessLayout()
              : renderLegacyLayout();

  const body = (
    <>
      {standalone ? (
        <HeaderWrapper>
          <LogoHeader onBack={() => router.push("/")} />
        </HeaderWrapper>
      ) : null}
      <EmailContent>
        {renderedLayout}
        {renderSubscriptionSummary()}
      </EmailContent>
    </>
  );

  if (standalone) {
    return (
      <EmailPage>
        <VisuallyHidden aria-hidden>{briefing.preheader}</VisuallyHidden>
        {body}
      </EmailPage>
    );
  }

  return (
    <NonStandaloneContainer>
      <VisuallyHidden aria-hidden>{briefing.preheader}</VisuallyHidden>
      {body}
    </NonStandaloneContainer>
  );
};

export default EmailBriefingLanding;

const EmailPage = styled.div`
  min-height: 100vh;
  background: #f4f6f8;
  color: #111827;
`;

const NonStandaloneContainer = styled.div`
  width: 100%;
`;

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(244, 246, 248, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`;

const EmailContent = styled.main`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR",
    sans-serif;
`;

const HeroCard = styled.section`
  background: #fff;
  border-radius: 24px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
`;

const HeroMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #475569;
  font-weight: 700;
  margin-bottom: 12px;
`;

const HeroBadge = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1d4ed8;
  font-weight: 800;
`;

const SummaryBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: #ecfccb;
  color: #365314;
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 10px;
`;

const HeroHeadline = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.4;
  color: #0f172a;
`;

const HeroList = styled.ul`
  margin: 18px 0 0;
  padding-left: 20px;
  font-size: 15px;
  line-height: 1.8;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style-type: disc;
`;

const ContentCard = styled.section`
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
`;

const SectionLabel = styled.p`
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
  color: #1d4ed8;
`;

const SectionHeading = styled.h2`
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 900;
  margin-bottom: 8px;
  color: #0f172a;
`;

const SectionSubheading = styled.p`
  margin: 16px 0 0px;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
`;

const SectionParagraph = styled.p`
  margin: 0;
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.75;
  color: #374151;
`;

const BusinessSectionParagraph = styled(SectionParagraph)`
  margin-top: 8px;
`;

const NarrativeList = styled.ul`
  /* margin: 18px 0 0; */
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const VideoGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
`;

const MacroSnapshotGrid = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 16px;
`;

const MacroSnapshotCard = styled.div<{ $variant?: string }>`
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: ${({ $variant }) => {
    if ($variant === "growth") return "#ecfccb";
    if ($variant === "inflation") return "#fee2e2";
    if ($variant === "policy") return "#dbeafe";
    if ($variant === "liquidity") return "#cffafe";
    return "#f8fafc";
  }};
`;

const MacroSnapshotLabel = styled.p`
  margin: 0 0 6px 0;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
`;

const MacroSnapshotBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
`;

const MacroList = styled.ul`
  margin: 12px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
  list-style-position: outside;
`;

const MacroInfoGrid = styled.div`
  display: grid;
  width: 100%;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  justify-items: stretch;
`;

const MacroInfoCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
`;

const MacroInfoTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
`;

const MacroInfoMeta = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: #4338ca;
`;

const MacroRiskCard = styled(MacroInfoCard)`
  background: #fff7f7;
  border-color: #fecaca;
`;

const MacroImpactBadge = styled.span`
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 12px;
  font-weight: 700;
`;

const LandingEvidenceSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background: #fff;
  padding: 20px;
  /* margin-top: 18px; */
`;

const LandingEvidenceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LandingEvidenceTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
`;

const LandingEvidenceList = styled(VideoSourceList)`
  margin-top: 4px;
`;

const VideoCardObserver = styled.div`
  display: block;
  width: 100%;
`;

const VideoCard = styled.a`
  display: flex;
  gap: 12px;
  text-decoration: none;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid transparent;
  transition: border-color 0.2s ease;
  &:hover {
    border-color: #1d4ed8;
  }
`;

const VideoThumb = styled.div`
  flex: 0 0 120px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  background: #0f172a;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const VideoBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VideoTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const VideoMeta = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const VideoAvatar = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoChannelText = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #64748b;
  strong {
    font-size: 12px;
    color: #0f172a;
  }
`;

const RiskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const OwnerBadge = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
`;

const OutroSection = styled.section`
  width: 100%;
  margin: 20px 0 0;
`;

const OutroCard = styled.div`
  width: 100%;
  border-radius: 24px;
  padding: 28px 24px 32px;
  /* text-align: center; */
  background: linear-gradient(135deg, #0f172a, #312e81);
  color: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
`;

const OutroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
`;

const OutroTitle = styled.p`
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.4;
  white-space: pre-line;
`;

const OutroDescription = styled.p`
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
`;

const OutroButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 22px;
  padding: 13px 28px;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
`;

const OutroFootnote = styled.p`
  margin: 16px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
`;

const SurveyCtaSection = styled.section`
  width: 100%;
  margin: 32px 0 0;
`;

const SurveyCtaCard = styled.div`
  width: 100%;
  border-radius: 24px;
  padding: 28px 24px 32px;
  text-align: center;
  background: linear-gradient(135deg, #0f172a, #312e81);
  color: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
`;

const SurveyCtaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
`;

const SurveyCtaTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 900;
`;

const SurveyCtaDescription = styled.p`
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
`;

const SurveyCtaButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 320px;
  margin: 22px auto 0;
  padding: 13px 28px;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
`;

const SurveyCtaFootnote = styled.p`
  margin: 16px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
`;

const FeedbackSection = styled.section`
  /* margin: 32px 0 0; */
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeedbackQuestion = styled.span`
  font-weight: 750;
  color: #1f2a4a;
`;

const FeedbackActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const FeedbackButton = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid
    ${({ $active }) => ($active ? "#0f172a" : "rgba(15, 23, 42, 0.15)")};
  background: ${({ $active }) =>
    $active ? "#0f172a" : "linear-gradient(135deg, #fff, #eef2ff)"};
  color: ${({ $active }) => ($active ? "#fff" : "#0f172a")};
  font-weight: 700;
  cursor: pointer;

  small {
    font-size: 13px;
  }
`;

const Mark = styled.span`
  background-color: #fff4cc;
  padding: 0 4px;
  border-radius: 4px;
  font-weight: 700;
`;

const VisuallyHidden = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const MoodSignalGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
`;

const MoodSignalCard = styled.div<{ $variant: "warning" | "info" }>`
  border-radius: 14px;
  padding: 14px;
  border: 1px solid
    ${({ $variant }) => ($variant === "warning" ? "#fef3c7" : "#bae6fd")};
  background: ${({ $variant }) =>
    $variant === "warning" ? "#fff7ed" : "#ecfeff"};
  p {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 800;
    color: ${({ $variant }) =>
      $variant === "warning" ? "#b45309" : "#0369a1"};
  }
  span {
    font-size: 14px;
    line-height: 1.6;
    color: #0f172a;
  }
`;

const TickerGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TickerCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const TickerHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TickerLabel = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
`;

const TickerBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 700;
`;

const TickerSubheading = styled.p`
  margin: 16px 0 6px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
`;

const BulletList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const RiskGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RiskCard = styled.div`
  border: 1px solid #fee2e2;
  border-radius: 14px;
  padding: 18px;
  background: #fff7f7;
`;

const RiskBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
`;

const RiskList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const ChecklistGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActionGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActionCard = styled.div`
  border: 1px solid #bae6fd;
  border-radius: 14px;
  padding: 18px;
  background: #f0f9ff;
`;

const ActionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const ActionOwnerPill = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
`;

const ChecklistCard = styled.div`
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 18px;
  background: #f0f9ff;
`;

const ChecklistTitle = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  color: #0f172a;
`;

const ChecklistList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const SnapshotSignalGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const SnapshotSignalCard = styled.div<{
  $variant: "innovation" | "market" | "policy";
}>`
  border-radius: 14px;
  padding: 16px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "innovation"
        ? "#c7d2fe"
        : $variant === "market"
          ? "#a7f3d0"
          : "#fde68a"};
  background: ${({ $variant }) =>
    $variant === "innovation"
      ? "#eef2ff"
      : $variant === "market"
        ? "#ecfccb"
        : "#fef9c3"};
`;

const SignalLabel = styled.p`
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 800;
  color: #312e81;
`;

const SignalBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
`;

const PulseSummaryCard = styled.div`
  margin-top: 12px;
  border-radius: 14px;
  padding: 18px;
  background: #fff7f5;
  border: 1px solid #fecaca;
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
`;

const PulseHighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const PulseHighlightCard = styled.div<{ $variant: "price" | "transaction" }>`
  border-radius: 14px;
  padding: 16px;
  border: 1px solid
    ${({ $variant }) => ($variant === "price" ? "#fef3c7" : "#bae6fd")};
  background: ${({ $variant }) =>
    $variant === "price" ? "#fefce8" : "#ecfeff"};
`;

const DemandGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DemandCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DemandMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const MetaBadge = styled.span`
  padding: 3px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #312e81;
  font-size: 12px;
  font-weight: 700;
`;

const ModelGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ModelCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const ModelTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProviderBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
`;

const ModelFocus = styled.p`
  margin: 10px 0 0;
  font-size: 14px;
  color: #64748b;
`;

const TrackMeta = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
`;

const TrackFocus = styled.span`
  font-weight: 600;
  color: #0f172a;
`;

const UseCaseGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const UseCaseCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const UseCaseTitle = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  color: #0f172a;
`;

const UseCaseSubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  color: #64748b;
`;

const PolicyGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PolicyCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const EcosystemGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EcosystemCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const PolicyImpact = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff7ed;
  border: 1px solid #fef3c7;
  font-size: 14px;
  color: #92400e;
  line-height: 148%;
  strong {
    display: block;
    font-size: 12px;
    font-weight: 800;
    color: #b45309;
    margin-bottom: 4px;
  }
`;

const RelatedEntities = styled.p`
  margin: 12px 0 0;
  font-size: 13px;
  color: #64748b;
`;

const SubscriptionList = styled.ul`
  margin: 12px 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
`;

const SubscriptionChip = styled.li`
  padding: 6px 14px;
  border-radius: 999px;
  background: #eef2ff;
  color: #312e81;
  font-size: 13px;
  font-weight: 700;
`;

const SubscriptionDescription = styled.p`
  margin: 8px 0 0;
  font-size: 15px;
  color: #000;
  line-height: 1.6;
  white-space: pre-line;
`;

const SubscriptionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  padding: 12px 24px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  font-size: 15px;
  width: 100%;
`;
