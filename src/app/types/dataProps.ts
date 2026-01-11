export type StockFeedSlotPhase =
  | "baseline"
  | "slot2"
  | "slot3"
  | "slot4"
  | "slot5";

export interface DataProps {
  video_id: string;
  title: string;
  section: string;
  duration: string;
  upload_date: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  subscribers: number;
  score: number;
  is_new?: boolean | null;
  detected_slots?: Record<string, boolean> | null;
  summary_data: SummaryData;
  id?: string;
  channel_details: ChannelDetails;
  stock_mentions?: StockMention[];
  stock_slot_phase?: StockFeedSlotPhase;
  stock_slot_priority?: number;
}

export interface MarketInsightSentences {
  intraday_flow?: string;
  market_breadth?: string;
  liquidity?: string;
  order_flow?: string;
  [key: string]: unknown;
}

export interface MarketInsightIntraday {
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close_pos_text?: string;
  open_delta?: string;
  [key: string]: unknown;
}

export interface MarketInsightBreadth {
  adv?: number | string;
  unch?: number | string;
  dec?: number | string;
  adv_ratio_text?: string;
  bias_text?: string;
  [key: string]: unknown;
}

export interface MarketInsightLiquidity {
  volume?: number | string;
  prev_volume?: number | string;
  x_volume?: string;
  value?: number | string;
  prev_value?: number | string;
  x_value?: string;
  state_text?: string;
  [key: string]: unknown;
}

export interface MarketInsightOrderbook {
  bid_qty?: number | string;
  ask_qty?: number | string;
  bid_pct?: number | string;
  ask_pct?: number | string;
  net_qty_text?: string;
  [key: string]: unknown;
}

export interface MarketInsightTopic {
  market?: string;
  price_str?: string;
  chg_point?: number | string;
  chg_pct?: number | string;
  chg_point_str?: string;
  chg_pct_str?: string;
  comment_title?: string;
  comment_body?: string;
  comment_bullets?: string[];
  topic_category?: string;
  related_topics?: string[];
  intraday?: MarketInsightIntraday;
  breadth?: MarketInsightBreadth;
  liquidity?: MarketInsightLiquidity;
  orderbook?: MarketInsightOrderbook;
  sentences?: MarketInsightSentences;
  asof?: string;
  date_kst?: string;
  [key: string]: unknown;
}

export interface MarketInsightPayload {
  date_kst?: string;
  by_market?: Record<string, MarketInsightTopic | undefined>;
  [key: string]: unknown;
}

export interface Overview {
  market_analysis?: string;
  stocks?: Stock[];
  investment_strategy?: InvestmentStrategy[];
  investment_strategy_real_estate: string;
  beauty_trends?: BeautyTrend[]; // Beauty trend section
  brand_spotlight?: BrandSpotlight[]; // Brand spotlight section
  styling_tips?: StylingTip[];

  // AI 관련 데이터
  ai_trends?: AITrend[];
  related_technologies?: RelatedTechnology[];

  fashion_trends?: FashionTrend[]; // 패션 관련
  brand_spotlight_fashion?: FashionBrandSpotlight[]; // 패션 관련
  styling_tips_fashion?: FashionStylingTip[]; // 패션 관련

  business_trends?: BusinessTrend[]; // 비즈니스 트렌드
  strategic_insights?: StrategicInsight[];

  // 경제 관련 데이터 추가
  economic_trends?: EconomicTrend[];
  market_analysis_economy?: MarketAnalysisEconomy[];
  investment_strategies_economy?: InvestmentStrategyEconomy[];

  cryptos?: Crypto[]; // 새로운 cryptos 필드 추가
}
export interface Crypto {
  crypto_name: string;
  crypto_description: string;
  crypto_analysis: CryptoAnalysis[];
}

export interface CryptoAnalysis {
  description: string;
}
// 새로운 경제 관련 타입 정의
export interface EconomicTrend {
  trend_name: string;
  trend_description: string;
}

export interface MarketAnalysisEconomy {
  market_indicator: string;
  analysis: string;
}

export interface InvestmentStrategyEconomy {
  strategy_title: string;
  strategy_description: string;
}

export interface BusinessTrend {
  trend_name: string;
  trend_description: string;
}

export interface StrategicInsight {
  strategy_name: string;
  strategy_description: string;
  application_tips: ApplicationTip[];
}

export interface ApplicationTip {
  tip_title: string;
  tip_description: string;
  related_tools: RelatedTool[];
}

export interface RelatedTool {
  tool_name: string;
  tool_usage_description: string;
}

export interface RecommendedTool {
  tool_name: string;
  tool_description: string;
  recommended_use_case: string;
}

export interface FashionTrend {
  trend_name: string;
  trend_description: string;
}

export interface FashionBrandSpotlight {
  brand_name: string;
  brand_description: string;
  highlighted_items: HighlightedItem[];
}

export interface HighlightedItem {
  item_name: string;
  item_description: string;
}

export interface FashionStylingTip {
  tip_title: string;
  tip_description: string;
  recommended_item: RecommendedItem[];
}

export interface RecommendedItem {
  item_name: string;
  usage_tip: string;
}

// 인공지능
export interface AITrend {
  trend_name: string;
  trend_description: string;
}

export interface RelatedTechnology {
  technology_name: string;
  technology_description: string;
  usage_tips: UsageTip[];
}

export interface UsageTip {
  tip_title: string;
  tip_description: string;
}

export interface HealthFocus {
  focus_name: string;
  focus_description: string;
}

export interface MethodSpotlight {
  method_name: string;
  method_description: string;
  key_benefits: KeyBenefits[];
}

export interface KeyBenefits {
  benefit_name: string;
  benefit_description: string;
}

export interface LifeStyleTips {
  tip_title: string;
  tip_description: string;
  recommended_step: RecommendStep[];
}

export interface RecommendStep {
  step_name: string;
  usage_instruction: string;
}

export interface Stock {
  stock_name: string;
  company_description: string;
  stock_analysis: StockAnalysis[];
}

export interface StockAnalysis {
  description: string;
}

export interface StockMentionSegment {
  start_time?: string | number;
  label?: string;
  summary?: string;
  seconds?: number | null;
  confidence?: string;
}

export interface StockMention {
  stock_name: string;
  ticker?: string;
  mention_count?: number;
  segments: StockMentionSegment[];
  actionIdea?: StockMentionActionIdea;
  companyDescription?: string;
  commentBody?: string;
  commentBullets?: string[];
}

export interface StockMentionActionIdea {
  stance?: string;
  reason?: string;
}

export interface InvestmentStrategy {
  strategy_title: string;
  strategy_description: string;
}

export interface RealEstateAnalysis {
  real_estate_area: string;
  area_description: string;
  analysis: string[];
}

export interface BeautyTrend {
  trend_name: string;
  trend_description: string;
}

export interface BrandSpotlight {
  brand_name: string;
  brand_description: string;
  highlighted_products: HighlightedProduct[];
}

export interface HighlightedProduct {
  product_name: string;
  product_description: string;
}

export interface StylingTip {
  tip_title: string;
  tip_description: string;
  recommended_product: RecommendedProduct[];
}

export interface RecommendedProduct {
  product_name: string;
  product_usage_tip: string;
}
export interface EditorDataProps {
  video_id: string;
  title: string;
  section: string;
  duration: string;
  upload_date: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  subscribers: number;
  article_date: string;
  score: number;
  summary_data: SummaryData;
  channel_details: ChannelDetails;
}

export interface SummaryData {
  headline_title: string;
  headline_sub_title: string;
  short_summary: string;
  key_points?: KeyPoint[]; // key_points 배열 추가
  section: Section[];
  channel_overview: string;
  overview?: Overview; // Make overview optional
  comment_insight?: CommentInsight; // ✅ comment_insight 속성 추가
  five_lines_summary?: FiveLineSummary[]; // ✅ five_lines_summary 속성 추가
  comment_social_proof: CommentSocialProof;
  comment_insight_front: CommentInsightFront;
  category_relative_views_pct: number;
  relative_sub_norm_pct: number;
  avg_views_per_hour_normalized: number;
  avg_views_per_hour: number;
  like_rate_pct: number;
  comment_rate_pct: number;
  score: number;
  hooking_content: HookingContent;
  stock_mentions?: StockMention[];
}

export interface FiveLineSummary {
  content: string;
  start_time: string;
}
export interface HookingContent {
  hooking_content: string;
}

// 🟡 새로운 comment_insight 타입 정의
export interface CommentInsight {
  "1st": string;
  "1st_comments": CommentObj[];
  "2nd": string;
  "2nd_comments": CommentObj[];
  "3rd": string;
  "3rd_comments": CommentObj[];
}

export interface CommentSocialProof {
  comment: string;
  likeCount: string;
}

export interface CommentInsightFront {
  "1st": string;
  "1st_comments": CommentObj[];
  "2nd": string;
  "2nd_comments": CommentObj[];
  "3rd": string;
  "3rd_comments": CommentObj[];
}

export interface CommentObj {
  comment: string;
  likeCount: string;
  updatedAt: string;
}

export interface KeyPoint {
  point: string; // key_points 배열의 point 필드
}

export interface Section {
  title: string;
  detail_contents: string;
  start_time: string;
  explanation_keyword: string;
  explanation_description: string;
}

export interface ChannelDetails {
  channel_id: string;
  channel_name: string;
  channel_subscribers: number;
  channel_video_count: number;
  channel_view_count: number;
  channel_thumbnail: string;
  channel_banner: string;
}

export interface ReportChannel {
  banner: string;
  description: string;
  id: string;
  sub_count: number;
  thumbnail: string;
  title: string;
  video_count: number;
  view_count: number;
  // Add other relevant fields if needed
}

export interface ReportVideo {
  channel_id: string;
  detail_category: string;
  duration: string;
  id: string;
  section: string;
  summary_data: SummaryData;
  tags: string;
  thumbnail: string;
  title: string;
  upload_date: string;
  // Add other relevant fields if needed
}

export interface ReportData {
  briefing_channel: ReportChannel;
  briefing_video: ReportVideo;
  category: string;
  keyword: string;
  period: "D" | "W"; // 'D' for Daily, 'W' for Weekly
  user_id: number;
  video_id: string;
}
