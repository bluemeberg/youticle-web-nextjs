// /app/components/LandingPageClient.tsx (클라이언트 컴포넌트)
"use client";

import { useEffect, useState } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import ServiceIntroduce from "./ServiceIntroduce";
import LogoHeader from "@/common/LogoHeader";
import YoutubeToday from "./YoutubeToday";
import Footer from "./Footer";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import { fetchSubscribedSubjects } from "../api/apiClient";

interface LandingPageClientProps {
  apiData: any;
}

export default function LandingPageClient({ apiData }: LandingPageClientProps) {
  const setApiData = useSetRecoilState(dataState);
  const user = useRecoilValue(userState);
  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recoil 상태에 apiData를 설정
  useEffect(() => {
    setApiData(apiData);
  }, [apiData, setApiData]);

  // 사용자 정보를 기준으로 구독 키워드 데이터를 가져오는 로직
  useEffect(() => {
    const fetchSubjects = async () => {
      if (user.name !== "") {
        try {
          const subjects = await fetchSubscribedSubjects(user.email, user.name);
          setSubscribedSubjects(subjects);
        } catch (error) {
          console.error("Error fetching subscribed subjects:", error);
          setSubscribedSubjects([]);
        }
      } else {
        setSubscribedSubjects([]);
      }
      setIsLoading(false); // 데이터 로드가 완료되면 로딩 상태를 해제
    };

    fetchSubjects();
  }, [user.name, user.email]); // user 상태가 변경될 때만 실행

  return (
    <Container $isLogin={user.name !== ""}>
      <LogoHeader />
      <>
        <ServiceIntroduce subjects={subscribedSubjects} />
        <YoutubeToday data={apiData} subjects={subscribedSubjects} />
      </>
      <Footer />
    </Container>
  );
}

const Container = styled.div<{ $isLogin: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: #f0f4ff;
  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 16px;
  font-weight: bold;
`;
