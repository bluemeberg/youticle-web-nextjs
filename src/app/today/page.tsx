"use client";

import TodayPageClient from "./components/TodayPageClient"; // 클라이언트 컴포넌트
import { useEffect, useState } from "react";
import styled from "styled-components";

export default function LandingPage() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";
      const EXCEPT_STOCK_API_URL = "https://youticle.shop/briefing/top_videos";
      //   const STOCK_API_URL_LOCAL = "http://0.0.0.0:8000/briefing/top_videos/stock";
      //   const EXCEPT_STOCK_API_URL_LOCAL = "http://0.0.0.0:8000/briefing/top_videos";

      try {
        const [response1, response2] = await Promise.all([
          fetch(EXCEPT_STOCK_API_URL, { method: "GET", cache: "no-store" }),
          fetch(STOCK_API_URL, { method: "GET", cache: "no-store" }),
        ]);

        if (!response1.ok || !response2.ok) {
          throw new Error("API request failed");
        }

        const data1 = await response1.json();
        const data2 = await response2.json();
        const combinedData = [...data1, ...data2];
        setApiData(combinedData);
      } catch (error) {
        console.error("Error fetching data:", error);
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
      ) : (
        <TodayPageClient apiData={apiData} />
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
