import type {
  BriefingLandingData,
  SlotPackage,
  SlotTabContent,
} from "@/types/briefingLanding";
import { businessEmailBriefing } from "./mockEmailBriefings";

type SlotPhase = "baseline" | "slot2" | "slot3" | "slot4" | "slot5";

type SlotLabelDefinition = {
  title: string;
  description: string;
};

const SLOT_PHASES: SlotPhase[] = [
  "baseline",
  "slot2",
  "slot3",
  "slot4",
  "slot5",
];

const STOCK_SLOT_LABELS: Record<SlotPhase, SlotLabelDefinition> = {
  baseline: {
    title: "프리 마켓 1차 브리핑",
    description: "07:30 장 시작 전 베이스라인",
  },
  slot2: {
    title: "오전 1차 브리핑",
    description: "11:00 장 중 흐름 점검",
  },
  slot3: {
    title: "오후 2차 브리핑",
    description: "14:30 점심 이후 체크",
  },
  slot4: {
    title: "장 마감 전 브리핑",
    description: "17:00 장 마감 직전 체크",
  },
  slot5: {
    title: "저녁 리뷰 브리핑",
    description: "21:00 장 마감 리뷰",
  },
};

const OVERSEAS_STOCK_SLOT_LABELS: Record<SlotPhase, SlotLabelDefinition> = {
  baseline: {
    title: "간밤 미국장 1차 요약",
    description: "07:30 미국장 핵심 요약",
  },
  slot2: {
    title: "간밤 미국장 2차 요약",
    description: "11:00 새 소식 업데이트",
  },
  slot3: {
    title: "오늘 밤 미국장 프리뷰 1차",
    description: "14:30 오늘 밤 주목 포인트",
  },
  slot4: {
    title: "오늘 밤 미국장 프리뷰 2차",
    description: "17:00 마감 전 리마인드",
  },
  slot5: {
    title: "미국 프리마켓 체크",
    description: "21:00 프리마켓 동향",
  },
};

const CRYPTO_SLOT_LABELS: Record<SlotPhase, SlotLabelDefinition> = {
  baseline: {
    title: "새벽·아침 코인 브리핑 1차",
    description: "07:30 새벽/아침 흐름",
  },
  slot2: {
    title: "오전 브리핑",
    description: "11:00 출근 이후 급등락 체크",
  },
  slot3: {
    title: "점심 브리핑",
    description: "14:30 점심 시간대 반응",
  },
  slot4: {
    title: "오후 브리핑",
    description: "17:00 퇴근 직전 리듬",
  },
  slot5: {
    title: "심야 브리핑",
    description: "21:00 밤 시간대 미국장 반응",
  },
};

const STOCK_SLOT_TIMES: Record<SlotPhase, string> = {
  baseline: "07:30",
  slot2: "11:00",
  slot3: "14:30",
  slot4: "17:00",
  slot5: "21:00",
};

const OVERSEAS_STOCK_SLOT_TIMES: Record<SlotPhase, string> = {
  baseline: "07:30",
  slot2: "11:00",
  slot3: "14:30",
  slot4: "17:00",
  slot5: "21:00",
};

const CRYPTO_SLOT_TIMES: Record<SlotPhase, string> = {
  baseline: "07:30",
  slot2: "11:00",
  slot3: "14:30",
  slot4: "18:00",
  slot5: "01:00",
};

const DOMESTIC_STOCK_INSIGHTS = [
  {
    id: "domestic-stock-005930",
    ticker: "005930",
    name: "삼성전자",
    changeText: "+0.33%",
    detailHref: "/stocks/005930",
  },
  {
    id: "domestic-stock-000660",
    ticker: "000660",
    name: "SK하이닉스",
    changeText: "-0.41%",
    detailHref: "/stocks/000660",
  },
  {
    id: "domestic-stock-035720",
    ticker: "035720",
    name: "카카오",
    changeText: "+1.02%",
    detailHref: "/stocks/035720",
  },
];

const OVERSEAS_STOCK_INSIGHTS = [
  {
    id: "overseas-stock-NVDA",
    ticker: "NVDA",
    name: "엔비디아",
    changeText: "+1.20%",
    detailHref: "/stocks/NVDA",
  },
  {
    id: "overseas-stock-MSFT",
    ticker: "MSFT",
    name: "마이크로소프트",
    changeText: "+0.45%",
    detailHref: "/stocks/MSFT",
  },
  {
    id: "overseas-stock-AMZN",
    ticker: "AMZN",
    name: "아마존",
    changeText: "-0.32%",
    detailHref: "/stocks/AMZN",
  },
];

const KR_CRYPTO_INSIGHTS = [
  {
    id: "kr-crypto-btc",
    ticker: "BTC/KRW",
    name: "비트코인",
    changeText: "+0.23%",
    detailHref: "/crypto/BTC-KRW",
  },
  {
    id: "kr-crypto-xrp",
    ticker: "XRP/KRW",
    name: "리플",
    changeText: "+1.14%",
    detailHref: "/crypto/XRP-KRW",
  },
  {
    id: "kr-crypto-sol",
    ticker: "SOL/KRW",
    name: "솔라나",
    changeText: "-2.21%",
    detailHref: "/crypto/SOL-KRW",
  },
];

const GLOBAL_CRYPTO_INSIGHTS = [
  {
    id: "global-crypto-btc",
    ticker: "BTC/USD",
    name: "비트코인",
    changeText: "+0.47%",
    detailHref: "/crypto/BTC-USD",
  },
  {
    id: "global-crypto-eth",
    ticker: "ETH/USD",
    name: "이더리움",
    changeText: "+1.65%",
    detailHref: "/crypto/ETH-USD",
  },
  {
    id: "global-crypto-arb",
    ticker: "ARB/USD",
    name: "아비트럼",
    changeText: "+4.11%",
    detailHref: "/crypto/ARB-USD",
  },
];

const buildVideos = (prefix: string, topic: string) => [
  {
    id: `${prefix}-video-1`,
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
    title: `${topic} · 3줄 핵심 요약`,
    channel: "탑픽 리서치",
    duration: "10:42",
    summary: ["핵심 모멘텀", "수급 흐름", "다음 액션"],
  },
  {
    id: `${prefix}-video-2`,
    thumbnail:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&auto=format&fit=crop&q=60",
    title: `${topic} · 전략 브리핑`,
    channel: "마켓인사이트",
    duration: "12:33",
    summary: ["전략 시나리오", "리스크", "대응 포인트"],
  },
  {
    id: `${prefix}-video-3`,
    thumbnail:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
    title: `${topic} · Q&A`,
    channel: "리서치 LIVE",
    duration: "08:05",
    summary: ["실시간 질문", "전문가 답", "체크포인트"],
  },
];

const buildStockTabs = (
  idPrefix: string,
  variant: "domestic" | "overseas",
  slotTitle: string
): SlotTabContent => {
  const isDomestic = variant === "domestic";
  const indexes = isDomestic
    ? [
        {
          label: "KOSPI",
          value: "4,129.12",
          changeText: "+32.4",
          changeRate: "+0.79%",
          sentiment: "up" as const,
        },
        {
          label: "KOSDAQ",
          value: "891.77",
          changeText: "-8.1",
          changeRate: "-0.91%",
          sentiment: "down" as const,
        },
      ]
    : [
        {
          label: "S&P500",
          value: "5,214.12",
          changeText: "+12.4",
          changeRate: "+0.24%",
          sentiment: "up" as const,
        },
        {
          label: "NASDAQ",
          value: "16,081.55",
          changeText: "-28.1",
          changeRate: "-0.17%",
          sentiment: "down" as const,
        },
      ];

  const insightItems = (isDomestic
    ? DOMESTIC_STOCK_INSIGHTS
    : OVERSEAS_STOCK_INSIGHTS
  ).map((item) => ({
    ...item,
    id: `${item.id}-${idPrefix}`,
  }));

  return {
    market: {
      indexes: indexes.map((index) => ({
        ...index,
        id: `${idPrefix}-${index.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      })),
      commentary: isDomestic
        ? [
            `${slotTitle} 기준으로 환율·선물 방향 체크`,
            "반도체·콘텐츠 섹터 변동성 유의",
          ]
        : [
            `${slotTitle} 기준으로 미국 지수/채권 금리 확인`,
            "매크로 변수(달러·유가) 동시 체크",
          ],
    },
    insight: {
      items: insightItems,
      title: "TOP5 인사이트",
    },
    videos: buildVideos(idPrefix, isDomestic ? "국내 주식" : "해외 주식"),
  };
};

const buildCryptoTabs = (
  idPrefix: string,
  region: "kr" | "global",
  slotTitle: string
): SlotTabContent => {
  const isKr = region === "kr";
  const indexes = isKr
    ? [
        {
          label: "BTC",
          value: "₩92,880,000",
          changeText: "-₩410,000",
          changeRate: "-0.44%",
          sentiment: "down" as const,
        },
        {
          label: "ETH",
          value: "₩4,910,000",
          changeText: "+₩80,000",
          changeRate: "+1.65%",
          sentiment: "up" as const,
        },
      ]
    : [
        {
          label: "BTC",
          value: "$67,120",
          changeText: "+$210",
          changeRate: "+0.31%",
          sentiment: "up" as const,
        },
        {
          label: "ETH",
          value: "$3,510",
          changeText: "-$42",
          changeRate: "-1.17%",
          sentiment: "down" as const,
        },
      ];

  const insightItems = (isKr ? KR_CRYPTO_INSIGHTS : GLOBAL_CRYPTO_INSIGHTS).map(
    (item) => ({
      ...item,
      id: `${item.id}-${idPrefix}`,
    })
  );

  return {
    market: {
      indexes: indexes.map((index) => ({
        ...index,
        id: `${idPrefix}-${index.label.toLowerCase()}`,
      })),
      commentary: isKr
        ? [
            `${slotTitle} 기준으로 원화 마켓 변동성 체크`,
            "알트 코인은 섹터별 순환매 빠름",
          ]
        : [
            `${slotTitle} 기준으로 달러·미국 지수와 상관관계 점검`,
            "ETF/기관 유입 뉴스 동시 확인",
          ],
    },
    insight: { items: insightItems, title: "TOP5 인사이트" },
    videos: buildVideos(idPrefix, isKr ? "국내 코인" : "해외 코인"),
  };
};

const createStockSlotPackages = (
  prefix: string,
  labels: Record<SlotPhase, SlotLabelDefinition>,
  times: Record<SlotPhase, string>,
  variant: "domestic" | "overseas"
): SlotPackage[] =>
  SLOT_PHASES.map((phase) => ({
    id: `${prefix}-${phase}`,
    label: labels[phase].title,
    description: labels[phase].description,
    displayTime: times[phase],
    default: phase === "slot4",
    tabs: buildStockTabs(`${prefix}-${phase}`, variant, labels[phase].title),
  }));

const createCryptoSlotPackages = (
  prefix: string,
  labels: Record<SlotPhase, SlotLabelDefinition>,
  times: Record<SlotPhase, string>,
  region: "kr" | "global"
): SlotPackage[] =>
  SLOT_PHASES.map((phase) => ({
    id: `${prefix}-${phase}`,
    label: labels[phase].title,
    description: labels[phase].description,
    displayTime: times[phase],
    default: phase === "slot4",
    tabs: buildCryptoTabs(`${prefix}-${phase}`, region, labels[phase].title),
  }));

const domesticStockSlotPackages = createStockSlotPackages(
  "domestic-stock",
  STOCK_SLOT_LABELS,
  STOCK_SLOT_TIMES,
  "domestic"
);

const overseasStockSlotPackages = createStockSlotPackages(
  "overseas-stock",
  OVERSEAS_STOCK_SLOT_LABELS,
  OVERSEAS_STOCK_SLOT_TIMES,
  "overseas"
);

const domesticCryptoSlotPackages = createCryptoSlotPackages(
  "kr-crypto",
  CRYPTO_SLOT_LABELS,
  CRYPTO_SLOT_TIMES,
  "kr"
);

const globalCryptoSlotPackages = createCryptoSlotPackages(
  "global-crypto",
  CRYPTO_SLOT_LABELS,
  CRYPTO_SLOT_TIMES,
  "global"
);

export const mockBriefingLanding: BriefingLandingData = {
  briefingId: "recap-20260102-2100",
  deliveryMeta: {
    deliveredAt: "2026-01-02T21:00:00+09:00",
    displayLabel: "2026.01.02 · 21:00",
    description: "카카오톡 저녁 슬롯을 그대로 옮겨왔어요",
    tagline: "슬롯을 바꾸면 TOP5 근거영상이 새로 갱신돼요",
    backHref: "/feed",
    backLabel: "카톡 브리핑 보기",
    source: "kakao",
  },
  keywordNav: [
    { id: "nav-kr-stocks", label: "국내 주식", anchor: "stocks-kr" },
    { id: "nav-global-stocks", label: "해외 주식", anchor: "stocks-global" },
    { id: "nav-kr-crypto", label: "국내 가상자산", anchor: "crypto-kr" },
    { id: "nav-global-crypto", label: "해외 가상자산", anchor: "crypto-global" },
    { id: "nav-realestate", label: "부동산", anchor: "realestate" },
  ],
  sections: [
    {
      id: "sec-stocks-kr",
      type: "stocks",
      title: "📈 국내 주식",
      anchor: "stocks-kr",
      summaryBullets: [
        "📈 코스피 4,129… 변동성 확대 대비",
        "🎮 붉은사막 3/19… 관련주 단기 변동성",
        "🧠 개인용 AI… 디바이스/맞춤형 기업 주목",
      ],
      defaultSlotId: domesticStockSlotPackages.find((slot) => slot.default)?.id,
      slotPackages: domesticStockSlotPackages,
    },
    {
      id: "sec-stocks-global",
      type: "stocks",
      title: "🌎 해외 주식",
      anchor: "stocks-global",
      summaryBullets: [
        "🇺🇸 S&P500 5,200선 안착 시도",
        "💹 반도체/AI 모멘텀 지속",
        "💵 달러·금리 동조화 체크",
      ],
      defaultSlotId: overseasStockSlotPackages.find((slot) => slot.default)?.id,
      slotPackages: overseasStockSlotPackages,
    },
    {
      id: "sec-crypto-kr",
      type: "crypto",
      title: "🪙 국내 가상자산",
      anchor: "crypto-kr",
      summaryBullets: [
        "📉 비트코인 20일선 하회",
        "🏦 리플 기관 DeFi 협업",
        "⏳ 장기 관점 분할 접근",
      ],
      defaultSlotId: domesticCryptoSlotPackages.find((slot) => slot.default)?.id,
      slotPackages: domesticCryptoSlotPackages,
    },
    {
      id: "sec-crypto-global",
      type: "crypto",
      title: "🌐 해외 가상자산",
      anchor: "crypto-global",
      summaryBullets: [
        "🌍 달러 강세 구간, 변동성 주의",
        "🧊 스테이블 수요 확대",
        "🧮 ETF 자금 유입 모니터",
      ],
      defaultSlotId: globalCryptoSlotPackages.find((slot) => slot.default)?.id,
      slotPackages: globalCryptoSlotPackages,
    },
    {
      id: "sec-realestate",
      type: "realestate",
      title: "🏠 부동산",
      anchor: "realestate",
      summaryBullets: [
        "🏠 매수 위축/규제 변수",
        "💱 환율·정책 방향성",
        "🧾 지역 양극화 심화",
      ],
      summaryBriefing: {
        keywords: ["기관 매입 0.5%", "노후 한옥", "26조 예수금"],
        entries: [
          {
            title: "기관 매입 비중",
            soWhat:
              "기관 주택 매입 비중이 <mark>0.5%</mark>라 단기적으로는 보수적인 심리가 이어질 수 있어요.",
            references: [],
          },
          {
            title: "한옥 투자 체크",
            soWhat:
              "<mark>노후 한옥</mark>은 리모델링 비용과 문화재 지정 가능성을 먼저 확인해야 한다는 의견이 많습니다.",
            references: [],
          },
          {
            title: "증시 예수금 흐름",
            soWhat:
              "증시 예수금 <mark>26조</mark>가 당장 부동산으로 유입되긴 어려워 단기 반등은 제한적일 수 있다는 분석입니다.",
            references: [],
          },
        ],
      },
      tabs: {
        topVideos: buildVideos("realestate", "부동산"),
        rankingUpdates: [
          { id: "re-1", elapsedLabel: "52분 전", message: "NEW #3 진입 (A 채널)" },
          { id: "re-2", elapsedLabel: "1시간 전", message: "#1 유지 (B 채널)" },
          { id: "re-3", elapsedLabel: "6시간 전", message: "#2→#4 하락 (C 채널)" },
          { id: "re-4", elapsedLabel: "18시간 전", message: "NEW #1 진입 (D 채널)" },
        ],
      },
      rankingWindows: ["3시간", "12시간", "24시간"],
      defaultRankingWindow: "3시간",
    },
  ],
  exploreTabs: [
    { id: "explore-all", label: "전체 탭", href: "/today" },
    { id: "explore-kr-stocks", label: "국내 주식", href: "/today?asset=stocks-kr" },
    { id: "explore-global-stocks", label: "해외 주식", href: "/today?asset=stocks-global" },
    { id: "explore-kr-crypto", label: "국내 코인", href: "/today?asset=crypto-kr" },
    { id: "explore-global-crypto", label: "해외 코인", href: "/today?asset=crypto-global" },
  ],
};

const mockBusinessEmailLanding: BriefingLandingData = {
  briefingId: "email-business-20260131",
  deliveryMeta: {
    deliveredAt: "2026-01-31T09:00:00+09:00",
    displayLabel: businessEmailBriefing.dateBadge,
    description: "이메일 브리핑",
    tagline: businessEmailBriefing.topicLabel,
    backHref: "/briefing",
    backLabel: "전체 브리핑",
    source: "email",
  },
  keywordNav: [
    {
      id: "nav-email-business",
      label: businessEmailBriefing.topicLabel,
      anchor: "email-business",
    },
  ],
  sections: [
    {
      id: "sec-email-business",
      type: "email",
      title: businessEmailBriefing.topicLabel,
      anchor: "email-business",
      summaryBullets: [],
      emailBriefing: businessEmailBriefing,
    },
  ],
  exploreTabs: [],
};

export const mockBriefingLandingById: Record<string, BriefingLandingData> = {
  [mockBriefingLanding.briefingId]: mockBriefingLanding,
  [mockBusinessEmailLanding.briefingId]: mockBusinessEmailLanding,
};
