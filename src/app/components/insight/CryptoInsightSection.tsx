"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";

import DomesticStockInsightSection, {
  MarketComment,
  MarketCommentTitle,
} from "./DomesticStockInsightSection";
import type { InsightSection, InsightStock, InsightStockMetrics, InsightMarketInsights, InsightMarketCard } from "@/types/insight";

interface CryptoInsightSectionProps {
  section: InsightSection;
}

function buildCryptoMarketInsights(
  section: InsightSection
): InsightMarketInsights | undefined {
  const original = section.data?.market_insights;
  const byMarket = original?.by_market && Object.keys(original.by_market).length > 0;
  if (byMarket) return original;

  const overview = section.data?.overview;
  if (!overview) return original;

  const { market_snapshot, macro_drivers } = overview as {
    market_snapshot?: string;
    macro_drivers?: string[];
  };

  const hasSnapshot = !!market_snapshot?.trim();
  const drivers = Array.isArray(macro_drivers)
    ? macro_drivers.filter((item): item is string => Boolean(item && item.trim())).map((item) => item.trim())
    : [];

  if (!hasSnapshot && drivers.length === 0) {
    return original;
  }

  const commentParts: string[] = [];
  if (hasSnapshot) commentParts.push(market_snapshot!.trim());
  if (drivers.length > 0) {
    commentParts.push(drivers.map((driver) => `• ${driver}`).join('<br/>'));
  }

  const commentBody = commentParts.join('<br/><br/>');
  const quickLines: string[] = [];
  if (hasSnapshot) quickLines.push(market_snapshot!.trim());
  quickLines.push(...drivers.slice(0, 2));

  const card: InsightMarketCard = {
    market: `${section.label} 시장 개요`,
    comment_title: '마켓 스냅샷',
    comment_body: commentBody,
    quick_lines: quickLines,
  };

  return {
    ...(original ?? {}),
    date_kst: original?.date_kst ?? section.updated_at,
    by_market: {
      ...(original?.by_market ?? {}),
      [`${section.key}_overview`]: card,
    },
    quick: original?.quick && original.quick.length > 0 ? original.quick : quickLines,
  };
}


function emphasizeNumbers(text?: string | null) {
  if (typeof text !== "string" || text.length === 0) {
    return text == null ? "" : String(text);
  }
  return text.replace(
    /([0-9]+(?:[.,][0-9]+)*\s?(?:억|만|p|%|원|만주|만|조|x)?)/g,
    "<strong>$1</strong>"
  );
}

function sanitizeMetrics(metrics?: InsightStockMetrics): InsightStockMetrics | undefined {
  if (!metrics) return metrics;
  const liquidity = metrics.liquidity
    ? { ...metrics.liquidity }
    : undefined;

  if (liquidity) {
    delete (liquidity as { turnover_pct?: number | null }).turnover_pct;
    delete (liquidity as { volume_change_pct?: number | null }).volume_change_pct;
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

const StyledDomesticSection = DomesticStockInsightSection;

function sanitizeStock(stock: InsightStock): InsightStock {
  const metrics = sanitizeMetrics(stock.metrics);
  return {
    ...stock,
    metrics,
  };
}

const CryptoInsightSection = ({ section }: CryptoInsightSectionProps) => {
  const normalizedSection = useMemo<InsightSection>(() => {
    const stocks = (section.data?.stocks ?? []).map((stock) =>
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
      Boolean(card && card.comment_body)
    );
  }, [normalizedSection]);

  const marketIntro = useMemo<ReactNode | null>(() => {
    if (marketCards.length === 0) return null;
    return (
      <CryptoMarketIntro>
        {marketCards.map((card) => (
          <MarketComment key={card.market ?? card.comment_title}>
            <MarketCommentTitle>
              {card.comment_title ?? "마켓 코멘트"}
            </MarketCommentTitle>
            <div
              dangerouslySetInnerHTML={{
                __html: formatCommentText(card.comment_body ?? ""),
              }}
            />
          </MarketComment>
        ))}
      </CryptoMarketIntro>
    );
  }, [marketCards]);

  return (
    <StyledDomesticSection
      section={normalizedSection}
      hideInsightSectionList
      hideMarketCards
      renderMarketIntro={marketIntro}
    />
  );
};

export default CryptoInsightSection;

const CryptoMarketIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
