// /app/components/LandingPageClient.tsx (클라이언트 컴포넌트)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import ServiceIntroduce from "./ServiceIntroduce";
import LogoHeader from "@/common/LogoHeader";
import YoutubeToday from "./YoutubeToday";
import Footer from "./Footer";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import { fetchSubscribedSubjects } from "../api/apiClient";
import { buildMarketInsightCards } from "@/utils/marketInsight";
import type { MarketInsightCardData } from "@/utils/marketInsight";
import type {
  InsightAsset,
  InsightSection,
  InsightStock,
  InsightStockMetrics,
  InsightStockMetricInsight,
} from "@/types/insight";
import type { StockSlotSection } from "@/utils/stockFeed";

function toFiniteNumber(value?: number | null): number | undefined {
  if (value == null) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeCommentBullets(value?: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
}

function deriveCurrencyFromTicker(ticker?: string | null): string | undefined {
  if (!ticker) return undefined;
  const [currency] = ticker.split("-");
  if (!currency) return undefined;
  return currency.toUpperCase();
}

function buildMetricInsight(
  asset: InsightAsset
): InsightStockMetricInsight | undefined {
  const base = asset.metric_insight ? { ...asset.metric_insight } : {};
  const commentTitle = asset.card_comment?.comment_title;
  const commentBody = asset.card_comment?.comment_body;
  const commentBullets = normalizeCommentBullets(
    asset.card_comment?.comment_bullets || base.comment_bullets
  );
  const baseCommentBullets = normalizeCommentBullets(base.comment_bullets);

  const insightSections = [
    asset.metric_insight?.summary_sentence
      ? {
          category: "summary",
          title: "요약",
          summary: String(asset.metric_insight.summary_sentence),
        }
      : null,
    asset.metric_insight?.turnover_sentence
      ? {
          category: "turnover",
          title: "거래대금",
          summary: String(asset.metric_insight.turnover_sentence),
        }
      : null,
    asset.metric_insight?.range_sentence
      ? {
          category: "range",
          title: "변동성",
          summary: String(asset.metric_insight.range_sentence),
        }
      : null,
    asset.metric_insight?.one_year_pos_sentence
      ? {
          category: "position",
          title: "52주 위치",
          summary: String(asset.metric_insight.one_year_pos_sentence),
        }
      : null,
    asset.metric_insight?.vwap_sentence
      ? {
          category: "vwap",
          title: "VWAP",
          summary: String(asset.metric_insight.vwap_sentence),
        }
      : null,
  ].filter(Boolean);

  const commentResolved =
    commentBody ??
    (typeof base.comment_body === "string" ? base.comment_body : undefined);

  const metricInsight: InsightStockMetricInsight = {
    ...base,
    comment_title:
      commentTitle ??
      (typeof base.comment_title === "string"
        ? base.comment_title
        : undefined) ??
      "코멘트",
    comment_body: commentResolved,
    comment_bullets:
      commentBullets.length > 0
        ? commentBullets
        : baseCommentBullets.length > 0
        ? baseCommentBullets
        : undefined,
  };

  if (insightSections.length > 0) {
    metricInsight.insight_sections = insightSections as Array<{
      category?: string;
      title?: string;
      summary?: string;
      highlights?: string;
    }>;
  }

  return metricInsight;
}

function buildMetrics(asset: InsightAsset): InsightStockMetrics | undefined {
  const realtime = asset.realtime ?? {};
  const cryptoMetrics = asset.crypto_metrics ?? {};

  const currentPrice = toFiniteNumber(realtime.trade_price);
  const changeAmount = toFiniteNumber(
    realtime.signed_change_price ?? realtime.change_price
  );
  const changePct =
    toFiniteNumber(cryptoMetrics.chg_pct) ??
    (toFiniteNumber(realtime.signed_change_rate) != null
      ? Number(realtime.signed_change_rate) * 100
      : undefined);

  const metrics: InsightStockMetrics = {};

  const derivedCurrency = deriveCurrencyFromTicker(asset.ticker);
  if (derivedCurrency) {
    metrics.currency = derivedCurrency;
  }

  if (realtime.market || asset.chain) {
    metrics.market = realtime.market ?? asset.chain;
  }

  if (currentPrice != null) {
    metrics.price = currentPrice;
  }

  if (changePct != null) {
    metrics.chg_pct = changePct;
  }

  if (changeAmount != null) {
    metrics.change_amount = changeAmount;
  }

  const volume =
    toFiniteNumber(realtime.acc_trade_volume_24h) ??
    toFiniteNumber(realtime.acc_trade_volume) ??
    toFiniteNumber(realtime.trade_volume);
  if (volume != null) {
    metrics.volume = volume;
  }

  const priceInfoFields = {
    current_price: currentPrice,
    change_pct: changePct,
    change_amount: changeAmount,
    open: toFiniteNumber(realtime.opening_price),
    high: toFiniteNumber(realtime.high_price),
    low: toFiniteNumber(realtime.low_price),
    prev_close: toFiniteNumber(realtime.prev_closing_price),
    weighted_avg_price:
      toFiniteNumber(cryptoMetrics.vwap_day) ??
      toFiniteNumber(cryptoMetrics.vwap_24h),
  };

  if (Object.values(priceInfoFields).some((value) => value != null)) {
    metrics.price_info = priceInfoFields;
  }

  const range52w = {
    high_52w: toFiniteNumber(realtime.highest_52_week_price),
    high_52w_date: realtime.highest_52_week_date,
    low_52w: toFiniteNumber(realtime.lowest_52_week_price),
    low_52w_date: realtime.lowest_52_week_date,
    position_pct: toFiniteNumber(cryptoMetrics.pos_52w_pct),
    from_high_pct: toFiniteNumber(cryptoMetrics.from_52w_high_pct),
    from_low_pct: toFiniteNumber(cryptoMetrics.from_52w_low_pct),
  };

  if (Object.values(range52w).some((value) => value != null)) {
    metrics.range_52w = range52w;
  }

  const liquidity = {
    volume: toFiniteNumber(realtime.acc_trade_volume_24h),
    value: toFiniteNumber(realtime.acc_trade_price_24h),
    turnover_pct: toFiniteNumber(cryptoMetrics.tr_pct),
    volume_change_pct: undefined,
    value_change_pct: undefined,
  };

  if (Object.values(liquidity).some((value) => value != null)) {
    metrics.liquidity = liquidity;
  }

  return Object.keys(metrics).length > 0 ? metrics : undefined;
}

function mapAssetToInsightStock(asset: InsightAsset): InsightStock | null {
  if (!asset || typeof asset !== "object") return null;
  if (!asset.asset_name || !asset.ticker) return null;

  const metrics = buildMetrics(asset);
  const metricInsight = buildMetricInsight(asset);

  const stock: InsightStock = {
    stock_name: asset.asset_name,
    ticker: asset.ticker,
    company_description: asset.asset_description,
    thesis: asset.thesis,
    catalysts: asset.catalysts,
    risks: asset.risks,
    action_idea: asset.action_idea,
    sources: asset.sources,
  };

  if (metrics) {
    stock.metrics = metrics;
  }

  if (metricInsight) {
    stock.metric_insight = metricInsight;
  }

  const quoteRaw = {
    output: {
      realtime: asset.realtime,
      crypto_metrics: asset.crypto_metrics,
      levels: asset.levels,
      onchain: asset.onchain,
    },
  };

  stock.quote_raw = quoteRaw;

  return stock;
}

function normalizeIntegratedSection(section: InsightSection): InsightSection {
  const assets = section.data?.assets ?? [];
  if (!assets || assets.length === 0) {
    return section;
  }

  const baseStocks = section.data?.stocks ?? [];
  const existingTickers = new Set(
    baseStocks.map((stock) => (stock.ticker ? stock.ticker.trim() : ""))
  );

  const assetStocks = assets
    .map((asset) => {
      if (asset?.ticker && existingTickers.has(asset.ticker.trim())) {
        return null;
      }
      return mapAssetToInsightStock(asset);
    })
    .filter((stock): stock is InsightStock => Boolean(stock));

  if (assetStocks.length === 0) {
    return section;
  }

  return {
    ...section,
    data: {
      ...section.data,
      stocks: [...baseStocks, ...assetStocks],
    },
  };
}

interface LandingPageClientProps {
  apiData: any;
  integratedSections: InsightSection[];
  initialTopic?: string | null;
  stockSlotSections?: StockSlotSection[];
}

export default function LandingPageClient({
  apiData,
  integratedSections,
  initialTopic,
  stockSlotSections = [],
}: LandingPageClientProps) {
  console.log(apiData);
  const setApiData = useSetRecoilState(dataState);
  const user = useRecoilValue(userState);
  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const normalizedSections = useMemo(
    () =>
      integratedSections.map((section) => normalizeIntegratedSection(section)),
    [integratedSections]
  );

  const marketInsightCards: MarketInsightCardData[] = useMemo(() => {
    const cards: MarketInsightCardData[] = [];
    normalizedSections.forEach((section) => {
      const byMarket = section.data?.market_insights?.by_market;
      if (!byMarket) return;
      const payload = {
        date_kst: section.data?.market_insights?.date_kst,
        by_market: byMarket,
      };
      const sectionCards = buildMarketInsightCards(payload).map((card) => ({
        ...card,
        topics: Array.from(new Set([section.label, ...card.topics])),
      }));
      cards.push(...sectionCards);
    });
    return cards;
  }, [normalizedSections]);

  // Recoil 상태에 apiData를 설정
  useEffect(() => {
    setApiData(apiData);
  }, [apiData, setApiData]);

  // 사용자 정보를 기준으로 구독 키워드 데이터를 가져오는 로직
  useEffect(() => {
    const fetchSubjects = async () => {
      if (user.name !== "") {
        try {
          const subjects = await fetchSubscribedSubjects(user.email, user.name);
          setSubscribedSubjects(subjects);
        } catch (error) {
          console.error("Error fetching subscribed subjects:", error);
          setSubscribedSubjects([]);
        }
      } else {
        setSubscribedSubjects([]);
      }
      setIsLoading(false); // 데이터 로드가 완료되면 로딩 상태를 해제
    };

    fetchSubjects();
  }, [user.name, user.email]); // user 상태가 변경될 때만 실행
  return (
    <Container $isLogin={user.name !== ""}>
      <LogoHeader />
      <>
        <ServiceIntroduce subjects={subscribedSubjects} />
        <YoutubeToday
          data={apiData}
          subjects={subscribedSubjects}
          marketInsightCards={marketInsightCards}
          integratedSections={normalizedSections}
          initialTopic={initialTopic}
          stockSlotSections={stockSlotSections}
        />
      </>
      <Footer />
    </Container>
  );
}

const Container = styled.div<{ $isLogin: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: #f0f4ff;
  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;
