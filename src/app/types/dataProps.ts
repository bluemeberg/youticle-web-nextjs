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
  summary_data: SummaryData;
  channel_details: ChannelDetails;
}

export interface Overview {
  market_analysis?: string;
  stock_analysis?: StockAnalysis[];
  real_estate_analysis?: RealEstateAnalysis[];
  investment_strategy?: string;
  beauty_trends?: BeautyTrend[]; // Beauty trend section
  brand_spotlight?: BrandSpotlight[]; // Brand spotlight section
  styling_tips?: StylingTip[];
  // AI 관련 데이터
  ai_trends?: AITrend[];
  company_spotlight?: CompanySpotlight[];
  application_tips?: ApplicationTip[];
  fashion_trends?: FashionTrend[]; // 패션 관련
  brand_spotlight_fashion?: FashionBrandSpotlight[]; // 패션 관련
  styling_tips_fashion?: FashionStylingTip[]; // 패션 관련
  business_trends?: BusinessTrend[]; // 비즈니스 트렌드
  case_studies?: CaseStudy[]; // 사례 연구
  growth_strategies?: GrowthStrategy[]; // 성장 전략
  recommended_tools?: RecommendedTool[]; // 추천 도구
}

export interface BusinessTrend {
  trend_name: string;
  trend_description: string;
}

export interface CaseStudy {
  company_name: string;
  case_description: string;
  key_learnings: KeyLearning[];
}

export interface KeyLearning {
  learning_point: string;
}

export interface GrowthStrategy {
  strategy_name: string;
  strategy_description: string;
  target_industry: string;
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
// AI 데이터 구조 정의
export interface AITrend {
  trend_name: string;
  trend_description: string;
}

export interface CompanySpotlight {
  company_name: string;
  company_description: string;
  highlighted_technologies: HighlightedTechnology[];
}

export interface HighlightedTechnology {
  technology_name: string;
  technology_description: string;
}

export interface ApplicationTip {
  tip_title: string;
  tip_description: string;
  recommended_tool: RecommendedTool[];
}

export interface RecommendedTool {
  tool_name: string;
  tool_usage_tip: string;
}

export interface StockAnalysis {
  stock: string;
  stock_description: string;
  analysis: string;
}

export interface RealEstateAnalysis {
  real_estate_area: string;
  area_description: string;
  analysis: string;
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
  overview?: Overview; // Make overview optional
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
