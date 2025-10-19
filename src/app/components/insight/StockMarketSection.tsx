"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";

import type {
  InsightMarketDeltaCard,
  InsightSection,
  InsightStock,
} from "@/types/insight";
import {
  buildIntradayDetailFromCard,
  buildLiquidityDetailFromSentence,
  buildFlowShareDetail,
  buildFlowShiftDetail,
} from "./utils/marketDeltaParsers";
import { StockVideoSources } from "./DomesticStockInsightSection";

interface StockMarketSectionProps {
  section: InsightSection;
  showHeader?: boolean;
  defaultExpanded?: boolean;
}

type StockInsightSectionDetail = {
  category?: string | null;
  title?: string | null;
  summary?: string | null;
  highlights?: string | null;
};

type PriceTone = "positive" | "negative" | "neutral";

const COLOR_POSITIVE = "#ff6b6b";
const COLOR_NEGATIVE = "#0b63f6";
const COLOR_NEUTRAL = "#9db3ff";
const COLOR_TRACK = "#e7ecff";
const COLOR_CARD_BG = "#f5f7ff";
const COLOR_TEXT = "#0f172a";

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

const StockMarketSection = ({
  section,
  showHeader = true,
  defaultExpanded,
}: StockMarketSectionProps) => {
  const delta = section.data?.market_delta_insights;
  const rawStocks = (section.data?.stocks ?? []) as InsightStock[];
  const stocks = rawStocks;
  const stockIntroText = getStockIntroText(section.label);
  const hasStocks = stocks.length > 0;

  const marketEntries = useMemo(() => {
    if (!delta?.by_market) return [] as Array<[string, InsightMarketDeltaCard]>;
    return Object.entries(delta.by_market).filter(
      (entry): entry is [string, InsightMarketDeltaCard] => Boolean(entry[1])
    );
  }, [delta?.by_market]);

  const [showDetails, setShowDetails] = useState(
    defaultExpanded ?? !showHeader
  );
  const shouldRenderDetails = showHeader ? showDetails : true;

  if (!delta || marketEntries.length === 0) {
    return null;
  }

  return (
    <Wrapper>
      {showHeader ? (
        <SectionHeader>
          <Title>{section.label || "주식"} 마켓 인사이트</Title>
          {delta.date_kst ? (
            <Timestamp>업데이트 : {formatDateTime(delta.date_kst)}</Timestamp>
          ) : null}
        </SectionHeader>
      ) : null}

      {/* {delta.quick?.length ? (
        <SectionQuickLines>
          {delta.quick.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </SectionQuickLines>
      ) : null} */}

      {showHeader ? (
        <MarketGrid>
          {marketEntries.map(([marketKey, card]) => (
            <MarketCardWrapper key={`summary-${marketKey}`}>
              <MarketCardHeaderContent card={card} marketKey={marketKey} />
            </MarketCardWrapper>
          ))}
        </MarketGrid>
      ) : null}

      {showHeader ? (
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

      {shouldRenderDetails ? (
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
              card.sentences?.headline || card.comment_title || card.sentences?.comment;
            const commentBody = card.comment_body || card.sentences?.comment;

            return (
              <MarketCardWrapper key={marketKey}>
                <MarketCardHeaderContent card={card} marketKey={marketKey} />

                {/* {quickLines.length ? (
                  <QuickLines>
                    {quickLines.map((line) => (
                      <QuickLine key={line}>{line}</QuickLine>
                    ))}
                  </QuickLines>
                ) : null} */}

                <MarketDetailBody>
                  {headline || commentBody ? (
                    <MarketComment $withBorder={!commentBody}>
                      {headline ? (
                        <MarketCommentTitle>{headline}</MarketCommentTitle>
                      ) : null}
                      {commentBody ? (
                        <MarketCommentBody
                          dangerouslySetInnerHTML={{
                            __html: formatTextWithSentenceBreaks(commentBody),
                          }}
                        />
                      ) : null}
                    </MarketComment>
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
                                  $tone={liquidityDetail.volumeTone}
                                  style={{
                                    left: `${liquidityDetail.volumeLeft}%`,
                                    width: `${Math.max(
                                      liquidityDetail.volumeWidth,
                                      1
                                    )}%`,
                                  }}
                                />
                                <LiquidityPointer
                                  $tone={liquidityDetail.volumeTone}
                                  style={{
                                    left: `${liquidityDetail.volumePointer}%`,
                                  }}
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
                        {flowDetail.share ? (
                          <FlowShareBar>
                            {flowDetail.share.segments.map((segment) => (
                              <FlowShareSegment
                                key={segment.key}
                                $color={FLOW_COLORS[segment.tone] || FLOW_COLORS.others}
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
                                {stat.label ? <strong>{stat.label}</strong> : null}
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

                  {/* {extraSentences.length ? (
                    <MarketStatGrid>
                      <MarketStat>
                        <MarketStatLabel>기타 업데이트</MarketStatLabel>
                        <FlowStatList>
                          {extraSentences.map((item) => (
                            <li key={item.key}>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: emphasizeNumbers(item.text),
                                }}
                              />
                            </li>
                          ))}
                        </FlowStatList>
                      </MarketStat>
                    </MarketStatGrid>
                  ) : null} */}
                </MarketDetailBody>
              </MarketCardWrapper>
            );
          })}
        </MarketGrid>
      ) : null}

      {hasStocks ? (
        <>
          <StockSubSectionHeader>
            <StockSubSectionTitle>📊 종목 인사이트</StockSubSectionTitle>
            {section.updated_at ? (
              <Timestamp>
                업데이트 : {formatDateTime(section.updated_at)}
              </Timestamp>
            ) : null}
          </StockSubSectionHeader>
          <StockSubSectionIntro>{stockIntroText}</StockSubSectionIntro>
          <StockList>
            {stocks.map((stock, index) => (
              <StockInsightCard
                key={stock.ticker || stock.stock_name || `stock-${index}`}
                stock={stock}
              />
            ))}
          </StockList>
        </>
      ) : null}
    </Wrapper>
  );
};

export default StockMarketSection;

const StockInsightCard = ({ stock }: { stock: InsightStock }) => {
  const insight = stock.metric_insight;
  const insightSections = (insight?.insight_sections ?? []) as Array<
    StockInsightSectionDetail | null | undefined
  >;
  const priceSection = findPricePositionSection(insightSections);
  const additionalSections = insightSections
    // .filter((section): section is StockInsightSectionDetail =>
    //   Boolean(section && section !== priceSection)
    // )
    .filter((section): section is StockInsightSectionDetail => {
      return Boolean(section && (section.summary || section.highlights));
    });
  const priceInfo = parsePricePosition(priceSection ?? undefined);
  const commentTitle = insight?.comment_title || stock.action_idea?.stance || null;
  const commentBody = insight?.comment_body || stock.action_idea?.reason || null;
  const priceSummary = priceSection?.summary;
  const priceHighlights = priceSection?.highlights;
  const hasDetailContent = Boolean(
    priceSummary || priceHighlights || commentBody || additionalSections.length
  );
  const [showDetails, setShowDetails] = useState(false);
  const detailToggleLabel = showDetails
    ? "상세 인사이트 접기"
    : "상세 인사이트 펼치기";

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

          {showDetails ? (
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

              {commentBody ? (
                <StockComment>
                  {commentTitle ? (
                    <StockCommentTitle>{commentTitle}</StockCommentTitle>
                  ) : null}
                  <StockCommentBody
                    dangerouslySetInnerHTML={{
                      __html: formatTextWithSentenceBreaks(commentBody),
                    }}
                  />
                </StockComment>
              ) : null}

              {additionalSections.length ? (
                <StockInsightList>
                  {additionalSections.map((section, index) => {
                    const formattedSummary = formatInsightText(
                      section,
                      section.summary
                    );
                    const formattedHighlights = formatInsightText(
                      section,
                      section.highlights
                    );

                    return (
                      <StockInsightItem
                        key={`${section.category || "section"}-${section.title || index}`}
                      >
                        {(section.category || section.title) ? (
                          <StockInsightHeader>
                            {section.category ? (
                              <StockInsightBadge>{section.category}</StockInsightBadge>
                            ) : null}
                            {section.title ? <span>{section.title}</span> : null}
                          </StockInsightHeader>
                        ) : null}
                        {formattedSummary ? (
                          <StockInsightSummary
                            dangerouslySetInnerHTML={{
                              __html: emphasizeNumbers(formattedSummary),
                            }}
                          />
                        ) : null}
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
          ) : null}
        </>
      ) : null}


      {showDetails ? (
        <StockVideoSources
          stockName={stock.stock_name ?? ""}
          sources={stock.sources}
        />
      ) : null}
    </StockCardWrapper>
  );
};

const MarketCardHeaderContent = ({
  card,
  marketKey,
}: {
  card: InsightMarketDeltaCard;
  marketKey: string;
}) => (
  <MarketCardHeader className="StockMarketSection__MarketCardHeader">
    <MarketTitle>
      {card.market || marketKey}
      {card.price_str ? <strong>{card.price_str}</strong> : null}
    </MarketTitle>
    {card.chg_point_str || card.chg_pct_str ? (
      <MarketChange
        $positive={Boolean(
          card.chg_pct_str && card.chg_pct_str.includes("+")
        )}
      >
        {card.chg_point_str ? <span>{card.chg_point_str}</span> : null}
        {card.chg_pct_str}
      </MarketChange>
    ) : null}
  </MarketCardHeader>
);

function buildFlowDetail(card: InsightMarketDeltaCard) {
  const summary = card.flows?.summary || card.sentences?.flows_summary;
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
    const todayWidth = Math.min(50, (Math.abs(item.todayAmount) / safeMax) * 50);
    const prevWidth = Math.min(50, (Math.abs(item.prevAmount) / safeMax) * 50);
    const todayLeft = item.todayAmount >= 0 ? 50 : 50 - todayWidth;
    const prevLeft = item.prevAmount >= 0 ? 50 : 50 - prevWidth;

    return (
      <FlowShiftItem key={item.key}>
        <FlowShiftLabel>{item.label}</FlowShiftLabel>
        <FlowShiftBars>
          <FlowShiftRow>
            <FlowShiftBadge>오늘</FlowShiftBadge>
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
            <FlowShiftBadge $variant="muted">전일</FlowShiftBadge>
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
            수량 {formatSignedNumberCompact(item.todayQty)}주 (전일 {formatSignedNumberCompact(item.prevQty)}주)
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

function parsePricePosition(
  section?: { summary?: string | null; highlights?: string | null }
) {
  if (!section) return null;
  const source = section.highlights || section.summary;
  if (!source) return null;

  const sanitized = source
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
    changeTextParts.push(descriptor.includes("세") ? descriptor : `${descriptor}`);
  }

  const changeText = changeTextParts.join(" ");

  const tone: PriceTone = (() => {
    if (descriptor) {
      if (descriptor.includes("상") || descriptor.includes("강")) return "positive";
      if (descriptor.includes("하") || descriptor.includes("약")) return "negative";
    }
    if (changeMatch?.[1]) {
      const raw = changeMatch[1];
      if (raw.startsWith("+") || raw.startsWith("▲")) return "positive";
      if (raw.startsWith("-") || raw.startsWith("▼")) return "negative";
    }
    return "neutral";
  })();

  const closeText = closeMatch
    ? `${closeMatch[1]}${closeMatch[2] && closeMatch[2] !== "$" ? closeMatch[2] : ""}`
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

function formatInsightText(
  section: StockInsightSectionDetail,
  text?: string | null
) {
  if (!text) return text ?? "";
  const context = `${section.category ?? ""} ${section.title ?? ""} ${text}`.toLowerCase();
  const isHundredMillionContext = HUNDRED_MILLION_KEYWORDS.some((keyword) =>
    context.includes(keyword)
  );

  return text.replace(NUMBER_TOKEN_REGEX, (match, _token, index) => {
    const numeric = Number(match.replace(/,/g, ""));
    if (!Number.isFinite(numeric)) {
      return match;
    }

    const after = text.slice(index + match.length);
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
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (!Number.isFinite(abs)) {
    return String(value);
  }

  const jo = Math.floor(abs / 10000);
  const remainder = abs - jo * 10000;
  const parts: string[] = [];

  if (jo > 0) {
    parts.push(`${formatNumberWithoutTrailingZeros(jo)}조`);
  }

  if (remainder > 0) {
    parts.push(`${formatNumberWithoutTrailingZeros(remainder)}억`);
  }

  if (parts.length === 0) {
    parts.push(`${formatNumberWithoutTrailingZeros(abs)}억`);
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
  switch (label) {
    case "국내 가상자산":
    case "해외 가상자산":
      return "종목 인사이트에서는 온체인 지표와 거래 흐름을 기반으로 TOP5 영상에 등장한 코인을 정리합니다.";
    case "해외 주식":
      return "종목 인사이트에서는 TOP5 영상에서 포착한 해외 주식 흐름을 글로벌 지표와 함께 다시 정리한 요약입니다.";
    default:
      return "종목 인사이트에서는 TOP5 영상에 등장한 종목을 현재 시세, 밸류에이션, 수급, 유동성까지 한눈에 정리합니다.";
  }
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

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `오늘 ${hh}:${mm}`;
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

function convertMarkToStrong(text: string) {
  return text
    .replace(/<mark\b[^>]*>/g, "<strong>")
    .replace(/<\/mark>/g, "</strong>");
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
  justify-content: flex-end;
  margin-top: 8px;
`;

const MarketGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const MarketCardWrapper = styled.article`
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

const StockSubSectionHeader = styled.div`
  margin: 28px 4px 4px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: baseline;
`;

const StockSubSectionTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
`;

const StockSubSectionIntro = styled.p`
  margin: 4px 4px 12px;
  font-size: 16px;
  color: #000;
  line-height: 1.5;
`;

const StockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StockCardWrapper = styled.article`
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
  margin-top: 8px;
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

const StockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StockDetailBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
`;

const StockTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${COLOR_TEXT};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StockPriceValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #475569;
`;

const StockDeltaBlock = styled.div<{ $tone: PriceTone }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === "positive"
      ? COLOR_POSITIVE
      : $tone === "negative"
      ? COLOR_NEGATIVE
      : "#475569"};

  span {
    font-size: 16px;
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
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
`;

const StockHighlights = styled.div`
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
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
  font-size: 13px;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 6px;
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

const StockCommentTitle = styled.span`
  font-weight: 700;
  font-size: 14px;
  color: ${COLOR_NEGATIVE};
`;

const StockCommentBody = styled.div`
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
`;



const MarketToggleButton = styled.button`
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

const MarketDetailBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
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
  strong {
    font-weight: 700;
  }
`;

const MarketCommentTitle = styled.div`
  font-weight: 700;
  margin-bottom: 4px;
  color: #0b63f6;
`;

const MarketCommentBody = styled.div`
  font-size: 14px;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
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
`;

const FlowShareSegment = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color }) => $color};
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
  color: ${({ $variant }) =>
    $variant === "muted" ? "#475569" : "#1d4ed8"};
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

const FlowShiftValue = styled.span<{ $tone: "positive" | "negative" | "neutral" }>`
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
