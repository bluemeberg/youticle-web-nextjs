"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

import TodayPageClient from "../components/TodayPageClient"; // 클라이언트 컴포넌트
import type { InsightSectionsResponse } from "@/types/insight";

export default function LandingPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integratedSections, setIntegratedSections] =
    useState<InsightSectionsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";
      const STOCK_API_V2_URL = "https://youticle.shop/briefing_v2/top_videos/v2/";
      const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";
      const INSIGHTS_SECTION_URL = "https://youticle.shop/insights/sections";
      const getKstDate = (date: Date) =>
        new Date(date.getTime() + 9 * 60 * 60 * 1000);
      const formatDateKST = (date: Date) => {
        const kstDate = getKstDate(date);
        const y = kstDate.getUTCFullYear();
        const m = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
        const d = String(kstDate.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };
      const now = new Date();
      const buildSlot = (date: Date) => {
        const kstDate = getKstDate(date);
        const hours = kstDate.getUTCHours();
        const minutes = kstDate.getUTCMinutes();
        if (hours < 7 || (hours === 7 && minutes < 30)) return "slot4";
        if (
          (hours === 7 && minutes >= 30) ||
          (hours === 8 && minutes < 30)
        ) {
          return "baseline";
        }
        if (hours < 12 || (hours === 12 && minutes < 10)) return "slot1";
        if (hours < 15 || (hours === 15 && minutes < 10)) return "slot2";
        if (hours < 21 || (hours === 21 && minutes < 30)) return "slot3";
        return "slot4";
      };
      const resolveStockSlot = (date: Date): number | null => {
        const kstDate = getKstDate(date);
        const hours = kstDate.getUTCHours();
        const minutes = kstDate.getUTCMinutes();
        if (hours < 7 || (hours === 7 && minutes < 30)) return 4;
        if (
          (hours === 7 && minutes >= 30) ||
          (hours === 8 && minutes < 30)
        ) {
          return null;
        }
        if (hours < 12 || (hours === 12 && minutes < 10)) return 1;
        if (hours < 15 || (hours === 15 && minutes < 10)) return 2;
        if (hours < 21 || (hours === 21 && minutes < 30)) return 3;
        return 4;
      };
      const dateParam = formatDateKST(now);
      const slotParam = buildSlot(now);
      const kstNow = getKstDate(now);
      const isMorningBaseline = slotParam === "baseline";
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
                : `${INSIGHTS_SECTION_URL}?sections=${encodedSectionKey}&date=${effectiveDateParam}&slot=${slotParam}`;
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
