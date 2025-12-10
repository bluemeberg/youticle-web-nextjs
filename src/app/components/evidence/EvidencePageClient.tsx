"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

import LogoHeader from "@/common/LogoHeader";
import { userState } from "@/store/user";
import type { InsightSource, InsightStock } from "@/types/insight";
import type { SummaryData } from "@/types/dataProps";
import {
  buildInsightVisualization,
  StockInsightVisualization,
  type StockInsightSectionDetail,
} from "@/components/insight/StockMarketSection";
import {
  DomesticPriceSectionVisual,
  DomesticValuationSectionVisual,
  DomesticFlowSectionVisual,
  isDomesticPriceSection,
  isDomesticValuationSection,
  isDomesticFlowSection,
  buildOutlineFetchUrl,
} from "@/components/insight/DomesticStockInsightSection";
import {
  getOrCreateAnonId,
  removeMarkTags,
  timeAgo,
  parseSubscribersCount,
} from "@/utils/formatter";
import { getBriefingSlot } from "@/utils/briefingSlot";
import type { BriefingSlot } from "@/utils/briefingSlot";
import {
  getUserByEmail,
  logCtaClick,
  upsertNotificationRequest,
} from "@/api/apiClient";
import GoogleLogin from "@/common/RegisterEmailByGoogle";

interface OutlineSegment {
  start_time?: string | null;
  key_point?: string | null;
}

type OutlineEntry = { segments?: OutlineSegment[] | null } | null;

interface OutlineVideoChannel {
  channel_id?: string | null;
  channel_name?: string | null;
  subscribers?: number | null;
  thumbnail?: string | null;
}

interface OutlineVideo {
  video_id?: string | null;
  title?: string | null;
  section?: string | null;
  upload_date?: string | null;
  duration?: string | null;
  thumbnail?: string | null;
  summary?: string | null;
  summary_data?: SummaryData | null;
  channel?: OutlineVideoChannel | null;
  channel_name?: string | null;
  channel_thumbnail?: string | null;
  channel_subscribers?: number | null;
}

type OutlineStockItem = Partial<InsightStock> & {
  stock_name?: string | null;
  ticker?: string | null;
  section?: string | null;
  sources?: InsightSource[] | null;
  comment_bullets?: string[] | null;
};

interface OutlineResponseItem {
  video_id?: string | null;
  video?: OutlineVideo | null;
  item?: OutlineStockItem | null;
  outline?:
    | OutlineEntry[]
    | {
        outline?: OutlineEntry[] | null;
      }
    | null;
}

interface OutlineResponsePayload {
  outlines?: OutlineResponseItem[];
}

interface StoredEvidencePayload {
  section: string | null;
  stock: InsightStock;
}

const SECTION_KEYWORD_MAP: Record<string, string> = {
  "국내 주식": "domestic_stock",
  "해외 주식": "overseas_stock",
};

const FINANCIAL_SECTION_KEYWORDS = [
  "profitability",
  "earnings_growth",
  "earnings",
  "growth",
  "수익성",
  "성장",
  "실적",
  "재무",
  "부채",
];

const EXCLUDED_SECTION_KEYWORDS = ["stability_liquidity", "안정성", "유동성"];

const EvidencePageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useRecoilValue(userState);
  const [payload, setPayload] = useState<StoredEvidencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [outlineSegments, setOutlineSegments] = useState<
    Record<string, OutlineSegment[]>
  >({});
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<"kakao" | "email">(
    "kakao"
  );
  const [emailValue, setEmailValue] = useState(user.email ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailLinked, setEmailLinked] = useState(Boolean(user.email));
  const [alertSuccessMessage, setAlertSuccessMessage] = useState<string | null>(
    null
  );
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const queryTicker = searchParams?.get("ticker")?.trim() || null;
  const querySection = searchParams?.get("section")?.trim() || null;
  const queryName = searchParams?.get("name")?.trim() || null;
  const scheduleKey = "07_50";
  const activeSlot = useMemo(() => getBriefingSlot(new Date()), []);

  useEffect(() => {
    setEmailValue(user.email ?? "");
    setEmailLinked(Boolean(user.email));
  }, [user.email]);

  const persistPayload = useCallback((next: StoredEvidencePayload | null) => {
    setPayload(next);
    if (typeof window === "undefined") return;
    try {
      if (next) {
        window.sessionStorage.setItem("evidence:payload", JSON.stringify(next));
      } else {
        window.sessionStorage.removeItem("evidence:payload");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let canceled = false;

    const bootstrap = async () => {
      let stored: StoredEvidencePayload | null = null;
      if (typeof window !== "undefined") {
        try {
          const raw = window.sessionStorage.getItem("evidence:payload");
          stored = raw ? (JSON.parse(raw) as StoredEvidencePayload) : null;
        } catch {
          stored = null;
        }
      }

      const storedMatchesQuery =
        stored &&
        queryTicker &&
        stored.stock?.ticker &&
        stored.stock.ticker === queryTicker;

      if (stored && (!queryTicker || storedMatchesQuery)) {
        persistPayload(stored);
        setLoading(false);
        return;
      }

      if (!queryTicker) {
        persistPayload(stored);
        setLoading(false);
        return;
      }

      try {
        const fetched = await fetchEvidencePayloadByTicker({
          ticker: queryTicker,
          sectionLabel: querySection,
          stockNameFallback: queryName,
          slot: activeSlot,
        });
        if (canceled) return;
        persistPayload(fetched);
      } catch (error) {
        if (!canceled) {
          console.error("Failed to load evidence payload", error);
          persistPayload(null);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      canceled = true;
    };
  }, [persistPayload, queryTicker, querySection, queryName, activeSlot]);

  const stock = payload?.stock;
  const stockNameDisplay = stock?.stock_name ?? "관심 종목";
  const sources = stock?.sources?.filter(Boolean) ?? [];
  const sectionLabel = payload?.section ?? "";
  const sectionDescription = sectionLabel
    ? `${sectionLabel} TOP5 영상`
    : "국내·해외 주식 TOP5 영상";
  const backTargetHref = (() => {
    const section = payload?.section?.trim() ?? "";
    const keyword = SECTION_KEYWORD_MAP[section];
    return keyword ? `/?keyword=${keyword}` : "/";
  })();

  const handleNavigateBack = () => router.push(backTargetHref);

  const openAlertModal = (channel: "kakao" | "email" = "kakao") => {
    setSelectedChannel(channel);
    if (channel === "email" && !emailLinked && user.email) {
      setEmailValue(user.email);
    }
    if (channel === "email") {
      setEmailError(null);
    } else {
      setPhoneValue("");
      setPhoneError(null);
    }
    setAlertSuccessMessage(null);
    setAlertModalOpen(true);
  };

  const closeAlertModal = () => setAlertModalOpen(false);

  const handleChannelSelect = (channel: "kakao" | "email") => {
    setSelectedChannel(channel);
    if (channel === "email") {
      if (!emailLinked && user.email) {
        setEmailValue(user.email);
      }
      setEmailError(null);
    } else {
      setEmailError(null);
      setPhoneError(null);
    }
  };

  const handleConversionClick = (channel: "kakao" | "email") => {
    openAlertModal(channel);
    void logCtaClick(
      channel === "kakao"
        ? "evidence_conversion_kakao"
        : "evidence_conversion_email",
      user?.id,
      stock?.stock_name,
      getOrCreateAnonId()
    ).catch(() => {});
  };

  const handleEmailLoginSuccess = async (loginUser: {
    email?: string | null;
    displayName?: string | null;
  }) => {
    const email = loginUser?.email?.trim();
    if (!email) {
      setEmailError("구글 계정 이메일을 확인하지 못했습니다.");
      return;
    }
    setEmailValue(email);
    setEmailLinked(true);
    setEmailError(null);
    logCtaClick(
      "evidence_email_login_success",
      user?.id,
      email,
      getOrCreateAnonId()
    ).catch(() => {});
    try {
      await getUserByEmail(email, loginUser?.displayName ?? "");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAlertConfirm = () => {
    if (alertSubmitting) return;
    const digits = phoneValue.replace(/\D/g, "");
    if (selectedChannel === "kakao") {
      if (!(digits.length === 10 || digits.length === 11)) {
        setPhoneError("전화번호는 숫자 10자리 또는 11자리여야 합니다.");
        return;
      }
      setPhoneError(null);
    }
    if (selectedChannel === "email") {
      const trimmed = emailValue.trim();
      if (!trimmed || !emailLinked) {
        setEmailError("구글 계정 연동을 완료해 주세요.");
        return;
      }
      setEmailError(null);
    }
    const normalizedSectionLabel = sectionLabel?.trim() ?? "";
    const sectionKey = SECTION_KEYWORD_MAP[normalizedSectionLabel];
    setAlertSubmitting(true);
    void logCtaClick(
      "alert_modal_confirm",
      user?.id,
      `${stock?.ticker ?? "unknown"}:${selectedChannel}`,
      getOrCreateAnonId()
    ).catch(() => {});
    const payload = {
      anon_id: getOrCreateAnonId(),
      user_id: user?.id,
      phone: selectedChannel === "kakao" ? digits : undefined,
      schedule: scheduleKey,
      channel_name: selectedChannel,
      section_key: sectionKey,
    };
    void upsertNotificationRequest(payload)
      .then(() => {
        setAlertModalOpen(false);
        setAlertSubmitting(false);
        setAlertSuccessMessage(
          selectedChannel === "kakao"
            ? "카카오톡 알림 신청이 완료되었습니다. 입력하신 번호로 요약을 보내드릴게요."
            : `${emailValue}로 알림을 보내드릴게요.`
        );
        if (selectedChannel === "kakao") {
          setPhoneValue("");
        }
      })
      .catch((error) => {
        console.error(error);
        setAlertSubmitting(false);
        alert("알림 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      });
  };

  const stockTicker = stock?.ticker ?? null;

  useEffect(() => {
    if (!stockTicker) {
      setOutlineSegments({});
      return;
    }
    let canceled = false;
    const fetchOutlines = async () => {
      try {
        const requestUrl = buildOutlineFetchUrl(stockTicker, {
          slot: activeSlot,
          refresh: false,
        });
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!canceled) setOutlineSegments({});
          return;
        }
        const data = (await res.json()) as OutlineResponsePayload;
        if (canceled) return;
        const map: Record<string, OutlineSegment[]> = {};
        data.outlines?.forEach((item) => {
          const videoId = item.video_id ?? item.video?.video_id ?? null;
          if (!videoId) return;
          const outlineEntries = extractOutlineEntries(item);
          const segments = outlineEntries
            ?.flatMap((entry) => entry?.segments ?? [])
            .filter((segment): segment is OutlineSegment => Boolean(segment))
            .filter(
              (segment) =>
                Boolean(segment?.key_point) && Boolean(segment?.start_time)
            );
          if (segments && segments.length > 0) {
            map[videoId] = segments;
          }
        });
        setOutlineSegments(map);
      } catch {
        if (!canceled) setOutlineSegments({});
      }
    };
    fetchOutlines();
    return () => {
      canceled = true;
    };
  }, [stockTicker, activeSlot]);

  if (loading) return null;

  if (!stock || sources.length === 0) {
    return (
      <EvidencePageRoot>
        <LogoHeader
          title="근거 영상 모아보기"
          onBack={handleNavigateBack}
          onBackHome={handleNavigateBack}
          showLogo
        />
        <PageWrapper>
          <EmptyState>
            <p>근거 영상 정보를 찾을 수 없습니다.</p>
            <ActionRow>
              <ActionButton type="button" onClick={handleNavigateBack}>
                이전 페이지로 돌아가기
              </ActionButton>
              <ActionLink href="/today">오늘 인사이트 바로가기</ActionLink>
            </ActionRow>
          </EmptyState>
        </PageWrapper>
      </EvidencePageRoot>
    );
  }

  const pageTitle = `${stock.stock_name} 근거 영상 모아보기`;
  const metrics = stock.metrics ?? null;
  const priceInfo = metrics?.price_info ?? null;
  const priceField = (
    metrics as {
      price?: {
        close?: unknown;
        open?: unknown;
        change_pct?: unknown;
        change_amount?: unknown;
      };
    }
  )?.price;
  const priceFieldClose = normalizeNumericInput(priceField?.close);
  const priceFieldOpen = normalizeNumericInput(priceField?.open);
  const priceFieldChangeAmount = normalizeNumericInput(
    (priceField as { change_amount?: unknown } | undefined)?.change_amount
  );
  const priceFieldChangePct = normalizeNumericInput(
    (priceField as { change_pct?: unknown } | undefined)?.change_pct
  );
  const currentPriceValue = resolveNumericValue(
    priceInfo?.current_price,
    priceFieldClose,
    typeof metrics?.price === "number" ? metrics.price : null,
    priceInfo?.prev_close
  );
  const openPriceValue = resolveNumericValue(
    priceInfo?.open,
    priceFieldOpen,
    priceInfo?.prev_close
  );
  const derivedChangeAmount =
    currentPriceValue != null && openPriceValue != null
      ? currentPriceValue - openPriceValue
      : null;
  const derivedChangePct =
    currentPriceValue != null && openPriceValue != null && openPriceValue !== 0
      ? ((currentPriceValue - openPriceValue) / openPriceValue) * 100
      : null;
  const fallbackChangeAmount =
    derivedChangeAmount ??
    resolveNumericValue(
      priceInfo?.change_amount,
      metrics?.change_amount,
      priceFieldChangeAmount
    );
  const fallbackChangePct =
    derivedChangePct ??
    resolveNumericValue(
      priceInfo?.change_pct,
      metrics?.chg_pct,
      priceFieldChangePct
    );
  const displayMetrics = metrics
    ? {
        change_pct: fallbackChangePct,
        change_amount: fallbackChangeAmount,
        currency: metrics.currency ?? null,
      }
    : null;
  const heroChangePositive =
    currentPriceValue != null && openPriceValue != null
      ? currentPriceValue >= openPriceValue
      : fallbackChangePct != null
      ? fallbackChangePct >= 0
      : (fallbackChangeAmount ?? 0) >= 0;
  const heroChangeTextParts: string[] = [];
  if (typeof fallbackChangePct === "number") {
    heroChangeTextParts.push(
      `${fallbackChangePct >= 0 ? "+" : ""}${fallbackChangePct.toFixed(2)}%`
    );
  }
  if (typeof fallbackChangeAmount === "number") {
    heroChangeTextParts.push(
      formatCurrency(fallbackChangeAmount, metrics?.currency)
    );
  }
  const heroChangeText = heroChangeTextParts.join(" / ");

  const insightData = stock.metric_insight ?? null;
  const commentBullets = normalizeCommentBullets(
    insightData?.comment_bullets && insightData.comment_bullets.length > 0
      ? insightData.comment_bullets
      : stock.comment_bullets
  );
  const commentBody =
    insightData?.comment_body || stock.action_idea?.reason || null;
  const commentTitle =
    insightData?.comment_title || stock.action_idea?.stance || null;
  const heroCommentText =
    (commentBullets[0] ? removeMarkTags(commentBullets[0]) : null) ||
    (commentBody ? removeMarkTags(commentBody) : null);
  const mappedInsightSections = (insightData?.insight_sections ?? [])
    .map((section) => ({
      category: section?.category ?? null,
      title: section?.title ?? null,
      summary: section?.summary ?? null,
      highlights: section?.highlights ?? null,
      _raw: section as StockInsightSectionDetail,
    }))
    .filter((section) =>
      Boolean(
        section.category ||
          section.title ||
          section.summary ||
          section.highlights
      )
    );
  const insightSections = mappedInsightSections.filter(
    (section) => !shouldExcludeFinancialSection(section)
  );
  const prioritizedInsightSections = insightSections.filter((section) =>
    isFinancialMetricSection(section)
  );
  const mergedInsightSections = (() => {
    const merged: typeof insightSections = insightSections.slice(0, 3);
    prioritizedInsightSections.forEach((section) => {
      if (!merged.includes(section)) {
        merged.push(section);
      }
    });
    return merged;
  })();
  const limitedInsightSections = mergedInsightSections.map((section) => ({
    ...section,
    visualization:
      metrics && section._raw
        ? buildInsightVisualization(section._raw, stock)
        : null,
  }));
  const hasCommentBlock =
    commentBullets.length > 0 || Boolean(commentBody || commentTitle);
  const shouldRenderInsightPanel =
    hasCommentBlock || limitedInsightSections.some((section) => section);

  return (
    <EvidencePageRoot>
      <LogoHeader
        title={pageTitle}
        onBack={handleNavigateBack}
        onBackHome={handleNavigateBack}
        showLogo
      />
      <PageWrapper>
        {/* ① 종목 헤더 */}
        <StockHero>
          <HeroMain>
            <StockChip>{stock.ticker || stock.stock_name}</StockChip>
            <StockName>{stock.stock_name}</StockName>
          </HeroMain>
          <HeroActions>
            <HeroButtonPrimary
              type="button"
              onClick={() => openAlertModal("kakao")}
            >
              알림받기
            </HeroButtonPrimary>
            {/* <HeroButtonGhost type="button">워치리스트 추가</HeroButtonGhost> */}
          </HeroActions>
        </StockHero>

        {/* ② 메트릭 스냅샷 */}
        {metrics ? (
          <MetricSummary>
            <MetricPrimary>
              <MetricLabel>현재가</MetricLabel>
              <MetricValue>
                {formatCurrency(currentPriceValue, metrics.currency)}
              </MetricValue>
              {displayMetrics ? renderChange(displayMetrics) : null}
            </MetricPrimary>
            {heroCommentText ? (
              <MetricComment>
                <MetricCommentTitle>
                  {commentTitle || "오늘 코멘트"}
                </MetricCommentTitle>
                <MetricCommentBody>{heroCommentText}</MetricCommentBody>
              </MetricComment>
            ) : null}
          </MetricSummary>
        ) : null}

        {shouldRenderInsightPanel ? (
          <InsightWrapper>
            {limitedInsightSections.length ? (
              <InsightSectionList>
                {limitedInsightSections.map((section, index) => {
                  const summaryHtml = formatInsightHtml(section.summary);
                  const isValuationSection = isDomesticValuationSection(
                    section._raw
                  );
                  const highlightsHtml = !isValuationSection
                    ? formatInsightHtml(section.highlights)
                    : null;
                  const hasHeader = section.category || section.title;
                  const hasBody = summaryHtml || highlightsHtml;
                  const hasVisualization = Boolean(section.visualization);
                  const isPriceSection = isDomesticPriceSection(section._raw);
                  const isFlowSection = isDomesticFlowSection(section._raw);
                  const hasPrevDayData = containsPreviousDayData(
                    section.summary,
                    section.highlights
                  );
                  if (
                    !hasHeader &&
                    !hasBody &&
                    !hasVisualization &&
                    !isPriceSection &&
                    !isValuationSection &&
                    !isFlowSection
                  ) {
                    return null;
                  }
                  return (
                    <InsightSectionCard key={`insight-${index}`}>
                      {hasHeader ? (
                        <InsightSectionHeader>
                          {section.category ? (
                            <InsightBadge>{section.category}</InsightBadge>
                          ) : null}
                          {section.title ? (
                            <InsightSectionTitle>
                              {removeMarkTags(section.title)}
                            </InsightSectionTitle>
                          ) : null}
                        </InsightSectionHeader>
                      ) : null}
                      {isPriceSection ? (
                        <DomesticPriceSectionVisual
                          stock={stock}
                          summaryText={
                            section.summary || section.highlights || null
                          }
                        />
                      ) : null}
                      {isValuationSection ? (
                        <DomesticValuationSectionVisual stock={stock} />
                      ) : null}
                      {isFlowSection && !hasPrevDayData ? (
                        <DomesticFlowSectionVisual stock={stock} />
                      ) : null}
                      {section.visualization ? (
                        <InsightVisualizationContainer>
                          <StockInsightVisualization
                            visualization={section.visualization}
                          />
                        </InsightVisualizationContainer>
                      ) : null}
                      {!isFlowSection && highlightsHtml ? (
                        <InsightHighlights
                          dangerouslySetInnerHTML={{
                            __html: highlightsHtml,
                          }}
                        />
                      ) : null}
                    </InsightSectionCard>
                  );
                })}
              </InsightSectionList>
            ) : null}
          </InsightWrapper>
        ) : null}

        {/* ③ 섹션 타이틀 */}
        <SectionHeader>
          <SectionTitle>근거 영상 모아보기</SectionTitle>
          <SectionSub>{sectionLabel || "인사이트"}</SectionSub>
        </SectionHeader>

        {/* ④ 카드 리스트 */}
        <EvidenceList>
          {sources.map((source) => {
            const summaryLines = buildSummaryLines(source);
            const summaryText =
              removeMarkTags(source.summary ?? "") || summaryLines[0] || "";
            const relativeUpload = source.upload_date
              ? timeAgo(source.upload_date)
              : null;

            const focusHref = {
              pathname: `/detail/${source.video_id}`,
              query: { focus: "stock-mentions", stock: stock.ticker },
            } as const;
            const fullHref = {
              pathname: `/detail/${source.video_id}`,
            } as const;

            const handleFocusClick = () =>
              logCtaClick(
                "evidence_focus_click",
                user?.id,
                source.video_id,
                getOrCreateAnonId()
              ).catch(() => {});

            const handleFullClick = () =>
              logCtaClick(
                "evidence_full_click",
                user?.id,
                source.video_id,
                getOrCreateAnonId()
              ).catch(() => {});

            const outlineItems = outlineSegments[source.video_id] ?? [];
            if (outlineItems.length === 0) {
              return null;
            }
            const visibleOutlineItems = outlineItems.slice(0, 3);
            const handleOutlineTimeClick = (startTime?: string | null) => {
              const videoId = source.video_id;
              if (!videoId) return;
              const normalizedStart =
                typeof startTime === "string"
                  ? startTime.trim()
                  : startTime != null
                  ? String(startTime)
                  : "";
              if (!normalizedStart) return;

              const params = new URLSearchParams();
              params.set("focus", "stock-mentions");
              if (stock?.ticker) {
                params.set("stock", stock.ticker);
              } else if (stock?.stock_name) {
                params.set("stock_name", stock.stock_name);
              }
              params.set("start", normalizedStart);

              logCtaClick(
                "evidence_outline_click",
                user?.id,
                videoId,
                getOrCreateAnonId()
              ).catch(() => {});

              router.push(`/detail/${videoId}?${params.toString()}`);
            };
            return (
              <EvidenceCard
                key={`${source.video_id}-${stock.ticker ?? stock.stock_name}`}
              >
                <VideoMainRow>
                  <VideoThumbnail>
                    {source.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={source.thumbnail}
                        alt={source.title ?? stock.stock_name}
                      />
                    ) : (
                      <VideoThumbnailFallback>
                        <span>{stock.stock_name}</span>
                      </VideoThumbnailFallback>
                    )}
                  </VideoThumbnail>
                  <VideoBody>
                    <VideoTitle>
                      {removeMarkTags(
                        source.summary_data?.headline_title ??
                          source.title ??
                          stock.stock_name
                      )}
                    </VideoTitle>
                    {summaryText ? (
                      <VideoSummaryList>
                        <SummaryLine>{summaryText}</SummaryLine>
                      </VideoSummaryList>
                    ) : null}
                  </VideoBody>
                </VideoMainRow>

                <VideoMeta>
                  <ChannelInfo>
                    {source.channel_thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <ChannelAvatar
                        src={source.channel_thumbnail}
                        alt={source.channel_name ?? "채널"}
                      />
                    ) : null}
                    <div>
                      {source.channel_name ? (
                        <strong>{source.channel_name}</strong>
                      ) : null}
                      <span>
                        {parseSubscribersCount(source.channel_subscribers ?? 0)}
                        {relativeUpload ? (
                          <>
                            {" "}
                            · <small>{relativeUpload}</small>
                          </>
                        ) : null}
                      </span>
                    </div>
                  </ChannelInfo>
                </VideoMeta>
                {visibleOutlineItems.length ? (
                  <OutlineWrapper>
                    <OutlineTitle>
                      {`"${stock.stock_name}" 관련 핵심 요약`}
                    </OutlineTitle>
                    <OutlineSegmentList>
                      {visibleOutlineItems.map((segment, index) => {
                        const outlineHtml =
                          convertMarkToStrong(
                            segment.key_point ?? "관련 하이라이트"
                          ) || "관련 하이라이트";
                        return (
                          <li
                            key={`${source.video_id}-outline-${index}`}
                            title={segment.key_point ?? undefined}
                          >
                            <OutlineTime
                              type="button"
                              onClick={() =>
                                handleOutlineTimeClick(segment.start_time)
                              }
                              disabled={!segment.start_time}
                            >
                              {formatOutlineTime(segment.start_time)}
                            </OutlineTime>
                            <OutlineText
                              dangerouslySetInnerHTML={{
                                __html: outlineHtml,
                              }}
                            />
                          </li>
                        );
                      })}
                    </OutlineSegmentList>
                  </OutlineWrapper>
                ) : null}
                <EvidenceActions>
                  <PrimaryLink
                    href={focusHref}
                    onClick={handleFocusClick}
                    prefetch={false}
                  >
                    종목 구간 더 보기
                  </PrimaryLink>
                  <SecondaryLink
                    href={fullHref}
                    onClick={handleFullClick}
                    prefetch={false}
                  >
                    영상 요약 전체 보기
                  </SecondaryLink>
                </EvidenceActions>
              </EvidenceCard>
            );
          })}
        </EvidenceList>

        {/* ⑤ 카카오톡/이메일 전환 섹션 */}
        <ConversionSection>
          <ConversionBadge>카카오톡 · 이메일 알림</ConversionBadge>
          <ConversionTitle>
            💡 {stockNameDisplay} 언급 영상, 놓치지 않고 받아보세요!
          </ConversionTitle>
          {alertSuccessMessage ? (
            <ConversionSuccess role="status">
              {alertSuccessMessage}
            </ConversionSuccess>
          ) : null}
          <ConversionList>
            <li>오늘 시청자 반응이 제일 핫한 주식 TOP5 영상에서</li>
            <li>{stockNameDisplay} 종목이 언급된 날마다</li>
            <li>핵심 내용과 투자 지표를 정리해 바로 알림드립니다.</li>
            <li>카카오톡 또는 이메일 중 편한 채널을 선택하세요.</li>
          </ConversionList>
          <ConversionActions>
            <ConversionPrimaryButton
              type="button"
              onClick={() => handleConversionClick("kakao")}
            >
              카카오톡으로 무료 요약 받기
            </ConversionPrimaryButton>
            <ConversionSecondaryButton
              type="button"
              onClick={() => handleConversionClick("email")}
            >
              이메일로 받아보기
            </ConversionSecondaryButton>
          </ConversionActions>
        </ConversionSection>
      </PageWrapper>

      {/* 알림 채널 선택 모달 */}
      {alertModalOpen ? (
        <AlertModalOverlay>
          <AlertModal>
            <AlertHeader>
              <div>
                <ModalEyebrow>알림 채널 선택</ModalEyebrow>
                <AlertTitle>
                  {stock.stock_name} 언급 영상이 나오면 바로 알려드릴게요
                </AlertTitle>
                <ModalDescription>
                  유티클은 오늘 업로드된 {sectionDescription} 가운데 시청자
                  반응이 좋은 영상 TOP5를 선정합니다. 관심 종목이 그 TOP5에
                  등장하면 바로 요약을 보내드려요.
                </ModalDescription>
              </div>
              <CloseButton type="button" onClick={closeAlertModal}>
                ×
              </CloseButton>
            </AlertHeader>
            <ChannelGrid>
              <ChannelOption
                type="button"
                $selected={selectedChannel === "kakao"}
                onClick={() => handleChannelSelect("kakao")}
              >
                <span className="badge">추천</span>
                <strong>카카오톡</strong>
                <p>
                  TOP5 영상에 {stock.stock_name}이 등장하면 즉시 카톡으로 요약을
                  보내드려요.
                </p>
                {selectedChannel === "kakao" ? (
                  <PhoneField>
                    <label htmlFor="alert-phone">카카오 알림 받을 번호</label>
                    <input
                      id="alert-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="예) 010-1234-5678"
                      value={phoneValue}
                      onChange={(event) => setPhoneValue(event.target.value)}
                    />
                    {phoneError ? <ErrorText>{phoneError}</ErrorText> : null}
                  </PhoneField>
                ) : null}
              </ChannelOption>
              <ChannelOption
                type="button"
                $selected={selectedChannel === "email"}
                onClick={() => handleChannelSelect("email")}
              >
                <strong>이메일</strong>
                <p>업무 PC에서 편하게 확인하고 싶을 때 선택하세요.</p>
                {selectedChannel === "email" ? (
                  <EmailField>
                    <label>구글 계정 연동</label>
                    {emailLinked ? (
                      <EmailLinkedNotice>
                        ✅ {emailValue} 계정으로 알림을 보내드릴게요.
                      </EmailLinkedNotice>
                    ) : (
                      <>
                        <GoogleLogin onLoginSuccess={handleEmailLoginSuccess} />
                        <EmailHint>
                          구글 계정을 연동하면 해당 이메일로 요약을 보내드려요.
                        </EmailHint>
                      </>
                    )}
                    {emailError ? <ErrorText>{emailError}</ErrorText> : null}
                  </EmailField>
                ) : null}
              </ChannelOption>
            </ChannelGrid>
            <BenefitList>
              <li>관심 종목이 TOP5에 등장할 때만 알림 전송</li>
              <li>영상 시청 없이 핵심 요약만 바로 확인</li>
              <li>언제든 마이페이지에서 알림 해지 가능</li>
            </BenefitList>
            <AlertFooter>
              <AlertConfirmButton
                type="button"
                onClick={handleAlertConfirm}
                disabled={alertSubmitting}
              >
                알림 설정 완료
              </AlertConfirmButton>
              <AlertCancelButton type="button" onClick={closeAlertModal}>
                나중에 할게요
              </AlertCancelButton>
            </AlertFooter>
          </AlertModal>
        </AlertModalOverlay>
      ) : null}
    </EvidencePageRoot>
  );
};

export default EvidencePageClient;

/* ---------- helpers ---------- */

function buildSummaryLines(source: InsightSource): string[] {
  const raw = removeMarkTags(
    source.summary_data?.short_summary ?? source.summary ?? ""
  );
  if (!raw) return ["요약 정보가 아직 준비되지 않았습니다."];
  const segments = raw
    .split(/\n|(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return [raw];
  return segments.slice(0, 3);
}

function containsPreviousDayData(
  ...values: Array<string | null | undefined>
): boolean {
  return values.some((value) => {
    if (!value) return false;
    return value.includes("전일");
  });
}

function normalizeCommentBullets(value?: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
}

function normalizeNumericInput(value?: unknown): number | string | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

function isFinancialMetricSection(section: {
  category?: string | null;
  title?: string | null;
  _raw?: StockInsightSectionDetail | null;
}): boolean {
  return sectionMatchesKeyword(section, FINANCIAL_SECTION_KEYWORDS);
}

function shouldExcludeFinancialSection(section: {
  category?: string | null;
  title?: string | null;
  _raw?: StockInsightSectionDetail | null;
}): boolean {
  return sectionMatchesKeyword(section, EXCLUDED_SECTION_KEYWORDS);
}

function sectionMatchesKeyword(
  section: {
    category?: string | null;
    title?: string | null;
    _raw?: StockInsightSectionDetail | null;
  },
  keywords: string[]
): boolean {
  if (!keywords.length) return false;
  const texts = [
    section.category,
    section.title,
    section._raw?.category,
    section._raw?.title,
  ]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .filter((value) => value.length > 0);
  if (!texts.length) return false;
  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    return texts.some((text) => text.includes(normalizedKeyword));
  });
}

async function fetchEvidencePayloadByTicker({
  ticker,
  sectionLabel,
  stockNameFallback,
  slot,
}: {
  ticker: string;
  sectionLabel: string | null;
  stockNameFallback: string | null;
  slot?: BriefingSlot | null;
}): Promise<StoredEvidencePayload | null> {
  const response = await fetch(
    buildOutlineFetchUrl(ticker, { slot, refresh: false }),
    {
      method: "GET",
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Outline payload request failed (${response.status})`);
  }
  const payload = (await response.json()) as OutlineResponsePayload;
  const stock = adaptStockFromOutlinePayload(payload, {
    fallbackTicker: ticker,
    fallbackName: stockNameFallback,
  });
  if (!stock) return null;
  const derivedSection =
    sectionLabel ?? extractSectionLabelFromOutlines(payload) ?? null;
  return {
    section: derivedSection,
    stock,
  };
}

function adaptStockFromOutlinePayload(
  payload: OutlineResponsePayload,
  options: { fallbackTicker: string; fallbackName?: string | null }
): InsightStock | null {
  const outlines = payload?.outlines?.filter(Boolean) ?? [];
  const firstItem = outlines.find((entry) => entry?.item)?.item ?? null;
  const ticker =
    safeTrim(firstItem?.ticker) ?? safeTrim(options.fallbackTicker) ?? null;
  if (!ticker) return null;
  const stockName =
    safeTrim(firstItem?.stock_name) ?? safeTrim(options.fallbackName) ?? ticker;
  const sources = mergeOutlineSources(outlines, firstItem?.sources);
  if (sources.length === 0) return null;
  return {
    stock_name: stockName,
    ticker,
    company_description: firstItem?.company_description ?? undefined,
    thesis: sanitizeThesisArray(firstItem?.thesis),
    catalysts: sanitizeCatalystArray(firstItem?.catalysts),
    risks: sanitizeRiskArray(firstItem?.risks),
    action_idea: firstItem?.action_idea ?? undefined,
    comment_bullets: sanitizeStringArray(firstItem?.comment_bullets),
    sources,
    quote_raw: firstItem?.quote_raw ?? undefined,
    metrics: firstItem?.metrics ?? undefined,
    metric_insight: firstItem?.metric_insight ?? undefined,
  };
}

function sanitizeThesisArray(
  value?: Array<{ point?: string | null } | null> | null
) {
  if (!Array.isArray(value)) return undefined;
  const next = value
    .map((entry) => {
      const point = safeTrim(entry?.point);
      return point ? { point } : null;
    })
    .filter((entry): entry is { point: string } => Boolean(entry));
  return next.length ? next : undefined;
}

function sanitizeCatalystArray(
  value?: Array<{ item?: string | null; when?: string | null } | null> | null
) {
  if (!Array.isArray(value)) return undefined;
  const next = value
    .map((entry) => {
      const item = safeTrim(entry?.item);
      if (!item) return null;
      const when = safeTrim(entry?.when);
      return when ? { item, when } : { item };
    })
    .filter((entry): entry is { item: string; when?: string } =>
      Boolean(entry)
    );
  return next.length ? next : undefined;
}

function sanitizeRiskArray(
  value?: Array<{ item?: string | null } | null> | null
) {
  if (!Array.isArray(value)) return undefined;
  const next = value
    .map((entry) => {
      const item = safeTrim(entry?.item);
      return item ? { item } : null;
    })
    .filter((entry): entry is { item: string } => Boolean(entry));
  return next.length ? next : undefined;
}

function sanitizeStringArray(value?: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const next = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
  return next.length ? next : undefined;
}

function mergeOutlineSources(
  outlines: OutlineResponseItem[],
  fallbackSources?: InsightSource[] | null | undefined
): InsightSource[] {
  const map = new Map<string, InsightSource>();

  fallbackSources?.forEach((source) => {
    if (!source || !source.video_id) return;
    map.set(source.video_id, { ...source });
  });

  outlines.forEach((entry) => {
    const videoId = entry?.video_id ?? entry?.video?.video_id;
    if (!videoId) return;
    const existing = map.get(videoId) ?? { video_id: videoId };
    const video = entry?.video;
    const summaryFromOutline = deriveSummaryFromOutline(entry);
    map.set(videoId, {
      ...existing,
      video_id: videoId,
      channel_id:
        video?.channel?.channel_id ?? existing.channel_id ?? undefined,
      title: video?.title ?? existing.title,
      thumbnail: video?.thumbnail ?? existing.thumbnail,
      upload_date: video?.upload_date ?? existing.upload_date,
      channel_name:
        video?.channel?.channel_name ??
        video?.channel_name ??
        existing.channel_name,
      channel_thumbnail:
        video?.channel?.thumbnail ??
        video?.channel_thumbnail ??
        existing.channel_thumbnail,
      channel_subscribers:
        video?.channel?.subscribers ??
        video?.channel_subscribers ??
        existing.channel_subscribers,
      summary_data: video?.summary_data ?? existing.summary_data,
      summary: summaryFromOutline ?? video?.summary ?? existing.summary,
    });
  });

  return Array.from(map.values());
}

function deriveSummaryFromOutline(
  entry?: OutlineResponseItem
): string | undefined {
  if (!entry) return undefined;
  const outlineEntries = extractOutlineEntries(entry);
  const segments = outlineEntries
    ?.flatMap((item) => item?.segments ?? [])
    .filter((segment): segment is OutlineSegment =>
      Boolean(segment?.key_point)
    );
  const keyPoint = segments?.find((segment) => segment.key_point)?.key_point;
  return keyPoint ? removeMarkTags(keyPoint) : undefined;
}

function extractSectionLabelFromOutlines(
  payload?: OutlineResponsePayload
): string | null {
  if (!payload?.outlines) return null;
  for (const entry of payload.outlines) {
    const section =
      safeTrim(entry?.item?.section) || safeTrim(entry?.video?.section);
    if (section) return section;
  }
  return null;
}

function safeTrim(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function formatOutlineTime(value?: string | null) {
  if (!value) return "";
  if (value.includes(":")) return value;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return value;
  const minutes = Math.floor(numeric / 60);
  const seconds = Math.floor(numeric % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function convertMarkToStrong(html?: string | null) {
  if (typeof html !== "string" || html.length === 0) return html ?? "";
  return html
    .replace(/<mark\b[^>]*>/gi, "<strong>")
    .replace(/<\/mark>/gi, "</strong>");
}

function extractOutlineEntries(item: OutlineResponseItem): OutlineEntry[] {
  if (Array.isArray(item.outline)) {
    return item.outline;
  }
  const nested =
    item.outline && typeof item.outline === "object"
      ? (item.outline as { outline?: OutlineEntry[] | null }).outline
      : null;
  return Array.isArray(nested) ? nested : [];
}

function resolveNumericValue(
  ...values: Array<number | string | null | undefined>
): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function formatCurrency(value?: number | null, currency?: string | null) {
  if (value == null) return "—";
  const unit = currency || "KRW";
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: unit,
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${unit}`;
  }
}

function formatCompactCurrency(
  value?: number | null,
  currency?: string | null
) {
  if (value == null) return "—";
  const unit = currency || "KRW";
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: unit,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${formatCompactNumber(value)} ${unit}`;
  }
}

function formatCompactNumber(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function renderChange(metric: {
  change_pct?: number | null;
  change_amount?: number | null;
  currency?: string | null;
}) {
  const pct = metric.change_pct;
  const amt = metric.change_amount;
  if (pct == null && amt == null) return null;
  const positive = (pct ?? amt ?? 0) >= 0;
  const pctText =
    pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : null;
  const amtText =
    amt != null ? formatCurrency(amt, metric.currency ?? "KRW") : null;
  return (
    <ChangeBadge $positive={positive}>
      {pctText}
      {pctText && amtText ? " · " : ""}
      {amtText}
    </ChangeBadge>
  );
}

const HIGHLIGHT_NUMBER_REGEX =
  /([0-9]+(?:[.,][0-9]+)*(?:\s?(?:억|만|조|천|원|p|%|배|건|회))?)/g;
const LARGE_CURRENCY_VALUE_REGEX = /(\d{1,3}(?:,\d{3})+)(?=\s?원)/g;

function formatInsightHtml(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalizedCurrency = insertLargeCurrencyUnits(trimmed);
  const withLineBreaks = normalizedCurrency.replace(/\n+/g, "<br/>");
  const highlighted = withLineBreaks.replace(
    HIGHLIGHT_NUMBER_REGEX,
    "<strong>$1</strong>"
  );
  return highlighted
    .replace(/<mark\b[^>]*>/gi, "<strong>")
    .replace(/<\/mark>/gi, "</strong>");
}

function insertLargeCurrencyUnits(text: string) {
  return text.replace(LARGE_CURRENCY_VALUE_REGEX, (match) => {
    const numeric = Number(match.replace(/,/g, ""));
    if (!Number.isFinite(numeric)) return match;
    return formatLargeCurrencyValue(numeric);
  });
}

function formatLargeCurrencyValue(value: number): string {
  if (!Number.isFinite(value)) return "";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const format = (num: number) => {
    if (num >= 100) return Math.round(num).toString();
    if (num >= 10) return num.toFixed(1).replace(/\.0$/, "");
    return num.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  };

  if (abs >= 1_000_000_000_000) {
    return `${sign}${format(abs / 1_000_000_000_000)}조`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${format(abs / 100_000_000)}억`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${format(abs / 1_000_000)}백만`;
  }
  if (abs >= 10_000) {
    return `${sign}${format(abs / 10_000)}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

/* ---------- styles ---------- */

const EvidencePageRoot = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;
  font-family: "Pretendard Variable";
  color: #0f172a;
`;

const PageWrapper = styled.section`
  --gutter-l: max(16px, env(safe-area-inset-left));
  --gutter-r: max(16px, env(safe-area-inset-right));
  --gutter-t: max(24px, env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  padding: calc(var(--gutter-t) + 60px) var(--gutter-r) 48px var(--gutter-l);
  box-sizing: border-box;
  font-family: "Pretendard Variable", var(--font-Pretendard), -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  & > *:first-child {
    margin-top: 0;
  }
  @media (min-width: 768px) {
    max-width: 960px;
    padding-left: max(32px, var(--gutter-l));
    padding-right: max(32px, var(--gutter-r));
  }
`;

/* 공용 CTA 버튼 토큰 */
const BaseCtaButton = styled.button`
  flex: 1;
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

const PrimaryBlueButton = styled(BaseCtaButton)`
  background: #2563eb;
  color: #ffffff;
`;

const SecondaryOutlineButton = styled(BaseCtaButton)`
  background: #ffffff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
`;

/* 상단 종목 헤더 */
const StockHero = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
`;

const HeroMain = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const StockChip = styled.span`
  padding: 4px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
`;

const StockName = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  max-width: 180px;
  font-family: "Pretendard Variable";
`;

const HERO_POSITIVE_COLOR = "#ff6b6b";
const HERO_NEGATIVE_COLOR = "#0b63f6";

const HeroActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  @media (min-width: 420px) {
    align-items: flex-end;
  }
`;

const HeroButtonPrimary = styled(PrimaryBlueButton)`
  padding-inline: 18px;
`;

const HeroButtonGhost = styled.button`
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
`;

/* 섹션 타이틀 */
const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  color: #0f172a;
`;

const SectionSub = styled.span`
  font-size: 12px;
  color: #64748b;
`;

/* 메트릭 */
const MetricSummary = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MetricPrimary = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
`;

const MetricComment = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  background: #edf2ff;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MetricCommentTitle = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #1d4ed8;
  text-transform: uppercase;
`;

const MetricCommentBody = styled.p`
  margin: 0;
  font-size: 14px;
  color: #0f172a;
  line-height: 1.4;
`;

const MetricLabel = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
`;

const MetricValue = styled.span`
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
`;

const ChangeBadge = styled.span<{ $positive?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $positive }) =>
    $positive ? HERO_POSITIVE_COLOR : HERO_NEGATIVE_COLOR};
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const MetricItem = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
  }
  strong {
    font-size: 16px;
    color: #0f172a;
  }
`;

/* 리스트/카드 */
const EvidenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EvidenceCard = styled.article`
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  overflow: hidden;
`;

const VideoMainRow = styled.div`
  display: flex;
  gap: 16px;
`;

const VideoThumbnail = styled.div`
  width: 160px;
  min-width: 160px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  background: #e2e8f0;
  box-sizing: border-box;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoThumbnailFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #475569;
  background: #edf2ff;
`;

const VideoBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VideoTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VideoSummaryList = styled.ul`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #1f2937;
  list-style: disc;

  li {
    line-height: 1.5;
  }
`;

const SummaryLine = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
  line-height: 1.2;
  font-size: 14px;
`;

const OutlineSegmentList = styled.ul`
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;

  li {
    display: flex;
    align-items: flex-start;
  }
`;

const OutlineTime = styled.button`
  display: inline-flex;
  min-width: 48px;
  padding: 4px 6px;
  border-radius: 4px;
  background: #e0e7ff;
  justify-content: center;
  align-items: center;
  color: #3730a3;
  font-size: 12px;
  font-weight: 700;
  margin-right: 8px;
  border: none;
  cursor: pointer;
  line-height: 1.3;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover:enabled {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const OutlineText = styled.span`
  font-size: 14px;
  color: #0f172a;
  line-height: 1.4;
  strong {
    background: none;
    color: inherit;
    font-weight: 700;
    padding: 0;
  }
`;

const OutlineWrapper = styled.div`
  margin-top: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  background: #f8fafc;
`;

const OutlineTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 12px;
`;

const AlertModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 2000;
`;

const AlertModal = styled.div`
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const ModalEyebrow = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
`;

const AlertTitle = styled.h3`
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
`;

const ModalDescription = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
`;

const ChannelGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChannelOption = styled.button<{ $selected: boolean }>`
  border-radius: 16px;
  border: 2px solid ${({ $selected }) => ($selected ? "#2563eb" : "#e2e8f0")};
  background: ${({ $selected }) =>
    $selected ? "rgba(37, 99, 235, 0.04)" : "#f8fafc"};
  padding: 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;

  strong {
    font-size: 16px;
    color: #0f172a;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: #e0edff;
    color: #1d4ed8;
    font-size: 11px;
    font-weight: 700;
  }
`;

const EmailField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }

  input {
    border: 1px solid #cbd5f5;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
  }
`;

const EmailHint = styled.p`
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
`;

const EmailLinkedNotice = styled.div`
  font-size: 13px;
  color: #0f172a;
  font-weight: 600;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ecfccb;
`;

const PhoneField = styled(EmailField)`
  input {
    letter-spacing: 0.5px;
  }
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: #dc2626;
`;

const BenefitList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
`;

const AlertFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 420px) {
    flex-direction: row;
  }
`;

const AlertConfirmButton = styled(PrimaryBlueButton)`
  flex: 1;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AlertCancelButton = styled(SecondaryOutlineButton)`
  flex: 1;
`;

/* 인사이트 섹션 */

const InsightWrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InsightSectionList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const InsightSectionCard = styled.article`
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InsightVisualizationContainer = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
`;

const InsightSectionHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const InsightBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(11, 99, 246, 0.12);
  color: rgb(11, 99, 246);
  font-size: 11px;
  font-weight: 700;
`;

const InsightSectionTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
`;

const InsightSectionSummary = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;

  strong {
    color: #dc2626;
  }
`;

const InsightHighlights = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #475569;

  strong {
    font-weight: 700;
    color: #000;
  }
`;

const VideoMeta = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    display: block;
    font-size: 14px;
    color: #0f172a;
  }
  span {
    font-size: 12px;
    color: #64748b;
  }
`;

const ChannelAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
  background: #e2e8f0;
`;

const EvidenceActions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;

  @media (min-width: 520px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const PrimaryLink = styled(Link)`
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  width: 100%;
  text-decoration: none;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #2563eb;
  border: 1px solid #2563eb;
`;

const SecondaryLink = styled(Link)`
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 700;
  width: 100%;
  font-size: 16px;
  text-decoration: none;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  display: flex;
  justify-content: center;
  align-items: center;
`;

/* 빈 상태 */
const EmptyState = styled.div`
  padding: 48px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
  margin: 40px auto;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
`;

const ActionButton = styled.button`
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  background: #f8fafc;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
`;

const ActionLink = styled(Link)`
  border-radius: 999px;
  border: 1px solid #2563eb;
  padding: 10px 16px;
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
`;

/* 카카오/이메일 전환 섹션 */

const ConversionSection = styled.section`
  margin-top: 24px;
  padding: 20px 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ConversionBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e0edff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  width: fit-content;
`;

const ConversionTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #0f172a;
  line-height: 1.4;
  font-weight: 800;
`;

const ConversionList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    color: #475569;

    &::before {
      content: "•";
      color: #2563eb;
      font-weight: 700;
      margin-right: 4px;
    }
  }
`;

const ConversionActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 480px) {
    flex-direction: row;
  }
`;

const ConversionSuccess = styled.p`
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.15);
  color: #065f46;
  font-size: 13px;
  font-weight: 600;
`;

const ConversionPrimaryButton = styled(BaseCtaButton)`
  flex: 1;
  background: linear-gradient(120deg, #facc15, #f97316);
  color: #1f2937;
`;

const ConversionSecondaryButton = styled(BaseCtaButton)`
  flex: 1;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  border: 1px solid rgba(29, 78, 216, 0.3);
`;
