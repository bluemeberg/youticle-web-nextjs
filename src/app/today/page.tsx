"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

import TodayPageClient from "../components/TodayPageClient"; // 클라이언트 컴포넌트
import type { InsightSectionsResponse } from "@/types/insight";
import {
  buildRefreshMeta,
  formatDateKST,
  getBriefingSlot,
  getSlotLabelInfo,
  resolveStockSlot,
  toKst,
} from "@/utils/briefingSlot";
import {
  buildStockSlotRequests,
  mergeStockSlotPayloads,
  buildStockSlotSections,
} from "@/utils/stockFeed";
import type { DataProps } from "@/types/dataProps";
import type { StockSlotSection } from "@/utils/stockFeed";

export default function LandingPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integratedSections, setIntegratedSections] =
    useState<InsightSectionsResponse | null>(null);
  const [stockSlotSections, setStockSlotSections] = useState<StockSlotSection[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [refreshMeta] = useState(() => buildRefreshMeta(new Date()));
  const [insightSlotLabel, setInsightSlotLabel] = useState(() =>
    getSlotLabelInfo(getBriefingSlot(new Date()))
  );

  useEffect(() => {
    const fetchData = async () => {
      const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";
      const STOCK_API_V2_URL = "https://youticle.shop/briefing_v2/top_videos/v2/";
      const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";
      const INSIGHTS_SECTION_URL = "https://youticle.shop/insights/sections";
      const now = new Date();
      const dateParam = formatDateKST(now);
      const slotParam = getBriefingSlot(now);
      setInsightSlotLabel(getSlotLabelInfo(slotParam));
      const kstNow = toKst(now);
      const isMorningBaseline = slotParam === "baseline";
      const isPreBaselineSlot4 =
        slotParam === "slot4" &&
        (kstNow.getUTCHours() < 7 ||
          (kstNow.getUTCHours() === 7 && kstNow.getUTCMinutes() < 30));
      const effectiveDateParam = isPreBaselineSlot4
        ? formatDateKST(new Date(now.getTime() - 24 * 60 * 60 * 1000))
        : dateParam;
      const stockSlot = resolveStockSlot(now);
      const stockSlotRequests = buildStockSlotRequests({
        currentSlot: stockSlot,
        baselineUrl: STOCK_API_URL,
        v2BaseUrl: STOCK_API_V2_URL,
      });
      //   const STOCK_API_URL_LOCAL = "http://0.0.0.0:8000/briefing/top_videos/stock";
      // const EXCEPT_STOCK_API_URL_LOCAL =
      //   "http://0.0.0.0:8000/briefing/top_videos";

      try {
        const sectionKeys = [
          "domestic_stock",
          "overseas_stock",
          "crypto",
        ] as const;

        const [response1, stockPayloads, sectionPayloads] = await Promise.all([
          fetch(EXCEPT_STOCK_API_URL, {
            method: "GET",
            cache: "no-store",
          }),
          Promise.all(
            stockSlotRequests.map(async (request) => {
              const res = await fetch(request.url, {
                method: "GET",
                cache: "no-store",
              });
              if (!res.ok) {
                throw new Error(
                  `Stock API request failed (${request.slot})`
                );
              }
              const data = (await res.json()) as DataProps[];
              return { ...request, data };
            })
          ),
          Promise.all(
            sectionKeys.map(async (key) => {
              const encodedSectionKey = encodeURIComponent(key);
              const url = isMorningBaseline
                ? `${INSIGHTS_SECTION_URL}?sections=${encodedSectionKey}`
                : `${INSIGHTS_SECTION_URL}?sections=${encodedSectionKey}&date=${effectiveDateParam}&slot=${slotParam}`;
              const res = await fetch(url, {
                method: "GET",
                cache: "no-store",
              });
              if (!res.ok) {
                console.warn(
                  `Insight section ${key} request failed (${res.status})`
                );
                return null;
              }
              return res.json() as Promise<InsightSectionsResponse>;
            })
          ),
        ]);

        if (!response1.ok) {
          throw new Error("API request failed");
        }

        const data1 = await response1.json();
        const stockData = mergeStockSlotPayloads(stockPayloads);
        const combinedData = [...data1, ...stockData];
        const slotSectionsPayload = buildStockSlotSections(stockPayloads);
        setApiData(combinedData);
        setStockSlotSections(slotSectionsPayload);

        const validSectionPayloads = sectionPayloads.filter(
          (payload): payload is InsightSectionsResponse => Boolean(payload)
        );

        const sectionsJson: InsightSectionsResponse = {
          sections: validSectionPayloads
            .flatMap((payload) => payload.sections ?? [])
            .filter(Boolean),
          missing: validSectionPayloads.flatMap(
            (payload) => payload.missing ?? []
          ),
        };

        setIntegratedSections(sectionsJson);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {isLoading ? (
        <LoadingContainer>로딩 중...</LoadingContainer>
      ) : error ? (
        <ErrorContainer>
          데이터를 불러오는 중 문제가 발생했습니다.
          <br />
          {error.message}
        </ErrorContainer>
      ) : (
        <TodayPageClient
          apiData={apiData}
          integratedSections={integratedSections?.sections ?? []}
          refreshMeta={refreshMeta}
          stockSlotSections={stockSlotSections}
          insightSlotLabel={insightSlotLabel}
        />
      )}
    </>
  );
}

const LoadingContainer = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  width: 100vw;
`;

const ErrorContainer = styled(LoadingContainer)`
  color: #dc2626;
  text-align: center;
`;
