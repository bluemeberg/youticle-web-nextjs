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
