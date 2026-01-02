import type {
  BriefingLandingData,
  RecapVideoSummary,
  SlotTabContent,
} from "@/types/briefingLanding";

const buildVideos = (topic: string): RecapVideoSummary[] => [
  {
    id: `${topic}-video-1`,
    title: `${topic} · 3줄 핵심 요약`,
    channel: "인사이트 채널",
    thumbnail: "https://images.youticle.com/sample-video-1.png",
    duration: "10:24",
    summary: [
      "핵심 모멘텀 정리",
      "기관 수급 변화",
      "차트 포인트 복습",
    ],
  },
  {
    id: `${topic}-video-2`,
    title: `${topic} · TOP 픽 2`,
    channel: "탑픽 리서치",
    thumbnail: "https://images.youticle.com/sample-video-2.png",
    duration: "08:12",
    summary: [
      "단기 대응 전략",
      "리스크 관리 가이드",
      "추가 확인 채널",
    ],
  },
  {
    id: `${topic}-video-3`,
    title: `${topic} · 뉴스 체크`,
    channel: "마켓 나우",
    thumbnail: "https://images.youticle.com/sample-video-3.png",
    duration: "09:45",
    summary: ["장중 뉴스", "기업 코멘트", "다음 슬롯 예고"],
  },
  {
    id: `${topic}-video-4`,
    title: `${topic} · 빠른 복습`,
    channel: "클립 하이라이트",
    thumbnail: "https://images.youticle.com/sample-video-4.png",
    duration: "05:33",
    summary: ["30초 스냅샷", "장중 체크", "자세한 설명"],
  },
  {
    id: `${topic}-video-5`,
    title: `${topic} · 뷰 확대`,
    channel: "탐구생활",
    thumbnail: "https://images.youticle.com/sample-video-5.png",
    duration: "11:02",
    summary: ["시장 구조", "거시 변수", "섹터별 반응"],
  },
];

const buildSlotTabs = (topic: string): SlotTabContent => ({
  market: {
    indexes: [
      {
        id: `${topic}-kospi`,
        label: "KOSPI",
        value: "4,129.12",
        changeText: "+32.4",
        changeRate: "+0.79%",
        sentiment: "up",
      },
      {
        id: `${topic}-kosdaq`,
        label: "KOSDAQ",
        value: "891.77",
        changeText: "-8.1",
        changeRate: "-0.91%",
        sentiment: "down",
      },
    ],
    commentary: [
      "선물 야간 변동성 확대",
      "기관/외국인 동시 순매수",
      "장 후반 실적 모멘텀 관찰",
    ],
  },
  insight: {
    title: "오늘의 핵심 종목",
    items: [
      {
        id: `${topic}-item-1`,
        name: "삼성전자",
        ticker: "005930",
        changeText: "+0.33%",
        detailHref: "/detail/005930",
      },
      {
        id: `${topic}-item-2`,
        name: "두산에너빌리티",
        ticker: "034020",
        changeText: "-1.57%",
        detailHref: "/detail/034020",
      },
      {
        id: `${topic}-item-3`,
        name: "AI 디바이스",
        ticker: "AI-DEVICE",
        changeText: "+1.20%",
        detailHref: "/detail/ai-device",
      },
    ],
  },
  videos: buildVideos(topic),
});

export const mockBriefingLanding: BriefingLandingData = {
  briefingId: "recap-demo-20260102",
  deliveryMeta: {
    deliveredAt: "2026-01-02T21:00:00+09:00",
    displayLabel: "2026.01.02 · 21:00",
    description: "저녁 슬롯 · 21:00",
    tagline: "\"방금 받은 브리핑을 웹에서 그대로 이어서 봅니다\"",
    backLabel: "카톡 브리핑 보기",
    backHref: "/kakao/briefing",
  },
  keywordNav: [
    { id: "nav-stocks", label: "주식", anchor: "stocks" },
    { id: "nav-crypto", label: "가상자산", anchor: "crypto" },
    { id: "nav-realestate", label: "부동산", anchor: "realestate" },
  ],
  sections: [
    {
      id: "section-stocks",
      anchor: "stocks",
      type: "stocks",
      title: "📈 주식",
      summaryBullets: [
        "📈 코스피 4,129… 변동성 확대 대비",
        "🎮 붉은사막 3/19… 관련주 단기 변동성",
        "🧠 개인용 AI… 디바이스/맞춤형 기업 주목",
      ],
      slotPackages: [
        {
          id: "stock-pre1",
          label: "프리1",
          displayTime: "06:00",
          description: "오전 시황",
          tabs: buildSlotTabs("stocks-pre1"),
        },
        {
          id: "stock-pre2",
          label: "프리2",
          displayTime: "07:00",
          description: "세컨드 프리",
          tabs: buildSlotTabs("stocks-pre2"),
        },
        {
          id: "stock-open",
          label: "장중",
          displayTime: "11:30",
          description: "장중 브리핑",
          tabs: buildSlotTabs("stocks-open"),
        },
        {
          id: "stock-close",
          label: "장마감",
          displayTime: "15:40",
          description: "마켓 클로징",
          tabs: buildSlotTabs("stocks-close"),
        },
        {
          id: "stock-evening",
          label: "저녁",
          displayTime: "21:00",
          description: "저녁 리뷰",
          default: true,
          tabs: buildSlotTabs("stocks-evening"),
        },
        {
          id: "stock-night",
          label: "심야",
          displayTime: "23:00",
          description: "심야 체크",
          tabs: buildSlotTabs("stocks-night"),
        },
      ],
    },
    {
      id: "section-crypto",
      anchor: "crypto",
      type: "crypto",
      title: "🪙 가상자산",
      summaryBullets: [
        "📉 비트코인 20일선 하회…",
        "🏦 리플 기관 DeFi…",
        "⏳ 장기 관점…",
      ],
      slotPackages: [
        {
          id: "crypto-pre",
          label: "프리",
          displayTime: "07:00",
          tabs: buildSlotTabs("crypto-pre"),
        },
        {
          id: "crypto-open",
          label: "장중",
          displayTime: "13:00",
          tabs: buildSlotTabs("crypto-open"),
        },
        {
          id: "crypto-close",
          label: "장마감",
          displayTime: "18:00",
          tabs: buildSlotTabs("crypto-close"),
        },
        {
          id: "crypto-evening",
          label: "저녁",
          displayTime: "21:00",
          default: true,
          tabs: buildSlotTabs("crypto-evening"),
        },
        {
          id: "crypto-night",
          label: "심야 코인",
          displayTime: "01:00",
          tabs: buildSlotTabs("crypto-night"),
        },
      ],
    },
    {
      id: "section-realestate",
      anchor: "realestate",
      type: "realestate",
      title: "🏠 부동산",
      summaryBullets: [
        "🏠 매수 위축/규제…",
        "💱 환율/정책 변수…",
        "🧾 지역 양극화…",
      ],
      tabs: {
        topVideos: buildVideos("realestate"),
        rankingUpdates: [
          {
            id: "ranking-1",
            elapsedLabel: "52분 전",
            message: "NEW #3 진입 (영상 A)",
          },
          {
            id: "ranking-2",
            elapsedLabel: "1시간 전",
            message: "#1 유지 (영상 B)",
          },
          {
            id: "ranking-3",
            elapsedLabel: "3시간 전",
            message: "#5 이탈 (영상 C)",
          },
        ],
      },
      rankingWindows: ["3시간", "12시간", "24시간"],
      defaultRankingWindow: "3시간",
    },
  ],
  exploreTabs: [
    { id: "explore-all", label: "전체 탭 피드", href: "/today" },
    { id: "explore-stocks", label: "주식 탭", href: "/today?asset=stocks" },
    { id: "explore-crypto", label: "가상자산 탭", href: "/today?asset=crypto" },
    { id: "explore-realestate", label: "부동산 탭", href: "/today?asset=realestate" },
  ],
};

export const mockBriefingLandingById: Record<string, BriefingLandingData> = {
  [mockBriefingLanding.briefingId]: mockBriefingLanding,
};
