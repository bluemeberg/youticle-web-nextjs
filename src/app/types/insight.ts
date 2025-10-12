import type { SummaryData } from "./dataProps";

export interface InsightSectionsResponse {
  sections: InsightSection[];
  missing: string[];
}

export interface InsightSection {
  key: string;
  label: string;
  cache_key: string;
  updated_at?: string;
  data: InsightSectionData;
}

export interface InsightSectionData {
  overview?: InsightOverview;
  stocks?: InsightStock[];
  assets?: InsightAsset[];
  investment_strategies?: InsightStrategy[];
  tags?: string[];
  market_insights?: InsightMarketInsights;
  [key: string]: unknown;
}

export interface InsightOverview {
  market_snapshot?: string;
  macro_drivers?: string[];
  sectors_heatmap?: {
    leaders?: string[];
    laggards?: string[];
  };
  [key: string]: unknown;
}

export interface InsightMarketInsights {
  date_kst?: string;
  by_market?: Record<string, InsightMarketCard | undefined>;
  quick?: string[];
  [key: string]: unknown;
}

export interface InsightMarketCard {
  market?: string;
  price_str?: string;
  chg_point_str?: string;
  chg_pct_str?: string;
  range_str?: string;
  breadth_str?: string;
  volume_value_str?: string;
  order_imbalance_str?: string;
  ytd_range_str?: string;
  one_year_pos_str?: string;
  quick_lines?: string[];
  sentences?: Record<string, string | undefined>;
  comment_title?: string;
  comment_body?: string;
  labels?: Record<string, string | undefined>;
  [key: string]: unknown;
}

export interface InsightSource {
  video_id: string;
  channel_id?: string;
  title?: string;
  thumbnail?: string;
  upload_date?: string;
  channel_name?: string;
  channel_thumbnail?: string;
  summary?: string;
  channel_subscribers?: number;
  summary_data?: SummaryData;
}

export interface InsightStock {
  stock_name: string;
  ticker: string;
  company_description?: string;
  thesis?: Array<{ point: string }>;
  catalysts?: Array<{ item: string; when?: string }>;
  risks?: Array<{ item: string }>;
  action_idea?: { stance: string; reason?: string };
  sources?: InsightSource[];
  quote_raw?: {
    output?: {
      hts_avls?: string | number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  metrics?: InsightStockMetrics;
  metric_insight?: InsightStockMetricInsight;
}

export interface InsightAsset {
  asset_name: string;
  ticker: string;
  chain?: string;
  asset_description?: string;
  thesis?: Array<{ point: string }>;
  catalysts?: Array<{ item: string; when?: string }>;
  risks?: Array<{ item: string }>;
  action_idea?: { stance: string; reason?: string };
  sources?: InsightSource[];
  realtime?: {
    market?: string;
    trade_date?: string;
    trade_time?: string;
    trade_date_kst?: string;
    trade_time_kst?: string;
    timestamp?: number;
    opening_price?: number;
    high_price?: number;
    low_price?: number;
    trade_price?: number;
    prev_closing_price?: number;
    change?: string;
    change_price?: number;
    change_rate?: number;
    signed_change_price?: number;
    signed_change_rate?: number;
    trade_volume?: number;
    acc_trade_price?: number;
    acc_trade_price_24h?: number;
    acc_trade_volume?: number;
    acc_trade_volume_24h?: number;
    highest_52_week_price?: number;
    highest_52_week_date?: string;
    lowest_52_week_price?: number;
    lowest_52_week_date?: string;
    ts_kst?: string;
    [key: string]: unknown;
  };
  crypto_metrics?: {
    vwap_24h?: number;
    vwap_day?: number;
    chg_pct?: number;
    gap_open_pct?: number;
    range_pct?: number;
    tr?: number;
    tr_pct?: number;
    from_52w_high_pct?: number;
    from_52w_low_pct?: number;
    pos_52w_pct?: number;
    liquidity_24h_usdt?: number;
    flow_last_qty?: number;
    flow_last_notional?: number;
    [key: string]: unknown;
  };
  metric_insight?: Record<string, unknown> & {
    one_year_pos_sentence?: string;
    vwap_sentence?: string;
    turnover_sentence?: string;
    range_sentence?: string;
    summary_sentence?: string;
  };
  card_comment?: {
    comment_title?: string;
    comment_body?: string;
  };
  levels?: {
    support?: string;
    resistance?: string;
    [key: string]: string | undefined;
  };
  onchain?: {
    metric?: string;
    note?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface InsightVideoMentionSegmentApi {
  start_time?: string | number;
  start?: string | number;
  timestamp?: string;
  offset_seconds?: number;
  offset?: number;
  label?: string;
  title?: string;
  summary?: string;
  description?: string;
  topic?: string;
  text?: string;
}

export interface InsightVideoMention {
  kind?: string;
  name?: string;
  ticker?: string;
  mention_count?: number;
  segments?: InsightVideoMentionSegmentApi[];
  transcript_segments?: InsightVideoMentionSegmentApi[];
  transcript_mentions?: InsightVideoMentionSegmentApi[];
  timeline?: InsightVideoMentionSegmentApi[];
  timeline_items?: InsightVideoMentionSegmentApi[];
  occurrences?: InsightVideoMentionSegmentApi[];
  highlights?: InsightVideoMentionSegmentApi[];
  action_idea?: { stance?: string; reason?: string };
  metric_insight?: InsightStockMetricInsight;
  item?: InsightStock;
  [key: string]: unknown;
}

export interface InsightVideoMentionsResponse {
  video_id: string;
  mentions?: InsightVideoMention[];
  [key: string]: unknown;
}

export interface InsightVideoOutlineSegmentApi {
  start_time?: string;
  key_point?: string;
  confidence?: string;
  summary?: string;
  description?: string;
  [key: string]: unknown;
}

export interface InsightVideoOutlineEntry {
  stock_name?: string;
  ticker?: string;
  segments?: InsightVideoOutlineSegmentApi[];
  [key: string]: unknown;
}

export interface InsightVideoOutlineResponse {
  video_id?: string;
  outline?:
    | InsightVideoOutlineEntry[]
    | {
        video_id?: string;
        outline?: InsightVideoOutlineEntry[];
      };
  [key: string]: unknown;
}

export interface InsightStockMetrics {
  market?: string;
  currency?: string;
  price?: number;
  chg_pct?: number;
  change_amount?: number;
  volume?: number;
  market_cap?: number;
  per?: number;
  pbr?: number;
  eps?: number;
  bps?: number;
  roe_pct?: number;
  sector?: string;
  range_52w?: {
    high_52w?: number;
    high_52w_date?: string;
    low_52w?: number;
    low_52w_date?: string;
    from_high_pct?: number;
    from_low_pct?: number;
    position_pct?: number;
  };
  price_info?: {
    current_price?: number;
    change_pct?: number;
    change_amount?: number;
    open?: number;
    high?: number;
    low?: number;
    prev_close?: number;
    weighted_avg_price?: number;
  };
  flows?: {
    foreign_ownership_pct?: number;
    foreign_net_buy_qty?: number;
    institution_net_buy_qty?: number;
    foreign_netbuy_share_pct?: number;
    institution_netbuy_share_pct?: number;
  };
  liquidity?: {
    volume?: number;
    value?: number;
    turnover_pct?: number;
    volume_change_pct?: number;
    value_change_pct?: number | null;
  };
  levels?: {
    pivot?: number;
    r1?: number;
    r2?: number;
    s1?: number;
    s2?: number;
    dist_to_resistance_pct?: number;
    dist_to_support_pct?: number;
  };
  quote_raw?: {
    output?: {
      hts_avls?: string | number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export interface InsightStockMetricInsight {
  metric_kind?: string;
  comment_title?: string;
  comment_body?: string;
  insight_sections?: Array<{
    category?: string;
    title?: string;
    summary?: string;
    highlights?: string;
  }>;
  [key: string]: unknown;
}

export interface InsightStrategy {
  strategy_title: string;
  strategy_description: string;
}
