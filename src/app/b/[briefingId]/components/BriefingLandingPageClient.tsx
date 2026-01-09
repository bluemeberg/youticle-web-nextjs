"use client";

import styled, { keyframes } from "styled-components";
import type { DefaultTheme } from "styled-components";
import Link from "next/link";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import LogoHeader from "@/common/LogoHeader";
import LandingDomesticStockInsightSection, {
  StockVideoSources,
} from "./LandingDomesticStockInsightSection";
import LandingCryptoInsightSection from "./LandingCryptoInsightSection";
import LandingStockMarketSection from "./LandingStockMarketSection";
import type { SlotLabel, BriefingSlot } from "@/utils/briefingSlot";
import { resolveInsightSlotCopy } from "@/utils/insightSlotCopy";
import type {
  InsightMarketDeltaCard,
  InsightSection,
  InsightSource,
  InsightStock,
  InsightStockMetrics,
} from "@/types/insight";

/**
 * =========================================================
 * Mock Types (최소 실사용 형태)
 * =========================================================
 */

type Sentiment = "up" | "down" | "flat";

type MoneySectionType = "stocks" | "crypto";
type RankingSectionType = "realestate";

export type RankingTabKey = "topVideos" | "rankingUpdates";

const sentimentColor = (sentiment: Sentiment, theme: DefaultTheme) => {
  if (sentiment === "up") return theme.color.up;
  if (sentiment === "down") return theme.color.down;
  return theme.color.neutral;
};

export interface BriefingLandingData {
  briefingId: string;
  deliveryMeta: {
    displayLabel: string; // "2026.01.02 · 21:00"
    description: string; // "카카오톡에서 보신 통합 브리핑"
    tagline: string; // "오늘 뭐 봐야 함? 슬롯별로 한 번에"
    backHref: string; // "/feed"
    backLabel: string; // "전체"
    source?: "kakao" | "email" | "web";
  };
  keywordNav?: Array<{ id: string; label: string; anchor: string }>;
  sections: RecapSection[];
  exploreTabs: Array<{ id: string; label: string; href: string }>;
}

export type RecapSection =
  | MoneyRecapSection
  | RankingRecapSection
  | GeneralRecapSection;

export interface MoneyRecapSection {
  id: string;
  type: MoneySectionType;
  title: string; // "국내 주식" / "가상자산"
  anchor: string; // "stocks" / "crypto"
  summaryBullets: string[];
  defaultSlotId?: string;
  slotPackages: SlotPackage[];
}

export interface RankingRecapSection {
  id: string;
  type: RankingSectionType; // realestate or generic
  title: string; // "부동산" 또는 다른 키워드
  anchor: string; // "realestate"
  summaryBullets: string[];
  rankingWindows: string[]; // ["3시간", "12시간", "24시간"]
  defaultRankingWindow?: string;
  tabs: {
    topVideos: VideoCardData[];
    rankingUpdates: RankingUpdate[];
  };
}

export interface GeneralRecapSection {
  id: string;
  type: "general";
  title: string;
  anchor: string;
  summaryBullets: string[];
  defaultSlotId?: string;
  slotPackages: SlotPackage[];
}

export interface SlotPackage {
  id: string;
  label: string; // "프리1" "저녁" "심야"
  displayTime: string; // "21:00"
  default?: boolean;
  description?: string;
  tabs: {
    market: {
      indexes: Array<{
        id: string;
        label: string;
        value: string;
        changeText: string;
        changeRate: string;
        sentiment: Sentiment;
      }>;
      commentary: string[];
    };
    insight: {
      items: Array<{
        id: string;
        ticker: string;
        name: string;
        changeText: string;
        detailHref: string;
      }>;
    };
    videos: VideoCardData[];
    insightSection?: InsightSection;
  };
}

export interface VideoCardData {
  id: string;
  thumbnail: string;
  title: string;
  channel: string;
  duration: string;
  summary: string[];
  href?: string;
}

const convertMarkToStrong = (text?: string | null) => {
  if (text == null) return "";
  const source = typeof text === "string" ? text : String(text);
  const placeholderOpen = "__MARK_OPEN__";
  const placeholderClose = "__MARK_CLOSE__";
  const withPlaceholders = source
    .replace(/<mark>/gi, placeholderOpen)
    .replace(/<\/mark>/gi, placeholderClose);
  const escaped = withPlaceholders
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(new RegExp(placeholderOpen, "g"), "<strong>")
    .replace(new RegExp(placeholderClose, "g"), "</strong>");
};

const createMarkedHtml = (text: string) => ({
  __html: convertMarkToStrong(text),
});

export interface RankingUpdate {
  id: string;
  elapsedLabel: string; // "52분 전"
  message: string; // "NEW #3 진입 (영상 A)"
}

/**
 * =========================================================
 * Mock Data (요청: Mockup 데이터 붙여서)
 * =========================================================
 */

const MOCK_DATA: BriefingLandingData = {
  briefingId: "KAKAO_20260102_2100",
  deliveryMeta: {
    displayLabel: "2026.01.02 · 21:00",
    description: "카카오톡에서 보신 통합 브리핑을 웹에서 이어서 봅니다",
    tagline: "슬롯을 바꾸면 TOP5 근거영상이 새로 갱신돼요",
    backHref: "/feed",
    backLabel: "전체",
    source: "kakao",
  },
  sections: [
    {
      id: "sec_stocks",
      type: "stocks",
      title: "국내 주식",
      anchor: "stocks",
      summaryBullets: [
        "📈 변동성 확대 구간: 지수는 견조하지만 개별 이슈 영향이 커요",
        "🎮 게임/콘텐츠 모멘텀: 일정·출시 이슈로 단기 급등락 가능",
        "🧠 AI 디바이스 확산: 하드웨어/플랫폼/콘텐츠 축 수혜 분화",
      ],
      defaultSlotId: "slot_evening",
      slotPackages: [
        {
          id: "slot_pre1",
          label: "프리1",
          displayTime: "08:10",
          tabs: {
            market: {
              indexes: [
                {
                  id: "kospi",
                  label: "KOSPI",
                  value: "2,680.12",
                  changeText: "+14.22",
                  changeRate: "+0.53%",
                  sentiment: "up",
                },
                {
                  id: "kosdaq",
                  label: "KOSDAQ",
                  value: "854.30",
                  changeText: "-2.11",
                  changeRate: "-0.25%",
                  sentiment: "down",
                },
              ],
              commentary: [
                "장 시작 전 선물·환율 변동에 민감: 갭 상승/하락 리스크 체크",
                "전일 강세 섹터(반도체/AI) 중심으로 차익실현 가능성",
              ],
            },
            insight: {
              items: [
                {
                  id: "005930",
                  ticker: "005930",
                  name: "삼성전자",
                  changeText: "+0.7%",
                  detailHref: "/stocks/005930",
                },
                {
                  id: "000660",
                  ticker: "000660",
                  name: "SK하이닉스",
                  changeText: "-0.4%",
                  detailHref: "/stocks/000660",
                },
                {
                  id: "035420",
                  ticker: "035420",
                  name: "NAVER",
                  changeText: "+1.2%",
                  detailHref: "/stocks/035420",
                },
              ],
            },
            videos: [
              {
                id: "v_stk_1",
                thumbnail:
                  "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&auto=format&fit=crop&q=60",
                title: "프리마켓 핵심 체크: 환율/선물/섹터 수급",
                channel: "머니인사이트",
                duration: "12:03",
                summary: [
                  "오늘 변동성 포인트",
                  "오전 수급 체크",
                  "리스크 관리",
                ],
              },
              {
                id: "v_stk_2",
                thumbnail:
                  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&auto=format&fit=crop&q=60",
                title: "AI 수혜주 3분류: 반도체/플랫폼/디바이스",
                channel: "주식연구소",
                duration: "18:22",
                summary: ["축별 모멘텀", "실적/밸류", "단기 트리거"],
              },
              {
                id: "v_stk_3",
                thumbnail:
                  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
                title: "오늘의 단타 체크리스트",
                channel: "트레이더K",
                duration: "10:11",
                summary: ["갭 전략", "손절 라인", "체결강도"],
              },
              {
                id: "v_stk_4",
                thumbnail:
                  "https://images.unsplash.com/photo-1551281044-8cba9b1a4a0d?w=800&auto=format&fit=crop&q=60",
                title: "이슈 캘린더: 실적/공시/정책",
                channel: "캘린더리서치",
                duration: "14:55",
                summary: ["주요 일정", "섹터 영향", "주의 종목"],
              },
              {
                id: "v_stk_5",
                thumbnail:
                  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
                title: "장 초반 변동성 매매 주의점",
                channel: "시그널랩",
                duration: "09:48",
                summary: ["변동성 구간", "추격 매수 금지", "분할 접근"],
              },
            ],
          },
        },
        {
          id: "slot_evening",
          label: "저녁",
          displayTime: "21:00",
          default: true,
          tabs: {
            market: {
              indexes: [
                {
                  id: "kospi",
                  label: "KOSPI",
                  value: "2,705.80",
                  changeText: "+25.68",
                  changeRate: "+0.96%",
                  sentiment: "up",
                },
                {
                  id: "usdkrw",
                  label: "USD/KRW",
                  value: "1,312.4",
                  changeText: "-4.1",
                  changeRate: "-0.31%",
                  sentiment: "down",
                },
              ],
              commentary: [
                "외국인 수급이 지수 방어: 다만 개별주 변동성은 확대",
                "2차전지/게임 등 이슈 섹터에 단기 수급 집중",
              ],
            },
            insight: {
              items: [
                {
                  id: "373220",
                  ticker: "373220",
                  name: "LG에너지솔루션",
                  changeText: "-1.1%",
                  detailHref: "/stocks/373220",
                },
                {
                  id: "035720",
                  ticker: "035720",
                  name: "카카오",
                  changeText: "+2.3%",
                  detailHref: "/stocks/035720",
                },
                {
                  id: "047810",
                  ticker: "047810",
                  name: "한국항공우주",
                  changeText: "+0.9%",
                  detailHref: "/stocks/047810",
                },
              ],
            },
            videos: [
              {
                id: "v_stk_2", // pre1에도 있었던 영상(유지)
                thumbnail:
                  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&auto=format&fit=crop&q=60",
                title: "AI 수혜주 3분류: 반도체/플랫폼/디바이스",
                channel: "주식연구소",
                duration: "18:22",
                summary: ["축별 모멘텀", "실적/밸류", "단기 트리거"],
              },
              {
                id: "v_stk_6",
                thumbnail:
                  "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&auto=format&fit=crop&q=60",
                title: "저녁 리뷰: 수급/섹터 상위 정리",
                channel: "머니인사이트",
                duration: "15:40",
                summary: ["외국인/기관 동향", "섹터 강약", "내일 체크"],
              },
              {
                id: "v_stk_7",
                thumbnail:
                  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60",
                title: "종목 테마: 게임·콘텐츠 모멘텀",
                channel: "테마헌터",
                duration: "13:09",
                summary: ["일정 기반 모멘텀", "수급 포인트", "리스크"],
              },
              {
                id: "v_stk_8",
                thumbnail:
                  "https://images.unsplash.com/photo-1551281044-8cba9b1a4a0d?w=800&auto=format&fit=crop&q=60",
                title: "장마감 이후 이슈: 공시/환율/선물",
                channel: "시그널랩",
                duration: "11:22",
                summary: ["야간 선물", "리스크 이벤트", "포지션 관리"],
              },
              {
                id: "v_stk_9",
                thumbnail:
                  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
                title: "내일 전략: 분할매수/손절 라인",
                channel: "트레이더K",
                duration: "09:35",
                summary: ["시나리오 2개", "대응 전략", "심리 관리"],
              },
            ],
          },
        },
        {
          id: "slot_close",
          label: "장마감",
          displayTime: "15:40",
          tabs: {
            market: {
              indexes: [
                {
                  id: "kospi",
                  label: "KOSPI",
                  value: "2,700.10",
                  changeText: "+19.98",
                  changeRate: "+0.74%",
                  sentiment: "up",
                },
                {
                  id: "vix",
                  label: "변동성 지표",
                  value: "14.8",
                  changeText: "+0.6",
                  changeRate: "+4.22%",
                  sentiment: "up",
                },
              ],
              commentary: [
                "마감 수급이 지수는 지탱, 개별주는 롤러코스터",
                "마감 이후 공시/환율 영향 체크 필요",
              ],
            },
            insight: {
              items: [
                {
                  id: "051910",
                  ticker: "051910",
                  name: "LG화학",
                  changeText: "-0.6%",
                  detailHref: "/stocks/051910",
                },
                {
                  id: "207940",
                  ticker: "207940",
                  name: "삼성바이오로직스",
                  changeText: "+0.8%",
                  detailHref: "/stocks/207940",
                },
              ],
            },
            videos: [
              {
                id: "v_stk_10",
                thumbnail:
                  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&auto=format&fit=crop&q=60",
                title: "장마감 TOP5: 오늘 시장을 만든 5개 영상",
                channel: "마감리포트",
                duration: "16:12",
                summary: ["마감 총평", "수급 핵심", "내일 변수"],
              },
              // base(저녁)와 거의 다르게 구성 → diffCount 크게
              {
                id: "v_stk_11",
                thumbnail:
                  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
                title: "마감 이후 공시 해석 가이드",
                channel: "공시해부",
                duration: "12:44",
                summary: ["공시 체크", "실적 포인트", "주의사항"],
              },
              {
                id: "v_stk_12",
                thumbnail:
                  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60",
                title: "섹터 강약: 반도체 vs 2차전지",
                channel: "섹터스캔",
                duration: "14:01",
                summary: ["강세 이유", "약세 이유", "대응"],
              },
              {
                id: "v_stk_13",
                thumbnail:
                  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
                title: "단기 급등락 종목 리스크 관리",
                channel: "리스크랩",
                duration: "08:58",
                summary: ["손절", "분할", "추격 금지"],
              },
              {
                id: "v_stk_14",
                thumbnail:
                  "https://images.unsplash.com/photo-1551281044-8cba9b1a4a0d?w=800&auto=format&fit=crop&q=60",
                title: "다음 거래일 시나리오 3가지",
                channel: "시나리오X",
                duration: "10:31",
                summary: ["상승/횡보/하락", "트리거", "대응"],
              },
            ],
          },
        },
      ],
    },
    {
      id: "sec_crypto",
      type: "crypto",
      title: "국내 가상자산",
      anchor: "crypto",
      summaryBullets: [
        "🪙 단기 변동성 확대: 주요 지지/저항 구간에서 흔들림",
        "📉 알트는 종목별 분화: 섹터/테마로 빠르게 쏠림 발생",
        "🧭 리스크 관리 우선: 레버리지·추격매수는 손익비 악화",
      ],
      defaultSlotId: "slot_crypto_evening",
      slotPackages: [
        {
          id: "slot_crypto_evening",
          label: "저녁",
          displayTime: "21:00",
          default: true,
          tabs: {
            market: {
              indexes: [
                {
                  id: "btc",
                  label: "BTC",
                  value: "₩92,340,000",
                  changeText: "-₩410,000",
                  changeRate: "-0.44%",
                  sentiment: "down",
                },
                {
                  id: "eth",
                  label: "ETH",
                  value: "₩4,870,000",
                  changeText: "+₩35,000",
                  changeRate: "+0.72%",
                  sentiment: "up",
                },
              ],
              commentary: [
                "BTC는 단기 박스권 하단 테스트: 반등 실패 시 변동성 확대",
                "ETH는 상대적 강세, 다만 알트 과열 구간은 주의",
              ],
            },
            insight: {
              items: [
                {
                  id: "KRW-BTC",
                  ticker: "KRW-BTC",
                  name: "비트코인",
                  changeText: "-0.4%",
                  detailHref: "/crypto/KRW-BTC",
                },
                {
                  id: "KRW-XRP",
                  ticker: "KRW-XRP",
                  name: "리플",
                  changeText: "+1.8%",
                  detailHref: "/crypto/KRW-XRP",
                },
                {
                  id: "KRW-SOL",
                  ticker: "KRW-SOL",
                  name: "솔라나",
                  changeText: "-2.2%",
                  detailHref: "/crypto/KRW-SOL",
                },
              ],
            },
            videos: [
              {
                id: "v_cr_1",
                thumbnail:
                  "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&auto=format&fit=crop&q=60",
                title: "BTC 박스권 하단: 오늘 밤 체크 포인트",
                channel: "코인시그널",
                duration: "11:10",
                summary: ["지지/저항", "단기 시나리오", "리스크 관리"],
              },
              {
                id: "v_cr_2",
                thumbnail:
                  "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&auto=format&fit=crop&q=60",
                title: "ETH 강세의 이유와 알트 분화",
                channel: "크립토리서치",
                duration: "16:02",
                summary: ["섹터 로테이션", "과열 신호", "대응"],
              },
              {
                id: "v_cr_3",
                thumbnail:
                  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=60",
                title: "심야 변동성 구간 대비: 포지션 관리",
                channel: "트레이더Z",
                duration: "09:27",
                summary: ["레버리지 주의", "손절 기준", "분할 진입"],
              },
              {
                id: "v_cr_4",
                thumbnail:
                  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60",
                title: "알트 테마: 게임/AI/메타버스",
                channel: "알트픽",
                duration: "14:20",
                summary: ["테마 흐름", "진입 타이밍", "리스크"],
              },
              {
                id: "v_cr_5",
                thumbnail:
                  "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&auto=format&fit=crop&q=60",
                title: "내일 전략: 핵심 코인만 압축",
                channel: "크립토리서치",
                duration: "12:44",
                summary: ["관망/공격 구간", "손익비", "심리"],
              },
            ],
          },
        },
        {
          id: "slot_crypto_night",
          label: "심야 코인",
          displayTime: "00:30",
          tabs: {
            market: {
              indexes: [
                {
                  id: "btc",
                  label: "BTC",
                  value: "₩93,120,000",
                  changeText: "+₩780,000",
                  changeRate: "+0.84%",
                  sentiment: "up",
                },
                {
                  id: "alt",
                  label: "알트 강도",
                  value: "상승",
                  changeText: "테마 쏠림",
                  changeRate: "↑",
                  sentiment: "up",
                },
              ],
              commentary: [
                "심야는 급등락 빈번: 시장가·추격 진입 주의",
                "알트는 테마 한 방에 쏠리므로 분할/손절 우선",
              ],
            },
            insight: {
              items: [
                {
                  id: "KRW-BTC",
                  ticker: "KRW-BTC",
                  name: "비트코인",
                  changeText: "+0.8%",
                  detailHref: "/crypto/KRW-BTC",
                },
                {
                  id: "KRW-ARB",
                  ticker: "KRW-ARB",
                  name: "아비트럼",
                  changeText: "+4.1%",
                  detailHref: "/crypto/KRW-ARB",
                },
              ],
            },
            videos: [
              // 일부는 저녁과 동일, 일부는 완전 신규
              {
                id: "v_cr_2", // 유지
                thumbnail:
                  "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&auto=format&fit=crop&q=60",
                title: "ETH 강세의 이유와 알트 분화",
                channel: "크립토리서치",
                duration: "16:02",
                summary: ["섹터 로테이션", "과열 신호", "대응"],
              },
              {
                id: "v_cr_6",
                thumbnail:
                  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=60",
                title: "심야 급등락 구간: 3개 체크",
                channel: "트레이더Z",
                duration: "10:51",
                summary: ["유동성", "청산", "리스크"],
              },
              {
                id: "v_cr_7",
                thumbnail:
                  "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&auto=format&fit=crop&q=60",
                title: "BTC 반등/실패 시나리오",
                channel: "코인시그널",
                duration: "12:28",
                summary: ["지지", "저항", "대응"],
              },
              {
                id: "v_cr_8",
                thumbnail:
                  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60",
                title: "알트 테마 변동성 대응",
                channel: "알트픽",
                duration: "13:33",
                summary: ["테마 로테이션", "손절", "분할"],
              },
              {
                id: "v_cr_9",
                thumbnail:
                  "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&auto=format&fit=crop&q=60",
                title: "내일 아침까지 포지션 관리",
                channel: "크립토리서치",
                duration: "09:12",
                summary: ["수면 시간", "알림 설정", "리스크"],
              },
            ],
          },
        },
      ],
    },
    {
      id: "sec_realestate",
      type: "realestate",
      title: "부동산",
      anchor: "realestate",
      summaryBullets: [
        "🏠 거래량 둔화 속 지역 양극화: 상급지 중심의 방어",
        "🧾 정책 변수(대출/세제) 예고: 심리 변동 가능",
        "📉 재건축/재개발은 공사비·사업지연 리스크 점검",
      ],
      rankingWindows: ["3시간", "12시간", "24시간"],
      defaultRankingWindow: "12시간",
      tabs: {
        topVideos: [
          {
            id: "v_re_1",
            thumbnail:
              "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=60",
            title: "서울 아파트 흐름: 과열 vs 조정 시그널",
            channel: "부동산읽기",
            duration: "17:03",
            summary: ["상급지 수급", "규제 변수", "관망 포인트"],
          },
          {
            id: "v_re_2",
            thumbnail:
              "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop&q=60",
            title: "전세/대출 규제 강화 가능성: 영향 정리",
            channel: "정책브리핑",
            duration: "13:41",
            summary: ["대출 변수", "전세 시장", "전략"],
          },
          {
            id: "v_re_3",
            thumbnail:
              "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=60",
            title: "지방 양극화: 실거주/투자 판단 기준",
            channel: "지방리포트",
            duration: "12:09",
            summary: ["수요/공급", "리스크", "사례"],
          },
          {
            id: "v_re_4",
            thumbnail:
              "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&auto=format&fit=crop&q=60",
            title: "재건축 투자: 공사비와 사업 지연 체크",
            channel: "재건축랩",
            duration: "15:22",
            summary: ["사업 단계", "공사비", "자금 계획"],
          },
          {
            id: "v_re_5",
            thumbnail:
              "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=60",
            title: "2026년 상반기 전망: 가격/정책/금리 변수",
            channel: "전망센터",
            duration: "18:57",
            summary: ["금리", "정책", "시나리오"],
          },
        ],
        rankingUpdates: [
          {
            id: "u1",
            elapsedLabel: "52분 전",
            message: "NEW #3 진입 (서울 흐름)",
          },
          {
            id: "u2",
            elapsedLabel: "1시간 전",
            message: "#1 유지 (전망센터)",
          },
          {
            id: "u3",
            elapsedLabel: "2시간 전",
            message: "#5 이탈 (지방리포트)",
          },
          {
            id: "u4",
            elapsedLabel: "3시간 전",
            message: "NEW #2 진입 (정책브리핑)",
          },
          {
            id: "u5",
            elapsedLabel: "5시간 전",
            message: "#2 → #4 하락 (재건축랩)",
          },
          {
            id: "u6",
            elapsedLabel: "11시간 전",
            message: "#1 유지 (전망센터)",
          },
        ],
      },
    },
  ],
  exploreTabs: [
    { id: "t_all", label: "전체 탭 피드", href: "/feed" },
    { id: "t_stocks", label: "주식 피드", href: "/feed/stocks" },
    { id: "t_crypto", label: "가상자산 피드", href: "/feed/crypto" },
    { id: "t_realestate", label: "부동산 피드", href: "/feed/realestate" },
  ],
};

/**
 * =========================================================
 * Helpers
 * =========================================================
 */

const hasMarketDeltaData = (section?: InsightSection) =>
  !!section &&
  Object.keys(section.data?.market_delta_insights?.by_market ?? {}).length > 0;

const isMoneySection = (section: RecapSection): section is MoneyRecapSection =>
  section.type === "stocks" || section.type === "crypto";

const isRankingSection = (
  section: RecapSection
): section is RankingRecapSection => section.type === "realestate";

function safeKey(text: string, idx: number) {
  return `${idx}-${text}`;
}

function getDefaultSlotId(section: MoneyRecapSection) {
  return (
    section.defaultSlotId ||
    section.slotPackages.find((s) => s.default)?.id ||
    section.slotPackages[0]?.id ||
    ""
  );
}

function diffCountFromBase(
  baseIds: Set<string>,
  targetVideos: VideoCardData[]
) {
  let c = 0;
  for (const v of targetVideos) if (!baseIds.has(v.id)) c += 1;
  return c;
}

function badgeForDiff(diff: number) {
  if (diff <= 0) return null;
  if (diff >= 5) return "NEW";
  return `+${diff}`;
}

const BRIEFING_SLOT_PHASES: BriefingSlot[] = [
  "baseline",
  "slot1",
  "slot2",
  "slot3",
  "ranking",
  "slot4",
];

const resolveSlotPhase = (slotId?: string | null): BriefingSlot | null => {
  if (!slotId) return null;
  return BRIEFING_SLOT_PHASES.includes(slotId as BriefingSlot)
    ? (slotId as BriefingSlot)
    : null;
};

const buildSectionSlotLabel = (
  sectionTitle: string,
  slot: SlotPackage
): SlotLabel => {
  const phase = resolveSlotPhase(slot.id) || "slot4";
  const baseLabel: SlotLabel = {
    phase,
    title: slot.label,
    description: slot.description ?? "",
  };
  return resolveInsightSlotCopy(sectionTitle, baseLabel) ?? baseLabel;
};

type HighlightStockItem = {
  id: string;
  name: string;
  ticker: string;
  changeText?: string;
  summary?: string;
  detailHref?: string;
  insightStock?: InsightStock;
};

/**
 * =========================================================
 * Component
 * =========================================================
 */

interface BriefingLandingPageClientProps {
  data?: BriefingLandingData;
}

const BriefingLandingPageClient = ({
  data: inputData,
}: BriefingLandingPageClientProps) => {
  const data = inputData ?? MOCK_DATA;

  const router = useRouter();
  const user = useRecoilValue(userState);

  const topBarRef = useRef<HTMLDivElement | null>(null);
  const keywordNavRef = useRef<HTMLDivElement | null>(null);

  const navItems = useMemo(() => {
    if (data.keywordNav?.length) return data.keywordNav;
    return data.sections.map((section) => ({
      id: section.id,
      label: section.title,
      anchor: section.anchor,
    }));
  }, [data.keywordNav, data.sections]);

  const [activeAnchor, setActiveAnchor] = useState(navItems[0]?.anchor ?? "");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // sticky 높이 동적 계산 → 앵커 점프/scroll-margin-top 정확히
  const [topbarH, setTopbarH] = useState(64);
  const [keywordNavH, setKeywordNavH] = useState(52);

  useLayoutEffect(() => {
    const measure = () => {
      const tb = topBarRef.current?.getBoundingClientRect().height ?? 64;
      const kn = keywordNavRef.current?.getBoundingClientRect().height ?? 52;
      setTopbarH(Math.round(tb));
      setKeywordNavH(Math.round(kn));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [
    data.deliveryMeta.displayLabel,
    data.deliveryMeta.tagline,
    navItems.length,
  ]);

  /**
   * 초기 상태 구성
   */
  const buildInitialSlotState = () => {
    const entries = data.sections
      .filter(isMoneySection)
      .map((section) => [section.id, getDefaultSlotId(section)]);
    return Object.fromEntries(entries);
  };

  const buildInitialRankingTabs = () => {
    const entries = data.sections
      .filter(isRankingSection)
      .map((section) => [section.id, "topVideos" as RankingTabKey]);
    return Object.fromEntries(entries);
  };

  const buildInitialRankingWindows = () => {
    const entries = data.sections
      .filter(isRankingSection)
      .map((section) => [
        section.id,
        section.defaultRankingWindow || section.rankingWindows[0] || "",
      ]);
    return Object.fromEntries(entries);
  };

  const [activeSlotBySection, setActiveSlotBySection] = useState<
    Record<string, string>
  >(buildInitialSlotState);

  const [rankingTabBySection, setRankingTabBySection] = useState<
    Record<string, RankingTabKey>
  >(buildInitialRankingTabs);

  const [rankingWindowBySection, setRankingWindowBySection] = useState<
    Record<string, string>
  >(buildInitialRankingWindows);

  // “TOP5 갱신 기대감” 도트 표시용: base 대비 diffCount가 있으면 videos 탭에 dot
  const baseVideoIdsByMoneySection = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    data.sections.filter(isMoneySection).forEach((section) => {
      const baseSlotId = getDefaultSlotId(section);
      const baseSlot =
        section.slotPackages.find((s) => s.id === baseSlotId) ||
        section.slotPackages[0];
      const ids = new Set<string>(
        (baseSlot?.tabs.videos ?? []).map((v) => v.id)
      );
      m[section.id] = ids;
    });
    return m;
  }, [data.sections]);

  const diffBadgeByMoneySectionSlot = useMemo(() => {
    const m: Record<
      string,
      Record<string, { diff: number; badge: string | null }>
    > = {};
    data.sections.filter(isMoneySection).forEach((section) => {
      const baseIds =
        baseVideoIdsByMoneySection[section.id] ?? new Set<string>();
      m[section.id] = {};
      section.slotPackages.forEach((slot) => {
        const diff = diffCountFromBase(baseIds, slot.tabs.videos);
        m[section.id][slot.id] = { diff, badge: badgeForDiff(diff) };
      });
    });
    return m;
  }, [data.sections, baseVideoIdsByMoneySection]);

  useEffect(() => {
    setActiveSlotBySection(buildInitialSlotState());
    setRankingTabBySection(buildInitialRankingTabs());
    setRankingWindowBySection(buildInitialRankingWindows());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sections]);

  /**
   * IntersectionObserver: 현재 섹션 하이라이트
   * - ref가 채워진 다음에 observe
   */
  useEffect(() => {
    const nodes = Object.values(sectionRefs.current).filter(
      Boolean
    ) as Element[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // intersecting 중에서 가장 위(가까운) 것을 active로
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0)
          );
        const top = visible[0];
        if (top) {
          const id = (top.target as HTMLElement).getAttribute("data-anchor-id");
          if (id) setActiveAnchor(id);
        }
      },
      { threshold: 0.3 }
    );

    // DOM이 안정된 다음 observe
    const raf = requestAnimationFrame(() => {
      nodes.forEach((n) => observer.observe(n));
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [data.sections, navItems.length]);

  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleNavClick = (anchor: string) => {
    const target = sectionRefs.current[anchor];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = () => {
    const nextUrl =
      typeof window !== "undefined"
        ? encodeURIComponent(
            window.location.pathname +
              window.location.search +
              window.location.hash
          )
        : encodeURIComponent(`/b/${data.briefingId}`);

    if (!user?.email) {
      router.push(`/login?next=${nextUrl}&intent=save`);
      return;
    }
    if (saved) return;
    setSaved(true);
    showToast("내 브리핑에 저장했어요");
  };

  const handleShare = () => {
    const sharePayload = {
      title: "오늘의 브리핑",
      text: data.deliveryMeta.tagline,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share(sharePayload).catch(() => undefined);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(sharePayload.url)
        .then(() => showToast("링크를 복사했어요"))
        .catch(() => undefined);
    }
  };

  const getActiveSlot = (
    section: MoneyRecapSection
  ): SlotPackage | undefined => {
    const activeSlotId = activeSlotBySection[section.id];
    return (
      section.slotPackages.find((slot) => slot.id === activeSlotId) ||
      section.slotPackages[0]
    );
  };

  /**
   * 슬롯 변경 시: "TOP5 갱신" 기대감 토스트 + TOP5 탭에 dot 유지
   */
  const onSlotSelect = (section: MoneyRecapSection, slotId: string) => {
    setActiveSlotBySection((prev) => ({ ...prev, [section.id]: slotId }));

    const slot = section.slotPackages.find((s) => s.id === slotId);
    const diff = diffBadgeByMoneySectionSlot?.[section.id]?.[slotId]?.diff ?? 0;
    if (slot) {
      const slotCopy = buildSectionSlotLabel(section.title, slot);
      if (diff > 0) {
        showToast(
          `${slotCopy.title} TOP5로 갱신됐어요 · 새 근거영상 ${diff}개`
        );
      } else {
        showToast(`${slotCopy.title} 슬롯으로 이동했어요`);
      }
    }

    if (typeof window !== "undefined") {
      const target = sectionRefs.current[section.anchor];
      if (target) {
        const offset = Math.max(0, topbarH + keywordNavH + 24);
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const adaptSlotVideosToSources = (
    videos: VideoCardData[]
  ): InsightSource[] => {
    return videos.map((video) => {
      const summaryText =
        video.summary?.find((line) => line && line.trim().length > 0) ?? "";
      return {
        video_id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channel_name: video.channel,
        summary: summaryText,
      } as InsightSource;
    });
  };

  const renderMoneySection = (section: MoneyRecapSection) => {
    const activeSlot = getActiveSlot(section);
    const baseIds = baseVideoIdsByMoneySection[section.id] ?? new Set<string>();
    const activeSlotId = activeSlotBySection[section.id];
    const activeDiff =
      diffBadgeByMoneySectionSlot?.[section.id]?.[activeSlotId]?.diff ?? 0;
    const slotLabel: SlotLabel | null = activeSlot
      ? buildSectionSlotLabel(section.title, activeSlot)
      : null;
    const insightSection = activeSlot?.tabs.insightSection;

    const insightContent = (() => {
      if (!insightSection) return null;
      if (section.type === "crypto") {
        return (
          <LandingCryptoInsightSection
            section={insightSection}
            slotLabel={slotLabel ?? undefined}
          />
        );
      }
      if (hasMarketDeltaData(insightSection)) {
        return (
          <LandingStockMarketSection
            section={insightSection}
            slotLabel={slotLabel ?? undefined}
          />
        );
      }
      return (
        <LandingDomesticStockInsightSection
          section={insightSection}
          slotLabel={slotLabel ?? undefined}
        />
      );
    })();

    const summaryLines = activeSlot?.tabs.market.commentary?.length
      ? activeSlot.tabs.market.commentary
      : section.summaryBullets;
    const slotVideoSources = activeSlot
      ? adaptSlotVideosToSources(activeSlot.tabs.videos)
      : [];

    return (
      <SectionBlock
        key={section.id}
        id={section.anchor}
        data-anchor-id={section.anchor}
        ref={(node) => {
          sectionRefs.current[section.anchor] = node as HTMLDivElement | null;
        }}
      >
        <SectionTitleRow>
          <SectionTitle>{section.title}</SectionTitle>
          <SectionMiniHint>슬롯 변경 시 TOP5가 갱신돼요</SectionMiniHint>
        </SectionTitleRow>

        {section.slotPackages.length || activeSlot ? (
          <SectionSlotBar $withShadow>
            {section.slotPackages.length ? (
              <SlotSelector aria-label={`${section.title} 슬롯 선택`}>
                {section.slotPackages.map((slot) => {
                  const slotCopy = buildSectionSlotLabel(section.title, slot);
                  const badge =
                    diffBadgeByMoneySectionSlot?.[section.id]?.[slot.id]?.badge;
                  const isActive = slot.id === activeSlotBySection[section.id];
                  return (
                    <SlotChip
                      key={slot.id}
                      type="button"
                      $active={isActive}
                      onClick={() => onSlotSelect(section, slot.id)}
                    >
                      <span>{slotCopy.title}</span>
                      {badge ? (
                        <ChipBadge $active={isActive}>{badge}</ChipBadge>
                      ) : null}
                    </SlotChip>
                  );
                })}
              </SlotSelector>
            ) : null}
            {activeSlot ? (
              <SlotMeta>
                현재: {slotLabel?.title ?? activeSlot.label} ·{" "}
                {activeSlot.displayTime}
              </SlotMeta>
            ) : null}
          </SectionSlotBar>
        ) : null}

        <SummaryCard>
          <BlockTitle>카카오톡 브리핑 요약</BlockTitle>
          <SummaryList>
            {summaryLines.map((line, idx) => (
              <li
                key={safeKey(line, idx)}
                dangerouslySetInnerHTML={createMarkedHtml(line)}
              />
            ))}
          </SummaryList>
        </SummaryCard>

        {insightContent ? (
          <InsightBlock>
            <BlockHeader>
              <BlockTitle>인사이트 강화</BlockTitle>
              {slotLabel ? <BlockMeta>{slotLabel.title}</BlockMeta> : null}
            </BlockHeader>
            <BlockDivider />
            {insightContent}
          </InsightBlock>
        ) : (
          <InsightEmptyState>
            슬롯 인사이트를 불러오는 중이에요.
          </InsightEmptyState>
        )}

        {activeSlot ? (
          <VideoBlock>
            <BlockHeader>
              <BlockTitle>TOP5 근거영상</BlockTitle>
              {activeDiff > 0 ? (
                <BlockBadge>
                  새 근거영상 <strong>+{activeDiff}</strong>
                </BlockBadge>
              ) : null}
            </BlockHeader>
            <VideoList>
              {activeSlot.tabs.videos.map((video) => {
                const isNew = !baseIds.has(video.id);
                return (
                  <VideoCard key={video.id}>
                    <VideoThumb src={video.thumbnail} alt={video.title} />
                    <VideoContent>
                      <VideoTitleRow>
                        <VideoTitle>{video.title}</VideoTitle>
                        {isNew ? <NewPill>NEW</NewPill> : null}
                      </VideoTitleRow>
                      <VideoMeta>
                        {video.channel} · {video.duration}
                      </VideoMeta>
                      <BulletList>
                        {video.summary.map((line, idx) => (
                          <li
                            key={safeKey(line, idx)}
                            dangerouslySetInnerHTML={createMarkedHtml(line)}
                          />
                        ))}
                      </BulletList>
                    </VideoContent>
                  </VideoCard>
                );
              })}
            </VideoList>
          </VideoBlock>
        ) : null}
      </SectionBlock>
    );
  };

  const renderRankingSection = (section: RankingRecapSection) => {
    const activeTab = rankingTabBySection[section.id] ?? "topVideos";
    const rankingWindow = rankingWindowBySection[section.id];
    const updates = section.tabs.rankingUpdates ?? [];
    const summaryLines = section.summaryBullets;

    return (
      <SectionBlock
        key={section.id}
        id={section.anchor}
        data-anchor-id={section.anchor}
        ref={(node) => {
          sectionRefs.current[section.anchor] = node as HTMLDivElement | null;
        }}
      >
        <SectionTitleRow>
          <SectionTitle>{section.title}</SectionTitle>
        </SectionTitleRow>

        <SummaryCard>
          <SummarySource>카카오톡 브리핑 요약</SummarySource>
          <SummaryList>
            {summaryLines.map((line, idx) => (
              <li
                key={safeKey(line, idx)}
                dangerouslySetInnerHTML={createMarkedHtml(line)}
              />
            ))}
          </SummaryList>
        </SummaryCard>

        <TabList role="tablist" aria-label={`${section.title} 탭`}>
          {(
            [
              { key: "topVideos", label: "TOP5 근거영상" },
              { key: "rankingUpdates", label: "랭킹 갱신 스트림" },
            ] as { key: RankingTabKey; label: string }[]
          ).map((tab) => (
            <TabButton
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              $active={activeTab === tab.key}
              onClick={() =>
                setRankingTabBySection((prev) => ({
                  ...prev,
                  [section.id]: tab.key,
                }))
              }
            >
              {tab.label}
            </TabButton>
          ))}
        </TabList>

        <TabPanel>
          {activeTab === "topVideos" ? (
            <VideoList>
              {section.tabs.topVideos.map((video) => (
                <VideoCard key={video.id}>
                  <VideoThumb src={video.thumbnail} alt={video.title} />
                  <VideoContent>
                    <VideoTitleRow>
                      <VideoTitle>{video.title}</VideoTitle>
                    </VideoTitleRow>
                    <VideoMeta>
                      {video.channel} · {video.duration}
                    </VideoMeta>
                    <BulletList>
                      {video.summary.map((line, idx) => (
                        <li key={safeKey(line, idx)}>{line}</li>
                      ))}
                    </BulletList>
                  </VideoContent>
                </VideoCard>
              ))}
            </VideoList>
          ) : null}

          {activeTab === "rankingUpdates" ? (
            <RankingStream>
              <RankingWindowSelector aria-label="랭킹 기간 선택">
                {section.rankingWindows.map((windowLabel) => (
                  <SlotChip
                    key={windowLabel}
                    type="button"
                    $active={windowLabel === rankingWindow}
                    onClick={() => {
                      setRankingWindowBySection((prev) => ({
                        ...prev,
                        [section.id]: windowLabel,
                      }));
                      showToast(
                        `${section.title} · ${windowLabel} 갱신으로 전환했어요`
                      );
                    }}
                  >
                    <span>{windowLabel}</span>
                  </SlotChip>
                ))}
              </RankingWindowSelector>

              <RankingList>
                {updates.map((update) => (
                  <RankingItem key={update.id}>
                    <RankingTime>{update.elapsedLabel}</RankingTime>
                    <RankingMessage>{update.message}</RankingMessage>
                  </RankingItem>
                ))}
              </RankingList>
            </RankingStream>
          ) : null}
        </TabPanel>
      </SectionBlock>
    );
  };

  return (
    <PageContainer
      style={
        {
          ["--topbar-h" as any]: `${topbarH}px`,
          ["--keywordnav-h" as any]: `${keywordNavH}px`,
          ["--sticky-offset" as any]: `${topbarH + keywordNavH + 16}px`,
        } as React.CSSProperties
      }
    >
      <LogoHeaderDock>
        <LogoHeader showLogo />
      </LogoHeaderDock>
      <TopAppBar>
        <BackButton href={data.deliveryMeta.backHref}>
          {`< ${data.deliveryMeta.backLabel}`}
        </BackButton>
        <TopMeta ref={topBarRef}>
          <TopTime>{data.deliveryMeta.displayLabel}</TopTime>
          <TopDescription>{data.deliveryMeta.description}</TopDescription>
          <TopTagline>{data.deliveryMeta.tagline}</TopTagline>
        </TopMeta>
      </TopAppBar>

      <StickyKeywordNav
        ref={keywordNavRef}
        role="tablist"
        aria-label="섹션 이동"
      >
        {navItems.map((item) => (
          <KeywordChip
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeAnchor === item.anchor}
            $active={activeAnchor === item.anchor}
            onClick={() => handleNavClick(item.anchor)}
          >
            {item.label}
          </KeywordChip>
        ))}
      </StickyKeywordNav>

      <SectionsContainer>
        {data.sections.map((section) => {
          if (isMoneySection(section)) return renderMoneySection(section);
          if (isRankingSection(section)) return renderRankingSection(section);
          return null;
        })}
      </SectionsContainer>

      <FooterExplore>
        <FooterTitle>더 탐색하기</FooterTitle>
        <ExploreGrid>
          {data.exploreTabs.map((tab) => (
            <ExploreButton key={tab.id} href={tab.href}>
              {tab.label}
            </ExploreButton>
          ))}
        </ExploreGrid>

        <FooterActions>
          <GhostButton type="button" onClick={handleShare}>
            공유하기
          </GhostButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={saved}>
            {saved ? "저장됨 ✓" : "내 브리핑 저장하기"}
          </PrimaryButton>
        </FooterActions>
      </FooterExplore>

      {toastMessage ? <Toast role="status">{toastMessage}</Toast> : null}
    </PageContainer>
  );
};

export default BriefingLandingPageClient;

/**
 * =========================================================
 * Styles
 * =========================================================
 */

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #eef2ff 0%, #f9fafb 55%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  /* padding: 0 16px 80px; */
`;

const LogoHeaderDock = styled.div`
  width: 100%;
  max-width: 720px;
  padding: 12px 0 4px;
`;

const TopAppBar = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 720px;
  padding: 12px 0 8px;
`;

const BackButton = styled(Link)`
  font-size: 15px;
  color: #1f2a4a;
  text-decoration: none;
  font-weight: 700;
`;

const TopMeta = styled.div.attrs({
  className: "BriefingLandingPageClient__TopMeta",
})`
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 16px 0px;
  background: linear-gradient(
    180deg,
    rgba(246, 247, 251, 0.95) 0%,
    rgba(246, 247, 251, 0.8) 72%,
    rgba(246, 247, 251, 0)
  );
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(17, 24, 39, 0.06);
`;

const TopTime = styled.span`
  font-size: 18px;
  font-weight: 800;
`;

const TopDescription = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const TopTagline = styled.span`
  font-size: 12px;
  color: #94a3b8;
`;

const StickyKeywordNav = styled.nav`
  position: sticky;
  top: 52px;
  /* top: var(--topbar-h, 64px); */
  z-index: 25;
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 720px;
  padding: 8px 16px;
  overflow-x: auto;
  background: rgba(246, 247, 251, 0.96);
  backdrop-filter: blur(8px);
`;

const KeywordChip = styled.button<{ $active: boolean }>`
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "#111827" : "#e5e7eb")};
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: ${({ $active }) => ($active ? "#111827" : "#e8edff")};
  color: ${({ $active }) => ($active ? "#ffffff" : "#111827")};
`;

const SectionsContainer = styled.main`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 720px;
  padding: 24px 0 40px;
`;

const SectionBlock = styled.section`
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96) 0%,
    #ffffff 100%
  );
  border: 1px solid rgba(50, 71, 255, 0.08);
  padding: 16px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.07);
  scroll-margin-top: var(--sticky-offset, 140px);
`;

const SectionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  position: relative;
  padding-left: 14px;
  line-height: 1.35;
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.2em;
    bottom: 0.2em;
    width: 4px;
    border-radius: 999px;
    background: #3247ff;
  }
`;

const SectionMiniHint = styled.span`
  font-size: 12px;
  color: #6a6f85;
  font-weight: 700;
  margin-top: 4px;
`;

const SummaryCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(50, 71, 255, 0.08),
    rgba(14, 165, 233, 0.06)
  );
  border: none;
  border-radius: 16px;
  padding: 14px 16px;
  margin: 8px 0 20px;
`;

const SummarySource = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7289;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const SummaryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-size: 15px;
  line-height: 1.6;
  color: #1f2a4a;
  margin-top: 12px;
  li {
    position: relative;
    padding-left: 20px;
    word-break: keep-all;
  }
  li::before {
    content: "•";
    position: absolute;
    left: 0;
    top: 0;
    color: #3247ff;
    font-weight: 900;
  }
  li:not(:last-child) {
    margin-bottom: 8px;
  }
`;

const SectionSlotBar = styled.div.attrs({
  className: "BriefingLandingPageClient__SectionSlotBar",
})<{ $withShadow?: boolean }>`
  position: sticky;
  top: 96px;
  /* top: calc(var(--topbar-h, 64px) + var(--keywordnav-h, 52px) + 12px); */
  z-index: 8;
  margin: 12px 0;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(40, 51, 102, 0.08);
  box-shadow: ${({ $withShadow }) =>
    $withShadow ? "0 12px 24px rgba(15, 23, 42, 0.12)" : "none"};
  backdrop-filter: blur(12px);
`;

const InsightBlock = styled.section`
  margin-top: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(243, 246, 255, 0.82), #eef6ff);
  border: 1px solid rgba(50, 71, 255, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
`;

const VideoBlock = styled.section`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const BlockDivider = styled.div`
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.08),
    rgba(50, 71, 255, 0.25)
  );
`;

const BlockTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1f2a4a;
`;

const BlockMeta = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #5a648a;
`;

const BlockBadge = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #1f2a4a;
  background: #e4ecff;
  border-radius: 999px;
  padding: 4px 10px;
  strong {
    font-weight: 900;
  }
`;

const SlotSelector = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 4px;
  scroll-snap-type: x proximity;
  scroll-padding: 0 20px;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SlotChip = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  border-radius: 999px;
  border: 1px solid rgba(50, 71, 255, 0.16);
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
  line-height: 1;
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(135deg, #1f2a4a, #3730a3)"
      : "linear-gradient(135deg, #f8f9ff, #eef2ff)"};
  color: ${({ $active }) => ($active ? "#fff" : "#1f2a4a")};
  scroll-snap-align: start;
  transition: background 0.2s ease, border-color 0.2s ease;
  box-shadow: ${({ $active }) =>
    $active ? "0 6px 15px rgba(31, 42, 74, 0.4)" : "none"};
`;

const ChipBadge = styled.span<{ $active: boolean }>`
  font-size: 11px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 999px;
  background: ${({ $active }) =>
    $active ? "rgba(255, 255, 255, 0.3)" : "rgba(50, 71, 255, 0.08)"};
  color: ${({ $active }) => ($active ? "#fff" : "#1f2a4a")};
  border: 1px solid rgba(31, 42, 74, 0.12);
`;

const SlotMeta = styled.span`
  display: block;
  margin: 6px 0 12px;
  font-size: 13px;
  color: #575b73;
  font-weight: 650;
`;

const TabList = styled.div`
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #f3f5ff;
  border: 1px solid #e0e5ff;
  border-radius: 14px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 800;
  font-size: 13px;
  background: ${({ $active }) => ($active ? "#fff" : "transparent")};
  color: #1f2a4a;
  box-shadow: ${({ $active }) =>
    $active ? "0 6px 18px rgba(31, 42, 74, 0.12)" : "none"};
`;

const TabLabel = styled.span`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
`;

const TabDot = styled.span`
  font-size: 12px;
  line-height: 1;
  opacity: 0.95;
`;

const TabPanel = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InsightEmptyState = styled.div`
  border: 1px dashed #dfe4fb;
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  font-size: 13px;
  color: #5a648a;
  background: #f9faff;
`;

const IndexGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
`;

const IndexCard = styled.div`
  border-radius: 14px;
  background: #f8f9ff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IndexLabel = styled.span`
  font-size: 13px;
  color: #555c79;
  font-weight: 700;
`;

const IndexValue = styled.span`
  font-size: 20px;
  font-weight: 900;
`;

const IndexChange = styled.span<{ $sentiment: Sentiment }>`
  font-size: 13px;
  font-weight: 800;
  color: ${({ $sentiment }) =>
    $sentiment === "up"
      ? "#1fb56a"
      : $sentiment === "down"
      ? "#e05268"
      : "#5b6180"};
`;

const VideoList = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
`;

const VideoCard = styled.article`
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  align-items: flex-start;
  background: transparent;
  &:last-child {
    border-bottom: none;
  }
`;

const VideoThumb = styled.img`
  width: 92px;
  height: 52px;
  border-radius: 10px;
  object-fit: cover;
  flex: 0 0 auto;
`;

const VideoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const VideoTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const VideoTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  color: #1f2a4a;
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NewPill = styled.span`
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  background: #1f2a4a;
  color: #fff;
  white-space: nowrap;
`;

const VideoMeta = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #2e344f;
  line-height: 1.55;
  display: flex;
  flex-direction: column;
  li:not(:last-child) {
    margin-bottom: 6px;
  }
`;

const RankingStream = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RankingWindowSelector = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
`;

const RankingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RankingItem = styled.div`
  border-radius: 14px;
  background: #f8f9ff;
  padding: 12px;
  display: flex;
  gap: 12px;
`;

const RankingTime = styled.span`
  font-size: 13px;
  color: #6a6f85;
  min-width: 70px;
  font-weight: 800;
`;

const RankingMessage = styled.span`
  font-size: 14px;
  color: #1f2a4a;
  font-weight: 750;
`;

const FooterExplore = styled.section`
  margin: 30px 20px;
  padding: 20px;
  border-radius: 20px;
  background: #101a3c;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FooterTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 900;
`;

const ExploreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
`;

const ExploreButton = styled(Link)`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  padding: 12px;
  color: #fff;
  text-align: center;
  text-decoration: none;
  font-weight: 800;
`;

const FooterActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-weight: 900;
  font-size: 15px;
  background: #ffd54f;
  color: #1f2a4a;
`;

const GhostButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 12px;
  background: transparent;
  color: #fff;
  font-weight: 800;
`;

const toastAnimation = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 999px;
  background: rgba(15, 25, 60, 0.92);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  animation: ${toastAnimation} 0.2s ease;
`;
