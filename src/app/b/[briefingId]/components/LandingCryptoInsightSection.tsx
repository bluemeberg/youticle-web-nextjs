"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";

import LandingDomesticStockInsightSection, {
  MarketComment,
  MarketCommentTitle,
  MarketCommentBulletList,
  MarketCommentBulletItem,
} from "./LandingDomesticStockInsightSection";
import type {
  InsightAsset,
  InsightSection,
  InsightStock,
  InsightStockMetrics,
  InsightMarketInsights,
  InsightMarketCard,
} from "@/types/insight";
import type { SlotLabel } from "@/utils/briefingSlot";

interface LandingCryptoInsightSectionProps {
  section: InsightSection;
  slotLabel?: SlotLabel;
}

function buildCryptoMarketInsights(
  section: InsightSection
): InsightMarketInsights | undefined {
  const original = section.data?.market_insights;
  const byMarket =
    original?.by_market && Object.keys(original.by_market).length > 0;
  if (byMarket) return original;

  const overview = section.data?.overview;
  if (!overview) return original;

  const { market_snapshot, macro_drivers } = overview as {
    market_snapshot?: string | string[] | null;
    macro_drivers?: string | Array<string | null | undefined> | null;
  };

  const snapshotLines = normalizeTextEntries(market_snapshot);
  const drivers = normalizeTextEntries(macro_drivers);
  const snapshotBullets = snapshotLines.map(convertMarkToStrong);
  const driverBullets = drivers.map(convertMarkToStrong);
  const hasSnapshot = snapshotLines.length > 0;

  if (!hasSnapshot && drivers.length === 0) {
    return original;
  }

  const commentParts: string[] = [];
  if (snapshotBullets.length > 0) {
    commentParts.push(snapshotBullets.join("<br/>"));
  }
  // if (driverBullets.length > 0) {
  //   commentParts.push(
  //     driverBullets.map((driver) => `• ${driver}`).join("<br/>")
  //   );
  // }

  const commentBody =
    commentParts.length > 0 ? commentParts.join("<br/><br/>") : undefined;
  const commentBullets = [...snapshotBullets];
  const quickLines: string[] = [];
  if (hasSnapshot) quickLines.push(convertMarkToStrong(snapshotLines[0]));
  quickLines.push(...drivers.slice(0, 2).map(convertMarkToStrong));

  const card: InsightMarketCard = {
    market: `${section.label} 시장 개요`,
    comment_title: section.label ? `${section.label} 코멘트` : "마켓 코멘트",
    comment_body: commentBody,
    comment_bullets: commentBullets,
    quick_lines: quickLines,
  };

  return {
    ...(original ?? {}),
    date_kst: original?.date_kst ?? section.updated_at,
    by_market: {
      ...(original?.by_market ?? {}),
      [`${section.key}_overview`]: card,
    },
    quick:
      original?.quick && original.quick.length > 0
        ? original.quick
        : quickLines,
  };
}

const normalizeCommentBullets = (value?: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
};

const normalizeTextEntries = (value?: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item): item is string => item.length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

const convertMarkToStrong = (text: string): string =>
  text.replace(/<mark>/g, "<strong>").replace(/<\/mark>/g, "</strong>");

function emphasizeNumbers(text?: string | null) {
  if (typeof text !== "string" || text.length === 0) {
    return text == null ? "" : String(text);
  }
  return text.replace(
    /([0-9]+(?:[.,][0-9]+)*\s?(?:억|만|p|%|원|만주|만|조|x)?)/g,
    "<strong>$1</strong>"
  );
}

function sanitizeMetrics(
  metrics?: InsightStockMetrics
): InsightStockMetrics | undefined {
  if (!metrics) return metrics;
  const liquidity = metrics.liquidity ? { ...metrics.liquidity } : undefined;

  if (liquidity) {
    delete (liquidity as { turnover_pct?: number | null }).turnover_pct;
    delete (liquidity as { volume_change_pct?: number | null })
      .volume_change_pct;
    delete (liquidity as { value_change_pct?: number | null }).value_change_pct;
  }

  return {
    ...metrics,
    liquidity,
  };
}

function formatCommentText(text: string) {
  const highlighted = emphasizeNumbers(text);
  const parts = highlighted
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.join("<br/>");
}

const StyledDomesticSection = LandingDomesticStockInsightSection;

function sanitizeStock(stock: InsightStock): InsightStock {
  const metrics = sanitizeMetrics(stock.metrics);
  return {
    ...stock,
    metrics,
  };
}

const convertAssetToStock = (asset: InsightAsset): InsightStock => {
  const realtime = asset.realtime ?? {};
  const cryptoMetrics = asset.crypto_metrics ?? {};
  const priceInfo: InsightStockMetrics["price_info"] = {
    current_price:
      realtime.trade_price ??
      cryptoMetrics.vwap_day ??
      cryptoMetrics.vwap_24h ??
      undefined,
    change_pct: cryptoMetrics.chg_pct ?? realtime.change_rate ?? undefined,
    change_amount: realtime.change_price ?? undefined,
    open: realtime.opening_price ?? undefined,
    high: realtime.high_price ?? undefined,
    low: realtime.low_price ?? undefined,
    prev_close: realtime.prev_closing_price ?? undefined,
  };

  const range52w =
    realtime.highest_52_week_price || realtime.lowest_52_week_price
      ? {
          high_52w: realtime.highest_52_week_price ?? undefined,
          high_52w_date: realtime.highest_52_week_date ?? undefined,
          low_52w: realtime.lowest_52_week_price ?? undefined,
          low_52w_date: realtime.lowest_52_week_date ?? undefined,
        }
      : undefined;

  const metricInsight = {
    ...(asset.metric_insight ?? {}),
    comment_bullets:
      asset.metric_insight?.comment_bullets ??
      asset.card_comment?.comment_bullets ??
      [],
    comment_body:
      asset.metric_insight?.comment_body ?? asset.card_comment?.comment_body,
    summary_sentence:
      asset.metric_insight?.summary_sentence ??
      asset.card_comment?.comment_title ??
      undefined,
  } as InsightStock["metric_insight"];

  return {
    stock_name: asset.asset_name,
    ticker: asset.ticker ?? asset.asset_name,
    company_description: asset.asset_description,
    action_idea: asset.action_idea,
    comment_bullets:
      asset.card_comment?.comment_bullets ??
      asset.metric_insight?.comment_bullets,
    sources: asset.sources,
    metrics: {
      price_info: priceInfo,
      market: realtime.market,
      currency: realtime.market,
      range_52w: range52w,
      liquidity: {
        volume: realtime.acc_trade_volume_24h ?? realtime.acc_trade_volume,
        value: realtime.acc_trade_price_24h ?? realtime.acc_trade_price,
      },
    },
    metric_insight: metricInsight,
  };
};

const LandingCryptoInsightSection = ({
  section,
  slotLabel,
}: LandingCryptoInsightSectionProps) => {
  const normalizedSection = useMemo<InsightSection>(() => {
    const rawStocks = section.data?.stocks ?? [];
    const convertedStocks =
      rawStocks.length > 0
        ? rawStocks
        : (section.data?.assets ?? [])
            .map((asset) => (asset ? convertAssetToStock(asset) : null))
            .filter((asset): asset is InsightStock => Boolean(asset));
    const stocks = convertedStocks.map((stock) =>
      stock ? sanitizeStock(stock) : stock
    );

    const marketInsights = buildCryptoMarketInsights(section);

    return {
      ...section,
      data: {
        ...section.data,
        stocks,
        market_insights: marketInsights,
      },
    };
  }, [section]);

  const marketCards = useMemo(() => {
    const byMarket = normalizedSection.data.market_insights?.by_market;
    if (!byMarket) return [] as InsightMarketCard[];
    return Object.values(byMarket).filter((card): card is InsightMarketCard =>
      Boolean(
        card &&
          (card.comment_body ||
            (Array.isArray(card.comment_bullets) &&
              card.comment_bullets.length > 0))
      )
    );
  }, [normalizedSection]);

  const marketIntro = useMemo<ReactNode | null>(() => {
    if (marketCards.length === 0) return null;
    return (
      <CryptoMarketIntro>
        {marketCards.map((card) => {
          const bullets = normalizeCommentBullets(card.comment_bullets);
          const body = card.comment_body ?? "";
          const hasBody = typeof body === "string" && body.trim().length > 0;
          return (
            <MarketComment
              key={card.market ?? card.comment_title}
              $withBorder={!hasBody && bullets.length === 0}
            >
              <MarketCommentTitle>
                {card.comment_title ?? "마켓 코멘트"}
              </MarketCommentTitle>
              {bullets.length > 0 ? (
                <MarketCommentBulletList>
                  {bullets.map((bullet, index) => (
                    <MarketCommentBulletItem
                      key={`crypto-market-bullet-${index}`}
                      dangerouslySetInnerHTML={{
                        __html: formatCommentText(bullet),
                      }}
                    />
                  ))}
                </MarketCommentBulletList>
              ) : hasBody ? (
                <MarketCommentBody
                  dangerouslySetInnerHTML={{
                    __html: formatCommentText(body),
                  }}
                />
              ) : null}
            </MarketComment>
          );
        })}
      </CryptoMarketIntro>
    );
  }, [marketCards]);

  return (
    <StyledDomesticSection
      section={normalizedSection}
      hideInsightSectionList
      hideMarketCards
      renderMarketIntro={marketIntro}
      forceStockPreview
      slotLabel={slotLabel}
    />
  );
};

export default LandingCryptoInsightSection;

const CryptoMarketIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MarketCommentBody = styled.div`
  font-size: 14px;
`;
