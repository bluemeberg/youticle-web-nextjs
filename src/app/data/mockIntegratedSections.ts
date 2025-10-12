import type { InsightSectionsResponse } from "@/types/insight";

export const MOCK_INTEGRATED_SECTIONS: InsightSectionsResponse = {
  sections: [
    {
      key: "domestic_stock",
      label: "국내 주식",
      cache_key: "국내 주식__insight_integrated",
      updated_at: "2025-10-08T14:01:37+09:00",
      data: {
        overview: {
          market_snapshot:
            "금일 코스피는 0.4% 하락, 코스닥은 0.7% 상승하며 엇갈린 흐름을 보였다. 코스피는 하락했지만 오후 들어 회복세를 나타냈으며, 코스닥은 로봇, 비만 치료제, 스테이블 코인 관련주 강세에 힘입어 상승세를 유지했다. 전반적으로 변동성이 큰 하루였다.",
          macro_drivers: [
            "미국 3대 지수 상승 및 반도체 강세 영향.",
            "단기 과열에 따른 조정 심리 작용.",
          ],
          sectors_heatmap: {
            leaders: ["로봇", "스테이블 코인"],
            laggards: ["자동차", "증강 현실"],
          },
        },
        market_insights: {
          date_kst: "2025-10-08",
          by_market: {
            KOSPI: {
              market: "KOSPI",
              price_str: "3,549.21",
              chg_point_str: "93.38",
              chg_pct_str: "(+2.70%)",
              range_str: "시가 3,525.48 · 고가 3,565.96 · 저가 3,512.16",
              breadth_str: "상승 586 · 보합 48 · 하락 297 · 상한 1 · 하한 0",
              volume_value_str:
                "거래량 402,107(전일 493,641) · 거래대금 19,456,117.00억 원(전일 12,344,643.00억 원)",
              order_imbalance_str:
                "매도잔량 22,914,172 · 매수잔량 30,377,332 (매도 43.00% · 매수 57.00% · 순매수 7,463,160)",
              ytd_range_str:
                "YTD 고점 3,565.96(2025-10-02) · YTD 저점 2,284.72(2025-04-09)",
              one_year_pos_str: "고점 대비 0.47% · 저점 대비 -55.35%",
              derived: {
                adv_ratio_pct: "64.8",
                down_ratio_pct: "32.8",
                stnr_ratio_pct: "5.3",
                adv_down_spread: "289",
                volume_ratio_vs_prev: "0.82",
                value_ratio_vs_prev: "1.58",
                intraday_range_abs: "53.80",
                intraday_range_pct: "1.52",
                intraday_position_pct: "68.9",
                from_open_point: "23.73",
                from_open_pct: "0.67",
              },
              labels: {
                move_label: "상승",
                breadth_label: "상승 우세",
                volume_label: "거래량 위축",
                imbalance_label: "매수 우위",
                intraday_band: "장중 상단",
              },
              quick_lines: [
                "KOSPI 3,549.21 · 93.38p (+2.70%)",
                "상승 586종목 · 보합 48종목 · 하락 297종목 · 상승비중 64.8%",
                "거래량 40.21만(전일 49.36만, 약 0.82x) · 매수 57.0%/매도 43.0% · 순매수 746.32만",
                "금일 코스피는 0.4% 하락, 코스닥은 0.7% 상승하며 엇갈린 흐름을 보였다. 코스피는 하락했지만 오후 들어 회복세를 나타냈으며, 코스닥은 로봇, 비만 치료제…",
              ],
              sentences: {
                intraday_flow:
                  "시가 3,525.48에서 시작해 고가 3,565.96·저가 3,512.16을 찍었고, 종가는 범위의 상단에 가까운 구간에서 마감했습니다(시가 대비 23.73p).",
                market_breadth:
                  "상승 종목 586 · 보합 48 · 하락 종목 297로, 상승비중 64.8%로 상승 우세가 뚜렷했습니다.",
                liquidity:
                  "거래량 402,107(전일 493,641, 약 0.82x), 거래대금 19,456,117.00억 원(전일 12,344,643.00억 원)으로 거래량 위축되었습니다.",
                order_flow:
                  "매수잔량 30,377,332 · 매도잔량 22,914,172, 매수 57.00% / 매도 43.00%로 매수 우위(순매수 약 7,463,160)가 관찰되었습니다.",
              },
              comment_title: "마켓 코멘트",
              comment_body:
                "금일 코스피는 0.4% 하락, 코스닥은 0.7% 상승하며 엇갈린 흐름을 보였습니다. <mark>코스피는 하락했지만 오후 들어 회복세</mark>를 나타냈습니다. 코스닥은 로봇, 스테이블 코인 관련주 강세에 힘입어 상승세를 유지했습니다. 매크로 측면에서는 <mark>미국 3대 지수 상승 및 반도체 강세 영향</mark>과 단기 과열에 따른 조정 심리가 작용했습니다. 섹터 측면에서 <mark>로봇, 스테이블 코인이 강세</mark>였고 자동차, 증강 현실은 부진했습니다.",
            },
            KOSDAQ: {
              market: "KOSDAQ",
              price_str: "854.25",
              chg_point_str: "8.91",
              chg_pct_str: "(+1.05%)",
              range_str: "시가 853.40 · 고가 854.87 · 저가 848.75",
              breadth_str: "상승 1,052 · 보합 113 · 하락 571 · 상한 4 · 하한 0",
              volume_value_str:
                "거래량 820,880(전일 620,014) · 거래대금 7,228.65억 원(전일 6,344.08억 원)",
              order_imbalance_str:
                "매도잔량 26,505,838 · 매수잔량 34,049,137 (매도 43.77% · 매수 56.23% · 순매수 7,543,299)",
              ytd_range_str:
                "YTD 고점 877.56(2025-09-23) · YTD 저점 637.55(2025-04-09)",
              one_year_pos_str: "고점 대비 2.66% · 저점 대비 -33.99%",
              derived: {
                adv_ratio_pct: "62.8",
                down_ratio_pct: "34.1",
                stnr_ratio_pct: "6.7",
                adv_down_spread: "481",
                volume_ratio_vs_prev: "1.32",
                value_ratio_vs_prev: "1.14",
                intraday_range_abs: "6.12",
                intraday_range_pct: "0.72",
                intraday_position_pct: "92.3",
                from_open_point: "0.85",
                from_open_pct: "0.10",
              },
              labels: {
                move_label: "상승",
                breadth_label: "상승 우세",
                volume_label: "거래량 확대",
                imbalance_label: "매수 우위",
                intraday_band: "장중 상단",
              },
              quick_lines: [
                "KOSDAQ 854.25 · 8.91p (+1.05%)",
                "상승 1,052종목 · 보합 113종목 · 하락 571종목 · 상승비중 62.8%",
                "거래량 82.09만(전일 62.00만, 약 1.32x) · 매수 56.2%/매도 43.8% · 순매수 754.33만",
                "금일 코스피는 0.4% 하락, 코스닥은 0.7% 상승하며 엇갈린 흐름을 보였다. 코스피는 하락했지만 오후 들어 회복세를 나타냈으며, 코스닥은 로봇, 비만 치료제…",
              ],
              sentences: {
                intraday_flow:
                  "시가 853.40에서 시작해 고가 854.87·저가 848.75을 찍었고, 종가는 범위의 상단에 가까운 구간에서 마감했습니다(시가 대비 0.85p).",
                market_breadth:
                  "상승 종목 1,052 · 보합 113 · 하락 종목 571로, 상승비중 62.8%로 상승 우세가 뚜렷했습니다.",
                liquidity:
                  "거래량 820,880(전일 620,014, 약 1.32x), 거래대금 7,228.65억 원(전일 6,344.08억 원)으로 거래량 확대되었습니다.",
                order_flow:
                  "매수잔량 34,049,137 · 매도잔량 26,505,838, 매수 56.23% / 매도 43.77%로 매수 우위(순매수 약 7,543,299)가 관찰되었습니다.",
              },
              comment_title: "마켓 코멘트",
              comment_body:
                "금일 코스피는 0.4% 하락, <mark>코스닥은 0.7% 상승하며 엇갈린 흐름</mark>을 보였습니다. 코스피는 하락했지만 오후 들어 회복세를 나타냈으며, 코스닥은 로봇, 비만 치료제, 스테이블 코인 관련주 강세에 힘입어 상승세를 유지했습니다. <mark>미국 3대 지수 상승 및 반도체 강세</mark> 영향이 있었습니다. 섹터 측면에서 <mark>로봇, 스테이블 코인이 강세</mark>였고 자동차, 증강 현실은 부진했습니다. 단기 과열에 따른 조정 심리도 작용했습니다.",
            },
          },
          quick: [
            "금일 코스피는 0.4% 하락, 코스닥은 0.7% 상승하며 엇갈린 흐름을 보였다. 코스피는 하락했지만 오후 들어 회복세를 나타냈으며, 코스닥은 로봇, 비만 치료제, 스테이블 코인 관련주 강세에 힘입…",
            "KOSPI 3,549.21 93.38p (+2.70%) · 상승.",
            "KOSDAQ 854.25 8.91p (+1.05%) · 상승.",
          ],
        },
        tags: ["반도체", "로봇"],
        investment_strategies: [
          {
            strategy_title: "분산 투자 전략",
            strategy_description:
              "특정 자산에 집중 투자하는 대신, 주식, 채권, 부동산 등 다양한 자산에 분산 투자하여 리스크를 줄이고 안정적인 수익을 추구한다. 자산 배분 비율은 투자자의 투자 성향과 목표에 따라 조정한다. 특히, 변동성이 큰 시장에서는 분산 투자를 통해 안정성을 확보하는 것이 중요하다.",
          },
          {
            strategy_title: "가치 투자 전략",
            strategy_description:
              "기업의 내재 가치에 비해 저평가된 주식을 매수하여 장기적인 수익을 추구한다. 재무제표 분석, 산업 분석 등을 통해 기업의 가치를 평가하고, 성장 가능성이 높은 기업을 선별한다. 단기적인 시장 변동에 흔들리지 않고, 기업의 장기적인 성장 가능성을 믿고 투자하는 것이 중요하다.",
          },
        ],
        stocks: [
          {
            stock_name: "삼성전자",
            ticker: "005930",
            company_description:
              "삼성전자는 한국의 대표적인 전자 기업으로, 반도체, 스마트폰, 디스플레이 등 다양한 전자 제품을 생산·판매한다.  최근 HBM 시장 경쟁 심화 속에서 기술 경쟁력 강화에 힘쓰고 있다.",
            thesis: [
              {
                point:
                  "외국인 투자자들은 9월 한 달 동안 삼성전자 주식을 6조 5천억 원 순매수하며 높은 관심을 보였다.",
              },
              {
                point:
                  "2025년 디램 시장은 HBM을 포함하여 연평균 39% 성장할 것으로 예상되며, ESSD 시장의 성장 또한 기대된다.",
              },
              {
                point:
                  "파운드리 부문에서 테슬라 도조칩 및 애플 CIS 이미지 센서 칩 수주를 통해 실적 개선이 기대된다.",
              },
            ],
            catalysts: [
              {
                item: "HBM3 12단 관련 엔비디아 컬 테스트 통과",
                when: "10월",
              },
            ],
            risks: [
              {
                item: "HBM 시장 경쟁 심화 및 기술 격차 발생 가능성",
              },
            ],
            action_idea: {
              stance: "매수관심",
              reason:
                "HBM 시장 경쟁 심화에도 불구하고, 파운드리 회복 및 메모리 사업부의 견조한 성장세가 기대되므로 긍정적인 관점에서 접근할 필요가 있다.",
            },
            sources: [
              {
                video_id: "-4e4b1g1li8",
                channel_id: "UCw8pcmyPWGSik7bjJpeINlA",
              },
              {
                video_id: "FbPA3vCPygw",
                channel_id: "UCxJ_N3v10n6zLAvVSE7iZug",
              },
              {
                video_id: "XrGjUWSj3tg",
                channel_id: "UCaJdckl6MBdDPDf75Ec_bJA",
              },
            ],
            metrics: {
              market: "KOSPI200",
              currency: "KRW",
              price: 89_000,
              chg_pct: 3.49,
              change_amount: 3_000,
              volume: 49_883_028,
              market_cap: 778_000_000_000,
              per: 17.98,
              pbr: 1.54,
              eps: 4_950,
              bps: 57_930,
              roe_pct: 8.544795442775763,
              sector: "전기·전자",
              range_52w: {
                high_52w: 90_300,
                high_52w_date: "2025-10-02",
                low_52w: 49_900,
                low_52w_date: "2024-11-14",
                from_high_pct: -1.44,
                from_low_pct: 78.36,
                position_pct: 96.78217821782178,
              },
              price_info: {
                current_price: 89_000,
                change_pct: 3.49,
                change_amount: 3_000,
                open: 89_300,
                high: 90_300,
                low: 88_700,
                prev_close: 86_000,
                weighted_avg_price: 89_653.21,
              },
              flows: {
                foreign_ownership_pct: 51.85,
                foreign_net_buy_qty: 19_882_588,
                institution_net_buy_qty: 13_125_873,
                foreign_netbuy_share_pct: 39.858422387670615,
                institution_netbuy_share_pct: 26.313304396838138,
              },
              liquidity: {
                volume: 49_883_028,
                value: 4_472_131_514_922,
                turnover_pct: 0.8426702554663443,
                volume_change_pct: 226.34,
                value_change_pct: null,
              },
              levels: {
                pivot: 85_633,
                r1: 86_566,
                r2: 87_133,
                s1: 85_066,
                s2: 84_133,
                dist_to_resistance_pct: -2.811727468059053,
                dist_to_support_pct: 4.624644393764841,
              },
            },
            metric_insight: {
              metric_kind: "domestic",
              insight_sections: [
                          {
                                      "category": "price_position",
                                      "title": "가격 & 위치",
                                      "summary": "현재가는 52주 고점에 근접한 수준이다.",
                                      "highlights": "현재가 89,000원(+3.49%)이며 52주 고점 대비 -1.44%, 저점 대비 +78.36%로 밴드 상단(96.78%)에 위치합니다."
                          },
                          {
                                      "category": "valuation",
                                      "title": "밸류에이션",
                                      "summary": "수익성 대비 밸류에이션은 보통 수준이다.",
                                      "highlights": "PER 17.98배·PBR 1.54배·ROE 8.54%이며 EPS 4,950원·BPS 57,930원으로 밸류에이션은 무난한 편입니다."
                          },
                          {
                                      "category": "momentum_volatility",
                                      "title": "멘텀 & 단기 변동성",
                                      "summary": "일중 변동성은 크지 않다.",
                                      "highlights": "일중 변동폭 1.79%이며 상한가까지 -20.39%·하한가까지 +47.84%이고 가중평균가 대비 -0.73%로 소폭 하회하고 있습니다."
                          },
                          {
                                      "category": "flows",
                                      "title": "수급(Flows)",
                                      "summary": "외국인과 기관이 동반 순매수했다.",
                                      "highlights": "외국인 지분율 51.85%이며 외국인 순매수 19,882,588주(39.86%)·기관 순매수 13,125,873주(26.31%)로 동반 매수가 유입되었습니다."
                          },
                          {
                                      "category": "liquidity",
                                      "title": "유동성(Liquidity)",
                                      "summary": "유동성은 전일 대비 크게 증가했다.",
                                      "highlights": "거래량 4,988만주·거래대금 약 4.47조원·회전율 0.84%이고 전일 대비 거래량 +226.34%로 유동성이 크게 증가했습니다."
                          },
                          {
                                      "category": "levels",
                                      "title": "기술적 레벨(Levels)",
                                      "summary": "현재가는 피벗 포인트 상단에 위치한다.",
                                      "highlights": "피벗 85,633원 상단에서 거래 중이며 R1 86,566원·R2 87,133원을 상회했고 다음 저항까지 여지 -2.81%, 주요 지지까지 여지 +4.62%입니다."
                          },
                          {
                                      "category": "risk_flags",
                                      "title": "리스크 플래그(Risk Flags)",
                                      "summary": "특별한 리스크 플래그는 없다.",
                                      "highlights": "시장경고코드 '00'으로 경고는 없고 VI 미발동이며 공매도 과열도 없습니다."
                          }
              ],
              comment_title: "코멘트",
              comment_body:
                "최근 삼성전자 주가는 상승세를 보이고 있으며, 52주 최고가에 근접한 89,000원에 거래되고 있다. 외국인과 기관의 동반 순매수가 유입되었고, 거래량 또한 크게 증가했다. <mark>2025년 디램 시장은 HBM을 포함하여 연평균 39% 성장할 것으로 예상</mark>되며, 긍정적인 전망이 주가에 반영되고 있는 것으로 보인다. <mark>파운드리 부문에서 테슬라 도조칩 및 애플 CIS 이미지 센서 칩 수주를 통해 실적 개선이 기대</mark>된다는 점도 투자 심리를 자극하는 요인이다. 전략: 신고가 경신 시도에 따른 변동성 확대에 대비하며, HBM 및 파운드리 관련 모멘텀 지속 여부를 확인합니다.",
            },
          },
          {
            stock_name: "SK하이닉스",
            ticker: "000660",
            company_description:
              "SK하이닉스는 메모리 반도체 전문 기업으로, HBM 시장에서 선두를 달리고 있다.  최근 HBM 생산 능력 확대 및 기술 경쟁력 강화에 집중하고 있다.",
            thesis: [
              {
                point:
                  "외국인 투자자들은 9월 한 달 동안 SK하이닉스 주식을 1조 8천억 원 순매수하며 높은 관심을 보였다.",
              },
              {
                point:
                  "HBM 시장은 2025년에도 성장세를 이어갈 것으로 예상되며, SK하이닉스는 HBM 시장에서 선두를 유지할 것으로 기대된다.",
              },
              {
                point:
                  "엔비디아의 HBM 전수 검사 요구로 인해 HBM 검사 장비 수요가 증가할 것으로 예상되며, 이는 SK하이닉스에 긍정적인 영향을 미칠 수 있다.",
              },
            ],
            catalysts: [
              {
                item: "SK하이닉스, HBM 관련 테크윙의 SK하이닉스 납품 임박",
                when: "9월",
              },
            ],
            risks: [
              {
                item: "HBM 시장 경쟁 심화 및 삼성전자 등 경쟁사들의 추격",
              },
            ],
            action_idea: {
              stance: "보유",
              reason:
                "HBM 시장에서의 경쟁 심화 가능성이 존재하지만, 여전히 HBM 시장을 선도하고 있으며, 엔비디아의 전수 검사 요구에 따른 수혜가 예상되므로 보유하는 것이 유리하다.",
            },
            sources: [
              {
                video_id: "-Xg1Kbu0JG0",
                channel_id: "UC9OdxrtKsOxQCXpjNmaRMsw",
              },
              {
                video_id: "FbPA3vCPygw",
                channel_id: "UCxJ_N3v10n6zLAvVSE7iZug",
              },
              {
                video_id: "XrGjUWSj3tg",
                channel_id: "UCaJdckl6MBdDPDf75Ec_bJA",
              },
            ],
            metrics: {
              market: "KOSPI200",
              currency: "KRW",
              price: 395_500,
              chg_pct: 9.86,
              change_amount: 35_500,
              volume: 7_430_763,
              market_cap: 3_657_700_000_000,
              per: 14.55,
              pbr: 3.78,
              eps: 27_182,
              bps: 104_567,
              roe_pct: 25.994816720380236,
              sector: "전기·전자",
              range_52w: {
                high_52w: 404_500,
                high_52w_date: "2025-10-02",
                low_52w: 157_600,
                low_52w_date: "2024-11-29",
                from_high_pct: -2.22,
                from_low_pct: 150.95,
                position_pct: 96.35479951397326,
              },
              price_info: {
                current_price: 395_500,
                change_pct: 9.86,
                change_amount: 35_500,
                open: 388_500,
                high: 404_500,
                low: 384_000,
                prev_close: 360_000,
                weighted_avg_price: 396_307.15,
              },
              flows: {
                foreign_ownership_pct: 55.64,
                foreign_net_buy_qty: 1_174_010,
                institution_net_buy_qty: 705_327,
                foreign_netbuy_share_pct: 15.799319666096201,
                institution_netbuy_share_pct: 9.491986219988444,
              },
              liquidity: {
                volume: 7_430_763,
                value: 2_944_922_514_970,
                turnover_pct: 1.0207058874046377,
                volume_change_pct: 265.15,
                value_change_pct: null,
              },
              levels: {
                pivot: 357_666,
                r1: 364_332,
                r2: 368_666,
                s1: 353_332,
                s2: 346_666,
                dist_to_resistance_pct: -8.554834601407507,
                dist_to_support_pct: 11.934384658055313,
              },
            },
            metric_insight: {
              metric_kind: "domestic",
              insight_sections: [
                          {
                                      "category": "price_position",
                                      "title": "가격 & 위치",
                                      "summary": "현재가는 52주 고점에 근접한 수준이다.",
                                      "highlights": "현재가 89,000원(+3.49%)이며 52주 고점 대비 -1.44%, 저점 대비 +78.36%로 밴드 상단(96.78%)에 위치합니다."
                          },
                          {
                                      "category": "valuation",
                                      "title": "밸류에이션",
                                      "summary": "수익성 대비 밸류에이션은 보통 수준이다.",
                                      "highlights": "PER 17.98배·PBR 1.54배·ROE 8.54%이며 EPS 4,950원·BPS 57,930원으로 밸류에이션은 무난한 편입니다."
                          },
                          {
                                      "category": "momentum_volatility",
                                      "title": "멘텀 & 단기 변동성",
                                      "summary": "일중 변동성은 크지 않다.",
                                      "highlights": "일중 변동폭 1.79%이며 상한가까지 -20.39%·하한가까지 +47.84%이고 가중평균가 대비 -0.73%로 소폭 하회하고 있습니다."
                          },
                          {
                                      "category": "flows",
                                      "title": "수급(Flows)",
                                      "summary": "외국인과 기관이 동반 순매수했다.",
                                      "highlights": "외국인 지분율 51.85%이며 외국인 순매수 19,882,588주(39.86%)·기관 순매수 13,125,873주(26.31%)로 동반 매수가 유입되었습니다."
                          },
                          {
                                      "category": "liquidity",
                                      "title": "유동성(Liquidity)",
                                      "summary": "유동성은 전일 대비 크게 증가했다.",
                                      "highlights": "거래량 4,988만주·거래대금 약 4.47조원·회전율 0.84%이고 전일 대비 거래량 +226.34%로 유동성이 크게 증가했습니다."
                          },
                          {
                                      "category": "levels",
                                      "title": "기술적 레벨(Levels)",
                                      "summary": "현재가는 피벗 포인트 상단에 위치한다.",
                                      "highlights": "피벗 85,633원 상단에서 거래 중이며 R1 86,566원·R2 87,133원을 상회했고 다음 저항까지 여지 -2.81%, 주요 지지까지 여지 +4.62%입니다."
                          },
                          {
                                      "category": "risk_flags",
                                      "title": "리스크 플래그(Risk Flags)",
                                      "summary": "특별한 리스크 플래그는 없다.",
                                      "highlights": "시장경고코드 '00'으로 경고는 없고 VI 미발동이며 공매도 과열도 없습니다."
                          }
              ],
              comment_title: "코멘트",
              comment_body:
                "SK하이닉스는 HBM 시장의 선두 주자로서 <mark>최근 주가는 52주 최고가에 근접하며 강세를 보이고 있습니다</mark>. 외국인과 기관의 동반 순매수가 유입되며 수급 또한 긍정적이며, 거래량 급증으로 유동성도 풍부한 상황입니다. <mark>엔비디아의 HBM 전수 검사 요구로 인해 HBM 검사 장비 수요 증가가 예상</mark>되며, 이는 SK하이닉스에 긍정적인 영향을 미칠 수 있습니다. 밸류에이션은 PER 14.55배, PBR 3.78배로 적정 수준으로 판단됩니다. 전략: 신고가 경신 흐름을 이어갈지, 40만원 저항선 돌파 여부를 확인합니다.",
            },
          },
          {
            stock_name: "현대로템",
            ticker: "064350",
            company_description:
              "현대로템은 철도 차량, 방산 제품 등을 생산하는 기업이다. 최근 방산 부문에서 해외 수주가 증가하고 있으며, 철도 부문에서도 미국 시장 진출을 확대하고 있다.",
            thesis: [
              {
                point: "최근 한 달 동안 기관과 외국인의 꾸준한 순매수가 이어지고 있다.",
              },
              {
                point:
                  "미국에 철도 전장품 공장을 준공하여 미국 철도 시장 진출을 본격화할 것으로 기대된다.",
              },
              {
                point:
                  "최근 방산 관련주로 인식되고 있으나, 과거 철도 관련주로서의 면모도 갖추고 있어 남북 관계 개선 시 수혜를 기대할 수 있다.",
              },
            ],
            catalysts: [
              {
                item: "미국 철도 전장품 공장 준공",
                when: "근거 부족",
              },
            ],
            risks: [
              {
                item: "방산 관련 지정학적 리스크",
              },
            ],
            action_idea: {
              stance: "보유",
              reason:
                "방산 부문의 성장과 더불어 미국 철도 시장 진출 확대를 통해 추가적인 성장 동력을 확보할 수 있을 것으로 예상되므로 긍정적인 관점에서 보유하는 것이 좋다.",
            },
            sources: [
              {
                video_id: "FbPA3vCPygw",
                channel_id: "UCxJ_N3v10n6zLAvVSE7iZug",
              },
            ],
            metrics: {
              market: "KOSPI200",
              currency: "KRW",
              price: 226_000,
              chg_pct: 1.57,
              change_amount: 3_500,
              volume: 917_380,
              market_cap: 545_700_000_000,
              per: 60.62,
              pbr: 12.06,
              eps: 3_728,
              bps: 18_737,
              roe_pct: 19.89646154667236,
              sector: "운송장비·부품",
              range_52w: {
                high_52w: 233_500,
                high_52w_date: "2025-09-24",
                low_52w: 43_650,
                low_52w_date: "2024-12-10",
                from_high_pct: -3.21,
                from_low_pct: 417.75,
                position_pct: 96.04951277324203,
              },
              price_info: {
                current_price: 226_000,
                change_pct: 1.57,
                change_amount: 3_500,
                open: 223_500,
                high: 228_000,
                low: 218_000,
                prev_close: 222_500,
                weighted_avg_price: 224_433.85,
              },
              flows: {
                foreign_ownership_pct: 32.99,
                foreign_net_buy_qty: 211_423,
                institution_net_buy_qty: 94_057,
                foreign_netbuy_share_pct: 23.04639298872877,
                institution_netbuy_share_pct: 10.252785105408883,
              },
              liquidity: {
                volume: 917_380,
                value: 205_892_093_236,
                turnover_pct: 0.8405357582142791,
                volume_change_pct: 195.32,
                value_change_pct: null,
              },
              levels: {
                pivot: 221_666,
                r1: 225_332,
                r2: 228_166,
                s1: 218_832,
                s2: 215_166,
                dist_to_resistance_pct: -0.2964514582926526,
                dist_to_support_pct: 3.2755721283907286,
              },
            },
            metric_insight: {
              metric_kind: "domestic",
              insight_sections: [
                          {
                                      "category": "price_position",
                                      "title": "가격 & 위치",
                                      "summary": "현재가는 52주 고점에 근접한 수준이다.",
                                      "highlights": "현재가 89,000원(+3.49%)이며 52주 고점 대비 -1.44%, 저점 대비 +78.36%로 밴드 상단(96.78%)에 위치합니다."
                          },
                          {
                                      "category": "valuation",
                                      "title": "밸류에이션",
                                      "summary": "수익성 대비 밸류에이션은 보통 수준이다.",
                                      "highlights": "PER 17.98배·PBR 1.54배·ROE 8.54%이며 EPS 4,950원·BPS 57,930원으로 밸류에이션은 무난한 편입니다."
                          },
                          {
                                      "category": "momentum_volatility",
                                      "title": "멘텀 & 단기 변동성",
                                      "summary": "일중 변동성은 크지 않다.",
                                      "highlights": "일중 변동폭 1.79%이며 상한가까지 -20.39%·하한가까지 +47.84%이고 가중평균가 대비 -0.73%로 소폭 하회하고 있습니다."
                          },
                          {
                                      "category": "flows",
                                      "title": "수급(Flows)",
                                      "summary": "외국인과 기관이 동반 순매수했다.",
                                      "highlights": "외국인 지분율 51.85%이며 외국인 순매수 19,882,588주(39.86%)·기관 순매수 13,125,873주(26.31%)로 동반 매수가 유입되었습니다."
                          },
                          {
                                      "category": "liquidity",
                                      "title": "유동성(Liquidity)",
                                      "summary": "유동성은 전일 대비 크게 증가했다.",
                                      "highlights": "거래량 4,988만주·거래대금 약 4.47조원·회전율 0.84%이고 전일 대비 거래량 +226.34%로 유동성이 크게 증가했습니다."
                          },
                          {
                                      "category": "levels",
                                      "title": "기술적 레벨(Levels)",
                                      "summary": "현재가는 피벗 포인트 상단에 위치한다.",
                                      "highlights": "피벗 85,633원 상단에서 거래 중이며 R1 86,566원·R2 87,133원을 상회했고 다음 저항까지 여지 -2.81%, 주요 지지까지 여지 +4.62%입니다."
                          },
                          {
                                      "category": "risk_flags",
                                      "title": "리스크 플래그(Risk Flags)",
                                      "summary": "특별한 리스크 플래그는 없다.",
                                      "highlights": "시장경고코드 '00'으로 경고는 없고 VI 미발동이며 공매도 과열도 없습니다."
                          }
              ],
              comment_title: "코멘트",
              comment_body:
                "현대로템은 철도 차량 및 방산 제품을 생산하는 기업으로, 최근 기관과 외국인의 순매수가 이어지고 있습니다. <mark>미국 철도 전장품 공장 준공을 통해 미국 철도 시장 진출을 본격화할 것으로 기대</mark>되며, 방산 부문의 해외 수주 증가도 긍정적입니다. 과거 철도 관련주로서 남북 관계 개선 시 수혜를 기대할 수 있다는 점도 투자 포인트입니다. 다만, 높은 밸류에이션은 부담 요인으로 작용할 수 있습니다. 전략: 52주 신고가 경신 시도에 따른 밸류에이션 부담을 점검합니다.",
            },
          },
          {
            stock_name: "카카오",
            ticker: "035720",
            company_description:
              "카카오는 한국의 대표적인 IT 기업으로, 카카오톡, 카카오페이, 카카오모빌리티 등 다양한 플랫폼 서비스를 제공한다. 최근 AI 기술을 활용한 카카오톡 개편을 준비 중이다.",
            thesis: [
              {
                point: "최근 기관과 외국인의 양매수세가 유입되고 있다.",
              },
              {
                point:
                  "다음 주 화요일 채 GPT를 활용한 카톡 개편 발표 예정으로 기대감이 형성되고 있다.",
              },
              {
                point: "지속적으로 저점이 높아지고 있어 긍정적인 흐름을 보이고 있다.",
              },
            ],
            catalysts: [
              {
                item: "카카오, 채 GPT 활용 카톡 개편 발표",
                when: "다음 주 화요일",
              },
            ],
            risks: [
              {
                item: "66,000원 부근의 저항선 돌파 실패 시 매물 부담 발생 가능성",
              },
            ],
            action_idea: {
              stance: "관망",
              reason:
                "다음 주 카톡 개편 발표에 대한 기대감이 존재하지만, 66,000원 부근의 저항선 돌파 여부에 따라 추가적인 상승 가능성이 결정될 수 있으므로 신중하게 접근하는 것이 좋다.",
            },
            sources: [
              {
                video_id: "-4e4b1g1li8",
                channel_id: "UCw8pcmyPWGSik7bjJpeINlA",
              },
              {
                video_id: "FbPA3vCPygw",
                channel_id: "UCxJ_N3v10n6zLAvVSE7iZug",
              },
            ],
            metrics: {
              market: "KOSPI200",
              currency: "KRW",
              price: 59_600,
              chg_pct: -0.67,
              change_amount: -400,
              volume: 2_321_148,
              market_cap: 44_300_000_000,
              per: 480.65,
              pbr: 2.61,
              eps: 124,
              bps: 22_860,
              roe_pct: 0.5424321959755031,
              sector: "IT 서비스",
              range_52w: {
                high_52w: 71_600,
                high_52w_date: "2025-06-24",
                low_52w: 32_550,
                low_52w_date: "2024-11-14",
                from_high_pct: -16.76,
                from_low_pct: 83.1,
                position_pct: 69.27016645326505,
              },
              price_info: {
                current_price: 59_600,
                change_pct: -0.67,
                change_amount: -400,
                open: 60_400,
                high: 60_800,
                low: 59_600,
                prev_close: 60_000,
                weighted_avg_price: 60_024.28,
              },
              flows: {
                foreign_ownership_pct: 29.66,
                foreign_net_buy_qty: 227_381,
                institution_net_buy_qty: 13_679,
                foreign_netbuy_share_pct: 9.796057812771956,
                institution_netbuy_share_pct: 0.5893204569463042,
              },
              liquidity: {
                volume: 2_321_148,
                value: 139_325_190_250,
                turnover_pct: 0.5248194787545378,
                volume_change_pct: 141.14,
                value_change_pct: null,
              },
              levels: {
                pivot: 60_300,
                r1: 60_800,
                r2: 61_600,
                s1: 59_500,
                s2: 59_000,
                dist_to_resistance_pct: 1.9736842105263157,
                dist_to_support_pct: 0.16806722689075632,
              },
            },
            metric_insight: {
              metric_kind: "domestic",
              insight_sections: [
                          {
                                      "category": "price_position",
                                      "title": "가격 & 위치",
                                      "summary": "현재가는 52주 고점에 근접한 수준이다.",
                                      "highlights": "현재가 89,000원(+3.49%)이며 52주 고점 대비 -1.44%, 저점 대비 +78.36%로 밴드 상단(96.78%)에 위치합니다."
                          },
                          {
                                      "category": "valuation",
                                      "title": "밸류에이션",
                                      "summary": "수익성 대비 밸류에이션은 보통 수준이다.",
                                      "highlights": "PER 17.98배·PBR 1.54배·ROE 8.54%이며 EPS 4,950원·BPS 57,930원으로 밸류에이션은 무난한 편입니다."
                          },
                          {
                                      "category": "momentum_volatility",
                                      "title": "멘텀 & 단기 변동성",
                                      "summary": "일중 변동성은 크지 않다.",
                                      "highlights": "일중 변동폭 1.79%이며 상한가까지 -20.39%·하한가까지 +47.84%이고 가중평균가 대비 -0.73%로 소폭 하회하고 있습니다."
                          },
                          {
                                      "category": "flows",
                                      "title": "수급(Flows)",
                                      "summary": "외국인과 기관이 동반 순매수했다.",
                                      "highlights": "외국인 지분율 51.85%이며 외국인 순매수 19,882,588주(39.86%)·기관 순매수 13,125,873주(26.31%)로 동반 매수가 유입되었습니다."
                          },
                          {
                                      "category": "liquidity",
                                      "title": "유동성(Liquidity)",
                                      "summary": "유동성은 전일 대비 크게 증가했다.",
                                      "highlights": "거래량 4,988만주·거래대금 약 4.47조원·회전율 0.84%이고 전일 대비 거래량 +226.34%로 유동성이 크게 증가했습니다."
                          },
                          {
                                      "category": "levels",
                                      "title": "기술적 레벨(Levels)",
                                      "summary": "현재가는 피벗 포인트 상단에 위치한다.",
                                      "highlights": "피벗 85,633원 상단에서 거래 중이며 R1 86,566원·R2 87,133원을 상회했고 다음 저항까지 여지 -2.81%, 주요 지지까지 여지 +4.62%입니다."
                          },
                          {
                                      "category": "risk_flags",
                                      "title": "리스크 플래그(Risk Flags)",
                                      "summary": "특별한 리스크 플래그는 없다.",
                                      "highlights": "시장경고코드 '00'으로 경고는 없고 VI 미발동이며 공매도 과열도 없습니다."
                          }
              ],
              comment_title: "코멘트",
              comment_body:
                "현재 카카오는 59,600원(-0.67%)에 거래되고 있으며, 52주 최고가 대비 -16.76% 하락한 가격에 위치하고 있습니다. 외국인과 기관의 동반 매수세가 유입되며 수급은 긍정적이지만, PER이 480.65배로 밸류에이션 부담이 있습니다. <mark>다음 주 화요일 채 GPT를 활용한 카톡 개편 발표 예정으로 기대감이 형성</mark>되고 있으며, <mark>지속적으로 저점이 높아지고 있어 긍정적인 흐름</mark>을 보이고 있습니다. 66,000원 부근의 저항선 돌파 여부가 중요하며, 돌파 실패 시 매물 부담이 발생할 수 있습니다. 전략: 다음 주 카톡 개편 발표를 앞두고 변동성에 유의하며, 저항선 돌파 여부를 확인합니다.",
            },
          },
          {
            stock_name: "홈캐스트",
            ticker: "064240",
            company_description:
              "단날은 모바일 결제 전문 기업으로, 휴대폰 소액 결제, 온라인 간편 결제, 해외 결제 서비스를 제공한다. 최근 해킹 사건 증가에 따른 보안 강화 기대감에 상승세를 보이고 있다.",
            thesis: [
              {
                point:
                  "최근 KT, 롯데카드 등 해킹 사건 발생으로 보안에 대한 인식이 높아지면서 안전하고 신뢰 가능한 결제 시스템에 대한 관심이 증가하고 있다.",
              },
              {
                point: "스테이블 코인 관련주로 분류되어, 스테이블 코인 도입 확대 시 수혜를 받을 것으로 기대된다.",
              },
              {
                point:
                  "9월 19일 거래대금 상위 종목 4위를 기록하며 22% 급등했다.",
              },
            ],
            risks: [
              {
                item: "스테이블 코인 관련 정책 변화",
              },
            ],
            action_idea: {
              stance: "관망",
              reason:
                "해킹 사건 증가 및 스테이블 코인 도입 기대감으로 상승세를 보이고 있지만, 스테이블 코인 관련 정책 변화에 따라 변동성이 커질 수 있으므로 신중하게 접근하는 것이 좋다.",
            },
            sources: [
              {
                video_id: "-4e4b1g1li8",
                channel_id: "UCw8pcmyPWGSik7bjJpeINlA",
              },
              {
                video_id: "FbPA3vCPygw",
                channel_id: "UCxJ_N3v10n6zLAvVSE7iZug",
              },
            ],
            metrics: {
              market: "KOSDAQ",
              currency: "KRW",
              price: 2_095,
              chg_pct: -0.24,
              change_amount: -5,
              volume: 61_179,
              market_cap: 17_800_000_000,
              per: 83.8,
              pbr: 0.84,
              eps: 25,
              bps: 2_500,
              roe_pct: 1,
              sector: "유통",
              range_52w: {
                high_52w: 3_205,
                high_52w_date: "2025-04-16",
                low_52w: 1_700,
                low_52w_date: "2025-02-19",
                from_high_pct: -34.63,
                from_low_pct: 23.24,
                position_pct: 26.245847176079735,
              },
              price_info: {
                current_price: 2_095,
                change_pct: -0.24,
                change_amount: -5,
                open: 2_095,
                high: 2_180,
                low: 2_095,
                prev_close: 2_100,
                weighted_avg_price: 2_123.29,
              },
              flows: {
                foreign_ownership_pct: 1.76,
                foreign_net_buy_qty: 4_261,
                institution_net_buy_qty: 2_635,
                foreign_netbuy_share_pct: 6.964808185815394,
                institution_netbuy_share_pct: 4.307033459193514,
              },
              liquidity: {
                volume: 61_179,
                value: 129_898_070,
                turnover_pct: 0.17460750912466153,
                volume_change_pct: 75.7,
                value_change_pct: null,
              },
              levels: {
                pivot: 2_095,
                r1: 2_150,
                r2: 2_200,
                s1: 2_045,
                s2: 1_990,
                dist_to_resistance_pct: 2.558139534883721,
                dist_to_support_pct: 2.444987775061125,
              },
            },
            metric_insight: {
              metric_kind: "domestic",
              insight_sections: [
                          {
                                      "category": "price_position",
                                      "title": "가격 & 위치",
                                      "summary": "현재가는 52주 고점에 근접한 수준이다.",
                                      "highlights": "현재가 89,000원(+3.49%)이며 52주 고점 대비 -1.44%, 저점 대비 +78.36%로 밴드 상단(96.78%)에 위치합니다."
                          },
                          {
                                      "category": "valuation",
                                      "title": "밸류에이션",
                                      "summary": "수익성 대비 밸류에이션은 보통 수준이다.",
                                      "highlights": "PER 17.98배·PBR 1.54배·ROE 8.54%이며 EPS 4,950원·BPS 57,930원으로 밸류에이션은 무난한 편입니다."
                          },
                          {
                                      "category": "momentum_volatility",
                                      "title": "멘텀 & 단기 변동성",
                                      "summary": "일중 변동성은 크지 않다.",
                                      "highlights": "일중 변동폭 1.79%이며 상한가까지 -20.39%·하한가까지 +47.84%이고 가중평균가 대비 -0.73%로 소폭 하회하고 있습니다."
                          },
                          {
                                      "category": "flows",
                                      "title": "수급(Flows)",
                                      "summary": "외국인과 기관이 동반 순매수했다.",
                                      "highlights": "외국인 지분율 51.85%이며 외국인 순매수 19,882,588주(39.86%)·기관 순매수 13,125,873주(26.31%)로 동반 매수가 유입되었습니다."
                          },
                          {
                                      "category": "liquidity",
                                      "title": "유동성(Liquidity)",
                                      "summary": "유동성은 전일 대비 크게 증가했다.",
                                      "highlights": "거래량 4,988만주·거래대금 약 4.47조원·회전율 0.84%이고 전일 대비 거래량 +226.34%로 유동성이 크게 증가했습니다."
                          },
                          {
                                      "category": "levels",
                                      "title": "기술적 레벨(Levels)",
                                      "summary": "현재가는 피벗 포인트 상단에 위치한다.",
                                      "highlights": "피벗 85,633원 상단에서 거래 중이며 R1 86,566원·R2 87,133원을 상회했고 다음 저항까지 여지 -2.81%, 주요 지지까지 여지 +4.62%입니다."
                          },
                          {
                                      "category": "risk_flags",
                                      "title": "리스크 플래그(Risk Flags)",
                                      "summary": "특별한 리스크 플래그는 없다.",
                                      "highlights": "시장경고코드 '00'으로 경고는 없고 VI 미발동이며 공매도 과열도 없습니다."
                          }
              ],
              comment_title: "코멘트",
              comment_body:
                "홈캐스트는 모바일 결제 전문 기업으로, 최근 해킹 사건 증가에 따른 보안 강화 기대감에 상승세를 보이고 있다. <mark>최근 KT, 롯데카드 등 해킹 사건 발생으로 보안에 대한 인식이 높아지면서 안전하고 신뢰 가능한 결제 시스템에 대한 관심이 증가</mark>하고 있다. 현재가는 2,095원이며 52주 고점 대비 -34.63% 수준이다. 외국인과 기관은 순매수를 보이며 수급은 긍정적이다. 전략: 보안 이슈 부각에 따른 수혜 기대감을 유지하며, 기술적 지지선을 확인한다.",
            },
          },
          {
            stock_name: "유진테크",
            ticker: "084370",
            company_description:
              "유진테크는 반도체 박막 공정 장비 제조 기업으로, 국내에서 유일하게 해당 장비를 생산하고 있다.  최근 반도체 업황 회복 및 설비 투자 확대로 수혜를 받을 것으로 기대된다.",
            thesis: [
              {
                point: "반도체 소부장 온기 확산에 따른 수혜 기대",
              },
              {
                point: "전공정 장비 경쟁력 확보",
              },
              {
                point: "국내 유일 박막 공정 장비 제조 기업",
              },
            ],
            risks: [
              {
                item: "반도체 업황 변동성",
              },
            ],
            action_idea: {
              stance: "매수관심",
              reason:
                "반도체 업황 회복 및 설비 투자 확대에 따른 수혜가 기대되며, 국내 유일의 박막 공정 장비 제조 기업으로서의 경쟁력을 바탕으로 성장할 것으로 예상된다.",
            },
            sources: [
              {
                video_id: "-Xg1Kbu0JG0",
                channel_id: "UC9OdxrtKsOxQCXpjNmaRMsw",
              },
            ],
            metrics: {
              market: "KSQ150",
              currency: "KRW",
              price: 77_200,
              chg_pct: 6.48,
              change_amount: 4_700,
              volume: 448_970,
              market_cap: 11_500_000_000,
              per: 27.96,
              pbr: 4.23,
              eps: 2_761,
              bps: 18_272,
              roe_pct: 15.110551663747811,
              sector: "기계·장비",
              range_52w: {
                high_52w: 79_600,
                high_52w_date: "2025-10-02",
                low_52w: 30_300,
                low_52w_date: "2024-12-20",
                from_high_pct: -3.02,
                from_low_pct: 154.79,
                position_pct: 95.131845841785,
              },
              price_info: {
                current_price: 77_200,
                change_pct: 6.48,
                change_amount: 4_700,
                open: 74_600,
                high: 79_600,
                low: 74_300,
                prev_close: 72_500,
                weighted_avg_price: 77_208.84,
              },
              flows: {
                foreign_ownership_pct: 33.43,
                foreign_net_buy_qty: 20_574,
                institution_net_buy_qty: 39_855,
                foreign_netbuy_share_pct: 4.582488807715437,
                institution_netbuy_share_pct: 8.87698509922712,
              },
              liquidity: {
                volume: 448_970,
                value: 34_664_447_400,
                turnover_pct: 1.9591952222814044,
                volume_change_pct: 195.82,
                value_change_pct: null,
              },
              levels: {
                pivot: 72_200,
                r1: 73_500,
                r2: 74_500,
                s1: 71_200,
                s2: 69_900,
                dist_to_resistance_pct: -5.034013605442176,
                dist_to_support_pct: 8.426966292134832,
              },
            },
            metric_insight: {
              metric_kind: "domestic",
              insight_sections: [
                          {
                                      "category": "price_position",
                                      "title": "가격 & 위치",
                                      "summary": "현재가는 52주 고점에 근접한 수준이다.",
                                      "highlights": "현재가 89,000원(+3.49%)이며 52주 고점 대비 -1.44%, 저점 대비 +78.36%로 밴드 상단(96.78%)에 위치합니다."
                          },
                          {
                                      "category": "valuation",
                                      "title": "밸류에이션",
                                      "summary": "수익성 대비 밸류에이션은 보통 수준이다.",
                                      "highlights": "PER 17.98배·PBR 1.54배·ROE 8.54%이며 EPS 4,950원·BPS 57,930원으로 밸류에이션은 무난한 편입니다."
                          },
                          {
                                      "category": "momentum_volatility",
                                      "title": "멘텀 & 단기 변동성",
                                      "summary": "일중 변동성은 크지 않다.",
                                      "highlights": "일중 변동폭 1.79%이며 상한가까지 -20.39%·하한가까지 +47.84%이고 가중평균가 대비 -0.73%로 소폭 하회하고 있습니다."
                          },
                          {
                                      "category": "flows",
                                      "title": "수급(Flows)",
                                      "summary": "외국인과 기관이 동반 순매수했다.",
                                      "highlights": "외국인 지분율 51.85%이며 외국인 순매수 19,882,588주(39.86%)·기관 순매수 13,125,873주(26.31%)로 동반 매수가 유입되었습니다."
                          },
                          {
                                      "category": "liquidity",
                                      "title": "유동성(Liquidity)",
                                      "summary": "유동성은 전일 대비 크게 증가했다.",
                                      "highlights": "거래량 4,988만주·거래대금 약 4.47조원·회전율 0.84%이고 전일 대비 거래량 +226.34%로 유동성이 크게 증가했습니다."
                          },
                          {
                                      "category": "levels",
                                      "title": "기술적 레벨(Levels)",
                                      "summary": "현재가는 피벗 포인트 상단에 위치한다.",
                                      "highlights": "피벗 85,633원 상단에서 거래 중이며 R1 86,566원·R2 87,133원을 상회했고 다음 저항까지 여지 -2.81%, 주요 지지까지 여지 +4.62%입니다."
                          },
                          {
                                      "category": "risk_flags",
                                      "title": "리스크 플래그(Risk Flags)",
                                      "summary": "특별한 리스크 플래그는 없다.",
                                      "highlights": "시장경고코드 '00'으로 경고는 없고 VI 미발동이며 공매도 과열도 없습니다."
                          }
              ],
              comment_title: "코멘트",
              comment_body:
                "유진테크는 반도체 박막 공정 장비 제조 기업으로, 현재 52주 고점 대비 -3.02% 하락한 77,200원에 거래되고 있다. 외국인과 기관의 동반 순매수가 유입되며 수급이 개선되었고, 거래량 또한 전일 대비 +195.82% 급증하며 유동성이 증가했다. <mark>반도체 소부장 온기 확산에 따른 수혜 기대감이 주가에 반영</mark>되고 있는 것으로 보인다. <mark>국내 유일 박막 공정 장비 제조 기업으로서의 경쟁력</mark>을 바탕으로 추가적인 성장도 기대해볼 수 있다. 전략: 반도체 업황 개선에 따른 실적 개선 기대감을 바탕으로 밸류에이션 매력도를 주시합니다.",
            },
          },
          {
            stock_name: "테크윙",
            ticker: "089030",
            company_description:
              "테크윙은 반도체 검사 장비 제조 기업으로, HBM 검사 장비 시장에서 경쟁력을 확보하고 있다.  최근 SK하이닉스에 HBM 검사 장비 납품이 임박하면서 성장 기대감이 높아지고 있다.",
            thesis: [
              {
                point: "HBM 시장 성장 지속 전망",
              },
              {
                point: "SK하이닉스 HBM 검사 장비 납품 임박",
              },
              {
                point: "엔비디아 HBM 전수 검사 요구에 따른 수혜",
              },
            ],
            catalysts: [
              {
                item: "SK하이닉스 HBM 검사 장비 납품",
                when: "9월",
              },
            ],
            risks: [
              {
                item: "HBM 시장 경쟁 심화",
              },
            ],
            action_idea: {
              stance: "매수관심",
              reason:
                "HBM 시장 성장 및 SK하이닉스 납품을 통해 실적 개선이 기대되며, 엔비디아의 전수 검사 요구에 따른 수혜 또한 예상되므로 긍정적인 관점에서 접근할 필요가 있다.",
            },
            sources: [
              {
                video_id: "-Xg1Kbu0JG0",
                channel_id: "UC9OdxrtKsOxQCXpjNmaRMsw",
              },
            ],
            metrics: {
              market: "KSQ150",
              currency: "KRW",
              price: 61_000,
              chg_pct: 2.52,
              change_amount: 1_500,
              volume: 1_395_149,
              market_cap: 19_000_000_000,
              per: -109.12,
              pbr: 11.11,
              eps: -559,
              bps: 5_489,
              roe_pct: -10.184004372381125,
              sector: "기계·장비",
              range_52w: {
                high_52w: 64_600,
                high_52w_date: "2025-10-02",
                low_52w: 26_050,
                low_52w_date: "2025-08-04",
                from_high_pct: -5.57,
                from_low_pct: 134.17,
                position_pct: 90.6614785992218,
              },
              price_info: {
                current_price: 61_000,
                change_pct: 2.52,
                change_amount: 1_500,
                open: 62_000,
                high: 64_600,
                low: 59_800,
                prev_close: 59_500,
                weighted_avg_price: 62_549.47,
              },
              flows: {
                foreign_ownership_pct: 10.36,
                foreign_net_buy_qty: -145_784,
                institution_net_buy_qty: -139_930,
                foreign_netbuy_share_pct: -10.449349854388313,
                institution_netbuy_share_pct: -10.029753094472346,
              },
              liquidity: {
                volume: 1_395_149,
                value: 87_265_603_250,
                turnover_pct: 3.7349741906044245,
                volume_change_pct: 168.45,
                value_change_pct: null,
              },
              levels: {
                pivot: 59_366,
                r1: 60_532,
                r2: 61_566,
                s1: 58_332,
                s2: 57_166,
                dist_to_resistance_pct: -0.773144782924734,
                dist_to_support_pct: 4.573818830144689,
              },
            },
            metric_insight: {
              metric_kind: "domestic",
              insight_sections: [
                          {
                                      "category": "price_position",
                                      "title": "가격 & 위치",
                                      "summary": "현재가는 52주 고점에 근접한 수준이다.",
                                      "highlights": "현재가 89,000원(+3.49%)이며 52주 고점 대비 -1.44%, 저점 대비 +78.36%로 밴드 상단(96.78%)에 위치합니다."
                          },
                          {
                                      "category": "valuation",
                                      "title": "밸류에이션",
                                      "summary": "수익성 대비 밸류에이션은 보통 수준이다.",
                                      "highlights": "PER 17.98배·PBR 1.54배·ROE 8.54%이며 EPS 4,950원·BPS 57,930원으로 밸류에이션은 무난한 편입니다."
                          },
                          {
                                      "category": "momentum_volatility",
                                      "title": "멘텀 & 단기 변동성",
                                      "summary": "일중 변동성은 크지 않다.",
                                      "highlights": "일중 변동폭 1.79%이며 상한가까지 -20.39%·하한가까지 +47.84%이고 가중평균가 대비 -0.73%로 소폭 하회하고 있습니다."
                          },
                          {
                                      "category": "flows",
                                      "title": "수급(Flows)",
                                      "summary": "외국인과 기관이 동반 순매수했다.",
                                      "highlights": "외국인 지분율 51.85%이며 외국인 순매수 19,882,588주(39.86%)·기관 순매수 13,125,873주(26.31%)로 동반 매수가 유입되었습니다."
                          },
                          {
                                      "category": "liquidity",
                                      "title": "유동성(Liquidity)",
                                      "summary": "유동성은 전일 대비 크게 증가했다.",
                                      "highlights": "거래량 4,988만주·거래대금 약 4.47조원·회전율 0.84%이고 전일 대비 거래량 +226.34%로 유동성이 크게 증가했습니다."
                          },
                          {
                                      "category": "levels",
                                      "title": "기술적 레벨(Levels)",
                                      "summary": "현재가는 피벗 포인트 상단에 위치한다.",
                                      "highlights": "피벗 85,633원 상단에서 거래 중이며 R1 86,566원·R2 87,133원을 상회했고 다음 저항까지 여지 -2.81%, 주요 지지까지 여지 +4.62%입니다."
                          },
                          {
                                      "category": "risk_flags",
                                      "title": "리스크 플래그(Risk Flags)",
                                      "summary": "특별한 리스크 플래그는 없다.",
                                      "highlights": "시장경고코드 '00'으로 경고는 없고 VI 미발동이며 공매도 과열도 없습니다."
                          }
              ],
              comment_title: "코멘트",
              comment_body:
                "테크윙은 HBM 검사 장비 시장에서의 성장 기대감으로 주가가 상승세를 보이고 있다. 현재 주가는 52주 최고가에 근접해 있으며, 외국인과 기관은 순매도하고 있지만 거래량은 크게 증가했다. <mark>SK하이닉스 HBM 검사 장비 납품 임박</mark>과 <mark>엔비디아 HBM 전수 검사 요구에 따른 수혜</mark> 기대감이 주가에 반영된 것으로 보인다. 다만, PER이 음수이고 PBR이 높은 수준인 점은 유의해야 한다. 전략: HBM 관련 모멘텀 지속 여부와 실적 개선 추이를 확인합니다.",
            },
          },
        ],
      },
    },
  ],
  missing: [],
};
