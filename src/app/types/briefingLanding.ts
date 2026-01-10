import type { InsightSection } from "@/types/insight";

export type RecapSectionType = "stocks" | "crypto" | "realestate" | "general";

export interface DeliveryMeta {
  deliveredAt: string;
  displayLabel: string;
  description: string;
  tagline: string;
  backLabel: string;
  backHref: string;
  source?: "kakao" | "email" | "web";
}

export interface KeywordNavItem {
  id: string;
  label: string;
  anchor: string;
}

export interface BaseRecapSection {
  id: string;
  anchor: string;
  title: string;
  summaryBullets: string[];
}

export interface MarketIndexCard {
  id: string;
  label: string;
  value: string;
  changeText: string;
  changeRate: string;
  sentiment: "up" | "down" | "flat";
}

export interface MarketInsightContent {
  indexes: MarketIndexCard[];
  commentary: string[];
}

export interface AssetInsightItem {
  id: string;
  name: string;
  ticker: string;
  changeText: string;
  detailHref: string;
}

export interface AssetInsightContent {
  title: string;
  items: AssetInsightItem[];
}

export interface RecapVideoSummary {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  channelThumbnail?: string;
  subscriberText?: string;
  href?: string;
  summary: string[];
}

export interface SlotTabContent {
  market: MarketInsightContent;
  insight: AssetInsightContent;
  videos: RecapVideoSummary[];
  insightSection?: InsightSection;
}

export interface SlotPackage {
  id: string;
  label: string;
  displayTime: string;
  description?: string;
  default?: boolean;
  tabs: SlotTabContent;
}


export interface GeneralRecapSection extends BaseRecapSection {
  type: "general";
  slotPackages: SlotPackage[];
  defaultSlotId?: string;
}

export interface RankingUpdateItem {
  id: string;
  elapsedLabel: string;
  message: string;
}

export type MoneySectionType = "stocks" | "crypto";

export interface MoneyRecapSection extends BaseRecapSection {
  type: MoneySectionType;
  slotPackages: SlotPackage[];
  defaultSlotId?: string;
}

export interface RealEstateRecapSection extends BaseRecapSection {
  type: "realestate";
  tabs: {
    topVideos: RecapVideoSummary[];
    rankingUpdates: RankingUpdateItem[];
  };
  rankingWindows: string[];
  defaultRankingWindow?: string;
}

export type RecapSection = MoneyRecapSection | RealEstateRecapSection | GeneralRecapSection;

export interface ExploreTabLink {
  id: string;
  label: string;
  href: string;
}

export interface BriefingLandingData {
  briefingId: string;
  deliveryMeta: DeliveryMeta;
  keywordNav: KeywordNavItem[];
  sections: RecapSection[];
  exploreTabs: ExploreTabLink[];
}
