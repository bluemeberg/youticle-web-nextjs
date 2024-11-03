// /app/components/LandingPageClient.tsx (클라이언트 컴포넌트)
"use client";

import { useEffect, useState } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import ServiceIntroduce from "./ServiceIntroduce";
import LogoHeader from "@/common/LogoHeader";
import YoutubeToday from "./YoutubeToday";
import Footer from "../../components/Footer";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import { fetchSubscribedSubjects } from "../../api/apiClient";

interface LandingPageClientProps {
  apiData: any;
}

export default function LandingPageClient({ apiData }: LandingPageClientProps) {
  const setApiData = useSetRecoilState(dataState);
  const user = useRecoilValue(userState);
  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 클라이언트에서 받은 데이터를 Recoil 상태에 설정
    setApiData(apiData);

    const fetchSubjects = async () => {
      if (user.name !== "") {
        const subjects = await fetchSubscribedSubjects(user.email);
        setSubscribedSubjects(subjects);
      } else {
        setSubscribedSubjects([]);
      }
      setIsLoading(false); // 데이터 로드가 완료되면 로딩 상태를 해제
    };

    fetchSubjects();
  }, [apiData, user]);

  return (
    <Container $isLogin={user.name !== ""}>
      <LogoHeader />
      {isLoading ? (
        <LoadingContainer>로딩 중...</LoadingContainer>
      ) : (
        <>
          <ServiceIntroduce subjects={subscribedSubjects} />
          <YoutubeToday data={apiData} subjects={subscribedSubjects} />
        </>
      )}
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
