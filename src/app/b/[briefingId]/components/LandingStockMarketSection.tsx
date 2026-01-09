"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { css } from "styled-components";
import { useRecoilValue } from "recoil";

import type {
  InsightMarketDeltaCard,
  InsightSection,
  InsightStock,
  InsightStockMetrics,
} from "@/types/insight";
import type { SlotLabel } from "@/utils/briefingSlot";
import { resolveInsightSlotCopy } from "@/utils/insightSlotCopy";
import {
  buildIntradayDetailFromCard,
  buildLiquidityDetailFromSentence,
  buildFlowShareDetail,
  buildFlowShiftDetail,
} from "@/components/insight/utils/marketDeltaParsers";
import { StockVideoSources } from "./LandingDomesticStockInsightSection";
import { userState } from "@/store/user";
import { logCtaClick } from "@/api/apiClient";
import { getOrCreateAnonId } from "@/utils/formatter";

interface StockMarketSectionProps {
  section: InsightSection;
  showHeader?: boolean;
  defaultExpanded?: boolean;
  slotLabel?: SlotLabel;
  hideMarketSection?: boolean;
  hideStockSection?: boolean;
}

export type StockInsightSectionDetail = {
  category?: string | null;
  title?: string | null;
  summary?: string | null;
  highlights?: string | null;
};

type PriceTone = "positive" | "negative" | "neutral";

type RangeMarker = {
  key: string;
  label: string;
  value: number;
  tone?: PriceTone;
};

type InsightBarItem = {
  key: string;
  label: string;
  value: number;
  display?: string;
  tone?: PriceTone;
};

type InsightDeltaItem = {
  key: string;
  label: string;
  current: number;
  previous?: number;
  currentDisplay?: string;
  previousDisplay?: string;
};

type InsightVisualizationBase = {
  contextLabel?: string;
};

type InsightMetricEntry = {
  key: string;
  label: string;
  value: string;
  description?: string;
  tone?: PriceTone;
};

type InsightFlowShiftItem = {
  key: string;
  label: string;
  todayAmount: number;
  prevAmount: number;
  deltaAmount?: number | null;
};

export type InsightVisualization =
  | ({
      type: "range";
      low: number;
      high: number;
      markers: RangeMarker[];
      formatter?: (value: number) => string;
    } & InsightVisualizationBase)
  | ({
      type: "signedBars";
      items: InsightBarItem[];
      formatter?: (value: number) => string;
      max?: number;
    } & InsightVisualizationBase)
  | ({
      type: "bars";
      items: InsightBarItem[];
      formatter?: (value: number) => string;
      max?: number;
    } & InsightVisualizationBase)
  | ({
      type: "delta";
      items: InsightDeltaItem[];
      formatter?: (value: number) => string;
    } & InsightVisualizationBase)
  | ({
      type: "entries";
      items: InsightMetricEntry[];
    } & InsightVisualizationBase)
  | ({
      type: "flowShift";
      items: InsightFlowShiftItem[];
      unitLabel?: string;
    } & InsightVisualizationBase);

const COLOR_POSITIVE = "#ff6b6b";
const COLOR_NEGATIVE = "#0b63f6";
const COLOR_NEUTRAL = "#9db3ff";
const COLOR_TRACK = "#e1e6ff";
const COLOR_CARD_BG = "#f6f8ff";
const COLOR_TEXT = "#1f2a4a";
const SOURCE_TAG_TEXT = "오늘 TOP5 유튜브 영상 기반";
const DEFAULT_VISIBLE_STOCKS = 5;

const FLOW_COLORS: Record<string, string> = {
  foreign: "#0b63f6",
  institution: "#6366f1",
  individual: "#f59e0b",
  others: "#cbd5f5",
};

const NUMBER_TOKEN_REGEX = /([+\-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g;
const HUNDRED_MILLION_KEYWORDS = [
  "매출",
  "매출액",
  "영업이익",
  "영업",
  "자본",
  "자산",
  "순이익",
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type StockPriceMetrics = {
  close?: number;
  prev_close?: number;
  change_pct?: number; // 퍼센트(예: 0.2 => 0.2%)
  open?: number;
  high?: number;
  low?: number;
};

function buildPriceInfoFromMetrics(mp?: StockPriceMetrics) {
  if (!mp || mp.close == null) return null;

  const close = mp.close;
  const prev = mp.prev_close;
  // change_pct가 없으면 prev 기반으로 계산
  const pct =
    typeof mp.change_pct === "number" && Number.isFinite(mp.change_pct)
      ? mp.change_pct
      : prev != null && prev !== 0
      ? ((close - prev) / prev) * 100
      : undefined;

  const diff = prev != null ? close - prev : undefined;

  const tone: PriceTone =
    pct != null
      ? pct > 0
        ? "positive"
        : pct < 0
        ? "negative"
        : "neutral"
      : diff != null
      ? diff > 0
        ? "positive"
        : diff < 0
        ? "negative"
        : "neutral"
      : "neutral";

  const sign = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "");

  const closeText = close.toLocaleString(); // 종가 숫자만 깔끔 표시
  const changeText =
    pct != null && diff != null
      ? `${sign(pct)}${Math.abs(pct).toFixed(2)}%`
      : pct != null
      ? `${sign(pct)}${Math.abs(pct).toFixed(2)}%`
      : diff != null
      ? `${sign(diff)}${Math.abs(diff).toLocaleString()}`
      : "";

  return { closeText, changeText, tone };
}

// 퍼센트 값 안전 변환 (기본 left=50, width=0, pointer=50)
const toPct = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeCommentBullets(value?: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
}

function formatCommentBullet(text: string) {
  return emphasizeNumbers(convertMarkToStrong(text));
}

const LandingStockMarketSection = ({
  section,
  showHeader = true,
  defaultExpanded,
  slotLabel,
  hideMarketSection = false,
  hideStockSection = false,
}: StockMarketSectionProps) => {
  const delta = section.data?.market_delta_insights;
  const rawStocks = (section.data?.stocks ?? []) as InsightStock[];
  const stocks = rawStocks.filter(
    (stock) =>
      typeof stock.ticker === "string" && stock.ticker.trim().length > 0
  );
  const stockIntroText = getStockIntroText(section.label);
  const hasStocks = stocks.length > 0;
  const [showAllStocks, setShowAllStocks] = useState(false);
  const hasMoreStocks = stocks.length > DEFAULT_VISIBLE_STOCKS;
  const displayedStocks =
    showAllStocks || !hasMoreStocks
      ? stocks
      : stocks.slice(0, DEFAULT_VISIBLE_STOCKS);
  const remainingStockCount = hasMoreStocks
    ? stocks.length - DEFAULT_VISIBLE_STOCKS
    : 0;

  const marketEntries = useMemo(() => {
    if (!delta?.by_market) return [] as Array<[string, InsightMarketDeltaCard]>;
    return Object.entries(delta.by_market).filter(
      (entry): entry is [string, InsightMarketDeltaCard] => Boolean(entry[1])
    );
  }, [delta?.by_market]);

  const appliedSlotLabel = useMemo(
    () => resolveInsightSlotCopy(section.label ?? "", slotLabel),
    [section.label, slotLabel]
  );

  const representativeMarketComment = useMemo(() => {
    if (section.label !== "국내 주식") return null;
    const representativeKeys = new Set(["KOSPI", "KOSDAQ"]);
    const bullets: string[] = [];
    let title: string | null = null;

    marketEntries.forEach(([marketKey, card]) => {
      const normalizedKey = (marketKey || "").toString().toUpperCase();
      const normalizedMarket = (card.market || "").toString().toUpperCase();
      if (
        !representativeKeys.has(normalizedKey) &&
        !representativeKeys.has(normalizedMarket)
      ) {
        return;
      }
      const cardBullets = normalizeCommentBullets(card.comment_bullets);
      if (!cardBullets.length) return;
      if (!title) {
        title =
          card.comment_title ||
          card.sentences?.headline ||
          card.sentences?.comment ||
          "마켓 코멘트";
      }
      cardBullets.forEach((bullet) => {
        if (!bullets.includes(bullet)) {
          bullets.push(bullet);
        }
      });
    });

    if (!bullets.length) return null;
    return {
      title: "마켓 코멘트",
      bullets: bullets.slice(0, 3),
    };
  }, [marketEntries, section.label]);

  const headerTimestamp = useMemo<string | null>(() => {
    const dateFromMarket = marketEntries
      .map(([, card]) => (card as { date_today?: string | null })?.date_today)
      .find(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0
      );

    return dateFromMarket || delta?.date_kst || null;
  }, [marketEntries, delta?.date_kst]);

  const [showDetails, setShowDetails] = useState(
    defaultExpanded ?? !showHeader
  );
  const shouldRenderDetails = showHeader ? showDetails : true;

  const stockUpdatedAt = section.updated_at ?? null;
  const stockTimestampText = stockUpdatedAt
    ? formatDateTime(stockUpdatedAt)
    : null;
  const stockRelativeText = stockUpdatedAt
    ? formatRelativeDay(
        stockUpdatedAt,
        headerTimestamp || delta?.date_kst || null
      )
    : null;
  const sharedTimestampText =
    stockTimestampText ||
    (headerTimestamp ? formatDateTime(headerTimestamp) : null);
  const sharedRelativeText = stockTimestampText ? stockRelativeText : null;

  const { data, label, updated_at } = section;
  const shouldShowStockPreview =
    typeof label === "string" && label.includes("주식");
  const introText = (() => {
    switch (label) {
      case "해외 주식":
        return "TOP5 영상에서 포착한 해외 주식 흐름을 글로벌 지표와 함께 다시 정리한 요약입니다.";
      case "국내 가상자산":
        return "TOP5 영상에서 포착한 국내 가상자산 흐름을 주요 온체인·거래 데이터를 묶어 정리한 요약입니다.";
      case "해외 가상자산":
        return "TOP5 영상에서 포착한 해외 가상자산 흐름을 글로벌 거래소의 데이터와 함께 정리한 요약입니다.";
      default:
        return "TOP5 영상에서 포착한 국내 주식 시황을 실시간 시장 지표와 함께 다시 정리한 요약입니다.";
    }
  })();

  const canShowMarketSection =
    !hideMarketSection && delta && marketEntries.length > 0;
  const canShowStockSection = !hideStockSection && hasStocks;
  if (!canShowMarketSection && !canShowStockSection) {
    return null;
  }
  return (
    <Wrapper>
      {canShowMarketSection && showHeader ? (
        <SectionHeader>
          <Title>🧭 마켓 인사이트</Title>
        </SectionHeader>
      ) : null}
      {/* {appliedSlotLabel?.description ? (
        <MarketSectionMeta>{appliedSlotLabel.description}</MarketSectionMeta>
      ) : null} */}
      {canShowMarketSection ? <SectionIntro>{introText}</SectionIntro> : null}

      {/* {delta.quick?.length ? (
        <SectionQuickLines>
          {delta.quick.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </SectionQuickLines>
      ) : null} */}

      {canShowMarketSection && showHeader ? (
        <MarketGrid>
          {marketEntries.map(([marketKey, card]) => (
            <MarketCardWrapper key={`summary-${marketKey}`}>
              <MarketCardHeaderContent card={card} marketKey={marketKey} />
            </MarketCardWrapper>
          ))}
        </MarketGrid>
      ) : null}

      {canShowMarketSection &&
      showHeader &&
      !showDetails &&
      representativeMarketComment ? (
        <MarketSummaryComment>
          {representativeMarketComment.title ? (
            <MarketCommentTitle>
              {representativeMarketComment.title}
            </MarketCommentTitle>
          ) : null}
          <CommentBulletList>
            {representativeMarketComment.bullets.map((bullet, index) => (
              <CommentBulletItem
                key={`representative-market-bullet-${index}`}
                dangerouslySetInnerHTML={{
                  __html: formatCommentBullet(bullet),
                }}
              />
            ))}
          </CommentBulletList>
        </MarketSummaryComment>
      ) : null}

      {canShowMarketSection && showHeader ? (
        <SectionToggleRow>
          <MarketToggleButton
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            aria-expanded={showDetails}
          >
            {showDetails ? "마켓 인사이트 접기" : "마켓 인사이트 펼치기"}
            <ToggleChevron aria-hidden={true} $expanded={showDetails}>
              <span />
            </ToggleChevron>
          </MarketToggleButton>
        </SectionToggleRow>
      ) : null}

      {canShowMarketSection ? (
        <MarketDetailCollapse
          $expanded={shouldRenderDetails}
          aria-hidden={showHeader ? !shouldRenderDetails : false}
        >
          <MarketGrid>
            {marketEntries.map(([marketKey, card]) => {
              const quickLines = card.quick_lines?.filter(Boolean) ?? [];
              const intradayDetail = buildIntradayDetailFromCard(card);
              const liquidityDetail = buildLiquidityDetailFromSentence({
                sentences: card.sentences,
                volume_value_str:
                  typeof card.volume_value_str === "string"
                    ? card.volume_value_str
                    : undefined,
              });
              const flowDetail = buildFlowDetail(card);
              const extraSentences = extractAdditionalSentences(card);

              const headline =
                card.sentences?.headline ||
                card.comment_title ||
                card.sentences?.comment;
              const commentBody = card.comment_body || card.sentences?.comment;
              const commentBullets = normalizeCommentBullets(
                card.comment_bullets
              );
              const showComment = Boolean(
                headline || commentBody || commentBullets.length > 0
              );

              return (
                <MarketCardWrapper key={marketKey}>
                  <MarketCardHeaderContent card={card} marketKey={marketKey} />

                  <MarketDetailBody>
                    {showComment ? (
                      <ExpandableMarketComment
                        title={
                          headline ||
                          card.comment_title ||
                          card.sentences?.comment ||
                          "마켓 코멘트"
                        }
                        commentBody={commentBody}
                        commentBullets={commentBullets}
                      />
                    ) : null}

                    <MarketStatGrid>
                      {intradayDetail ? (
                        <MarketStat>
                          <MarketStatLabel>장중 범위</MarketStatLabel>
                          <IntradayChart>
                            <IntradayIndicator>
                              <IntradayRail />
                              <IntradayFill
                                style={{
                                  left: `${intradayDetail.lowPct}%`,
                                  width: `${Math.max(
                                    intradayDetail.highPct -
                                      intradayDetail.lowPct,
                                    1
                                  )}%`,
                                }}
                              />
                              <IntradayMarker
                                $tone="open"
                                style={{ left: `${intradayDetail.openPct}%` }}
                              />
                              <IntradayMarker
                                $tone="close"
                                style={{ left: `${intradayDetail.closePct}%` }}
                              />
                            </IntradayIndicator>
                            <IntradayLabels>
                              <strong>
                                저 {intradayDetail.low.toLocaleString()}
                              </strong>
                              <span>
                                시 {intradayDetail.open.toLocaleString()}
                              </span>
                              <strong>
                                고 {intradayDetail.high.toLocaleString()}
                              </strong>
                            </IntradayLabels>
                            <IntradaySummary
                              dangerouslySetInnerHTML={{
                                __html: emphasizeNumbers(intradayDetail.text),
                              }}
                            />
                          </IntradayChart>
                        </MarketStat>
                      ) : null}

                      {liquidityDetail ? (
                        <MarketStat>
                          <MarketStatLabel>유동성</MarketStatLabel>
                          <LiquidityBox>
                            <LiquidityRow>
                              <LiquidityLabel>거래량</LiquidityLabel>
                              <LiquidityMeter>
                                <LiquidityTrack>
                                  <LiquidityFill
                                    $tone={liquidityDetail.volumeTone ?? "flat"}
                                    style={{
                                      left: `${toPct(
                                        liquidityDetail.volumeLeft,
                                        50
                                      )}%`,
                                      width: `${Math.max(
                                        toPct(liquidityDetail.volumeWidth, 0),
                                        1
                                      )}%`,
                                    }}
                                  />
                                  <LiquidityPointer
                                    $tone={liquidityDetail.volumeTone ?? "flat"}
                                    style={{
                                      left: `${toPct(
                                        liquidityDetail.volumePointer,
                                        50
                                      )}%`,
                                    }}
                                  />
                                </LiquidityTrack>
                                <LiquidityMeta>
                                  <span>{liquidityDetail.volumeRatioText}</span>
                                  {liquidityDetail.volumeSummary ? (
                                    <ChangeValue
                                      $tone={liquidityDetail.volumeTone}
                                    >
                                      {liquidityDetail.volumeSummary}
                                    </ChangeValue>
                                  ) : null}
                                </LiquidityMeta>
                              </LiquidityMeter>
                            </LiquidityRow>
                            <LiquidityRow>
                              <LiquidityLabel>거래대금</LiquidityLabel>
                              <LiquidityMeter>
                                <LiquidityTrack>
                                  <LiquidityFill
                                    $tone={liquidityDetail.valueTone}
                                    style={{
                                      left: `${liquidityDetail.valueLeft}%`,
                                      width: `${Math.max(
                                        liquidityDetail.valueWidth,
                                        1
                                      )}%`,
                                    }}
                                  />
                                  <LiquidityPointer
                                    $tone={liquidityDetail.valueTone}
                                    style={{
                                      left: `${liquidityDetail.valuePointer}%`,
                                    }}
                                  />
                                </LiquidityTrack>
                                <LiquidityMeta>
                                  <span>{liquidityDetail.valueRatioText}</span>
                                  {liquidityDetail.valueSummary ? (
                                    <ChangeValue
                                      $tone={liquidityDetail.valueTone}
                                    >
                                      {liquidityDetail.valueSummary}
                                    </ChangeValue>
                                  ) : null}
                                </LiquidityMeta>
                              </LiquidityMeter>
                            </LiquidityRow>
                          </LiquidityBox>
                          <StatDescriptor
                            dangerouslySetInnerHTML={{
                              __html: emphasizeNumbers(
                                liquidityDetail.summaryHtml
                              ),
                            }}
                          />
                        </MarketStat>
                      ) : null}

                      {flowDetail ? (
                        <MarketStat>
                          <MarketStatLabel>수급</MarketStatLabel>
                          {flowDetail.share ? (
                            <FlowShareBar>
                              {flowDetail.share.segments.map((segment) => (
                                <FlowShareSegment
                                  key={segment.key}
                                  $color={
                                    FLOW_COLORS[segment.tone] ||
                                    FLOW_COLORS.others
                                  }
                                  style={{ width: `${segment.percent}%` }}
                                >
                                  {segment.label} {segment.percent}%
                                </FlowShareSegment>
                              ))}
                            </FlowShareBar>
                          ) : null}
                          {flowDetail.summary ? (
                            <StatDescriptor
                              dangerouslySetInnerHTML={{
                                __html: emphasizeNumbers(flowDetail.summary),
                              }}
                            />
                          ) : null}
                          {flowDetail.stats.length ? (
                            <FlowStatList>
                              {flowDetail.stats.map((stat) => (
                                <li key={stat.key}>
                                  {stat.label ? (
                                    <strong>{stat.label}</strong>
                                  ) : null}
                                  {stat.value ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: emphasizeNumbers(stat.value),
                                      }}
                                    />
                                  ) : null}
                                </li>
                              ))}
                            </FlowStatList>
                          ) : null}
                          {flowDetail.shift ? (
                            <FlowShiftContainer>
                              {renderFlowShift(flowDetail.shift)}
                            </FlowShiftContainer>
                          ) : null}
                        </MarketStat>
                      ) : null}
                    </MarketStatGrid>
                  </MarketDetailBody>
                </MarketCardWrapper>
              );
            })}
          </MarketGrid>
        </MarketDetailCollapse>
      ) : null}

      {canShowStockSection ? (
        <>
          <StockSubSectionHeader>
            <StockSubSectionTitle>
              📊 종목 인사이트
              {/* {appliedSlotLabel?.title ? (
                <SlotBadge>{appliedSlotLabel.title}</SlotBadge>
              ) : null} */}
            </StockSubSectionTitle>
          </StockSubSectionHeader>
          <StockSubSectionIntro>
            {SOURCE_TAG_TEXT} · {appliedSlotLabel?.description ?? stockIntroText}
          </StockSubSectionIntro>
          <StockList>
            {displayedStocks.map((stock, index) => (
              <StockInsightCard
                key={stock.ticker || stock.stock_name || `stock-${index}`}
                stock={stock}
                sectionLabel={section.label}
                showCommentPreview={shouldShowStockPreview && index < 2}
              />
            ))}
          </StockList>
          {hasMoreStocks ? (
            <StockListToggleRow>
              <StockDetailToggleButton
                type="button"
                onClick={() => setShowAllStocks((prev) => !prev)}
                aria-expanded={showAllStocks}
              >
                {showAllStocks
                  ? "종목 목록 접기"
                  : `${remainingStockCount}개 종목 더 보기`}
                <ToggleChevron aria-hidden={true} $expanded={showAllStocks}>
                  <span />
                </ToggleChevron>
              </StockDetailToggleButton>
            </StockListToggleRow>
          ) : null}
        </>
      ) : null}
    </Wrapper>
  );
};

export default LandingStockMarketSection;

const StockInsightCard = ({
  stock,
  sectionLabel,
  showCommentPreview = false,
}: {
  stock: InsightStock;
  sectionLabel?: string | null;
  showCommentPreview?: boolean;
}) => {
  const insight = stock.metric_insight;
  const insightSections = (insight?.insight_sections ?? []) as Array<
    StockInsightSectionDetail | null | undefined
  >;
  const priceSection = findPricePositionSection(insightSections);

  // ✅ metrics.price 우선 사용
  const metricsPriceInfo = buildPriceInfoFromMetrics(
    stock.metrics?.price as any
  );
  // 섹션 파싱은 fallback
  const parsedPriceInfo = parsePricePosition(priceSection ?? undefined);

  const priceInfo = metricsPriceInfo ?? parsedPriceInfo ?? null;

  const additionalSections = insightSections
    .filter((section): section is StockInsightSectionDetail => {
      return Boolean(section && (section.summary || section.highlights));
    })
    .filter((section) => {
      const category = section.category?.toLowerCase() ?? "";
      const title = section.title?.toLowerCase() ?? "";
      const skipKeywords = ["안정", "유동", "stability", "liquidity"];
      return !skipKeywords.some(
        (keyword) => category.includes(keyword) || title.includes(keyword)
      );
    });

  const commentTitle =
    insight?.comment_title || stock.action_idea?.stance || null;
  const commentBody =
    insight?.comment_body || stock.action_idea?.reason || null;
  const commentBullets = normalizeCommentBullets(
    insight?.comment_bullets || stock.comment_bullets
  );
  const previewBullets = showCommentPreview ? commentBullets.slice(0, 3) : [];
  const hasVideoSources =
    Array.isArray(stock.sources) && stock.sources.length > 0;

  const hasDetailContent = Boolean(
    priceSection?.summary ||
      priceSection?.highlights ||
      commentBody ||
      commentBullets.length > 0 ||
      additionalSections.length
  );
  const [showDetails, setShowDetails] = useState(false);
  const showPreview =
    showCommentPreview && !showDetails && previewBullets.length > 0;
  const detailToggleLabel = showDetails ? "세부 지표 접기" : "세부 지표 펼치기";
  const router = useRouter();
  const user = useRecoilValue(userState);
  const storeEvidencePayload = () => {
    if (typeof window === "undefined") return;
    if (!hasVideoSources) return;
    const sanitizedStock = (() => {
      try {
        return typeof structuredClone === "function"
          ? structuredClone(stock)
          : JSON.parse(JSON.stringify(stock));
      } catch {
        return stock;
      }
    })();
    const payload = {
      section: sectionLabel ?? null,
      stock: sanitizedStock,
    };
    try {
      window.sessionStorage.setItem(
        "evidence:payload",
        JSON.stringify(payload)
      );
    } catch {
      /* ignore */
    }
  };
  const handleEvidenceClick = () => {
    if (!hasVideoSources) return;
    const params = new URLSearchParams();
    if (sectionLabel) params.set("section", sectionLabel);
    if (stock.ticker) params.set("ticker", stock.ticker);
    if (stock.stock_name) params.set("name", stock.stock_name);
    storeEvidencePayload();
    void logCtaClick(
      "evidence_button_click",
      user?.id,
      stock.stock_name,
      getOrCreateAnonId()
    ).catch(() => {});
    router.push(`/evidence?${params.toString()}`);
  };
  const handleAlertClick = () => {
    const params = new URLSearchParams();
    if (stock.stock_name) params.set("focus", stock.stock_name);
    if (stock.ticker) params.set("ticker", stock.ticker);
    router.push(`/subject?${params.toString()}`);
  };

  const videoSourcesContent = hasVideoSources ? (
    <StockVideoSources
      stockName={stock.stock_name ?? ""}
      sources={stock.sources}
      onEvidenceClick={handleEvidenceClick}
      hasVideoSources={hasVideoSources}
    />
  ) : null;

  return (
    <StockCardWrapper>
      <StockHeader>
        <StockTitle>
          {stock.stock_name}
          {priceInfo?.closeText ? (
            <StockPriceValue>{priceInfo.closeText}</StockPriceValue>
          ) : null}
        </StockTitle>
        {priceInfo?.changeText ? (
          <StockDeltaBlock $tone={priceInfo.tone}>
            <strong>{priceInfo.changeText}</strong>
          </StockDeltaBlock>
        ) : null}
      </StockHeader>
      {/* <StockActionDock>
        <StockEvidenceButton
          type="button"
          onClick={handleEvidenceClick}
          disabled={!hasVideoSources}
        >
          📊 {hasVideoSources ? "관련 영상 보기" : "영상 준비 중"}
        </StockEvidenceButton>
        {!hasVideoSources ? (
          <StockActionHint>
            오늘 TOP5 영상에서 아직 언급되지 않았어요.
          </StockActionHint>
        ) : null}
        <StockAlertButton type="button" onClick={handleAlertClick}>
          🔔 종목 알림 켜기
        </StockAlertButton>
      </StockActionDock> */}

      {showPreview ? (
        <StockPreviewComment>
          {commentTitle ? (
            <StockPreviewCommentTitle>종목 코멘트</StockPreviewCommentTitle>
          ) : null}
          <StockCommentBulletList>
            {previewBullets.map((bullet, index) => (
              <StockCommentBulletItem
                key={`${
                  stock.ticker || stock.stock_name
                }-preview-bullet-${index}`}
                dangerouslySetInnerHTML={{
                  __html: formatCommentBullet(bullet),
                }}
              />
            ))}
          </StockCommentBulletList>
        </StockPreviewComment>
      ) : null}
      {hasDetailContent ? (
        <>
          <StockDetailToggleRow>
            <StockDetailToggleButton
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              aria-expanded={showDetails}
            >
              {detailToggleLabel}
              <ToggleChevron aria-hidden={true} $expanded={showDetails}>
                <span />
              </ToggleChevron>
            </StockDetailToggleButton>
          </StockDetailToggleRow>

          <StockDetailCollapse
            $expanded={showDetails}
            aria-hidden={!showDetails}
          >
            <StockDetailBody>
              {/* {priceSummary ? (
                <StockSummary
                  dangerouslySetInnerHTML={{
                    __html: emphasizeNumbers(priceSummary),
                  }}
                />
              ) : null} */}

              {/* {priceHighlights ? (
                <StockHighlights
                  dangerouslySetInnerHTML={{
                    __html: emphasizeNumbers(priceHighlights),
                  }}
                />
              ) : null} */}

              {commentBody || commentBullets.length > 0 ? (
                <StockComment>
                  {commentTitle ? (
                    <StockCommentTitle>{commentTitle}</StockCommentTitle>
                  ) : null}
                  {commentBullets.length > 0 ? (
                    <StockCommentBulletList>
                      {commentBullets.map((bullet, index) => (
                        <StockCommentBulletItem
                          key={`${
                            stock.ticker || stock.stock_name
                          }-comment-bullet-${index}`}
                          dangerouslySetInnerHTML={{
                            __html: formatCommentBullet(bullet),
                          }}
                        />
                      ))}
                    </StockCommentBulletList>
                  ) : commentBody ? (
                    <StockCommentBody
                      dangerouslySetInnerHTML={{
                        __html: formatTextWithSentenceBreaks(commentBody),
                      }}
                    />
                  ) : null}
                </StockComment>
              ) : null}

              {additionalSections.length ? (
                <StockInsightList>
                  {additionalSections.map((section, index) => {
                    const itemKey =
                      section.category ||
                      section.title ||
                      `${stock.ticker || stock.stock_name}-section-${index}`;
                    const normalizedCategory = section.category?.trim();
                    const normalizedTitle = section.title?.trim();
                    const isProfitabilitySection = Boolean(
                      (normalizedCategory &&
                        /수익성/i.test(normalizedCategory)) ||
                        (normalizedTitle && /수익성/i.test(normalizedTitle))
                    );
                    const displayCategory = isProfitabilitySection
                      ? "수익성, 재무 안정 지표"
                      : normalizedCategory;
                    const displayTitle = isProfitabilitySection
                      ? "수익성, 재무 안정 지표"
                      : normalizedTitle;
                    const formattedSummary = formatInsightText(
                      section,
                      section.summary
                    );
                    const isMergedProfitSection = Boolean(
                      displayTitle &&
                        displayTitle.trim() === "수익성, 재무 안정 지표"
                    );
                    const formattedHighlights = isMergedProfitSection
                      ? null
                      : formatInsightText(section, section.highlights);
                    const visualization = buildInsightVisualization(
                      section,
                      stock
                    );

                    return (
                      <StockInsightItem key={itemKey}>
                        {section.category || section.title ? (
                          <StockInsightHeader>
                            {displayCategory ? (
                              <StockInsightBadge>
                                {displayCategory}
                              </StockInsightBadge>
                            ) : null}
                            {displayTitle ? <span>{displayTitle}</span> : null}
                          </StockInsightHeader>
                        ) : null}
                        {visualization ? (
                          <StockInsightVisualization
                            visualization={visualization}
                          />
                        ) : null}
                        {/* {formattedSummary ? (
                          <StockInsightSummary
                            dangerouslySetInnerHTML={{
                              __html: emphasizeNumbers(formattedSummary),
                            }}
                          />
                        ) : null} */}
                        {formattedHighlights ? (
                          <StockInsightHighlights
                            dangerouslySetInnerHTML={{
                              __html: emphasizeNumbers(formattedHighlights),
                            }}
                          />
                        ) : null}
                      </StockInsightItem>
                    );
                  })}
                </StockInsightList>
              ) : null}
            </StockDetailBody>
            {videoSourcesContent}
          </StockDetailCollapse>
        </>
      ) : (
        videoSourcesContent
      )}
    </StockCardWrapper>
  );
};

export const StockInsightVisualization = ({
  visualization,
}: {
  visualization: InsightVisualization;
}) => {
  if (!visualization) return null;
  switch (visualization.type) {
    case "range":
      return <StockInsightRangeViz data={visualization} />;
    case "signedBars":
      return <StockInsightSignedBars data={visualization} />;
    case "bars":
      return <StockInsightPositiveBars data={visualization} />;
    case "delta":
      return <StockInsightDeltaViz data={visualization} />;
    case "flowShift":
      return <StockInsightFlowShiftViz data={visualization} />;
    case "entries":
      return <StockInsightMetricEntries data={visualization} />;
    default:
      return null;
  }
};

const StockInsightRangeViz = ({
  data,
}: {
  data: Extract<InsightVisualization, { type: "range" }>;
}) => {
  const range = Math.max(data.high - data.low, 1);
  const toPercent = (value: number) =>
    Math.min(100, Math.max(0, ((value - data.low) / range) * 100));
  const openMarker = data.markers.find((marker) => marker.key === "open");
  const closeMarker = data.markers.find((marker) => marker.key === "close");
  const formatValue = (value: number) =>
    data.formatter ? data.formatter(value) : value.toLocaleString();

  return (
    <IntradayChart>
      <IntradayIndicator>
        <IntradayRail />
        <IntradayFill
          style={{
            left: "0%",
            width: "100%",
          }}
        />
        {openMarker ? (
          <IntradayMarker
            $tone="open"
            style={{ left: `${toPercent(openMarker.value)}%` }}
          />
        ) : null}
        {closeMarker ? (
          <IntradayMarker
            $tone="close"
            style={{ left: `${toPercent(closeMarker.value)}%` }}
          />
        ) : null}
      </IntradayIndicator>
      <IntradayLabels>
        <strong>저 {formatValue(data.low)}</strong>
        <span>
          {openMarker ? `시 ${formatValue(openMarker.value)}` : ""}
          {openMarker && closeMarker ? " · " : ""}
          {closeMarker ? `종 ${formatValue(closeMarker.value)}` : ""}
        </span>
        <strong>고 {formatValue(data.high)}</strong>
      </IntradayLabels>
      {/* {closeMarker ? (
        <IntradaySummary>
          종가 위치: {formatValue(closeMarker.value)}
        </IntradaySummary>
      ) : null} */}
    </IntradayChart>
  );
};

const StockInsightSignedBars = ({
  data,
}: {
  data: Extract<InsightVisualization, { type: "signedBars" }>;
}) => {
  const absMax =
    data.max ??
    data.items.reduce((acc, item) => Math.max(acc, Math.abs(item.value)), 0);
  const safeMax = absMax > 0 ? absMax : 1;

  return (
    <>
      {data.contextLabel ? (
        <InsightContextLabel>{data.contextLabel}</InsightContextLabel>
      ) : null}
      <InsightBarList>
        {data.items.map((item) => {
          const width = Math.min(50, (Math.abs(item.value) / safeMax) * 50);
          const left = item.value >= 0 ? 50 : 50 - width;
          const tone = item.tone || toneFromValue(item.value);
          const valueText =
            item.display ||
            data.formatter?.(item.value) ||
            item.value.toLocaleString();
          return (
            <InsightBarRow key={item.key}>
              <InsightBarLabel>{item.label}</InsightBarLabel>
              <SignedBarTrack>
                <SignedCenterLine />
                <SignedBarSegment
                  $tone={tone}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </SignedBarTrack>
              <InsightBarValue $tone={tone}>{valueText}</InsightBarValue>
            </InsightBarRow>
          );
        })}
      </InsightBarList>
    </>
  );
};

const StockInsightPositiveBars = ({
  data,
}: {
  data: Extract<InsightVisualization, { type: "bars" }>;
}) => {
  const maxValue =
    data.max ?? data.items.reduce((acc, item) => Math.max(acc, item.value), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;

  return (
    <InsightBarList>
      {data.items.map((item) => {
        const positiveValue = Math.max(0, item.value);
        const width = Math.min(100, (positiveValue / safeMax) * 100);
        const tone = item.tone || (item.value >= 0 ? "positive" : "negative");
        const valueText =
          item.display ||
          data.formatter?.(item.value) ||
          item.value.toLocaleString();
        return (
          <InsightBarRow key={item.key}>
            <InsightBarLabel>{item.label}</InsightBarLabel>
            <PositiveBarTrack>
              <PositiveBarFill $tone={tone} style={{ width: `${width}%` }} />
            </PositiveBarTrack>
            <InsightBarValue $tone={tone}>{valueText}</InsightBarValue>
          </InsightBarRow>
        );
      })}
    </InsightBarList>
  );
};

const StockInsightDeltaViz = ({
  data,
}: {
  data: Extract<InsightVisualization, { type: "delta" }>;
}) => {
  const formatValue = (value: number, preset?: string) => {
    if (preset) return preset;
    if (data.formatter) return data.formatter(value);
    return formatNumberCompact(value);
  };

  const derivedItems = data.items.map((item) => {
    const previousValue = isFiniteNumber(item.previous)
      ? (item.previous as number)
      : null;
    const changePct =
      previousValue != null && previousValue !== 0
        ? ((item.current - previousValue) / previousValue) * 100
        : null;
    const currentValueText = formatValue(item.current, item.currentDisplay);
    const previousValueText =
      previousValue != null
        ? formatValue(previousValue, item.previousDisplay)
        : null;
    return {
      item,
      previousValue,
      changePct,
      currentValueText,
      previousValueText,
    };
  });

  const maxAbsChange = derivedItems.reduce((acc, entry) => {
    if (entry.changePct == null) return acc;
    return Math.max(acc, Math.abs(entry.changePct));
  }, 0);
  const safeChangeMax = maxAbsChange > 0 ? maxAbsChange : 1;

  return (
    <InsightDeltaBox>
      <InsightContextLabel>
        {data.contextLabel || "오늘 ↔ 전일 비교"}
      </InsightContextLabel>
      <InsightBarList>
        {derivedItems.map(
          ({
            item,
            previousValue,
            changePct,
            currentValueText,
            previousValueText,
          }) => {
            const changeTone =
              changePct == null
                ? "neutral"
                : changePct >= 0
                ? "positive"
                : "negative";
            const changeText =
              changePct == null
                ? null
                : `${changePct >= 0 ? "+" : "-"}${Math.abs(changePct).toFixed(
                    1
                  )}%`;
            const detailText = previousValueText
              ? `오늘 ${currentValueText} · 전일 ${previousValueText}`
              : `오늘 ${currentValueText}`;
            const changeLabel = changeText
              ? `전일 대비 ${changeText}`
              : detailText;
            const widthPct =
              changePct == null
                ? 0
                : Math.min(50, (Math.abs(changePct) / safeChangeMax) * 50);
            const leftPct =
              changePct == null ? 50 : changePct >= 0 ? 50 : 50 - widthPct;
            return (
              <InsightDeltaRow key={item.key}>
                <InsightBarLabel>{item.label}</InsightBarLabel>
                <InsightDeltaTrackWrapper>
                  <SignedBarTrack className="StockMarketSection__SignedBarTrack">
                    <SignedCenterLine />
                    {changePct != null ? (
                      <SignedBarSegment
                        $tone={changeTone}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      />
                    ) : null}
                  </SignedBarTrack>
                </InsightDeltaTrackWrapper>
                <InsightDeltaValues
                  className="StockMarketSection__InsightDeltaValues"
                  title={detailText}
                  aria-label={changeLabel}
                >
                  {changeText ? (
                    <InsightDeltaChange
                      as="strong"
                      className="StockMarketSection__InsightDeltaChange"
                      $tone={changeTone}
                    >
                      {changeText}
                    </InsightDeltaChange>
                  ) : (
                    <>
                      <strong>{currentValueText}</strong>
                      {previousValueText ? (
                        <span>전일 {previousValueText}</span>
                      ) : null}
                    </>
                  )}
                </InsightDeltaValues>
              </InsightDeltaRow>
            );
          }
        )}
      </InsightBarList>
    </InsightDeltaBox>
  );
};

const StockInsightFlowShiftViz = ({
  data,
}: {
  data: Extract<InsightVisualization, { type: "flowShift" }>;
}) => {
  const maxAmount = data.items.reduce((acc, item) => {
    return Math.max(
      acc,
      Math.abs(item.todayAmount || 0),
      Math.abs(item.prevAmount || 0)
    );
  }, 0);

  const safeMax = maxAmount > 0 ? maxAmount : 1;

  return (
    <>
      {data.contextLabel ? (
        <InsightContextLabel>{data.contextLabel}</InsightContextLabel>
      ) : null}
      <FlowShiftContainer>
        {data.items.map((item) => {
          const todayWidth = Math.min(
            50,
            (Math.abs(item.todayAmount) / safeMax) * 50
          );
          const prevWidth = Math.min(
            50,
            (Math.abs(item.prevAmount) / safeMax) * 50
          );
          const todayLeft = item.todayAmount >= 0 ? 50 : 50 - todayWidth;
          const prevLeft = item.prevAmount >= 0 ? 50 : 50 - prevWidth;
          const deltaAmount =
            item.deltaAmount != null
              ? item.deltaAmount
              : item.todayAmount - item.prevAmount;
          const unitLabel = data.unitLabel || "주";

          return (
            <FlowShiftItem key={item.key}>
              <FlowShiftLabel>{item.label}</FlowShiftLabel>
              <FlowShiftBars>
                <FlowShiftRow>
                  <FlowShiftBadge>오늘</FlowShiftBadge>
                  <FlowShiftTrack>
                    <FlowShiftBar
                      $tone={item.todayAmount >= 0 ? "positive" : "negative"}
                      style={{
                        left: `${todayLeft}%`,
                        width: `${todayWidth}%`,
                      }}
                    />
                  </FlowShiftTrack>
                  <FlowShiftValue $tone={toneFromValue(item.todayAmount)}>
                    {formatSignedNumberCompact(item.todayAmount)}
                    {unitLabel}
                  </FlowShiftValue>
                </FlowShiftRow>
                <FlowShiftRow>
                  <FlowShiftBadge $variant="muted">전일</FlowShiftBadge>
                  <FlowShiftTrack>
                    <FlowShiftBar
                      $tone={item.prevAmount >= 0 ? "positive" : "negative"}
                      style={{
                        left: `${prevLeft}%`,
                        width: `${prevWidth}%`,
                      }}
                    />
                  </FlowShiftTrack>
                  <FlowShiftValue $tone={toneFromValue(item.prevAmount)}>
                    {formatSignedNumberCompact(item.prevAmount)}
                    {unitLabel}
                  </FlowShiftValue>
                </FlowShiftRow>
                <FlowShiftQuantity>
                  전일 대비 {formatSignedNumberCompact(deltaAmount)}
                  {unitLabel}
                </FlowShiftQuantity>
              </FlowShiftBars>
            </FlowShiftItem>
          );
        })}
      </FlowShiftContainer>
    </>
  );
};

const StockInsightMetricEntries = ({
  data,
}: {
  data: Extract<InsightVisualization, { type: "entries" }>;
}) => {
  if (!data.items.length) return null;
  return (
    <InsightMetricEntriesWrapper>
      {/* {data.contextLabel ? (
        <InsightContextLabel>{data.contextLabel}</InsightContextLabel>
      ) : null} */}
      <InsightMetricEntryGrid>
        {data.items.map((item) => (
          <InsightMetricEntryCard key={item.key}>
            <InsightMetricEntryLabel>
              {item.label}
              {item.description ? <small>{item.description}</small> : null}
            </InsightMetricEntryLabel>
            <InsightMetricEntryValue $tone={item.tone}>
              {item.value}
            </InsightMetricEntryValue>
          </InsightMetricEntryCard>
        ))}
      </InsightMetricEntryGrid>
    </InsightMetricEntriesWrapper>
  );
};

const MarketCardHeaderContent = ({
  card,
  marketKey,
}: {
  card: InsightMarketDeltaCard;
  marketKey: string;
}) => {
  const changeMeta = buildMarketChangeMeta(card);

  return (
    <MarketCardHeader className="StockMarketSection__MarketCardHeader">
      <MarketTitle>
        {card.market || marketKey}
        {card.price_str ? <strong>{card.price_str}</strong> : null}
      </MarketTitle>
      {changeMeta.text ? (
        <MarketChange $positive={changeMeta.isPositive}>
          {changeMeta.text}
        </MarketChange>
      ) : null}
    </MarketCardHeader>
  );
};

const ExpandableMarketComment = ({
  title,
  commentBody,
  commentBullets,
}: {
  title?: string | null;
  commentBody?: string | null;
  commentBullets: string[];
}) => {
  const [expanded, setExpanded] = useState(false);
  const previewBullets = expanded
    ? commentBullets
    : commentBullets.slice(0, 3);
  const normalizedBodyLength = commentBody
    ? commentBody.replace(/<[^>]+>/g, "").length
    : 0;
  const shouldClampBody =
    commentBullets.length === 0 && normalizedBodyLength > 180;
  const needsToggle =
    commentBullets.length > previewBullets.length || shouldClampBody;

  return (
    <MarketComment $withBorder={!commentBody && commentBullets.length === 0}>
      {title ? <MarketCommentTitle>{title}</MarketCommentTitle> : null}
      {previewBullets.length > 0 ? (
        <CommentBulletList>
          {previewBullets.map((bullet, index) => (
            <CommentBulletItem
              key={`delta-comment-bullet-${index}`}
              dangerouslySetInnerHTML={{
                __html: formatCommentBullet(bullet),
              }}
            />
          ))}
        </CommentBulletList>
      ) : commentBody ? (
        <MarketCommentBody
          $clamped={!expanded && shouldClampBody}
          dangerouslySetInnerHTML={{
            __html: formatTextWithSentenceBreaks(commentBody),
          }}
        />
      ) : null}
      {needsToggle ? (
        <CommentToggleButton
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? "간단히 보기" : "자세히 보기"}
          <ToggleChevron $expanded={expanded} aria-hidden={true}>
            <span />
          </ToggleChevron>
        </CommentToggleButton>
      ) : null}
    </MarketComment>
  );
};

function buildFlowDetail(card: InsightMarketDeltaCard) {
  const summary = [
    card.flows?.summary,
    card.sentences?.flows_summary,
    card.sentences?.flow_detail,
    card.sentences?.flow_shift,
  ].find((value): value is string => Boolean(value && value.trim().length > 0));
  const stats = (card.flows?.stats || [])
    .filter((stat) => Boolean(stat && (stat.label || stat.value)))
    .map((stat, index) => ({
      key: stat?.key || stat?.label || String(index),
      label: stat?.label,
      value: stat?.value,
    }));

  const share = buildFlowShareDetail(card);
  const shift = buildFlowShiftDetail(card);
  if (!summary && stats.length === 0 && !share && !shift) {
    return null;
  }

  return {
    summary,
    stats,
    share,
    shift,
  };
}

export function buildInsightVisualization(
  section: StockInsightSectionDetail,
  stock: InsightStock
): InsightVisualization | null {
  const metrics = stock.metrics;
  if (!metrics || !section) return null;

  const matches = (...keywords: string[]) =>
    sectionMatches(section, keywords.filter(Boolean));
  const currency = (metrics as { currency?: string | null })?.currency;

  if (matches("price_position", "가격", "price")) {
    const price = metrics.price as StockPriceMetrics | undefined;
    if (!price) return null;
    const candidates = [price.low, price.high, price.open, price.close].filter(
      isFiniteNumber
    );
    if (candidates.length < 2) return null;
    const low = isFiniteNumber(price.low) ? price.low : Math.min(...candidates);
    const high = isFiniteNumber(price.high)
      ? price.high
      : Math.max(...candidates);
    if (high <= low) return null;

    const markers: RangeMarker[] = [];
    if (isFiniteNumber(price.open)) {
      markers.push({ key: "open", label: "시가", value: price.open! });
    }
    if (isFiniteNumber(price.close)) {
      const deltaTone = (() => {
        if (isFiniteNumber(price.change_pct)) {
          return toneFromValue(price.change_pct!);
        }
        if (isFiniteNumber(price.prev_close)) {
          return toneFromValue((price.close ?? 0) - (price.prev_close ?? 0));
        }
        return "neutral" as PriceTone;
      })();
      markers.push({
        key: "close",
        label: "종가",
        value: price.close!,
        tone: deltaTone,
      });
    }

    return {
      type: "range",
      low,
      high,
      markers,
      formatter: (value) => formatPriceWithCurrency(value, currency),
    };
  }

  if (matches("flows", "수급", "flow")) {
    const flows = metrics.flows;
    if (!flows) return null;
    const flowShiftViz = buildStockFlowShiftVisualization(metrics);
    if (flowShiftViz) {
      return flowShiftViz;
    }
    const items: InsightBarItem[] = [
      flows.foreign?.qty,
      flows.institution?.qty,
      flows.individual?.qty,
    ]
      .map((value, index) => {
        if (!isFiniteNumber(value)) return null;
        const labels = ["외국인", "기관", "개인"];
        const key = ["foreign", "institution", "individual"][index];
        return {
          key,
          label: labels[index],
          value: value!,
          display: `${formatSignedNumberCompact(value!)}주`,
          tone: toneFromValue(value!),
        } satisfies InsightBarItem;
      })
      .filter(Boolean) as InsightBarItem[];
    if (!items.length) return null;
    return {
      type: "signedBars",
      items,
      formatter: (value) => `${formatSignedNumberCompact(value)}주`,
    };
  }

  if (matches("liquidity", "유동성")) {
    const liquidity = metrics.liquidity;
    if (!liquidity) return null;

    const pickNumber = (
      ...candidates: Array<number | null | undefined>
    ): number | null => {
      for (const candidate of candidates) {
        if (isFiniteNumber(candidate)) {
          return candidate as number;
        }
      }
      return null;
    };

    const buildDeltaItem = ({
      key,
      label,
      currentCandidates,
      previousCandidates = [],
      changePct,
      formatter,
    }: {
      key: string;
      label: string;
      currentCandidates: Array<number | null | undefined>;
      previousCandidates?: Array<number | null | undefined>;
      changePct?: number | null;
      formatter?: (value: number) => string;
    }): InsightDeltaItem | null => {
      const current = pickNumber(...currentCandidates);
      if (current == null) return null;

      let previous = pickNumber(...previousCandidates);
      const pctValue = isFiniteNumber(changePct) ? (changePct as number) : null;
      if (previous == null && pctValue != null) {
        const ratio = 1 + pctValue / 100;
        if (Math.abs(ratio) > 1e-6) {
          const derived = current / ratio;
          if (Number.isFinite(derived)) {
            previous = derived;
          }
        }
      }

      const item: InsightDeltaItem = {
        key,
        label,
        current,
      };

      if (isFiniteNumber(previous)) {
        item.previous = previous as number;
      }

      if (formatter) {
        item.currentDisplay = formatter(current);
        if (item.previous != null) {
          item.previousDisplay = formatter(item.previous);
        }
      }

      return item;
    };

    const items: InsightDeltaItem[] = [];
    const volumeItem = buildDeltaItem({
      key: "volume",
      label: "거래량",
      currentCandidates: [liquidity.latest?.volume, liquidity.volume],
      previousCandidates: [liquidity.previous?.volume],
      changePct: liquidity.volume_change_pct,
      formatter: (value) => `${formatNumberCompact(value)}주`,
    });
    if (volumeItem) {
      items.push(volumeItem);
    }

    const valueItem = buildDeltaItem({
      key: "value",
      label: "거래대금",
      currentCandidates: [liquidity.latest?.value, liquidity.value],
      previousCandidates: [liquidity.previous?.value],
      changePct: liquidity.value_change_pct,
      formatter: (value) => formatKrwLarge(value),
    });
    if (valueItem) {
      items.push(valueItem);
    }

    if (!items.length) return null;

    return {
      type: "delta",
      items,
      formatter: (value) => formatNumberCompact(value),
      contextLabel: "오늘 ↔ 전일",
    };
  }

  if (matches("earnings_growth", "실적", "성장")) {
    const entries = buildEarningsEntries(
      section,
      metrics as InsightStockMetrics
    );
    const opGrowth = metrics.earnings?.op_profit_growth_pct;
    const netGrowth = metrics.earnings?.net_profit_growth_pct;
    const shouldUseEntries =
      entries.length > 0 && opGrowth === 0 && netGrowth === 0;

    if (shouldUseEntries) {
      return {
        type: "entries",
        items: entries,
        contextLabel: "실적 지표",
      };
    }

    const earnings = metrics.earnings;
    if (!earnings) return null;
    const items: InsightBarItem[] = [
      {
        key: "sales_growth",
        label: "매출",
        value: earnings.sales_growth_pct,
      },
      {
        key: "op_growth",
        label: "영업이익",
        value: earnings.op_profit_growth_pct,
      },
      {
        key: "net_growth",
        label: "순이익",
        value: earnings.net_profit_growth_pct,
      },
    ]
      .filter((item) => isFiniteNumber(item.value))
      .map((item) => ({
        ...item,
        display:
          formatPercentValue(item.value, { showSign: true }) ?? undefined,
      })) as InsightBarItem[];
    if (!items.length) return null;
    return {
      type: "signedBars",
      items,
      formatter: (value) =>
        formatPercentValue(value, { showSign: true }) ?? `${value}%`,
      contextLabel: "전년 동기간 대비",
    };
  }

  if (matches("capital_scale", "규모", "자산")) {
    const capital = metrics.capital;
    const capitalChange = parseCapitalChangeFromSection(section);

    const changeItems = buildCapitalChangeItems(capitalChange);
    if (changeItems.length) {
      return {
        type: "signedBars",
        items: changeItems,
        formatter: (value) =>
          formatPercentValue(value, { showSign: true }) ?? `${value}%`,
        contextLabel: "자산·자본 증감률",
      };
    }

    if (!capital) return null;
    const items: InsightBarItem[] = [
      {
        key: "total_assets",
        label: "총자산",
        value: capital.total_assets,
      },
      {
        key: "total_equity",
        label: "총자본",
        value: capital.total_equity,
      },
    ]
      .filter((item) => isFiniteNumber(item.value))
      .map((item) => ({
        key: item.key,
        label: item.label,
        value: item.value as number,
        display: formatKrwLarge(item.value as number),
      }));
    if (!items.length) return null;
    return {
      type: "bars",
      items,
      formatter: (value) => formatKrwLarge(value),
    };
  }

  if (matches("profitability", "수익성")) {
    const entries = [
      ...buildProfitabilityEntries(metrics),
      ...buildStabilityEntries(metrics),
    ];
    if (!entries.length) return null;
    return {
      type: "entries",
      items: entries,
      contextLabel: "수익성, 재무 안정 지표",
    };
  }

  if (matches("stability_liquidity", "안정", "부채")) {
    const stabilityEntries = buildStabilityEntries(metrics);
    if (!stabilityEntries.length) return null;
    const hasProfitEntries = buildProfitabilityEntries(metrics).length > 0;
    if (hasProfitEntries) {
      return null;
    }
    return {
      type: "entries",
      items: stabilityEntries,
      contextLabel: "재무 안정성 지표",
    };
  }

  return null;
}

function sectionMatches(
  section: StockInsightSectionDetail,
  keywords: string[]
) {
  if (!keywords.length) return false;
  const category = section.category?.toLowerCase() ?? "";
  const title = section.title?.toLowerCase() ?? "";
  return keywords.some((keyword) => {
    const normalized = keyword.toLowerCase();
    return (
      (category &&
        (category === normalized || category.includes(normalized))) ||
      (title && title.includes(normalized))
    );
  });
}

type CapitalChangeDetail = {
  assets?: number | null;
  equity?: number | null;
};

function parseCapitalChangeFromSection(
  section: StockInsightSectionDetail
): CapitalChangeDetail | null {
  const source = section.highlights || section.summary;
  if (!source || typeof source !== "string") return null;
  const normalized = source
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;

  const assets = extractCapitalChange(normalized, ["총자산", "자산"]);
  const equity = extractCapitalChange(normalized, [
    "총자본",
    "자본",
    "자본총계",
  ]);

  if (!isFiniteNumber(assets) && !isFiniteNumber(equity)) {
    return null;
  }

  return { assets: assets ?? null, equity: equity ?? null };
}

const POSITIVE_HINT_REGEX = /(증가|확대|강화|확장|개선|상승|호전|늘어)/i;
const NEGATIVE_HINT_REGEX = /(감소|축소|위축|약화|악화|둔화|하락|줄어)/i;

function extractCapitalChange(text: string, keywords: string[]) {
  for (const keyword of keywords) {
    const regex = new RegExp(
      `${keyword}[^0-9+\-]{0,20}([+\-]?\d[\d.,]*)\s*%([^.,;)]*)`,
      "i"
    );
    const match = regex.exec(text);
    if (!match) continue;
    const rawValue = match[1]?.replace(/,/g, "");
    if (!rawValue) continue;
    let value = Number.parseFloat(rawValue);
    if (!Number.isFinite(value)) continue;
    const hasExplicitSign = /^[+-]/.test(match[1]?.trim() ?? "");
    if (!hasExplicitSign) {
      const afterContext = (match[2] ?? "").trim();
      const numberOffset = match[0].indexOf(match[1] ?? "");
      const keywordIndex = match.index ?? text.indexOf(match[0]);
      const numberStartIndex =
        keywordIndex + (numberOffset >= 0 ? numberOffset : 0);
      const beforeContext = text.slice(
        Math.max(0, numberStartIndex - 12),
        numberStartIndex
      );
      const context = `${beforeContext} ${afterContext}`.trim();
      if (NEGATIVE_HINT_REGEX.test(context)) {
        value = -Math.abs(value);
      } else if (POSITIVE_HINT_REGEX.test(context)) {
        value = Math.abs(value);
      }
    }
    return value;
  }
  return null;
}

function buildCapitalChangeItems(change?: CapitalChangeDetail | null) {
  const items: InsightBarItem[] = [];
  if (!change) return items;

  const pushItem = (key: string, label: string, value?: number | null) => {
    if (!isFiniteNumber(value)) return;
    const numericValue = value as number;
    items.push({
      key,
      label,
      value: numericValue,
      display:
        formatPercentValue(numericValue, { showSign: true }) ??
        `${numericValue}%`,
      tone:
        numericValue > 0
          ? "positive"
          : numericValue < 0
          ? "negative"
          : "neutral",
    });
  };

  pushItem("assets_change_pct", "총자산", change.assets);
  pushItem("equity_change_pct", "총자본", change.equity);

  return items;
}

function buildStockFlowShiftVisualization(
  metrics?: InsightStockMetrics | null
): Extract<InsightVisualization, { type: "flowShift" }> | null {
  const flows = metrics?.flows as
    | (InsightStockMetrics["flows"] & {
        foreign?: { qty?: number; prev_qty?: number; d_qty?: number };
        institution?: { qty?: number; prev_qty?: number; d_qty?: number };
        individual?: { qty?: number; prev_qty?: number; d_qty?: number };
      })
    | undefined;

  if (!flows) return null;

  const participants: Array<{
    key: "foreign" | "institution" | "individual";
    label: string;
    node?: { qty?: number; prev_qty?: number; d_qty?: number };
  }> = [
    { key: "foreign", label: "외국인", node: flows.foreign },
    { key: "institution", label: "기관", node: flows.institution },
    { key: "individual", label: "개인", node: flows.individual },
  ];

  const items: InsightFlowShiftItem[] = [];

  participants.forEach(({ key, label, node }) => {
    if (!node) return;
    const todayAmount = toOptionalNumber(node.qty);
    const prevAmount = toOptionalNumber(node.prev_qty);
    if (todayAmount == null && prevAmount == null) return;
    const deltaAmount =
      toOptionalNumber(node.d_qty) ??
      (todayAmount != null && prevAmount != null
        ? todayAmount - prevAmount
        : null);

    items.push({
      key,
      label,
      todayAmount: todayAmount ?? 0,
      prevAmount: prevAmount ?? 0,
      deltaAmount,
    });
  });

  if (items.length === 0) {
    return null;
  }

  return {
    type: "flowShift",
    items,
    contextLabel: "오늘 ↔ 전일 수급",
    unitLabel: "주",
  };
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function buildEarningsEntries(
  section: StockInsightSectionDetail,
  metrics?: InsightStockMetrics
) {
  const entries: InsightMetricEntry[] = [];
  const source = section.highlights || section.summary || "";
  const normalized = source
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parsedAmounts = parseEarningsAmounts(normalized);
  const parsedGrowth = parseEarningsGrowth(normalized);
  const earnings = metrics?.earnings;

  const pushEntry = (
    key: string,
    label: string,
    amount?: number | null,
    growth?: number | null
  ) => {
    if (!isFiniteNumber(amount) && !isFiniteNumber(growth)) {
      return;
    }

    const numericAmount = isFiniteNumber(amount) ? (amount as number) : null;
    const numericGrowth = isFiniteNumber(growth) ? (growth as number) : null;

    const valueText =
      numericAmount != null
        ? formatKrwShort(numericAmount)
        : numericGrowth != null
        ? formatPercentDisplay(numericGrowth, { showSign: true }) ?? "-"
        : "-";

    const growthText =
      numericGrowth != null
        ? formatPercentValue(numericGrowth, { showSign: true })
        : null;

    entries.push({
      key,
      label,
      value: valueText,
      description: growthText ? `전년 대비 ${growthText}` : undefined,
      tone:
        numericGrowth == null
          ? undefined
          : numericGrowth > 0
          ? "positive"
          : numericGrowth < 0
          ? "negative"
          : "neutral",
    });
  };

  pushEntry(
    "sales",
    "매출",
    earnings?.sales ?? parsedAmounts.sales,
    earnings?.sales_growth_pct ?? parsedGrowth.sales
  );

  pushEntry(
    "op_profit",
    "영업이익",
    earnings?.op_profit ?? parsedAmounts.opProfit,
    earnings?.op_profit_growth_pct ?? parsedGrowth.opProfit
  );

  pushEntry(
    "net_profit",
    "순이익",
    earnings?.net_profit ?? parsedAmounts.netProfit,
    earnings?.net_profit_growth_pct ?? parsedGrowth.netProfit
  );

  return entries.filter(Boolean);
}

function parseEarningsAmounts(source: string) {
  const result: {
    sales?: number | null;
    opProfit?: number | null;
    netProfit?: number | null;
  } = {};

  result.sales = extractCurrencyValue(source, /매출/);
  result.opProfit = extractCurrencyValue(source, /영업이익/);
  result.netProfit = extractCurrencyValue(source, /순이익/);

  return result;
}

function parseEarningsGrowth(source: string) {
  const normalized = source;
  return {
    sales: extractPercentChangeValue(normalized, ["매출"]),
    opProfit: extractPercentChangeValue(normalized, ["영업이익"]),
    netProfit: extractPercentChangeValue(normalized, ["순이익"]),
  } as {
    sales?: number | null;
    opProfit?: number | null;
    netProfit?: number | null;
  };
}

function extractPercentChangeValue(text: string, keywords: string[]) {
  return extractCapitalChange(text, keywords);
}

function extractCurrencyValue(text: string, keyword: RegExp) {
  const pattern = new RegExp(
    `${keyword.source}[^0-9]*([0-9,\\s조억만천]+)(?:원|krw|KRW)`,
    "i"
  );
  const match = pattern.exec(text);
  if (!match) return null;
  const rawValue = match[1]?.trim();
  if (!rawValue) return null;
  return parseKoreanCurrencyString(rawValue);
}

function parseKoreanCurrencyString(raw: string) {
  if (typeof raw !== "string") return null;
  const sanitized = raw
    .replace(/,/g, "")
    .replace(/원|krw/gi, "")
    .trim();
  if (!sanitized) return null;

  const tokenRegex = /([0-9]+(?:\.[0-9]+)?)(조|억|만|천)?/g;
  let match: RegExpExecArray | null;
  let total = 0;
  let matched = false;

  while ((match = tokenRegex.exec(sanitized)) !== null) {
    const value = parseFloat(match[1]);
    if (!Number.isFinite(value)) continue;
    matched = true;
    const unit = match[2];
    switch (unit) {
      case "조":
        total += value * 1_000_000_000_000;
        break;
      case "억":
        total += value * 100_000_000;
        break;
      case "만":
        total += value * 10_000;
        break;
      case "천":
        total += value * 1_000;
        break;
      default:
        total += value;
        break;
    }
  }

  if (matched) {
    return total;
  }

  const digitsOnly = sanitized.replace(/[^0-9.]/g, "");
  if (!digitsOnly) return null;
  const numeric = Number(digitsOnly);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildProfitabilityEntries(metrics?: InsightStockMetrics | null) {
  const entries: InsightMetricEntry[] = [];
  const profitability = metrics?.profitability;
  if (!profitability) return entries;

  const addEntry = (
    key: string,
    label: string,
    description: string,
    value?: number | null
  ) => {
    if (!isFiniteNumber(value)) return;
    entries.push({
      key,
      label,
      description,
      value: formatPercentDisplay(value),
      tone: value != null && value < 0 ? "negative" : "positive",
    });
  };

  addEntry("roe_pct", "ROE", "자기자본이익률", profitability.roe_pct);
  addEntry(
    "gpm_pct",
    "매출총이익률",
    "원가를 뺀 뒤 남는 비율",
    profitability.gpm_pct
  );
  addEntry(
    "npm_pct",
    "순이익률",
    "모든 비용을 뺀 남는 비율",
    profitability.npm_pct
  );

  return entries;
}

function buildStabilityEntries(metrics?: InsightStockMetrics | null) {
  const entries: InsightMetricEntry[] = [];
  const stability = metrics?.stability_liquidity;
  if (!stability) return entries;

  const addEntry = (
    key: string,
    label: string,
    description: string,
    value?: number | null
  ) => {
    if (!isFiniteNumber(value)) return;
    entries.push({
      key,
      label,
      description,
      value: formatPercentDisplay(value),
    });
  };

  addEntry(
    "current_ratio",
    "유동비율",
    "단기 부채 상환 능력",
    stability.current_ratio_pct
  );
  addEntry(
    "quick_ratio",
    "당좌비율",
    "재고 제외 단기 지급능력",
    stability.quick_ratio_pct
  );
  addEntry(
    "debt_ratio",
    "부채비율",
    "자본 대비 부채 규모",
    stability.debt_ratio_pct
  );

  return entries;
}

function renderFlowShift(detail: ReturnType<typeof buildFlowShiftDetail>) {
  if (!detail) return null;
  const maxAmount = detail.items.reduce((acc, item) => {
    return Math.max(
      acc,
      Math.abs(item.todayAmount || 0),
      Math.abs(item.prevAmount || 0)
    );
  }, 0);

  const safeMax = maxAmount > 0 ? maxAmount : 1;

  return detail.items.map((item) => {
    const todayWidth = Math.min(
      50,
      (Math.abs(item.todayAmount) / safeMax) * 50
    );
    const prevWidth = Math.min(50, (Math.abs(item.prevAmount) / safeMax) * 50);
    const todayLeft = item.todayAmount >= 0 ? 50 : 50 - todayWidth;
    const prevLeft = item.prevAmount >= 0 ? 50 : 50 - prevWidth;
    return (
      <FlowShiftItem key={item.key}>
        <FlowShiftLabel>{item.label}</FlowShiftLabel>
        <FlowShiftBars>
          <FlowShiftRow>
            <FlowShiftBadge>어제</FlowShiftBadge>
            <FlowShiftTrack>
              <FlowShiftBar
                $tone={item.todayAmount >= 0 ? "positive" : "negative"}
                style={{ left: `${todayLeft}%`, width: `${todayWidth}%` }}
              />
            </FlowShiftTrack>
            <FlowShiftValue $tone={toneFromValue(item.todayAmount)}>
              {formatSignedCurrencyCompact(item.todayAmount)}
            </FlowShiftValue>
          </FlowShiftRow>
          <FlowShiftRow>
            <FlowShiftBadge $variant="muted">그제</FlowShiftBadge>
            <FlowShiftTrack>
              <FlowShiftBar
                $tone={item.prevAmount >= 0 ? "positive" : "negative"}
                style={{ left: `${prevLeft}%`, width: `${prevWidth}%` }}
              />
            </FlowShiftTrack>
            <FlowShiftValue $tone={toneFromValue(item.prevAmount)}>
              {formatSignedCurrencyCompact(item.prevAmount)}
            </FlowShiftValue>
          </FlowShiftRow>
          <FlowShiftQuantity>
            수량 {formatSignedNumberCompact(item.todayQty)}주 (전일{" "}
            {formatSignedNumberCompact(item.prevQty)}주)
          </FlowShiftQuantity>
        </FlowShiftBars>
      </FlowShiftItem>
    );
  });
}

function findPricePositionSection(
  sections: Array<StockInsightSectionDetail | null | undefined>
) {
  return sections.find((section) => {
    if (!section) return false;
    const category = section.category?.toLowerCase();
    const title = section.title?.toLowerCase();
    return (
      category === "price_position" ||
      (title ? title.includes("가격") || title.includes("price") : false)
    );
  });
}

const flattenRichText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => flattenRichText(entry)).join(" ");
  }
  if (typeof value === "object") {
    const candidate = (value as { text?: unknown }).text;
    if (typeof candidate === "string") return candidate;
    return Object.values(value as Record<string, unknown>)
      .map((entry) => flattenRichText(entry))
      .join(" ");
  }
  return "";
};

function parsePricePosition(section?: {
  summary?: string | null;
  highlights?: string | null;
}) {
  if (!section) return null;
  const source = section.highlights ?? section.summary;
  const sourceText = flattenRichText(source).trim();
  if (!sourceText) return null;

  const sanitized = sourceText
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const closeMatch = sanitized.match(
    /종가는\s*([\d,]+(?:\.\d+)?)\s*(?:원|달러|USD|KRW)?/i
  );
  const changeMatch = sanitized.match(
    /전일\s*대비\s*([+\-−]?[0-9.,]+%?)(?:\s*(상승|하락|보합|강세|약세))?/i
  );

  const directionMatch = (() => {
    if (/전일\s*대비[^.]*상승/.test(sanitized)) return "상승";
    if (/전일\s*대비[^.]*하락/.test(sanitized)) return "하락";
    if (/전일\s*대비[^.]*보합/.test(sanitized)) return "보합";
    if (/전일\s*대비[^.]*강세/.test(sanitized)) return "강세";
    if (/전일\s*대비[^.]*약세/.test(sanitized)) return "약세";
    return undefined;
  })();

  const changeTextParts: string[] = [];
  if (changeMatch?.[1]) {
    changeTextParts.push(changeMatch[1]);
  }
  const descriptor = changeMatch?.[2] || directionMatch;
  if (descriptor) {
    changeTextParts.push(
      descriptor.includes("세") ? descriptor : `${descriptor}`
    );
  }

  const changeText = changeTextParts.join(" ");

  const tone: PriceTone = (() => {
    if (descriptor) {
      if (descriptor.includes("상") || descriptor.includes("강"))
        return "positive";
      if (descriptor.includes("하") || descriptor.includes("약"))
        return "negative";
    }
    if (changeMatch?.[1]) {
      const raw = changeMatch[1];
      if (raw.startsWith("+") || raw.startsWith("▲")) return "positive";
      if (raw.startsWith("-") || raw.startsWith("▼")) return "negative";
    }
    return "neutral";
  })();

  const closeText = closeMatch
    ? `${closeMatch[1]}${
        closeMatch[2] && closeMatch[2] !== "$" ? closeMatch[2] : ""
      }`
    : undefined;

  if (!closeText && !changeText) {
    return null;
  }

  return {
    closeText,
    changeText,
    tone,
  };
}

function formatInsightText(section: StockInsightSectionDetail, text?: unknown) {
  const resolvedText = flattenRichText(text).trim();
  if (!resolvedText) return "";
  const context = `${section.category ?? ""} ${
    section.title ?? ""
  } ${resolvedText}`.toLowerCase();
  const isHundredMillionContext = HUNDRED_MILLION_KEYWORDS.some((keyword) =>
    context.includes(keyword)
  );

  return resolvedText.replace(NUMBER_TOKEN_REGEX, (match, _token, index) => {
    const numeric = Number(match.replace(/,/g, ""));
    if (!Number.isFinite(numeric)) {
      return match;
    }

    const after = resolvedText.slice(index + match.length);
    const trimmedAfter = after.replace(/^\s*/, "");
    const lowerAfter = trimmedAfter.toLowerCase();

    if (
      lowerAfter.startsWith("%") ||
      lowerAfter.startsWith("x") ||
      lowerAfter.startsWith("배") ||
      lowerAfter.startsWith("배수") ||
      lowerAfter.startsWith("bp") ||
      lowerAfter.startsWith("ppt") ||
      lowerAfter.startsWith("pp") ||
      lowerAfter.startsWith("포인트")
    ) {
      return match;
    }

    if (isHundredMillionContext) {
      if (Math.abs(numeric) < 1) {
        return match;
      }
      if (lowerAfter.startsWith("억") || lowerAfter.startsWith("조")) {
        return match;
      }
      const formatted = formatHundredMillionNumber(numeric);
      const needsWon =
        !lowerAfter.startsWith("억") &&
        !lowerAfter.startsWith("조") &&
        !lowerAfter.startsWith("원");
      return needsWon ? `${formatted} 원` : formatted;
    }

    if (Math.abs(numeric) < 10000 && !lowerAfter.startsWith("원")) {
      return match;
    }

    return formatKoreanNumberForDisplay(numeric);
  });
}

function formatHundredMillionNumber(value: number) {
  if (!isFiniteNumber(value)) {
    return String(value);
  }

  if (value === 0) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const han = abs / 100_000_000; // 억 단위

  if (han < 1) {
    return sign + formatKoreanNumberForDisplay(abs);
  }

  const jo = Math.floor(han / 10_000);
  const remainderHan = han - jo * 10_000;
  const parts: string[] = [];

  if (jo > 0) {
    parts.push(`${formatNumberWithoutTrailingZeros(jo)}조`);
  }

  if (remainderHan > 0) {
    parts.push(`${formatNumberWithoutTrailingZeros(remainderHan)}억`);
  }

  if (parts.length === 0) {
    parts.push(`${formatNumberWithoutTrailingZeros(han)}억`);
  }

  return sign + parts.join(" ");
}

function formatKoreanNumberForDisplay(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (!Number.isFinite(abs)) {
    return String(value);
  }

  if (!Number.isInteger(abs)) {
    const formatted = abs
      .toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: abs < 10 ? 2 : 0,
      })
      .replace(/\.00$/, "")
      .replace(/(\.\d*[1-9])0+$/, "$1");
    return sign + formatted;
  }

  if (abs < 10000) {
    return sign + Math.trunc(abs).toLocaleString();
  }

  const units = ["", "만", "억", "조", "경"];
  let remainder = Math.trunc(abs);
  const parts: string[] = [];
  let index = 0;

  while (remainder > 0 && index < units.length) {
    const chunk = remainder % 10000;
    if (chunk > 0) {
      parts.unshift(`${chunk.toLocaleString()}${units[index]}`);
    }
    remainder = Math.floor(remainder / 10000);
    index += 1;
  }

  return sign + parts.join(" ");
}

function formatNumberWithoutTrailingZeros(value: number) {
  if (Number.isInteger(value)) {
    return Math.trunc(value).toLocaleString();
  }

  return value
    .toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })
    .replace(/\.00$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

function getStockIntroText(label?: string | null) {
  if (label?.includes("가상자산")) {
    return "유튜브 TOP5 영상에서 포착된 가상자산(코인)에 대한 핵심 지표와 거래 흐름을 다시 정리한 요약입니다.";
  }
  if (label?.includes("해외 주식")) {
    return "유튜브 TOP5 영상에서 포착된 해외 주식 종목의 핵심 포인트와 지표를 다시 정리한 요약입니다.";
  }
  if (label?.includes("주식")) {
    return "유튜브 TOP5 영상에서 포착된 국내 주식 종목을 현재 시세와 수급 지표와 함께 정리한 요약입니다.";
  }
  return "유튜브 TOP5 영상에서 포착된 종목을 현재 시세와 핵심 지표와 함께 정리한 요약입니다.";
}

function extractAdditionalSentences(card: InsightMarketDeltaCard) {
  const sentences = card.sentences;
  if (!sentences) return [] as Array<{ key: string; text: string }>;

  const ignored = new Set([
    "price_intraday",
    "liquidity_change",
    "flows_summary",
    "headline",
    "comment",
  ]);

  return Object.entries(sentences)
    .filter(([key, value]) => {
      if (!value || ignored.has(key)) return false;
      return typeof value === "string" && value.trim().length > 0;
    })
    .map(([key, value]) => ({ key, text: value as string }));
}

function formatDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;

  if (/^\d{8}$/.test(trimmed)) {
    const yyyy = trimmed.slice(0, 4);
    const mm = trimmed.slice(4, 6);
    const dd = trimmed.slice(6, 8);
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `오늘 ${hh}:${mm}`;
}

function formatRelativeDay(value: string, reference?: string | Date | null) {
  const target = parseDateValue(value);
  if (!target) return null;

  let referenceDate: Date | null;
  if (reference instanceof Date) {
    referenceDate = reference;
  } else if (typeof reference === "string" && reference.trim().length > 0) {
    referenceDate = parseDateValue(reference);
  } else {
    referenceDate = new Date();
  }

  if (!referenceDate || Number.isNaN(referenceDate.getTime())) {
    return null;
  }

  const diffDays = Math.round(
    (startOfDay(referenceDate).getTime() - startOfDay(target).getTime()) /
      DAY_IN_MS
  );

  if (diffDays === 0) return "오늘";
  if (diffDays > 0) return `${diffDays}일 전`;
  return `${Math.abs(diffDays)}일 후`;
}

function parseDateValue(input?: string | null) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d{8}$/.test(trimmed)) {
    const yyyy = Number(trimmed.slice(0, 4));
    const mm = Number(trimmed.slice(4, 6)) - 1;
    const dd = Number(trimmed.slice(6, 8));
    if (Number.isNaN(yyyy) || Number.isNaN(mm) || Number.isNaN(dd)) {
      return null;
    }
    return new Date(Date.UTC(yyyy, mm, dd));
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-").map((token) => Number(token));
    if (Number.isFinite(yyyy) && Number.isFinite(mm) && Number.isFinite(dd)) {
      return new Date(Date.UTC(yyyy, mm - 1, dd));
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPriceWithCurrency(value: number, currency?: string | null) {
  if (!isFiniteNumber(value)) return "-";
  if (!currency || currency === "KRW") {
    return `${value.toLocaleString()}원`;
  }
  if (currency === "USD") {
    return `$${value.toLocaleString()}`;
  }
  return `${value.toLocaleString()} ${currency}`;
}

function formatPercentValue(
  value?: number | null,
  options: { showSign?: boolean } = {}
) {
  if (!isFiniteNumber(value)) return null;
  const { showSign = false } = options;
  const digits = Math.abs(value) >= 10 ? 1 : 2;
  const absValue = Math.abs(value);
  const base = absValue.toFixed(digits);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const displaySign = showSign ? sign : value < 0 ? "-" : "";
  return `${displaySign}${base}%`;
}

function formatPercentDisplay(
  value?: number | null,
  options: { showSign?: boolean } = {}
) {
  const formatted = formatPercentValue(value, options);
  if (formatted) return formatted;
  if (isFiniteNumber(value)) {
    const digits = Math.abs(value) >= 10 ? 1 : 2;
    return `${value.toFixed(digits)}%`;
  }
  return "-";
}

function formatKrwShort(value: number) {
  if (!isFiniteNumber(value)) return "-";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  const format = (num: number) => {
    if (num >= 100) return Math.round(num).toString();
    if (num >= 10) return num.toFixed(1).replace(/\.0$/, "");
    return num.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  };

  if (abs >= 1_000_000_000_000) {
    return `${sign}${format(abs / 1_000_000_000_000)}조원`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${format(abs / 100_000_000)}억원`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${format(abs / 1_000_000)}백만원`;
  }
  if (abs >= 10_000) {
    return `${sign}${format(abs / 10_000)}만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
}

function formatNumberCompact(value: number) {
  if (!isFiniteNumber(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    return `${(abs / 100_000_000).toFixed(2)}억`;
  }
  if (abs >= 10_000) {
    return `${(abs / 10_000).toFixed(2)}만`;
  }
  if (abs >= 1_000) {
    return `${(abs / 1_000).toFixed(1)}천`;
  }
  return abs.toLocaleString();
}

function formatKrwLarge(value: number) {
  if (!isFiniteNumber(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) {
    return `${(abs / 1_000_000_000_000).toFixed(1)}조원`;
  }
  if (abs >= 100_000_000) {
    return `${(abs / 100_000_000).toFixed(1)}억원`;
  }
  return `${abs.toLocaleString()}원`;
}

function toneColor(tone?: PriceTone) {
  if (tone === "positive") return COLOR_POSITIVE;
  if (tone === "negative") return COLOR_NEGATIVE;
  return "#94a3b8";
}

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function emphasizeNumbers(text?: string | null) {
  if (typeof text !== "string" || text.length === 0) {
    return text == null ? "" : String(text);
  }
  const highlighted = text.replace(
    /([0-9]+(?:[.,][0-9]+)*\s?(?:억|만|p|%|원|만주|만|조|x)?)/g,
    "<strong>$1</strong>"
  );
  return convertMarkToStrong(highlighted);
}

function formatTextWithSentenceBreaks(text?: string | null) {
  if (typeof text !== "string") {
    return text == null ? "" : String(text);
  }
  const highlighted = emphasizeNumbers(text);
  const parts = highlighted
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.join("<br/>");
}
// ✅ mark → strong 으로 완전히 치환
function convertMarkToStrong(html: string) {
  if (typeof html !== "string" || html.length === 0) return html ?? "";
  // 여는 태그(<mark ...>)는 통째로 <strong>으로
  // 닫는 태그(</mark>)는 </strong>으로 교체
  return html
    .replace(/<mark\b[^>]*>/gi, "<strong>")
    .replace(/<\/mark>/gi, "</strong>");
}

function parseNumericChange(value?: string | null) {
  if (typeof value !== "string") return null;
  const sanitized = value.replace(/[^0-9+-.]/g, "");
  if (
    !sanitized ||
    sanitized === "+" ||
    sanitized === "-" ||
    sanitized === "."
  ) {
    return null;
  }
  const parsed = Number.parseFloat(sanitized);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildMarketChangeMeta(card: InsightMarketDeltaCard) {
  const pctValue = parseNumericChange(card.chg_pct_str);
  const pointValue = parseNumericChange(card.chg_point_str);

  let sign: -1 | 0 | 1 | null = null;
  if (pctValue != null) {
    sign = pctValue > 0 ? 1 : pctValue < 0 ? -1 : 0;
  } else if (pointValue != null) {
    sign = pointValue > 0 ? 1 : pointValue < 0 ? -1 : 0;
  }

  const displaySource =
    card.chg_pct_str?.trim() || card.chg_point_str?.trim() || "";
  const hasExplicitSign = /^[+\-▲▼]/.test(displaySource);
  const text =
    sign === 1 && displaySource && !hasExplicitSign
      ? `+${displaySource}`
      : displaySource;

  const fallbackPositive = hasExplicitSign
    ? /^[+▲]/.test(displaySource)
    : Boolean(
        card.chg_pct_str?.includes("+") || card.chg_point_str?.includes("+")
      );

  return {
    text,
    isPositive: sign !== null ? sign > 0 : fallbackPositive,
  };
}

function toneFromValue(value: number) {
  if (value > 0) return "positive" as const;
  if (value < 0) return "negative" as const;
  return "neutral" as const;
}

function formatSignedCurrencyCompact(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(2)}조원`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(2)}억원`;
  }
  if (abs >= 10_000_000) {
    return `${sign}${(abs / 10_000_000).toFixed(2)}천만원`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}백만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
}

function formatSignedNumberCompact(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(2)}억`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 10_000).toFixed(2)}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

const SlotBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #1d4ed8;
  background: #e0ebff;
  border-radius: 999px;
  padding: 2px 8px;
`;

const MarketSectionMeta = styled.p`
  margin: 8px 0 12px;
  font-size: 12px;
  color: #4b5563;
`;

const SectionIntro = styled.p`
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  margin-top: 4px;
  word-break: keep-all;
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
`;

const RelativeTimestamp = styled.span`
  margin-left: 6px;
  font-weight: 600;
  color: #94a3b8;
  font-size: 12px;
`;

const QuickLines = styled.div`
  border-top: 1px dashed ${COLOR_TRACK};
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
`;

const QuickLine = styled.div``;

const SectionQuickLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #334155;
`;

const SectionToggleRow = styled.div`
  display: flex;
  justify-content: center;
  /* margin-top: 8px; */
`;

const MarketGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
`;

const MarketCardWrapper = styled.article`
  border: 1px solid rgba(50, 71, 255, 0.14);
  border-radius: 20px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), #f3f6ff);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
`;

const MarketCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 16px;
`;

const MarketTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${COLOR_TEXT};

  strong {
    margin-left: 6px;
    color: #475569;
    font-weight: 700;
  }
`;

const MarketChange = styled.div<{ $positive: boolean }>`
  font-weight: 700;
  color: ${({ $positive }) => ($positive ? COLOR_POSITIVE : COLOR_NEGATIVE)};
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
`;

const StockSubSectionHeader = styled.div`
  margin: 28px 4px 4px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: baseline;
`;

const StockSubSectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StockSubSectionIntro = styled.p`
  font-size: 14px;
  color: #2e2e2e;
  margin-top: -12px;
  line-height: 1.4;
`;

const StockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StockCardWrapper = styled.article`
  border: 1px solid ${COLOR_TRACK};
  border-radius: 12px;
  padding: 12px;
  background: ${COLOR_CARD_BG};
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: none;
`;

const StockDetailToggleRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`;

const StockListToggleRow = styled(StockDetailToggleRow)`
  justify-content: center;
  margin-top: 12px;
`;

const StockDetailToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
  line-height: 1.4;

  &:hover,
  &:focus {
    color: #1d4ed8;
  }

  &:focus {
    outline: 2px solid rgba(37, 99, 235, 0.4);
    outline-offset: 2px;
  }
`;

const StockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StockDetailCollapse = styled.div<{ $expanded: boolean }>`
  overflow: hidden;
  max-height: ${({ $expanded }) => ($expanded ? "5000px" : "0px")};
  opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
  transform: ${({ $expanded }) =>
    $expanded ? "translateY(0)" : "translateY(-6px)"};
  transition: max-height 0.45s ease, opacity 0.3s ease, transform 0.4s ease,
    padding-top 0.4s ease;
  padding-top: ${({ $expanded }) => ($expanded ? "12px" : "0")};
  pointer-events: ${({ $expanded }) => ($expanded ? "auto" : "none")};
  will-change: max-height, opacity, transform;
`;

const StockDetailBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
`;

const StockTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${COLOR_TEXT};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StockPriceValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
`;

const StockDeltaBlock = styled.div<{ $tone: PriceTone }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === "positive"
      ? COLOR_POSITIVE
      : $tone === "negative"
      ? COLOR_NEGATIVE
      : "#475569"};

  span {
    font-size: 13px;
    color: ${({ $tone }) =>
      $tone === "positive"
        ? COLOR_POSITIVE
        : $tone === "negative"
        ? COLOR_NEGATIVE
        : "#475569"};
  }

  strong {
    font-size: 16px;
    font-weight: 700;
  }
`;

const StockSummary = styled.div`
  font-size: 16px;
  color: #1f2937;
  line-height: 1.5;
`;

const StockHighlights = styled.div`
  font-size: 15px;
  color: #475569;
  line-height: 1.5;
  background: ${COLOR_CARD_BG};
  border-radius: 10px;
  padding: 10px 12px;
`;

const StockInsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StockInsightItem = styled.div`
  border: 1px solid ${COLOR_TRACK};
  border-radius: 10px;
  padding: 12px;
  background: ${COLOR_CARD_BG};
  font-size: 15px;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StockInsightHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
  font-size: 14px;
  color: ${COLOR_TEXT};
`;

const StockInsightBadge = styled.span`
  background: rgba(11, 99, 246, 0.12);
  color: ${COLOR_NEGATIVE};
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
`;

const InsightBarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
`;

const InsightBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InsightBarLabel = styled.span`
  min-width: 72px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
`;

const SignedBarTrack = styled.div`
  position: relative;
  flex: 1;
  height: 8px;
  background: ${COLOR_TRACK};
  border-radius: 999px;
  overflow: hidden;
`;

const SignedCenterLine = styled.span`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #cbd5f5;
  transform: translateX(-50%);
`;

const SignedBarSegment = styled.span<{ $tone?: PriceTone }>`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: ${({ $tone }) => toneColor($tone)};
`;

const PositiveBarTrack = styled.div`
  flex: 1;
  height: 8px;
  background: ${COLOR_TRACK};
  border-radius: 999px;
  overflow: hidden;
`;

const PositiveBarFill = styled.span<{ $tone?: PriceTone }>`
  display: block;
  height: 100%;
  border-radius: 999px;
  background: ${({ $tone }) => toneColor($tone)};
`;

const InsightBarValue = styled.span<{ $tone?: PriceTone }>`
  min-width: 90px;
  text-align: right;
  font-size: 12px;
  font-weight: 700;
  color: ${({ $tone }) => toneColor($tone)};
`;

const InsightDeltaBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
`;

const InsightContextLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
`;

const InsightDeltaRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const InsightDeltaValues = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #475569;

  strong:not(.StockMarketSection__InsightDeltaChange) {
    color: ${COLOR_TEXT};
  }
`;

const InsightDeltaChange = styled.span<{ $tone: PriceTone | "neutral" }>`
  margin-top: 2px;
  font-weight: 700;
  color: ${({ $tone }) =>
    $tone === "positive"
      ? COLOR_POSITIVE
      : $tone === "negative"
      ? COLOR_NEGATIVE
      : "#94a3b8"};
`;

const InsightDeltaTrackWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  max-width: 160px;
`;

const InsightMetricEntriesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
`;

const InsightMetricEntryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
`;

const InsightMetricEntryCard = styled.div`
  background: ${COLOR_CARD_BG};
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InsightMetricEntryLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 2px;

  small {
    font-size: 12px;
    font-weight: 500;
    margin-top: 4px;
    color: #94a3b8;
  }
`;

const InsightMetricEntryValue = styled.span<{ $tone?: PriceTone }>`
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-top: 8px;
`;

const StockInsightSummary = styled.div`
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
`;

const StockInsightHighlights = styled.div`
  font-size: 14px;
  color: ${COLOR_TEXT};
  line-height: 1.5;

  strong {
    font-weight: 700;
  }
`;

const StockComment = styled.div`
  border-radius: 10px;
  border: 1px solid ${COLOR_TRACK};
  background: ${COLOR_CARD_BG};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StockPreviewComment = styled(StockComment)`
  margin-top: 12px;
`;

const StockPreviewCommentTitle = styled.div`
  margin-bottom: 8px;
  font-weight: 700;
  font-size: 16px;
  color: ${COLOR_NEGATIVE};
`;

const StockCommentTitle = styled.span`
  font-weight: 700;
  font-size: 14px;
  color: ${COLOR_NEGATIVE};
`;

const StockCommentBody = styled.div`
  font-size: 14px;
  color: ${COLOR_TEXT};
  line-height: 1.6;
  strong {
    font-weight: 700;
  }
`;

const StockCommentBulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StockCommentBulletItem = styled.li`
  font-size: 16px;
  color: ${COLOR_TEXT};
  line-height: 1.6;
  list-style: disc;
  strong {
    font-weight: 700;
  }
`;

const StockEvidenceButton = styled.button`
  margin: 10px 0 4px;
  border-radius: 8px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  flex: 1;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover,
  &:focus {
    background: #1d4ed8;
    border-color: #1d4ed8;
    outline: none;
  }
  &:disabled,
  &[disabled] {
    background: #e5e7eb;
    border-color: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const StockActionDock = styled.div`
  margin: 12px 0 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StockAlertButton = styled.button`
  flex: 1;
  min-width: 140px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
`;

const StockActionHint = styled.small`
  flex-basis: 100%;
  font-size: 12px;
  color: #6b7280;
`;

const MarketToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
  line-height: 1.4;

  &:hover,
  &:focus {
    color: #1d4ed8;
  }

  &:focus {
    outline: 2px solid rgba(37, 99, 235, 0.4);
    outline-offset: 2px;
  }
`;

const ToggleChevron = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? 180 : 0)}deg);

  span {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg);
  }
`;

const CommentToggleButton = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(120deg, rgba(37, 99, 235, 0.12), rgba(147, 51, 234, 0.12));
  color: #1d4ed8;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
`;

const MarketDetailCollapse = styled.div<{ $expanded: boolean }>`
  overflow: hidden;
  max-height: ${({ $expanded }) => ($expanded ? "5000px" : "0px")};
  opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
  transform: ${({ $expanded }) =>
    $expanded ? "translateY(0)" : "translateY(-6px)"};
  transition: max-height 0.45s ease, opacity 0.3s ease, transform 0.4s ease,
    padding-top 0.4s ease;
  padding-top: ${({ $expanded }) => ($expanded ? "16px" : "0")};
  pointer-events: ${({ $expanded }) => ($expanded ? "auto" : "none")};
  will-change: max-height, opacity, transform;
`;

const MarketDetailBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
`;

const MarketComment = styled.div<{ $withBorder?: boolean }>`
  font-size: 13px;
  line-height: 1.6;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid
    ${({ $withBorder }) =>
      $withBorder ? "rgba(148, 163, 184, 0.4)" : "rgba(37, 99, 235, 0.24)"};
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), #eef2ff);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  strong {
    font-weight: 700;
  }
`;

const MarketCommentTitle = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 15px;
  background: linear-gradient(120deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  color: transparent;
`;

const MarketCommentBody = styled.div<{ $clamped?: boolean }>`
  font-size: 14px;
  line-height: 1.6;

  /* mark 기본 스타일 제거 + 폰트 강조만 */
  mark,
  .StockMarketSection__highlight {
    background: transparent !important;
    color: inherit !important;
    padding: 0 !important;
    border-radius: 0 !important;
    text-decoration: none !important;
    display: inline;
    font-weight: 700; /* 강조는 굵기만 */
    font-style: normal;
  }

  ${({ $clamped }) =>
    $clamped
      ? css`
          max-height: 82px;
          overflow: hidden;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0),
              rgba(255, 255, 255, 0.95)
            );
          }
        `
      : null}
`;

const CommentBulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CommentBulletItem = styled.li`
  font-size: 15px;
  color: ${COLOR_TEXT};
  line-height: 1.5;
  list-style: disc;
  word-break: keep-all;
`;

const MarketSummaryComment = styled(MarketComment)`
  margin-top: 12px;
  border-color: rgba(59, 130, 246, 0.25);
`;

const MarketStatGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
`;

const MarketStat = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.92), #f5f7ff);
  border: 1px solid rgba(148, 163, 184, 0.3);
`;

const MarketStatLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${COLOR_NEGATIVE};
  text-transform: uppercase;
`;

const IntradayChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const IntradayIndicator = styled.div`
  position: relative;
  height: 8px;
`;

const IntradayRail = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: ${COLOR_TRACK};
`;

const IntradayFill = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, ${COLOR_NEUTRAL}, ${COLOR_POSITIVE});
`;

const IntradayMarker = styled.div<{ $tone: "open" | "close" }>`
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === "close" ? COLOR_POSITIVE : COLOR_NEGATIVE};
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: 700;

  &::after {
    content: ${({ $tone }) => ($tone === "close" ? "'종'" : "'시'")};
  }
`;

const IntradayLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
`;

const IntradaySummary = styled.div`
  font-size: 14px;
  color: ${COLOR_TEXT};
  line-height: 1.5;
`;

const LiquidityBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LiquidityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const LiquidityLabel = styled.span`
  min-width: 72px;
  font-size: 12px;
  font-weight: 600;
  color: ${COLOR_TEXT};
`;

const LiquidityMeter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const LiquidityTrack = styled.div`
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: ${COLOR_TRACK};
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: rgba(15, 23, 42, 0.18);
  }
`;

const LiquidityFill = styled.div<{ $tone: "up" | "down" | "flat" }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 0;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === "up"
      ? COLOR_POSITIVE
      : $tone === "down"
      ? COLOR_NEGATIVE
      : COLOR_NEUTRAL};
`;

const LiquidityPointer = styled.span<{ $tone: "up" | "down" | "flat" }>`
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.1);
  transform: translate(-50%, -50%);
  background: ${({ $tone }) =>
    $tone === "up"
      ? COLOR_POSITIVE
      : $tone === "down"
      ? COLOR_NEGATIVE
      : COLOR_NEUTRAL};
`;

const LiquidityMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  color: #475569;
`;

const ChangeValue = styled.span<{ $tone: "up" | "down" | "flat" }>`
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === "up"
      ? COLOR_POSITIVE
      : $tone === "down"
      ? COLOR_NEGATIVE
      : COLOR_NEUTRAL};
`;

const StatDescriptor = styled.div`
  font-size: 14px;
  line-height: 1.4;
  color: ${COLOR_TEXT};
`;

const FlowShareBar = styled.div`
  display: flex;
  height: 24px;
  border-radius: 999px;
  overflow: hidden;
  background: ${COLOR_TRACK};
  font-size: 11px;
  color: #fff;
  width: 100%;
`;

const FlowShareSegment = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color }) => $color};
  padding: 0 6px;
  min-width: 0;
  font-weight: 600;
`;

const FlowShiftContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
`;

const FlowShiftItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const FlowShiftLabel = styled.span`
  min-width: 48px;
  font-size: 13px;
  font-weight: 700;
  color: ${COLOR_TEXT};
`;

const FlowShiftBars = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FlowShiftRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #475569;
`;

const FlowShiftBadge = styled.span<{ $variant?: "muted" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === "muted" ? "#e2e8f0" : "rgba(37, 99, 235, 0.15)"};
  color: ${({ $variant }) => ($variant === "muted" ? "#475569" : "#1d4ed8")};
`;

const FlowShiftTrack = styled.div`
  position: relative;
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: ${COLOR_TRACK};
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(15, 23, 42, 0.16);
  }
`;

const FlowShiftBar = styled.div<{ $tone: "positive" | "negative" }>`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === "positive" ? COLOR_POSITIVE : COLOR_NEGATIVE};
`;

const FlowShiftValue = styled.span<{
  $tone: "positive" | "negative" | "neutral";
}>`
  min-width: 96px;
  text-align: right;
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === "positive"
      ? COLOR_POSITIVE
      : $tone === "negative"
      ? COLOR_NEGATIVE
      : "#475569"};
`;

const FlowShiftQuantity = styled.div`
  font-size: 11px;
  color: #64748b;
`;

const FlowStatList = styled.ul`
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #1f2937;

  li {
    list-style: disc;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    font-weight: 600;
    color: #1d4ed8;
  }

  span {
    color: #334155;
  }
`;
