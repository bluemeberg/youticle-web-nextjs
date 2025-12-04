"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

import TodayPageClient from "../components/TodayPageClient"; // 클라이언트 컴포넌트
import type { InsightSectionsResponse } from "@/types/insight";
import {
  buildRefreshMeta,
  formatDateKST,
  getBriefingSlot,
  resolveStockSlot,
  toKst,
} from "@/utils/briefingSlot";

export default function LandingPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integratedSections, setIntegratedSections] =
    useState<InsightSectionsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [refreshMeta] = useState(() => buildRefreshMeta(new Date()));

  useEffect(() => {
    const fetchData = async () => {
      const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";
      const STOCK_API_V2_URL = "https://youticle.shop/briefing_v2/top_videos/v2/";
      const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";
      const INSIGHTS_SECTION_URL = "https://youticle.shop/insights/sections";
      const now = new Date();
      const dateParam = formatDateKST(now);
      const slotParam = getBriefingSlot(now);
      const networkSlotParam = slotParam === "ranking" ? "slot3" : slotParam;
      const kstNow = toKst(now);
      const isMorningBaseline = networkSlotParam === "baseline";
      const isPreBaselineSlot4 =
        slotParam === "slot4" &&
        (kstNow.getUTCHours() < 7 ||
          (kstNow.getUTCHours() === 7 && kstNow.getUTCMinutes() < 30));
      const effectiveDateParam = isPreBaselineSlot4
        ? formatDateKST(new Date(now.getTime() - 24 * 60 * 60 * 1000))
        : dateParam;
      const stockSlot = resolveStockSlot(now);
      const stockApiUrl =
        stockSlot == null
          ? STOCK_API_URL
          : `${STOCK_API_V2_URL}?time_slot=${stockSlot}`;
      //   const STOCK_API_URL_LOCAL = "http://0.0.0.0:8000/briefing/top_videos/stock";
      // const EXCEPT_STOCK_API_URL_LOCAL =
      //   "http://0.0.0.0:8000/briefing/top_videos";

      try {
        const sectionKeys = [
          "domestic_stock",
          "overseas_stock",
          "domestic_crypto",
          "overseas_crypto",
        ] as const;

        const [response1, response2, sectionPayloads] = await Promise.all([
          fetch(EXCEPT_STOCK_API_URL, {
            method: "GET",
            cache: "no-store",
          }),
          fetch(stockApiUrl, { method: "GET", cache: "no-store" }),
          Promise.all(
            sectionKeys.map(async (key) => {
              const encodedSectionKey = encodeURIComponent(key);
              const url = isMorningBaseline
                ? `${INSIGHTS_SECTION_URL}?sections=${encodedSectionKey}`
                : `${INSIGHTS_SECTION_URL}?sections=${encodedSectionKey}&date=${effectiveDateParam}&slot=${networkSlotParam}`;
              const res = await fetch(url, {
                method: "GET",
                cache: "no-store",
              });
              if (!res.ok) {
                throw new Error(
                  `Insight section ${key} request failed (${res.status})`
                );
              }
              return res.json() as Promise<InsightSectionsResponse>;
            })
          ),
        ]);

        if (!response1.ok || !response2.ok) {
          throw new Error("API request failed");
        }

        const data1 = await response1.json();
        const data2 = await response2.json();
        const combinedData = [...data1, ...data2];
        setApiData(combinedData);

        const sectionsJson: InsightSectionsResponse = {
          sections: sectionPayloads
            .flatMap((payload) => payload.sections ?? [])
            .filter(Boolean),
          missing: [],
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
