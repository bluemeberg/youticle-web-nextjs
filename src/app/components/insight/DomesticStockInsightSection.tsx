"use client";

import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";

import type {
  InsightSection,
  InsightMarketCard,
  InsightStock,
  InsightStockMetrics,
  InsightStrategy,
} from "@/types/insight";
import type { ReactNode } from "react";
import {
  getOrCreateAnonId,
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
} from "@/utils/formatter";
import { useMemo, useState } from "react";
import { logCtaClick } from "@/api/apiClient";
import MarketInsightSection from "../marketInsight/MarketInsightSection";

const COLOR_POSITIVE = "#ff6b6b";
const COLOR_NEGATIVE = "#0b63f6";
const COLOR_NEUTRAL = "#9db3ff";
const COLOR_TRACK = "#e7ecff";
const COLOR_CARD_BG = "#f5f7ff";
const COLOR_TEXT = "#0f172a";
const OVERSEAS_STOCK_LABEL = "해외 주식";

function normalizeCommentBullets(value?: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
}

function formatCommentBullet(text: string) {
  return formatCommentText(text);
}

interface Props {
  section: InsightSection;
  hideInsightSectionList?: boolean;
  hideMarketCards?: boolean;
  renderMarketIntro?: ReactNode;
  forceStockPreview?: boolean;
}

interface ValuationDetail {
  per?: number;
  pbr?: number;
  roePct?: number;
  eps?: number;
  bps?: number;
}

type TonePositiveNeutralNegative = "positive" | "neutral" | "negative";

interface FlowSegment {
  key: string;
  label: string;
  percent: number;
  tone: "foreign" | "institution" | "others";
  direction: "buy" | "sell" | "neutral";
}

interface FlowStat {
  key: string;
  label: string;
  value: string;
  tone?: TonePositiveNeutralNegative;
  description?: string;
}

interface FlowDetail {
  segments: FlowSegment[];
  summary: { text: string; tone: TonePositiveNeutralNegative };
  stats: FlowStat[];
}

interface LiquidityStat {
  key: string;
  label: string;
  value: string;
  changePct?: number;
  changeText?: string;
  tone?: "up" | "down" | "flat";
  description?: string;
}

interface LiquidityDetail {
  stats: LiquidityStat[];
}

interface LevelMarkerPoint {
  key: string;
  label: string;
  value: number;
  position: number;
}

interface LevelsDetail {
  pivot?: number;
  resistances: Array<{ label: string; value?: number; distance?: string }>;
  supports: Array<{ label: string; value?: number; distance?: string }>;
  markers: LevelMarkerPoint[];
  bandStart: number;
  bandWidth: number;
  resistanceText: string;
  supportText: string;
}

function hasTickerSnapshot(stock?: InsightStock | null): stock is InsightStock {
  if (!stock) return false;

  const ticker = (stock.ticker || "").trim();
  if (!ticker) return false;

  const metrics = stock.metrics;
  if (!metrics) return false;

  const numericCandidates: Array<string | number | null | undefined> = [
    metrics.price_info?.current_price,
    metrics.price_info?.change_pct,
    metrics.price_info?.change_amount,
    metrics.price,
    metrics.chg_pct,
    metrics.change_amount,
    metrics.market_cap,
  ];

  return numericCandidates.some((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value);
    }
    if (typeof value === "string") {
      const numeric = toNumeric(value);
      return numeric != null && Number.isFinite(numeric);
    }
    return false;
  });
}

const DomesticStockInsightSection = ({
  section,
  hideInsightSectionList = false,
  hideMarketCards = false,
  renderMarketIntro,
  forceStockPreview = false,
}: Props) => {
  const { data, label, updated_at } = section;
  const overview = data?.overview;
  const marketInsights = data?.market_insights?.by_market || {};
  const rawStocks = data?.stocks ?? [];
  // 해외 주식은 티커 기반 수치가 비어 있으면 카드 자체를 숨긴다.
  const stocks =
    section.label === OVERSEAS_STOCK_LABEL
      ? rawStocks.filter((stock) => hasTickerSnapshot(stock))
      : rawStocks;
  const strategies = data?.investment_strategies || [];
  const tags = data?.tags || [];
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
  const stockIntroText =
    label === "국내 가상자산" || label === "해외 가상자산"
      ? "종목 인사이트에서는 온체인 지표와 거래 흐름을 기반으로 TOP5 영상에 등장한 코인을 정리합니다."
      : "종목 인사이트에서는 TOP5 영상에 등장한 종목을 현재 시세, 밸류에이션, 수급, 유동성까지 한눈에 정리합니다.";
  const hasMarketDetailToggle = label === "국내 주식" || label === "해외 주식";
  const [showMarketDetails, setShowMarketDetails] = useState(
    !hasMarketDetailToggle
  );
  const marketCardsAvailable =
    !hideMarketCards && Object.keys(marketInsights).length > 0;
  const marketDetailContentExists =
    Boolean(renderMarketIntro) || marketCardsAvailable;
  const isCryptoSection =
    label === "국내 가상자산" || label === "해외 가상자산";
  const shouldShowSummaryCardPreview =
    (label === "국내 주식" || label === "해외 주식") && !showMarketDetails;
  const shouldShowStockPreview =
    forceStockPreview || (typeof label === "string" && label.includes("주식"));
  const representativeMarketComment = useMemo(() => {
    const summaryTargets: Record<string, string[]> = {
      "국내 주식": ["KOSPI", "KOSDAQ"],
      "해외 주식": ["NASDAQ"],
    };
    const targetKeys = summaryTargets[label ?? ""];
    if (!targetKeys || targetKeys.length === 0) return null;
    const representativeKeys = new Set(
      targetKeys.map((key) => key.toUpperCase())
    );
    const bullets: string[] = [];
    let title: string | null = null;

    Object.entries(marketInsights).forEach(([marketKey, card]) => {
      if (!card) return;
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
        title = "오늘 TOP5 유튜브 영상 속 마켓 코멘트";
      }
      cardBullets.forEach((bullet) => {
        if (!bullets.includes(bullet)) {
          bullets.push(bullet);
        }
      });
    });

    if (!bullets.length) return null;
    return {
      title: title || "마켓 코멘트",
      bullets: bullets.slice(0, 3),
    };
  }, [label, marketInsights]);

  return (
    <Wrapper>
      <SectionHeader>
        <Title>{label} 마켓 인사이트</Title>
        {updated_at && (
          <Timestamp>업데이트 : {formatDateTime(updated_at)}</Timestamp>
        )}
      </SectionHeader>
      <SectionIntro>{introText}</SectionIntro>

      {hasMarketDetailToggle && marketCardsAvailable ? (
        <>
          <MarketGrid>
            {Object.entries(marketInsights).map(([key, value]) =>
              value ? (
                <MarketSummaryCard
                  key={key}
                  card={value}
                  showCommentPreview={shouldShowSummaryCardPreview}
                />
              ) : null
            )}
          </MarketGrid>
          {shouldShowSummaryCardPreview && representativeMarketComment ? (
            <MarketSummaryComment>
              {representativeMarketComment.title ? (
                <MarketCommentTitle>
                  {representativeMarketComment.title}
                </MarketCommentTitle>
              ) : null}
              <MarketCommentBulletList>
                {representativeMarketComment.bullets.map((bullet, index) => (
                  <MarketCommentBulletItem
                    key={`domestic-representative-market-bullet-${index}`}
                    dangerouslySetInnerHTML={{
                      __html: formatCommentBullet(bullet),
                    }}
                  />
                ))}
              </MarketCommentBulletList>
            </MarketSummaryComment>
          ) : null}
        </>
      ) : null}

      {marketDetailContentExists ? (
        hasMarketDetailToggle ? (
          <>
            <StockDetailToggleRow>
              <StockDetailToggleButton
                type="button"
                onClick={() => setShowMarketDetails((prev) => !prev)}
                aria-expanded={showMarketDetails}
              >
                {showMarketDetails
                  ? "마켓 인사이트 접기"
                  : "마켓 인사이트 펼치기"}
                <ToggleChevron aria-hidden={true} $expanded={showMarketDetails}>
                  <span />
                </ToggleChevron>
              </StockDetailToggleButton>
            </StockDetailToggleRow>
            {showMarketDetails ? (
              <StockDetailBody>
                {renderMarketIntro ? (
                  <MarketIntroContainer $compact={isCryptoSection}>
                    {renderMarketIntro}
                  </MarketIntroContainer>
                ) : null}
                {marketCardsAvailable ? (
                  <MarketGrid>
                    {Object.entries(marketInsights).map(([key, value]) =>
                      value ? <MarketCard key={key} card={value} /> : null
                    )}
                  </MarketGrid>
                ) : null}
              </StockDetailBody>
            ) : null}
          </>
        ) : (
          <>
            {renderMarketIntro ? (
              <MarketIntroContainer $compact={isCryptoSection}>
                {renderMarketIntro}
              </MarketIntroContainer>
            ) : null}
            {marketCardsAvailable ? (
              <MarketGrid>
                {Object.entries(marketInsights).map(([key, value]) =>
                  value ? <MarketCard key={key} card={value} /> : null
                )}
              </MarketGrid>
            ) : null}
          </>
        )
      ) : null}

      {/* {tags.length > 0 && (
        <TagRow>
          {tags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </TagRow>
      )} */}

      {stocks.length > 0 && (
        <>
          <SubSectionHeader>
            <SubSectionTitle>📊 종목 인사이트</SubSectionTitle>
            {updated_at && (
              <Timestamp>업데이트 : {formatDateTime(updated_at)}</Timestamp>
            )}
          </SubSectionHeader>
          <SubSectionIntro>{stockIntroText}</SubSectionIntro>
          <StockList>
            {stocks.map((stock) => (
              <StockCard
                key={`${stock.ticker}-${stock.stock_name}`}
                stock={stock}
                hideInsightSectionList={hideInsightSectionList}
                showCommentPreview={shouldShowStockPreview}
              />
            ))}
          </StockList>
        </>
      )}

      {/* {strategies.length > 0 && (
        <StrategyGrid>
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.strategy_title} strategy={strategy} />
          ))}
        </StrategyGrid>
      )} */}
    </Wrapper>
  );
};

export default DomesticStockInsightSection;

const MarketCardHeaderContent = ({ card }: { card: InsightMarketCard }) => (
  <MarketCardHeader>
    <MarketTitle>
      {card.market} <strong>{card.price_str}</strong>
    </MarketTitle>
    <MarketChange
      $positive={!!card.chg_pct_str && card.chg_pct_str.includes("+")}
    >
      {card.chg_point_str && <span>{card.chg_point_str}</span>}{" "}
      {card.chg_pct_str}
    </MarketChange>
  </MarketCardHeader>
);

const MarketSummaryCard = ({
  card,
  showCommentPreview = false,
}: {
  card: InsightMarketCard;
  showCommentPreview?: boolean;
}) => {
  const commentBullets = normalizeCommentBullets(card.comment_bullets);
  const previewBullets = showCommentPreview ? commentBullets.slice(0, 3) : [];
  const hasPreview = previewBullets.length > 0;
  const commentTitle = card.comment_title || "마켓 코멘트";

  return (
    <MarketCardWrapper>
      <MarketCardHeaderContent card={card} />
    </MarketCardWrapper>
  );
};

const MarketCard = ({ card }: { card: InsightMarketCard }) => {
  const quickLines = card.quick_lines || [];
  const highlightLabels = Object.entries(card.labels || {})
    .map(([, value]) => value)
    .filter(Boolean) as string[];
  const intradayDetail = buildIntradayDetail(card);
  const breadthDetail = buildBreadthDetail(card);
  const liquidityDetail = buildLiquidityDetail(card);
  const flowDetail = buildOrderFlowDetail(card);
  const commentBody = card.comment_body;
  const commentBullets = normalizeCommentBullets(card.comment_bullets);
  const commentTitle = card.comment_title || "마켓 코멘트";
  const hasComment = Boolean(commentBody || commentBullets.length > 0);
  const commentContent = hasComment ? (
    <MarketComment $withBorder={!commentBody && commentBullets.length === 0}>
      {commentTitle ? (
        <MarketCommentTitle>{commentTitle}</MarketCommentTitle>
      ) : null}
      {commentBullets.length > 0 ? (
        <MarketCommentBulletList>
          {commentBullets.map((bullet, index) => (
            <MarketCommentBulletItem
              key={`market-comment-bullet-${index}`}
              dangerouslySetInnerHTML={{
                __html: formatCommentBullet(bullet),
              }}
            />
          ))}
        </MarketCommentBulletList>
      ) : commentBody ? (
        <MarketCommentBody
          dangerouslySetInnerHTML={{
            __html: formatCommentText(commentBody),
          }}
        />
      ) : null}
    </MarketComment>
  ) : null;
  return (
    <MarketCardWrapper>
      <MarketCardHeaderContent card={card} />
      {/* {highlightLabels.length > 0 && (
        <MarketLabelRow>
          {highlightLabels.map((label) => (
            <MarketLabel key={label}>{label}</MarketLabel>
          ))}
        </MarketLabelRow>
      )} */}
      {commentContent}
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
                      intradayDetail.highPct - intradayDetail.lowPct,
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
                <strong>저 {intradayDetail.low.toLocaleString()}</strong>
                <span>시 {intradayDetail.open.toLocaleString()}</span>
                <strong>고 {intradayDetail.high.toLocaleString()}</strong>
              </IntradayLabels>
              <IntradaySummary
                dangerouslySetInnerHTML={{
                  __html: emphasizeNumbers(intradayDetail.text || ""),
                }}
              />
            </IntradayChart>
          </MarketStat>
        ) : null}
        {breadthDetail ? (
          <MarketStat>
            <MarketStatLabel>시장 폭</MarketStatLabel>
            <StackedBar>
              <StackedFill
                $tone="up"
                style={{ width: `${breadthDetail.upPct}%` }}
              >
                {breadthDetail.upPct}%
              </StackedFill>
              <StackedFill
                $tone="flat"
                style={{ width: `${breadthDetail.flatPct}%` }}
              >
                {breadthDetail.flatPct}%
              </StackedFill>
              <StackedFill
                $tone="down"
                style={{ width: `${breadthDetail.downPct}%` }}
              >
                {breadthDetail.downPct}%
              </StackedFill>
            </StackedBar>
            <StatDescriptor
              dangerouslySetInnerHTML={{
                __html: emphasizeNumbers(
                  breadthDetail.text ||
                    `상승 종목 ${breadthDetail.up.toLocaleString()} · 보합 ${breadthDetail.flat.toLocaleString()} · 하락 종목 ${breadthDetail.down.toLocaleString()}`
                ),
              }}
            />
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
                      $tone={liquidityDetail.volumeTone}
                      style={{
                        left: `${liquidityDetail.volumeLeft}%`,
                        width: `${liquidityDetail.volumeWidth}%`,
                      }}
                    />
                    <LiquidityPointer
                      $tone={liquidityDetail.volumeTone}
                      style={{ left: `${liquidityDetail.volumePointer}%` }}
                    />
                  </LiquidityTrack>
                  <LiquidityMeta>
                    <span>{liquidityDetail.volumeRatioText}</span>
                    {liquidityDetail.volumeSummary ? (
                      <ChangeValue $tone={liquidityDetail.volumeTone}>
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
                        width: `${liquidityDetail.valueWidth}%`,
                      }}
                    />
                    <LiquidityPointer
                      $tone={liquidityDetail.valueTone}
                      style={{ left: `${liquidityDetail.valuePointer}%` }}
                    />
                  </LiquidityTrack>
                  <LiquidityMeta>
                    <span>{liquidityDetail.valueRatioText}</span>
                    {liquidityDetail.valueSummary ? (
                      <ChangeValue $tone={liquidityDetail.valueTone}>
                        {liquidityDetail.valueSummary}
                      </ChangeValue>
                    ) : null}
                  </LiquidityMeta>
                </LiquidityMeter>
              </LiquidityRow>
            </LiquidityBox>
            <StatDescriptor
              dangerouslySetInnerHTML={{
                __html: emphasizeNumbers(liquidityDetail.summaryHtml),
              }}
            />
          </MarketStat>
        ) : null}
        {flowDetail ? (
          <MarketStat>
            <MarketStatLabel>수급</MarketStatLabel>
            <FlowBar>
              <FlowSegment
                $tone="down"
                style={{ width: `${flowDetail.sellPct}%` }}
              >
                매도 {flowDetail.sellPct}%
              </FlowSegment>
              <FlowSegment
                $tone="up"
                style={{ width: `${flowDetail.buyPct}%` }}
              >
                매수 {flowDetail.buyPct}%
              </FlowSegment>
            </FlowBar>
            <StatDescriptor
              dangerouslySetInnerHTML={{
                __html: emphasizeNumbers(
                  flowDetail.text ||
                    `${flowDetail.direction} ${flowDetail.netText}`
                ),
              }}
            />
          </MarketStat>
        ) : null}
      </MarketStatGrid>
      {/* {quickLines.length > 0 && (
        <QuickLines>
          {quickLines.map((line, index) => (
            <QuickLine key={index}>• {line}</QuickLine>
          ))}
        </QuickLines>
      )} */}
    </MarketCardWrapper>
  );
};

const StockCard = ({
  stock,
  hideInsightSectionList = false,
  showCommentPreview = false,
}: {
  stock: InsightStock;
  hideInsightSectionList?: boolean;
  showCommentPreview?: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const metrics = stock.metrics;
  const metricInsight = stock.metric_insight;
  const hasValidMetrics =
    metrics != null &&
    !("error" in (metrics as Record<string, unknown>)) &&
    Object.keys(metrics).length > 0;
  const hasInsight =
    metricInsight != null && Object.keys(metricInsight).length > 0;
  const user = useRecoilValue(userState);
  if (!hasValidMetrics || !hasInsight) {
    return null;
  }
  const priceInfo = metrics?.price_info;
  const changePct = priceInfo?.change_pct ?? metrics?.chg_pct;
  const changeAmount = priceInfo?.change_amount ?? metrics?.change_amount;
  const currency = normalizeCurrency(metrics?.currency);
  const deltaPositive =
    typeof changePct === "number"
      ? changePct >= 0
      : `${changePct ?? ""}`.includes("+");
  const deltaText =
    changePct != null && typeof changePct === "number"
      ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`
      : changePct ?? "—";
  const amountText =
    changeAmount != null && typeof changeAmount === "number"
      ? formatCurrencyWithUnit(changeAmount, currency, { sign: true })
      : undefined;
  const currentPriceRaw = priceInfo?.current_price ?? metrics?.price;
  const currentPriceText =
    currentPriceRaw != null && Number.isFinite(currentPriceRaw)
      ? formatCurrencyWithUnit(currentPriceRaw, currency)
      : "—";
  const roeText =
    metrics?.roe_pct != null && Number.isFinite(metrics.roe_pct)
      ? `${metrics.roe_pct.toFixed(2)}%`
      : "—";
  const epsText =
    metrics?.eps != null && Number.isFinite(metrics.eps)
      ? formatCurrencyWithUnit(metrics.eps, currency)
      : "—";
  const bpsText =
    metrics?.bps != null && Number.isFinite(metrics.bps)
      ? formatCurrencyWithUnit(metrics.bps, currency)
      : "—";
  const range = metrics?.range_52w;
  const rawHtsAvls = stock?.quote_raw?.output?.hts_avls;
  const marketCapHundredMillion =
    currency === "KRW" ? toFiniteNumber(toNumeric(rawHtsAvls)) : null;
  const marketCapNonKrw =
    currency === "KRW" ? null : toFiniteNumber(metrics?.market_cap);
  const marketCapDisplay = (() => {
    if (currency === "KRW") {
      return marketCapHundredMillion != null
        ? formatKrwFromHundredMillion(marketCapHundredMillion)
        : null;
    }
    return marketCapNonKrw != null
      ? formatCurrencyWithUnit(marketCapNonKrw, currency, { compact: true })
      : null;
  })();
  const marketCapText = marketCapDisplay ?? "—";
  const stance = stock.action_idea?.stance;
  const comment = stock.metric_insight?.comment_body;
  const commentBullets = normalizeCommentBullets(
    stock.metric_insight?.comment_bullets
  );
  const commentTitle = stock.metric_insight?.comment_title || "코멘트";
  const previewBullets = showCommentPreview ? commentBullets.slice(0, 3) : [];
  const insightSections = stock.metric_insight?.insight_sections || [];
  const intradayRange = buildStockIntradayDetail(metrics);
  const hasPriceSection = insightSections.some(
    (section) =>
      section &&
      ((section.category &&
        section.category.toLowerCase() === "price_position") ||
        (section.title &&
          (section.title.includes("가격") ||
            section.title.toLowerCase().includes("price"))))
  );
  const valuationDetail = buildValuationDetail(metrics);
  const hasValuationSection = insightSections.some(
    (section) =>
      section &&
      ((section.category && section.category.toLowerCase() === "valuation") ||
        (section.title &&
          (section.title.includes("밸류") ||
            section.title.toLowerCase().includes("valuation"))))
  );
  const flowDetail = buildFlowDetail(metrics);
  const hasFlowSection = insightSections.some((section) => {
    if (!section) return false;
    const title = section.title?.toLowerCase() ?? "";
    const category = section.category?.toLowerCase() ?? "";
    return (
      category === "flows" || title.includes("수급") || title.includes("flow")
    );
  });
  const liquidityDetail = buildStockLiquidityDetail(metrics);
  const hasLiquiditySection = insightSections.some((section) => {
    if (!section) return false;
    const title = section.title?.toLowerCase() ?? "";
    const category = section.category?.toLowerCase() ?? "";
    return (
      category === "liquidity" ||
      title.includes("유동성") ||
      title.includes("liquidity")
    );
  });
  const levelsDetail = buildLevelsDetail(
    metrics,
    priceInfo?.current_price || metrics?.price,
    metrics?.currency
  );
  const hasLevelsSection = insightSections.some(
    (section) =>
      section &&
      ((section.category && section.category.toLowerCase() === "levels") ||
        (section.title &&
          (section.title.includes("레벨") ||
            section.title.toLowerCase().includes("level"))))
  );
  const renderPriceVisuals = () => {
    const rangePosition = range?.position_pct;
    const hasRangePosition = typeof rangePosition === "number";
    if (!intradayRange && !hasRangePosition) {
      return null;
    }

    const currentPrice = priceInfo?.current_price || metrics?.price;
    const normalizedPosition = Math.min(Math.max(rangePosition ?? 0, 0), 100);
    const lowDate = formatDateLabel(range?.low_52w_date);
    const highDate = formatDateLabel(range?.high_52w_date);

    return (
      <PriceVisualGrid>
        {intradayRange ? (
          <PriceVisualCard>
            <PriceVisualTitle>장중 흐름</PriceVisualTitle>
            <IntradayChart>
              <IntradayIndicator>
                <IntradayRail />
                <IntradayFill
                  style={{
                    left: `${intradayRange.lowPct}%`,
                    width: `${Math.max(
                      intradayRange.highPct - intradayRange.lowPct,
                      1
                    )}%`,
                  }}
                />
                <IntradayMarker
                  $tone="open"
                  style={{ left: `${intradayRange.openPct}%` }}
                />
                <IntradayMarker
                  $tone="close"
                  style={{ left: `${intradayRange.closePct}%` }}
                />
              </IntradayIndicator>
              <IntradayLabels>
                <strong>저 {intradayRange.low.toLocaleString()}</strong>
                <span>
                  {intradayRange.openLabelShort}{" "}
                  {intradayRange.open.toLocaleString()}
                </span>
                <strong>고 {intradayRange.high.toLocaleString()}</strong>
              </IntradayLabels>
              <IntradayLegend>
                <LegendItem>
                  <LegendDot $tone="open" />
                  {intradayRange.openLabelLong}
                </LegendItem>
                <LegendItem>
                  <LegendDot $tone="close" />
                  종가
                </LegendItem>
              </IntradayLegend>
              {/* <IntradaySummary
                dangerouslySetInnerHTML={{
                  __html: emphasizeNumbers(intradayRange.text),
                }}
              /> */}
            </IntradayChart>
          </PriceVisualCard>
        ) : null}
        {hasRangePosition ? (
          <PriceVisualCard>
            <PriceVisualTitle>52주 위치</PriceVisualTitle>
            <RangeBar>
              <RangeTrack>
                <RangeFill style={{ width: `${normalizedPosition}%` }} />
              </RangeTrack>
              <RangePosition>
                현재 위치 <strong>{Math.round(normalizedPosition)}%</strong>
              </RangePosition>
              <RangeLabels>
                <span>
                  52주 저{" "}
                  {formatCurrencyWithUnit(range?.low_52w ?? null, currency)}
                  {lowDate ? <RangeDate>{lowDate}</RangeDate> : null}
                </span>
                <span>
                  52주 고{" "}
                  {formatCurrencyWithUnit(range?.high_52w ?? null, currency)}
                  {highDate ? <RangeDate>{highDate}</RangeDate> : null}
                </span>
              </RangeLabels>
            </RangeBar>
            {/* {currentPrice != null ? (
              <RangeMeta>
                현재가{" "}
                <strong>
                  {formatCurrencyWithUnit(currentPrice, currency)}
                </strong>
              </RangeMeta>
            ) : null} */}
          </PriceVisualCard>
        ) : null}
      </PriceVisualGrid>
    );
  };
  const renderValuationVisuals = () => {
    if (!valuationDetail) return null;

    const descriptor = (key: string) => {
      switch (key) {
        case "per":
          return "주가가 이익의 몇 배인지";
        case "pbr":
          return "주가가 자산의 몇 배인지";
        case "roePct":
          return "자기자본 수익률";
        case "eps":
          return "한 주가 벌어들인 이익";
        case "bps":
          return "한 주당 순자산";
        default:
          return "";
      }
    };

    const entries = [
      marketCapDisplay
        ? {
            key: "marketCap",
            label: "시가총액",
            display: marketCapDisplay,
            tone: "neutral" as TonePositiveNeutralNegative,
          }
        : null,
      valuationDetail.per != null
        ? {
            key: "per",
            label: "PER",
            display: `${valuationDetail.per.toFixed(1)}배`,
            tone: "neutral" as TonePositiveNeutralNegative,
          }
        : null,
      valuationDetail.pbr != null
        ? {
            key: "pbr",
            label: "PBR",
            display: `${valuationDetail.pbr.toFixed(2)}배`,
            tone: "neutral" as TonePositiveNeutralNegative,
          }
        : null,
      valuationDetail.roePct != null
        ? {
            key: "roePct",
            label: "ROE",
            display: `${valuationDetail.roePct.toFixed(1)}%`,
            tone: valuationDetail.roePct >= 0 ? "positive" : "negative",
          }
        : null,
      valuationDetail.eps != null
        ? {
            key: "eps",
            label: "EPS",
            display: formatCurrencyWithUnit(valuationDetail.eps, currency),
            tone: "neutral" as TonePositiveNeutralNegative,
          }
        : null,
      valuationDetail.bps != null
        ? {
            key: "bps",
            label: "BPS",
            display: formatCurrencyWithUnit(valuationDetail.bps, currency),
            tone: "neutral" as TonePositiveNeutralNegative,
          }
        : null,
    ].filter(Boolean) as Array<{
      key: string;
      label: string;
      display: string;
      tone: TonePositiveNeutralNegative;
    }>;

    if (entries.length === 0) return null;

    return (
      <ValuationVisualWrapper>
        <ValuationMetricGrid>
          {entries.map((entry) => (
            <ValuationMetricCard key={entry.key}>
              <ValuationMetricLabel>
                {entry.label}
                <small>{descriptor(entry.key)}</small>
              </ValuationMetricLabel>
              <ValuationMetricValue $tone={entry.tone}>
                {entry.display}
              </ValuationMetricValue>
            </ValuationMetricCard>
          ))}
        </ValuationMetricGrid>
      </ValuationVisualWrapper>
    );
  };
  const renderFlowVisuals = () => {
    if (!flowDetail) return null;
    return (
      <FlowVisualWrapper>
        {/* <FlowSummary $tone={flowDetail.summary.tone}>
          {flowDetail.summary.text}
        </FlowSummary> */}
        {flowDetail.segments.length > 0 ? (
          <FlowDistributionBar>
            {flowDetail.segments.map((segment) => {
              const directionLabel =
                segment.direction === "sell"
                  ? "매도"
                  : segment.direction === "buy"
                  ? "매수"
                  : "";
              return (
                <FlowDistributionSegment
                  key={segment.key}
                  $tone={segment.tone}
                  $direction={segment.direction}
                  style={{
                    flexGrow: Math.max(segment.percent, 6),
                    flexBasis: 0,
                  }}
                >
                  {segment.label}
                  {directionLabel ? ` ${directionLabel}` : ""} {segment.percent}
                  %
                </FlowDistributionSegment>
              );
            })}
          </FlowDistributionBar>
        ) : null}
        {flowDetail.stats.length > 0 ? (
          <FlowStats>
            {flowDetail.stats.map((stat) => (
              <FlowStatCard key={stat.key} $tone={stat.tone}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                {stat.description ? <small>{stat.description}</small> : null}
              </FlowStatCard>
            ))}
          </FlowStats>
        ) : null}
      </FlowVisualWrapper>
    );
  };
  const renderLiquidityVisuals = () => {
    if (!liquidityDetail) return null;
    return (
      <LiquidityVisualWrapper>
        <LiquidityStats>
          {liquidityDetail.stats.map((stat) => (
            <LiquidityStatCard key={stat.key}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              {stat.changeText ? (
                <LiquidityChange $tone={stat.tone || "flat"}>
                  {stat.changeText}
                </LiquidityChange>
              ) : null}
              {stat.description ? <small>{stat.description}</small> : null}
              {stat.changePct != null ? (
                <LiquidityGaugeTrack>
                  <LiquidityGaugeFill
                    $tone={stat.tone || "flat"}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(8, Math.abs(stat.changePct))
                      )}%`,
                    }}
                  />
                </LiquidityGaugeTrack>
              ) : null}
            </LiquidityStatCard>
          ))}
        </LiquidityStats>
      </LiquidityVisualWrapper>
    );
  };
  const renderLevelsVisuals = () => {
    if (!levelsDetail) return null;
    return (
      <LevelsVisualWrapper>
        <LevelsTrack>
          {levelsDetail.markers.map((marker) => (
            <LevelMarker
              key={marker.key}
              style={{ left: `${marker.position}%` }}
            >
              <span>{marker.label}</span>
              <strong>{formatCurrencyWithUnit(marker.value, currency)}</strong>
            </LevelMarker>
          ))}
          <LevelRangeFill
            style={{
              left: `${levelsDetail.bandStart}%`,
              width: `${levelsDetail.bandWidth}%`,
            }}
          />
        </LevelsTrack>
        <LevelsMeta>
          <span>
            저항까지 <strong>{levelsDetail.resistanceText}</strong>
          </span>
          <span>
            지지까지 <strong>{levelsDetail.supportText}</strong>
          </span>
        </LevelsMeta>
      </LevelsVisualWrapper>
    );
  };
  const handleToggleDetails = () => {
    setShowDetails((prev) => {
      const next = !prev;
      void logCtaClick(
        "stock_detail_toggle",
        user?.id,
        stock.stock_name,
        getOrCreateAnonId()
      ).catch(() => {});
      return next;
    });
  };

  const detailToggleLabel = showDetails
    ? "상세 인사이트 접기"
    : "상세 인사이트 펼치기";
  const hasComment = Boolean(comment || commentBullets.length > 0);
  const hasStandalonePriceVisual =
    !hasPriceSection &&
    (Boolean(intradayRange) || typeof range?.position_pct === "number");
  const hasStandaloneValuationVisual =
    !hasValuationSection && Boolean(valuationDetail);
  const hasStandaloneFlowVisual = !hasFlowSection && Boolean(flowDetail);
  const hasStandaloneLiquidityVisual =
    !hasLiquiditySection && Boolean(liquidityDetail?.stats?.length);
  const hasInsightSectionList =
    !hideInsightSectionList && insightSections.length > 0;
  const hasVideoSources =
    Array.isArray(stock.sources) && stock.sources.length > 0;
  const showPreview =
    showCommentPreview && !showDetails && previewBullets.length > 0;
  const hasDetailContent =
    hasComment ||
    hasStandalonePriceVisual ||
    hasStandaloneValuationVisual ||
    hasStandaloneFlowVisual ||
    hasStandaloneLiquidityVisual ||
    hasInsightSectionList ||
    hasVideoSources;

  return (
    <StockCardWrapper>
      <StockHeader>
        <StockTitle>
          {stock.stock_name}
          {/* <StockPriceValue>{currentPriceText}</StockPriceValue> */}
        </StockTitle>
        <StockDeltaBlock $positive={deltaPositive}>
          {/* {amountText ? <span>{amountText}</span> : null} */}
          <strong>{deltaText}</strong>
        </StockDeltaBlock>
      </StockHeader>
      {/* {stock.company_description && (
        <StockDescription>{stock.company_description}</StockDescription>
      )} */}
      {/* <StatRow>
        <StatBlock>
          <StatLabel>거래량</StatLabel>
          <StatValue>{formatCompact(metrics?.volume)}</StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>시가총액</StatLabel>
          <StatValue>{marketCapText}</StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>PER / PBR</StatLabel>
          <StatValue>
            {metrics?.per != null ? metrics.per.toFixed(2) : "—"} /{" "}
            {metrics?.pbr != null ? metrics.pbr.toFixed(2) : "—"}
          </StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>ROE</StatLabel>
          <StatValue>{roeText}</StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>EPS / BPS</StatLabel>
          <StatValue>
            {epsText} / {bpsText}
          </StatValue>
        </StatBlock>
      </StatRow> */}
      {showPreview ? (
        <CommentPreviewBox>
          {commentTitle ? (
            <CommentPreviewTitle>
              {" "}
              오늘 TOP5 유튜브 영상 속 코멘트
            </CommentPreviewTitle>
          ) : null}
          <CommentBulletList>
            {previewBullets.map((bullet, index) => (
              <CommentBulletItem
                key={`${stock.ticker || stock.stock_name}-preview-${index}`}
                dangerouslySetInnerHTML={{
                  __html: formatCommentBullet(bullet),
                }}
              />
            ))}
          </CommentBulletList>
        </CommentPreviewBox>
      ) : null}

      {hasDetailContent ? (
        <>
          <StockDetailToggleRow>
            <StockDetailToggleButton
              type="button"
              onClick={handleToggleDetails}
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
              {hasComment ? (
                <CommentBox>
                  <CommentTitle>{commentTitle}</CommentTitle>
                  {commentBullets.length > 0 ? (
                    <CommentBulletList>
                      {commentBullets.map((bullet, index) => (
                        <CommentBulletItem
                          key={`${
                            stock.ticker || stock.stock_name
                          }-bullet-${index}`}
                          dangerouslySetInnerHTML={{
                            __html: formatCommentBullet(bullet),
                          }}
                        />
                      ))}
                    </CommentBulletList>
                  ) : comment ? (
                    <CommentBody
                      dangerouslySetInnerHTML={{
                        __html: formatCommentText(comment ?? ""),
                      }}
                    />
                  ) : null}
                </CommentBox>
              ) : null}
              {hasStandalonePriceVisual ? renderPriceVisuals() : null}
              {hasStandaloneValuationVisual ? renderValuationVisuals() : null}
              {hasStandaloneFlowVisual ? renderFlowVisuals() : null}
              {hasStandaloneLiquidityVisual ? renderLiquidityVisuals() : null}
              {/* {!hasLevelsSection ? renderLevelsVisuals() : null} */}
              {hasInsightSectionList ? (
                <InsightSectionList>
                  {insightSections.map((section) => {
                    if (!section) return null;
                    const isPriceSection =
                      (section.category &&
                        section.category.toLowerCase() === "price_position") ||
                      (section.title &&
                        (section.title.includes("가격") ||
                          section.title.toLowerCase().includes("price")));
                    const isValuationSection =
                      (section.category &&
                        section.category.toLowerCase() === "valuation") ||
                      (section.title &&
                        (section.title.includes("밸류") ||
                          section.title.toLowerCase().includes("valuation")));
                    const isFlowSection =
                      (section.category &&
                        section.category.toLowerCase() === "flows") ||
                      (section.title &&
                        (section.title.includes("수급") ||
                          section.title.toLowerCase().includes("flow")));
                    const isLiquiditySection =
                      (section.category &&
                        section.category.toLowerCase() === "liquidity") ||
                      (section.title &&
                        (section.title.includes("유동성") ||
                          section.title.toLowerCase().includes("liquidity")));
                    // const isLevelsSection =
                    //   (section.category &&
                    //     section.category.toLowerCase() === "levels") ||
                    //   (section.title &&
                    //     (section.title.includes("레벨") ||
                    //       section.title.toLowerCase().includes("level")));

                    return (
                      <InsightSectionItem
                        key={section.category || section.title}
                      >
                        <InsightSectionHeader>
                          {section.category && (
                            <InsightSectionBadge>
                              {section.category}
                            </InsightSectionBadge>
                          )}
                          {section.title && <span>{section.title}</span>}
                        </InsightSectionHeader>
                        {/* {section.summary && (
                          <InsightSectionSummary
                            dangerouslySetInnerHTML={{
                              __html: emphasizeNumbers(section.summary),
                            }}
                          />
                        )} */}
                        {isPriceSection ? renderPriceVisuals() : null}
                        {isValuationSection ? renderValuationVisuals() : null}
                        {isFlowSection ? renderFlowVisuals() : null}
                        {isLiquiditySection ? renderLiquidityVisuals() : null}
                        {/* {isLevelsSection ? renderLevelsVisuals() : null} */}
                        {section.highlights && (
                          <InsightSectionHighlights
                            dangerouslySetInnerHTML={{
                              __html: formatHighlightText(section.highlights),
                            }}
                          />
                        )}
                      </InsightSectionItem>
                    );
                  })}
                </InsightSectionList>
              ) : null}
              {hasVideoSources ? (
                <StockVideoSources
                  stockName={stock.stock_name}
                  sources={stock.sources}
                />
              ) : null}
            </StockDetailBody>
          </StockDetailCollapse>
        </>
      ) : null}
      {/* {stock.thesis?.length ? (
        <BulletGroup>
          {stock.thesis.slice(0, 3).map((item, index) => (
            <Bullet key={item.point}>
              <b>{index + 1}.</b> {item.point}
            </Bullet>
          ))}
        </BulletGroup>
      ) : null}
      {stock.catalysts?.length ? (
        <InlineList>
          {stock.catalysts.map((catalyst) => (
            <InlineItem key={catalyst.item}>
              <strong>{catalyst.item}</strong>
              {catalyst.when ? <span>{catalyst.when}</span> : null}
            </InlineItem>
          ))}
        </InlineList>
      ) : null}
      {stock.risks?.length ? (
        <RiskRow>
          <RiskTitle>리스크</RiskTitle>
          <span>{stock.risks.map((risk) => risk.item).join(" · ")}</span>
        </RiskRow>
      ) : null}
      {stock.action_idea?.reason && (
        <ActionIdea>
          <strong>아이디어</strong>
          <p>{stock.action_idea.reason}</p>
        </ActionIdea>
      )} */}
    </StockCardWrapper>
  );
};

export const StockVideoSources = ({
  sources,
  stockName,
}: {
  sources?: InsightStock["sources"];
  stockName: string;
}) => {
  const user = useRecoilValue(userState);
  if (!sources || sources.length === 0) return null;

  return (
    <VideoSourcesSection>
      <VideoSourcesHeader>
        <VideoSourcesTitle>
          &ldquo;{stockName}&rdquo; 언급된 오늘 TOP5 영상
        </VideoSourcesTitle>
        {/* <VideoCountBadge>{sources.length}편</VideoCountBadge> */}
      </VideoSourcesHeader>
      <VideoSourceList>
        {sources.map((source) => {
          const summaryData = source.summary_data;
          const headlineTitle = removeMarkTags(
            summaryData?.headline_title ??
              source.title ??
              `${stockName} 관련 영상`
          );
          const summaryText = removeMarkTags(
            summaryData?.short_summary ?? source.summary ?? ""
          );
          const href = {
            pathname: `/detail/${source.video_id}`,
            query: { focus: "stock-mentions" },
          };
          const uploadText = formatVideoDate(source.upload_date);
          const hasChannel = Boolean(source.channel_name);

          const handleVideoLinkClick = () => {
            // 네비게이션을 막지 않도록 await 금지
            void logCtaClick(
              "metion_button_click",
              user?.id,
              source.video_id,
              getOrCreateAnonId()
            ).catch(() => {});
          };

          return (
            <VideoSourceCard
              key={source.video_id}
              href={href}
              onClick={handleVideoLinkClick}
            >
              <VideoSourceContainer>
                <VideoThumbnailWrapper>
                  {source.thumbnail ? (
                    <VideoThumbnailImage
                      src={source.thumbnail}
                      alt={headlineTitle}
                      width={120}
                      height={68}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <VideoThumbnailFallback>
                      <span>{stockName}</span>
                    </VideoThumbnailFallback>
                  )}
                </VideoThumbnailWrapper>
                <VideoSourceBody>
                  <VideoTitle>{headlineTitle}</VideoTitle>
                  {summaryText ? (
                    <VideoSummary>{summaryText}</VideoSummary>
                  ) : null}
                </VideoSourceBody>
              </VideoSourceContainer>
              {(hasChannel || uploadText) && (
                <VideoMetaRow>
                  {source.channel_thumbnail ? (
                    <ChannelAvatarImage
                      src={source.channel_thumbnail}
                      alt={source.channel_name || "채널"}
                      width={40}
                      height={40}
                      style={{ width: 40, height: 40 }}
                    />
                  ) : null}
                  <VideoMetaRowContainer>
                    {hasChannel ? <span>{source.channel_name}</span> : null}
                    <VideoMetaRowSubContainer>
                      {parseSubscribersCount(source.channel_subscribers ?? 0)}
                      {uploadText ? (
                        <strong>{timeAgo(source.upload_date ?? "")}</strong>
                      ) : null}
                    </VideoMetaRowSubContainer>
                  </VideoMetaRowContainer>
                </VideoMetaRow>
              )}
            </VideoSourceCard>
          );
        })}
      </VideoSourceList>
    </VideoSourcesSection>
  );
};

const StrategyCard = ({ strategy }: { strategy: InsightStrategy }) => (
  <StrategyItem>
    <StrategyTitle>{strategy.strategy_title}</StrategyTitle>
    <StrategyDesc>{strategy.strategy_description}</StrategyDesc>
  </StrategyItem>
);

function buildIntradayDetail(card: InsightMarketCard) {
  const rangeMatch = card.range_str?.match(
    /시가\s([\d.,]+) · 고가\s([\d.,]+) · 저가\s([\d.,]+)/
  );
  if (!rangeMatch) return null;
  const [, open, high, low] = rangeMatch;
  const openVal = parseNumber(open);
  const highVal = parseNumber(high);
  const lowVal = parseNumber(low);
  if (highVal == null || lowVal == null || openVal == null) return null;
  const spread = highVal - lowVal || 1;

  const closeMatch = card.price_str ? parseNumber(card.price_str) : null;
  const closeVal = closeMatch ?? highVal;

  return {
    open: openVal,
    high: highVal,
    low: lowVal,
    close: closeVal,
    openPct: ((openVal - lowVal) / spread) * 100,
    highPct: 100,
    lowPct: 0,
    closePct: Math.max(0, Math.min(100, ((closeVal - lowVal) / spread) * 100)),
    text: card.sentences?.intraday_flow || card.range_str,
  };
}

function buildBreadthDetail(card: InsightMarketCard) {
  const match = card.breadth_str?.match(
    /상승\s([\d,]+) · 보합\s([\d,]+) · 하락\s([\d,]+)/
  );
  if (!match) return null;
  const [, up, flat, down] = match;
  const upVal = parseInt(up.replace(/,/g, ""), 10);
  const flatVal = parseInt(flat.replace(/,/g, ""), 10);
  const downVal = parseInt(down.replace(/,/g, ""), 10);
  const total = upVal + flatVal + downVal || 1;

  const upPct = Math.round((upVal / total) * 100);
  const flatPct = Math.round((flatVal / total) * 100);
  const downPct = 100 - upPct - flatPct;
  const text =
    card.sentences?.market_breadth ||
    `상승 종목 ${upVal.toLocaleString()} · 보합 ${flatVal.toLocaleString()} · 하락 종목 ${downVal.toLocaleString()}`;

  return {
    up: upVal,
    flat: flatVal,
    down: downVal,
    upPct,
    flatPct,
    downPct,
    text,
  };
}

function buildLiquidityDetail(card: InsightMarketCard) {
  const rawText = card.sentences?.liquidity || card.volume_value_str;
  if (!rawText) return null;

  const normalized = rawText
    .replace(/<br\s*\/?\>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const volumeMatch = normalized.match(
    /거래량(?:은)?[^0-9가-힣-]*([\d,.]+(?:\s*[가-힣]+)?)\s*\(전일\s*([^)]+?)(?:,\s*(?:약\s*)?([\d.]+)x)?\)/i
  );
  const valueMatch = normalized.match(
    /거래대금(?:은)?[^0-9가-힣-]*([\d,.\s가-힣]+?)\(전일\s*([^)]+?)(?:,\s*(?:약\s*)?([\d.]+)x)?\)/i
  );
  const volumeSummaryMatch = normalized.match(
    /거래량은[^,]*?([가-힣A-Za-z\s]+?)\s*\(/
  );
  const valueSummaryMatch = normalized.match(
    /거래대금은[^,]*?([가-힣A-Za-z\s]+?)\s*\(/
  );

  if (!volumeMatch || !valueMatch) {
    return null;
  }

  const volumeRatioFromText = volumeMatch[3]
    ? parseFloat(volumeMatch[3])
    : null;
  const valueRatioFromText = valueMatch[3] ? parseFloat(valueMatch[3]) : null;
  const derivedVolumeRatio = toNumeric(card.derived?.volume_ratio_vs_prev);
  const derivedValueRatio = toNumeric(card.derived?.value_ratio_vs_prev);

  const volumeCurrent =
    parseKoreanAmount(volumeMatch[1]) ?? parseNumber(volumeMatch[1]) ?? 0;
  const volumePrevRawText = stripRatioText(volumeMatch[2]);
  const volumePrev =
    parseKoreanAmount(volumePrevRawText) ?? parseNumber(volumePrevRawText) ?? 0;

  const valueCurrentRawText = valueMatch[1]?.trim();
  const valuePrevRawText = stripRatioText(valueMatch[2]);
  const valueCurrent =
    parseKoreanAmount(valueCurrentRawText) ??
    parseNumber(valueCurrentRawText) ??
    0;
  const valuePrev =
    parseKoreanAmount(valuePrevRawText) ?? parseNumber(valuePrevRawText) ?? 0;

  const volumeRatio = (() => {
    const candidate = volumeRatioFromText ?? derivedVolumeRatio;
    if (candidate && Number.isFinite(candidate)) return candidate;
    return volumePrev > 0 ? volumeCurrent / volumePrev : 1;
  })();

  const valueRatio = (() => {
    const candidate = valueRatioFromText ?? derivedValueRatio;
    if (candidate && Number.isFinite(candidate)) return candidate;
    return valuePrev > 0 ? valueCurrent / valuePrev : 1;
  })();

  const compute = (ratio: number) => {
    const capHigh = 2;
    const capLow = 0;
    const base = 50;
    const r = Math.min(Math.max(ratio, capLow), capHigh);
    const maxAbove = capHigh - 1;
    const maxBelow = 1 - capLow;
    let left = base;
    let width = 0;

    if (r >= 1) {
      const diff = r - 1;
      width = maxAbove ? (diff / maxAbove) * 50 : 0;
    } else {
      const diff = 1 - r;
      width = maxBelow ? (diff / maxBelow) * 50 : 0;
      left = base - width;
    }

    const pointer = ((r - capLow) / (capHigh - capLow)) * 100;
    const changePct = (ratio - 1) * 100;
    const tone: "up" | "down" | "flat" =
      changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";

    return {
      left,
      width,
      pointer: Math.min(Math.max(pointer, 0), 100),
      changePct,
      tone,
    };
  };

  const volumeData = compute(volumeRatio);
  const valueData = compute(valueRatio);

  const volumeSummaryRaw = volumeSummaryMatch?.[1]?.trim();
  const valueSummaryRaw = valueSummaryMatch?.[1]?.trim();

  const volumeRatioText = volumeRatioFromText
    ? `${volumeRatioFromText}x`
    : `${volumeRatio.toFixed(2)}x`;
  const valueRatioText = valueRatioFromText
    ? `${valueRatioFromText}x`
    : `${valueRatio.toFixed(2)}x`;

  const volumeCurrentText = `${formatNumberCompact(volumeCurrent)}주`;
  const volumePrevText = `${formatNumberCompact(volumePrev)}주`;
  const valueCurrentText = formatCurrencyCompact(valueCurrent);
  const valuePrevText = formatCurrencyCompact(valuePrev);

  const summaryHtml = `거래량 ${volumeCurrentText} (전일 ${volumePrevText}) · 거래대금 ${valueCurrentText} (전일 ${valuePrevText})`;
  const volumeLabel = volumeSummaryRaw
    ? `거래량 ${volumeSummaryRaw}`
    : `전일 대비 ${volumeRatioText}`;
  const valueLabel = valueSummaryRaw
    ? `거래대금 ${valueSummaryRaw}`
    : `전일 대비 ${valueRatioText}`;

  return {
    text: rawText,
    summaryHtml,
    volumeRatio,
    volumeRatioText,
    valueRatio,
    valueRatioText,
    volumeLeft: volumeData.left,
    volumeWidth: volumeData.width,
    volumePointer: volumeData.pointer,
    volumeChangePct: volumeData.changePct,
    volumeTone: volumeData.tone,
    volumeSummary: volumeLabel,
    valueLeft: valueData.left,
    valueWidth: valueData.width,
    valuePointer: valueData.pointer,
    valueChangePct: valueData.changePct,
    valueTone: valueData.tone,
    valueSummary: valueLabel,
  };
}

function formatNumberCompact(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(2)}억`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 10_000).toFixed(2)}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

function formatCurrencyCompact(value: number) {
  const sign = value < 0 ? "-" : "";
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

function compactLargeNumbersInText(text?: string | null) {
  if (text == null) return "";
  if (typeof text !== "string") return String(text);
  if (text.trim().length === 0) return text;

  return text.replace(/(-?[\d,]+(?:\.[\d]+)?)/g, (match) => {
    const numeric = Number(match.replace(/,/g, ""));
    if (!Number.isFinite(numeric) || Math.abs(numeric) < 10_000) {
      return match;
    }
    return formatNumberCompact(numeric);
  });
}

function parseKoreanAmount(value?: string | null) {
  if (!value) return null;
  const normalized = value
    .replace(/원|주|건|개/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return null;

  const unitMap: Record<string, number> = {
    조: 1_000_000_000_000,
    억: 100_000_000,
    만: 10_000,
  };

  let total = 0;
  let matched = false;
  normalized.replace(/([+-]?\d+(?:\.\d+)?)(조|억|만)?/g, (_, numStr, unit) => {
    if (!numStr) return "";
    matched = true;
    const multiplier = unit ? unitMap[unit] ?? 1 : 1;
    const numeric = Number(numStr);
    if (Number.isFinite(numeric)) {
      total += numeric * multiplier;
    }
    return "";
  });

  if (matched) return total;
  const fallback = Number(normalized);
  return Number.isFinite(fallback) ? fallback : null;
}

function stripRatioText(value?: string | null) {
  if (!value) return "";
  return value.replace(/,?\s*(?:약\s*)?[\d.]+x/gi, "").trim();
}

function buildOrderFlowDetail(card: InsightMarketCard) {
  const match = card.order_imbalance_str?.match(
    /매도잔량\s([\d,.]+(?:\s*[가-힣]+)?) · 매수잔량\s([\d,.]+(?:\s*[가-힣]+)?) \(매도\s([\d.]+)% · 매수\s([\d.]+)% · 순매수\s(?:약\s*)?([\d,.]+(?:\s*[가-힣]+)?)\)/
  );
  if (!match) return null;
  const [, sell, buy, sellPct, buyPct, net] = match;
  const parseQuantity = (value?: string | null) =>
    parseKoreanAmount(value) ?? parseNumber(value) ?? 0;
  const netValue = parseQuantity(net);
  const netText = formatNumberWithUnit(netValue, { sign: true });
  const netDirection: "buy" | "sell" | "neutral" =
    netValue > 0 ? "buy" : netValue < 0 ? "sell" : "neutral";
  const rawText =
    card.sentences?.order_flow ||
    card.order_imbalance_str ||
    `${
      netDirection === "buy"
        ? "매수"
        : netDirection === "sell"
        ? "매도"
        : "중립"
    } ${netText}`;
  const text = compactLargeNumbersInText(rawText);
  return {
    sellPct: Number(sellPct),
    buyPct: Number(buyPct),
    netText,
    direction: netDirection,
    text,
  };
}

function buildStockIntradayDetail(metrics?: InsightStockMetrics) {
  if (!metrics?.price_info) return null;
  const { open, high, low, current_price, prev_close } = metrics.price_info;
  if (high == null || low == null || current_price == null) return null;

  const openValue =
    open != null ? open : prev_close != null ? prev_close : current_price;
  const openLabelShort =
    open != null ? "시" : prev_close != null ? "전일" : "기준";
  const openLabelLong =
    open != null
      ? "시가"
      : prev_close != null
      ? "전일 종가 기준"
      : "시가 데이터 없음";

  const spread = high - low || 1;
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  return {
    open: openValue,
    openLabelShort,
    openLabelLong,
    high,
    low,
    close: current_price,
    openPct: clamp(((openValue - low) / spread) * 100),
    highPct: clamp(((high - low) / spread) * 100),
    lowPct: 0,
    closePct: clamp(((current_price - low) / spread) * 100),
    text:
      open != null
        ? `장중 범위 ${low.toLocaleString()}~${high.toLocaleString()} / 시가 ${open.toLocaleString()} / 종가 ${current_price.toLocaleString()}`
        : `장중 범위 ${low.toLocaleString()}~${high.toLocaleString()} / 시가 데이터 없음 (전일 종가 ${openValue.toLocaleString()}) / 종가 ${current_price.toLocaleString()}`,
  };
}

function buildValuationDetail(
  metrics?: InsightStockMetrics
): ValuationDetail | null {
  if (!metrics) return null;

  const detail: ValuationDetail = {};
  const per = toFiniteNumber(metrics.per);
  const pbr = toFiniteNumber(metrics.pbr);
  const roePct = toFiniteNumber(metrics.roe_pct);
  const eps = toFiniteNumber(metrics.eps);
  const bps = toFiniteNumber(metrics.bps);

  if (per != null) detail.per = per;
  if (pbr != null) detail.pbr = pbr;
  if (roePct != null) detail.roePct = roePct;
  if (eps != null) detail.eps = eps;
  if (bps != null) detail.bps = bps;

  return Object.keys(detail).length > 0 ? detail : null;
}

function buildFlowDetail(metrics?: InsightStockMetrics): FlowDetail | null {
  const flows = metrics?.flows;
  const liquidity = metrics?.liquidity;
  if (!flows) return null;

  const volume = toFiniteNumber(liquidity?.volume);

  const foreignNet = toFiniteNumber(flows.foreign_net_buy_qty) || 0;
  const institutionNet = toFiniteNumber(flows.institution_net_buy_qty) || 0;

  const percent = (amount: number) => {
    if (!volume || volume <= 0) return 0;
    const ratio = (amount / volume) * 100;
    if (!Number.isFinite(ratio)) return 0;
    return ratio;
  };

  const foreignShareRaw = toFiniteNumber(flows.foreign_netbuy_share_pct);
  const institutionShareRaw = toFiniteNumber(
    flows.institution_netbuy_share_pct
  );

  const computeShare = (
    raw: number | null | undefined,
    fallbackAmount: number
  ) => {
    if (raw != null && Number.isFinite(raw)) return raw;
    return percent(fallbackAmount);
  };

  const foreignPercentRaw = computeShare(foreignShareRaw, foreignNet);
  const institutionPercentRaw = computeShare(
    institutionShareRaw,
    institutionNet
  );

  const segments: FlowSegment[] = [];

  const pushSegment = (
    key: "foreign" | "institution" | "others",
    label: string,
    value: number,
    direction: "buy" | "sell" | "neutral"
  ) => {
    if (!Number.isFinite(value) || Math.abs(value) < 0.05) return;
    const clamped = Math.max(-100, Math.min(100, value));
    segments.push({
      key,
      label,
      percent: Number(Math.abs(clamped).toFixed(1)),
      tone: key,
      direction,
    });
  };

  if (foreignPercentRaw) {
    pushSegment(
      "foreign",
      "외국인",
      foreignPercentRaw,
      foreignPercentRaw >= 0 ? "buy" : "sell"
    );
  }
  if (institutionPercentRaw) {
    pushSegment(
      "institution",
      "기관",
      institutionPercentRaw,
      institutionPercentRaw >= 0 ? "buy" : "sell"
    );
  }

  let totalPercent = segments.reduce((acc, item) => acc + item.percent, 0);
  if (totalPercent > 100) {
    segments.forEach((segment) => {
      segment.percent = Number(
        ((segment.percent / totalPercent) * 100).toFixed(1)
      );
    });
    totalPercent = segments.reduce((acc, item) => acc + item.percent, 0);
  }
  const remainder = Math.max(0, 100 - totalPercent);
  if (segments.length === 0 || remainder > 1) {
    segments.push({
      key: "others",
      label: "기타",
      percent: Number(remainder.toFixed(1)),
      tone: "others",
      direction: "neutral",
    });
  }

  const netSum = foreignNet + institutionNet;
  const summaryTone: TonePositiveNeutralNegative =
    netSum > 0 ? "positive" : netSum < 0 ? "negative" : "neutral";
  const summaryText =
    netSum !== 0
      ? `${
          netSum > 0 ? "외국인·기관 순매수" : "외국인·기관 순매도"
        } ${formatNumberWithUnit(netSum, { sign: false }).replace(
          /^[-+]/,
          ""
        )}주`
      : "외국인·기관 순매수/순매도 중립";

  const stats: FlowStat[] = [];

  if (foreignNet !== 0) {
    stats.push({
      key: "foreignNet",
      label: foreignNet > 0 ? "외국인 순매수" : "외국인 순매도",
      value: `${formatNumberWithUnit(foreignNet, { sign: true })}주`,
      tone: foreignNet > 0 ? "positive" : "negative",
      description: "외국인 투자자 (매수−매도) 수량",
    });
  }
  if (institutionNet !== 0) {
    stats.push({
      key: "institutionNet",
      label: institutionNet > 0 ? "기관 순매수" : "기관 순매도",
      value: `${formatNumberWithUnit(institutionNet, { sign: true })}주`,
      tone: institutionNet > 0 ? "positive" : "negative",
      description: "기관 투자자 (매수−매도) 수량",
    });
  }

  const foreignOwnership = toFiniteNumber(flows.foreign_ownership_pct);
  if (foreignOwnership != null) {
    stats.push({
      key: "foreignOwnership",
      label: "외국인 지분율",
      value: `${foreignOwnership.toFixed(2)}%`,
      description: "발행 주식 중 외국인이 보유한 비중",
    });
  }

  if (stats.length === 0) {
    stats.push({
      key: "volume",
      label: "거래량",
      value: `${formatNumberWithUnit(volume)}주`,
      description: "하루 동안 실제 손바뀜이 일어난 주식 수",
    });
  }

  return {
    segments,
    summary: { text: summaryText, tone: summaryTone },
    stats,
  };
}

function buildStockLiquidityDetail(
  metrics?: InsightStockMetrics
): LiquidityDetail | null {
  const liquidity = metrics?.liquidity;
  if (!liquidity) return null;

  const stats: LiquidityStat[] = [];
  const currency = normalizeCurrency(metrics?.currency);
  const marketKey = typeof metrics?.market === "string" ? metrics.market : "";
  const assetUnit = (() => {
    if (marketKey.includes("-")) {
      const [, assetSymbol] = marketKey.split("-");
      if (assetSymbol && assetSymbol.trim().length > 0) {
        return assetSymbol.trim();
      }
      return "코인";
    }
    return "주";
  })();

  const volume = toFiniteNumber(liquidity.volume);
  const volumeSharePct = toFiniteNumber(liquidity.volume_change_pct);
  if (volume != null) {
    const volumeShareText =
      volumeSharePct != null
        ? `전일 대비 비중 ${Math.abs(volumeSharePct).toFixed(0)}%`
        : undefined;
    stats.push({
      key: "volume",
      label: "거래량",
      value: `${formatNumberWithUnit(volume)}${
        assetUnit === "주" ? "주" : ` ${assetUnit}`
      }`,
      changeText: volumeShareText,
      changePct: volumeSharePct ?? undefined,
      tone: "flat",
      description: `${
        assetUnit === "주"
          ? "하루 동안 실제 손바뀜이 일어난 주식 수"
          : `하루 동안 체결된 ${assetUnit} 수량`
      } · 전일 대비 비중은 전일 거래량 대비 오늘 거래량 비율이에요.`,
    });
  }

  const value = toFiniteNumber(liquidity.value);
  const valueSharePct = toFiniteNumber(liquidity.value_change_pct);
  if (value != null) {
    const valueShareText =
      valueSharePct != null
        ? `전일 대비 비중 ${Math.abs(valueSharePct).toFixed(0)}%`
        : undefined;
    stats.push({
      key: "value",
      label: "거래대금",
      value: formatCurrencyWithUnit(value, currency, { compact: true }),
      changeText: valueShareText,
      changePct: valueSharePct ?? undefined,
      tone: "flat",
      description:
        "해당일 체결된 금액 총합 · 전일 대비 비중은 전일 거래대금 대비 오늘 거래대금 비율이에요.",
    });
  }

  const turnover = toFiniteNumber(liquidity.turnover_pct);
  if (turnover != null) {
    stats.push({
      key: "turnover",
      label: "회전율",
      value: `${turnover.toFixed(2)}%`,
      description: "발행주식 대비 하루 거래된 비율",
    });
  }

  return stats.length > 0 ? { stats } : null;
}

function buildLevelsDetail(
  metrics?: InsightStockMetrics,
  currentPrice?: number | null,
  currency?: string | null
): LevelsDetail | null {
  const levels = metrics?.levels;
  if (!levels) return null;

  const pivot = toFiniteNumber(levels.pivot);
  const normalizedCurrency = normalizeCurrency(currency);

  const computeDistance = (value?: number | null) => {
    if (
      value == null ||
      currentPrice == null ||
      !Number.isFinite(currentPrice) ||
      currentPrice === 0
    ) {
      return undefined;
    }
    const diff = ((value - currentPrice) / currentPrice) * 100;
    if (!Number.isFinite(diff)) return undefined;
    const arrow = diff >= 0 ? "▲" : "▼";
    return `${arrow} ${Math.abs(diff).toFixed(2)}%`;
  };

  const buildLevel = (label: string, value?: number | null) => {
    const numeric = toFiniteNumber(value);
    return {
      label,
      value: numeric,
      distance: computeDistance(numeric),
    };
  };

  const resistances = [
    buildLevel("R1", levels.r1),
    buildLevel("R2", levels.r2),
  ].filter((item) => item.value != null || item.distance);

  const supports = [
    buildLevel("S1", levels.s1),
    buildLevel("S2", levels.s2),
  ].filter((item) => item.value != null || item.distance);

  if (!pivot && resistances.length === 0 && supports.length === 0) {
    return null;
  }

  const numericCurrent = toFiniteNumber(currentPrice);

  type MarkerSource = { key: string; label: string; value?: number };
  const markerSources: MarkerSource[] = [];

  const addMarker = (key: string, label: string, value?: number) => {
    const numeric = toFiniteNumber(value);
    if (numeric == null) return;
    markerSources.push({ key, label, value: numeric });
  };

  supports.forEach((item) =>
    addMarker(item.label.toLowerCase(), item.label, item.value)
  );
  if (pivot != null) {
    addMarker("pivot", "Pivot", pivot);
  }
  if (numericCurrent != null) {
    addMarker("current", "현재가", numericCurrent);
  }
  resistances.forEach((item) =>
    addMarker(item.label.toLowerCase(), item.label, item.value)
  );

  const markerValues = markerSources
    .map((item) => item.value)
    .filter((value): value is number => value != null);

  if (markerValues.length === 0) {
    return {
      pivot,
      resistances,
      supports,
      markers: [],
      bandStart: 0,
      bandWidth: 0,
      resistanceText: "—",
      supportText: "—",
    };
  }

  const minValue = Math.min(...markerValues);
  const maxValue = Math.max(...markerValues);
  const span = maxValue - minValue;

  const clamp = (value: number) => Math.min(Math.max(value, 0), 100);
  const normalize = (value: number) => {
    if (span === 0) return 50;
    return clamp(((value - minValue) / span) * 100);
  };

  const markers: LevelMarkerPoint[] = markerSources
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: item.value as number,
      position: normalize(item.value as number),
    }))
    .sort((a, b) => a.value - b.value);

  const sortedResistances = resistances
    .filter((item) => item.value != null)
    .sort((a, b) => (a.value as number) - (b.value as number));
  const sortedSupports = supports
    .filter((item) => item.value != null)
    .sort((a, b) => (b.value as number) - (a.value as number));

  const pickResistance = () => {
    if (sortedResistances.length === 0) return undefined;
    if (numericCurrent == null) return sortedResistances[0];
    return (
      sortedResistances.find(
        (item) => (item.value as number) >= numericCurrent
      ) ?? sortedResistances[sortedResistances.length - 1]
    );
  };

  const pickSupport = () => {
    if (sortedSupports.length === 0) return undefined;
    if (numericCurrent == null) return sortedSupports[0];
    return (
      sortedSupports.find((item) => (item.value as number) <= numericCurrent) ??
      sortedSupports[sortedSupports.length - 1]
    );
  };

  const primaryResistance = pickResistance();
  const primarySupport = pickSupport();

  const normalizeOrUndefined = (value?: number) =>
    value != null ? normalize(value) : undefined;
  const supportPos = normalizeOrUndefined(primarySupport?.value);
  const resistancePos = normalizeOrUndefined(primaryResistance?.value);
  const currentPos = normalizeOrUndefined(numericCurrent ?? undefined);

  let bandStart = 0;
  let bandWidth = 0;

  const setBand = (first?: number, second?: number) => {
    if (first == null || second == null) return false;
    const start = Math.min(first, second);
    const width = Math.abs(first - second);
    bandStart = clamp(start);
    bandWidth = clamp(width);
    if (bandWidth > 0 && bandWidth < 4) {
      const adjustment = (4 - bandWidth) / 2;
      bandStart = clamp(bandStart - adjustment);
      bandWidth = clamp(bandWidth + adjustment * 2);
    }
    return true;
  };

  if (!setBand(supportPos, resistancePos)) {
    if (!setBand(supportPos, currentPos)) {
      setBand(currentPos, resistancePos);
    }
  }

  const formatLevelDistance = (
    level?: { value?: number; distance?: string } | null
  ) => {
    if (!level) return "—";
    if (level.distance) return level.distance;
    if (level.value != null) {
      if (numericCurrent != null) {
        const diffPct = ((level.value - numericCurrent) / numericCurrent) * 100;
        if (Number.isFinite(diffPct)) {
          const arrow = diffPct >= 0 ? "▲" : "▼";
          return `${arrow} ${Math.abs(diffPct).toFixed(2)}%`;
        }
      }
      return formatCurrencyWithUnit(level.value, normalizedCurrency);
    }
    return "—";
  };

  return {
    pivot,
    resistances,
    supports,
    markers,
    bandStart,
    bandWidth,
    resistanceText: formatLevelDistance(primaryResistance),
    supportText: formatLevelDistance(primarySupport),
  };
}

function toNumeric(value?: string | number | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return undefined;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
}

function toFiniteNumber(value?: number | null) {
  if (value == null) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseNumber(value?: string | null) {
  if (!value) return null;
  const num = Number(value.replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}
function formatDateTime(value: string) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `오늘 ${hh}:${min}`;
  } catch (error) {
    return value;
  }
}

function formatDateLabel(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{8}$/.test(trimmed)) {
    const yyyy = trimmed.slice(0, 4);
    const mm = trimmed.slice(4, 6);
    const dd = trimmed.slice(6, 8);
    return `${yyyy}-${mm}-${dd}`;
  }
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed;
}

function normalizeCurrency(currency?: string | null): string {
  if (!currency) return "KRW";
  return currency.toUpperCase();
}

function formatCurrencyWithUnit(
  value?: number | null,
  currency?: string | null,
  options: { compact?: boolean; sign?: boolean } = {}
): string {
  if (value == null || Number.isNaN(value)) return "—";

  const normalized = normalizeCurrency(currency);
  const abs = Math.abs(value);

  if (normalized === "KRW") {
    const formatter = new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: options.compact ? 1 : 0,
      notation: options.compact ? "compact" : "standard",
    });
    const formatted = formatter.format(abs);
    if (options.sign) {
      if (value > 0) return `+${formatted}원`;
      if (value < 0) return `-${formatted}원`;
      return `${formatted}원`;
    }
    const prefix = value < 0 ? "-" : "";
    return `${prefix}${formatted}원`;
  }

  if (normalized === "USD") {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: options.compact ? 2 : 2,
      notation: options.compact ? "compact" : "standard",
      signDisplay: options.sign ? "always" : "auto",
    });
    return formatter.format(value);
  }

  if (normalized === "USDT") {
    const formatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: options.compact ? 2 : 4,
      minimumFractionDigits: options.compact ? 0 : 2,
      notation: options.compact ? "compact" : "standard",
    });
    const formatted = formatter.format(abs);
    const sign = value < 0 ? "-" : options.sign && value > 0 ? "+" : "";
    return `${sign}${formatted} USDT`;
  }

  if (options.compact) {
    const compactFormatted = abs.toLocaleString("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    });
    const sign = value < 0 ? "-" : options.sign && value > 0 ? "+" : "";
    return `${sign}${compactFormatted} ${normalized}`;
  }

  const cryptoDecimals = (() => {
    if (abs >= 1000) return 2;
    if (abs >= 1) return 4;
    if (abs >= 0.01) return 6;
    return 8;
  })();

  const formatted = abs.toLocaleString("en-US", {
    maximumFractionDigits: cryptoDecimals,
    minimumFractionDigits:
      abs >= 1 ? Math.min(2, cryptoDecimals) : Math.min(4, cryptoDecimals),
  });
  const sign = value < 0 ? "-" : options.sign && value > 0 ? "+" : "";
  return `${sign}${formatted} ${normalized}`;
}

function formatKrwFromHundredMillion(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const isCho = abs >= 10_000;
  const base = isCho ? abs / 10_000 : abs;
  const formatter = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: base >= 100 ? 0 : base >= 10 ? 1 : 2,
    minimumFractionDigits: base < 10 ? 1 : 0,
  });
  const unit = isCho ? "조" : "억";
  return `${sign}${formatter.format(base)}${unit} 원`;
}

function formatNumberWithUnit(
  value?: number | null,
  options?: { sign?: boolean }
) {
  if (value == null || Number.isNaN(value)) return "—";

  const abs = Math.abs(value);
  let notation: "standard" | "compact" = "standard";
  let maximumFractionDigits = 0;
  let minimumFractionDigits = 0;

  if (abs >= 100_000) {
    notation = "compact";
    maximumFractionDigits = 1;
  } else if (abs >= 1_000) {
    maximumFractionDigits = 0;
  } else if (abs >= 1) {
    maximumFractionDigits = 2;
  } else if (abs >= 0.01) {
    maximumFractionDigits = 4;
    minimumFractionDigits = 2;
  } else {
    maximumFractionDigits = 6;
    minimumFractionDigits = 4;
  }

  const formatter = new Intl.NumberFormat("ko-KR", {
    notation,
    maximumFractionDigits,
    minimumFractionDigits,
  });
  const formatted = formatter.format(abs);

  if (options?.sign) {
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
  }

  return value < 0 ? `-${formatted}` : formatted;
}

function formatNumber(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

function formatCompact(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억`;
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(1)}만`;
  }
  return value.toLocaleString();
}

function toStrong(text?: string | null) {
  if (typeof text !== "string") return text == null ? "" : String(text);
  return text.replace(/<mark>/g, "<strong>").replace(/<\/mark>/g, "</strong>");
}

function emphasizeNumbers(text?: string | null) {
  if (typeof text !== "string" || text.length === 0) {
    return text == null ? "" : String(text);
  }
  return toStrong(
    text.replace(
      /([0-9]+(?:[.,][0-9]+)*\s?(?:억|만|p|%|원|만주|만|조|x)?)/g,
      "<strong>$1</strong>"
    )
  );
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

function formatChangePct(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 0.05) return "—";
  const arrow = value > 0 ? "▲" : value < 0 ? "▼" : "―";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${arrow} ${sign}${Math.abs(value).toFixed(1)}%`;
}

function formatChangeDelta(value?: number | null) {
  if (!Number.isFinite(value)) return undefined;
  const delta = value as number;
  if (Math.abs(delta) < 0.1) return undefined;
  const arrow = delta > 0 ? "▲" : "▼";
  const sign = delta > 0 ? "+" : "-";
  return `${arrow} ${sign}${Math.abs(delta).toFixed(1)}%`;
}

function changeTone(value?: number | null): "up" | "down" | "flat" {
  if (!Number.isFinite(value) || Math.abs(value as number) < 0.1) return "flat";
  return (value as number) > 0 ? "up" : "down";
}

function formatVideoDate(value?: string | null) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const now = Date.now();
    const diff = now - date.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    if (diff >= 0) {
      const days = Math.floor(diff / dayMs);
      if (days === 0) return "오늘";
      if (days === 1) return "1일 전";
      if (days < 7) return `${days}일 전`;
    }
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return value;
  }
}

function formatCommentText(text: string) {
  return formatTextWithSentenceBreaks(text);
}

function formatHighlightText(text: string) {
  return formatTextWithSentenceBreaks(text);
}

const Wrapper = styled.section`
  margin: 20px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
`;

const Timestamp = styled.span`
  font-size: 14px;
  color: #64748b;
  font-weight: 700;
`;

const SectionIntro = styled.p`
  margin: 8px;
  font-size: 16px;
  color: #000;
  line-height: 1.4;
`;

const OverviewCard = styled.div`
  background: ${COLOR_CARD_BG};
  border: 1px solid ${COLOR_TRACK};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OverviewText = styled.p`
  margin: 0;
  line-height: 1.6;
  color: ${COLOR_TEXT};
`;

const OverviewMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.span`
  background: ${COLOR_NEGATIVE};
  color: #fff;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
`;

const HeatmapRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const HeatmapColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const HeatmapTitle = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${COLOR_TEXT};
`;

const HeatmapChips = styled.div<{ $tone: "positive" | "negative" }>`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: ${({ $tone }) =>
    $tone === "positive" ? COLOR_POSITIVE : COLOR_NEGATIVE};
`;

const HeatmapChip = styled.span<{ $tone: "positive" | "negative" }>`
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "positive"
        ? "rgba(239, 68, 68, 0.35)"
        : "rgba(37, 99, 235, 0.3)"};
  background: ${({ $tone }) =>
    $tone === "positive"
      ? "rgba(239, 68, 68, 0.08)"
      : "rgba(37, 99, 235, 0.08)"};
`;

const MarketIntroContainer = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: ${({ $compact }) => ($compact ? "0 0 12px" : "16px 4px 12px")};
`;

const MarketGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const MarketCardWrapper = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MarketCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
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
`;

const MarketLabelRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const MarketLabel = styled.span`
  background: rgba(37, 99, 235, 0.12);
  color: ${COLOR_TEXT};
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 6px;
  font-weight: 600;
`;

const MarketStatGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const MarketStat = styled.div`
  flex: 1 1 240px;
  min-width: 220px;
  padding: 14px 16px;
  border-radius: 14px;
  background: ${COLOR_CARD_BG};
  /* border: 1px solid ${COLOR_TRACK}; */
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SubSectionHeader = styled.div`
  margin: 28px 4px 4px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: baseline;
`;

const SubSectionTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
`;

const SubSectionIntro = styled.p`
  margin: 4px 4px 12px;
  font-size: 16px;
  color: #000;
  line-height: 1.5;
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

const IntradayLegend = styled.div`
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #64748b;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled.span<{ $tone: "open" | "close" }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $tone }) =>
    $tone === "close" ? COLOR_POSITIVE : COLOR_NEGATIVE};
`;

const StackedBar = styled.div`
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  background: ${COLOR_TRACK};
  font-size: 11px;
  color: #fff;
  text-align: center;
`;

const StackedFill = styled.div<{ $tone: "up" | "flat" | "down" }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${({ $tone }) =>
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

const LiquidityBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LiquidityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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

const LiquidityMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  color: #475569;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  &::after {
    content: "오늘";
    font-weight: 600;
  }
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

const MarketComment = styled.div<{ $withBorder?: boolean }>`
  background: ${COLOR_CARD_BG};
  padding: 12px;
  border-radius: 10px;
  border: ${({ $withBorder }) =>
    $withBorder ? `1px solid ${COLOR_TRACK}` : "none"};
  font-size: 14px;
  line-height: 1.6;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 6px;
  strong {
    font-weight: 700;
  }
`;

const MarketSummaryComment = styled(MarketComment)`
  margin-top: 12px;
`;

const MarketCommentTitle = styled.div`
  font-weight: 700;
  margin-bottom: 4px;
  color: #0b63f6;
`;

const MarketCommentBody = styled.div`
  font-size: 14px;
`;

const MarketCommentBulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MarketCommentBulletItem = styled.li`
  font-size: 14px;
  color: ${COLOR_TEXT};
  line-height: 1.6;
  list-style: disc;
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

const TagRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: #111827;
  color: #fff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
`;

const StockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StockCardWrapper = styled.div`
  border: 1px solid ${COLOR_TRACK};
  border-radius: 12px;
  padding: 18px 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StockDetailToggleRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
`;

const StockDetailToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 15px;
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
`;

const StockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StockTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StockPriceValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #475569;
`;

const StockDeltaBlock = styled.div<{ $positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: ${({ $positive }) => ($positive ? COLOR_POSITIVE : COLOR_NEGATIVE)};
  span {
    font-size: 16px;
    color: ${({ $positive }) => ($positive ? COLOR_POSITIVE : COLOR_NEGATIVE)};
  }
  strong {
    font-size: 16px;
    font-weight: 700;
  }
`;

const StanceBadge = styled.span`
  background: ${COLOR_POSITIVE};
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
`;

const StockDescription = styled.p`
  margin: 0;
  line-height: 1.6;
  color: #334155;
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`;

const StatBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.span`
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
`;

const StatValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const RangeBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const PriceVisualGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
`;

const PriceVisualCard = styled.div`
  flex: 1 1 220px;
  min-width: 200px;
  background: ${COLOR_CARD_BG};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PriceVisualTitle = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: ${COLOR_NEGATIVE};
  text-transform: uppercase;
`;

const ValuationVisualWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
`;

const ValuationMetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  gap: 8px;
`;

const ValuationMetricCard = styled.div`
  background: ${COLOR_CARD_BG};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

const ValuationMetricLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  min-height: 36px;
  color: #475569;
  text-transform: uppercase;
  display: flex;
  flex-direction: column;
  gap: 2px;
  small {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
    text-transform: none;
  }
`;

const ValuationMetricValue = styled.span<{
  $tone: TonePositiveNeutralNegative;
}>`
  font-size: 18px;
  font-weight: 700;
  color: ${({ $tone }) =>
    $tone === "positive"
      ? COLOR_POSITIVE
      : $tone === "negative"
      ? COLOR_NEGATIVE
      : "#0f172a"};
`;

const FlowVisualWrapper = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${COLOR_CARD_BG};
  border-radius: 12px;
  /* padding: 16px; */
`;

const FlowSummary = styled.div<{ $tone: TonePositiveNeutralNegative }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === "positive"
      ? COLOR_POSITIVE
      : $tone === "negative"
      ? COLOR_NEGATIVE
      : "#475569"};
`;

const FlowDistributionBar = styled.div`
  display: flex;
  height: 18px;
  border-radius: 8px;
  overflow: hidden;
  background: ${COLOR_TRACK};
  font-size: 10px;
  color: #fff;
  min-height: 32px;
`;

const FlowDistributionSegment = styled.div<{
  $tone: "foreign" | "institution" | "others";
  $direction: "buy" | "sell" | "neutral";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  flex-shrink: 0;
  text-align: center;
  background: ${({ $tone, $direction }) => {
    const palette: Record<string, Record<string, string>> = {
      foreign: { buy: COLOR_POSITIVE, sell: "#2563eb", neutral: "#94a3b8" },
      institution: { buy: "#f97316", sell: "#1d4ed8", neutral: "#94a3b8" },
      others: { buy: "#94a3b8", sell: "#60a5fa", neutral: "#94a3b8" },
    };
    return palette[$tone][$direction] ?? "#94a3b8";
  }};
  color: ${({ $direction }) => ($direction === "neutral" ? "#0f172a" : "#fff")};
`;

const FlowStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const FlowStatCard = styled.div<{ $tone?: TonePositiveNeutralNegative }>`
  flex: 1 1 140px;
  min-width: 140px;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  span {
    font-weight: 600;
  }
  strong {
    font-size: 14px;
    color: ${({ $tone }) =>
      $tone === "positive"
        ? COLOR_POSITIVE
        : $tone === "negative"
        ? COLOR_NEGATIVE
        : "#0f172a"};
  }
  small {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }
`;

const FlowBar = styled.div`
  display: flex;
  height: 24px;
  border-radius: 999px;
  overflow: hidden;
  background: ${COLOR_TRACK};
  font-size: 11px;
  color: #fff;
`;

const FlowSegment = styled.div<{ $tone: "up" | "down" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $tone }) =>
    $tone === "up" ? COLOR_POSITIVE : COLOR_NEGATIVE};
`;

const LiquidityVisualWrapper = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LiquidityStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const LiquidityStatCard = styled.div`
  flex: 1 1 160px;
  min-width: 160px;
  background: ${COLOR_CARD_BG};
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  span {
    font-weight: 700;
    color: #0b63f6;
  }
  strong {
    font-size: 16px;
    color: #0f172a;
    font-weight: 700;
    margin-top: 4px;
  }
`;

const LiquidityChange = styled.span<{ $tone: "up" | "down" | "flat" }>`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === "up"
      ? COLOR_POSITIVE
      : $tone === "down"
      ? COLOR_NEGATIVE
      : "#94a3b8"};
`;

const LiquidityGaugeTrack = styled.div`
  margin-top: 4px;
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: ${COLOR_TRACK};
  overflow: hidden;
`;

const LiquidityGaugeFill = styled.div<{ $tone: "up" | "down" | "flat" }>`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  min-width: 8px;
  background: ${({ $tone }) =>
    $tone === "up"
      ? "linear-gradient(90deg, rgba(255,107,107,0.2), rgba(255,107,107,0.8))"
      : $tone === "down"
      ? "linear-gradient(90deg, rgba(11,99,246,0.2), rgba(11,99,246,0.8))"
      : "linear-gradient(90deg, rgba(148,163,184,0.2), rgba(148,163,184,0.6))"};
`;

const LevelsVisualWrapper = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LevelsTrack = styled.div`
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: ${COLOR_TRACK};
  overflow: visible;
  margin: 18px 0 10px;
`;

const LevelRangeFill = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 107, 107, 0.3),
    rgba(11, 99, 246, 0.3)
  );
  pointer-events: none;
`;

const LevelMarker = styled.div`
  position: absolute;
  top: -30px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
  span {
    font-weight: 600;
    text-transform: uppercase;
  }
  strong {
    font-size: 12px;
    color: #0f172a;
  }
  &::after {
    content: "";
    display: block;
    width: 2px;
    height: 20px;
    margin-top: 2px;
    background: rgba(148, 163, 184, 0.6);
  }
`;

const LevelsMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #475569;
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  strong {
    color: #0f172a;
    font-weight: 700;
  }
`;

const LevelsPivotCard = styled.div`
  background: ${COLOR_CARD_BG};
  border-radius: 12px;
  padding: 12px 16px;
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #475569;
  span {
    font-weight: 600;
  }
  strong {
    font-size: 16px;
    color: #0f172a;
  }
`;

const LevelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
`;

const LevelColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LevelColumnTitle = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
`;

const LevelCard = styled.div`
  background: ${COLOR_CARD_BG};
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #475569;
`;

const LevelLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
`;

const LevelValue = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
`;

const LevelDistance = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
`;

const LevelEmpty = styled.div`
  font-size: 11px;
  color: #94a3b8;
`;

const RangeTrack = styled.div`
  height: 6px;
  background: ${COLOR_TRACK};
  border-radius: 999px;
  overflow: hidden;
`;

const RangeFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${COLOR_NEGATIVE}, ${COLOR_POSITIVE});
`;

const RangePosition = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
`;

const RangeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
  span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
`;

const RangeDate = styled.small`
  font-size: 10px;
  color: #64748b;
`;

const RangeMeta = styled.div`
  font-size: 12px;
  color: #475569;
  font-weight: 500;
  margin-top: 4px;
  strong {
    margin-left: 4px;
    color: #0f172a;
    font-weight: 700;
  }
`;

const BulletGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #1f2937;
`;

const Bullet = styled.div`
  display: flex;
  gap: 6px;
`;

const InlineList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
`;

const InlineItem = styled.span`
  background: #f1f5f9;
  color: #1e293b;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const RiskRow = styled.div`
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #b91c1c;
`;

const RiskTitle = styled.span`
  font-weight: 700;
`;

const ActionIdea = styled.div`
  background: ${COLOR_CARD_BG};
  padding: 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${COLOR_TEXT};
  font-size: 13px;
`;

const CommentBox = styled.div`
  border: 1px solid ${COLOR_TRACK};
  border-radius: 10px;
  padding: 12px;
  background: ${COLOR_CARD_BG};
  font-size: 13px;
  line-height: 1.6;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 6px;
  strong {
    color: ${COLOR_TEXT};
    font-weight: 700;
  }
`;

const CommentPreviewBox = styled.div`
  margin-top: 8px;
  strong {
    font-weight: 700;
  }
`;

const CommentPreviewTitle = styled.div`
  margin-bottom: 8px;
  font-weight: 700;
  color: #0b63f6;
  font-size: 14px;
`;

const CommentTitle = styled.div`
  font-weight: 700;
  margin-bottom: 4px;
  color: #0b63f6;
  font-size: 14px;
`;

const CommentBody = styled.div`
  font-size: 14px;
`;

const CommentBulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CommentBulletItem = styled.li`
  font-size: 14px;
  color: ${COLOR_TEXT};
  line-height: 1.6;
  list-style: disc;
`;

const InsightSectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InsightSectionItem = styled.div`
  border: 1px solid ${COLOR_TRACK};
  border-radius: 10px;
  padding: 12px;
  background: ${COLOR_CARD_BG};
  font-size: 13px;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const InsightSectionHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
  font-size: 14px;
  color: ${COLOR_TEXT};
`;

const InsightSectionBadge = styled.span`
  background: rgba(11, 99, 246, 0.12);
  color: ${COLOR_NEGATIVE};
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
`;

const InsightSectionSummary = styled.div`
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
`;

const InsightSectionHighlights = styled.div`
  font-size: 14px;
  color: ${COLOR_TEXT};
  line-height: 1.5;
  strong {
    font-weight: 700;
  }
`;

const VideoSourcesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  margin-top: 20px;
`;

const VideoSourceContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const VideoSourcesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  color: ${COLOR_TEXT};
`;

const VideoSourcesTitle = styled.span`
  font-weight: 700;
`;

const VideoCountBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${COLOR_NEGATIVE};
  background: rgba(11, 99, 246, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
`;

const VideoSourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const VideoSourceCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.25);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover,
  &:focus-visible {
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
    outline: none;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const VideoThumbnailWrapper = styled.div`
  position: relative;
  width: 120px;
  /* height: 68px; */
  border-radius: 8px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.15);
  min-width: 160px;
  max-height: 90px;
  @media (max-width: 480px) {
    width: 100%;
    min-width: 160px;
    aspect-ratio: 16/9;
  }
`;

const VideoThumbnailImage = styled(Image)`
  object-fit: cover;
`;

const VideoThumbnailFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #475569;
  text-align: center;
  padding: 8px;
`;

const VideoSourceBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin-left: 8px;
`;

const VideoTitle = styled.span`
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  color: ${COLOR_TEXT};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VideoSummary = styled.p`
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VideoMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
  flex-wrap: wrap;
`;

const ChannelAvatarImage = styled(Image)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(148, 163, 184, 0.3);
`;

const VideoMetaDot = styled.span`
  font-size: 10px;
  color: #94a3b8;
`;

const VideoMetaRowContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 15px;
  font-weight: 600;
  strong {
    margin-left: 6px;
  }
`;

const VideoMetaRowSubContainer = styled.div`
  display: flex;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 400;
`;
const VideoLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: ${COLOR_NEGATIVE};
  padding: 14px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s ease;
  text-align: center;
  justify-content: center;
  &:hover {
    background: #0a4ec4;
  }

  @media (max-width: 480px) {
    justify-content: center;
  }
`;
const StrategyGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const StrategyItem = styled.div`
  border: 1px solid ${COLOR_TRACK};
  border-radius: 10px;
  background: ${COLOR_CARD_BG};
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StrategyTitle = styled.div`
  font-weight: 700;
  color: ${COLOR_NEGATIVE};
`;

const StrategyDesc = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: ${COLOR_TEXT};
`;

export {
  LiquidityStatCard,
  MarketComment,
  MarketCommentTitle,
  MarketCommentBody,
  MarketCommentBulletList,
  MarketCommentBulletItem,
};
