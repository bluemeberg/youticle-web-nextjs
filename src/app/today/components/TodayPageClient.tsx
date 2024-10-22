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
import { getUserByEmail, fetchSubscribedSubjects } from "../../api/apiClient";

interface LandingPageClientProps {
  apiData: any; // 서버에서 전달된 데이터
}

export default function LandingPageClient({ apiData }: LandingPageClientProps) {
  const setApiData = useSetRecoilState(dataState);
  const user = useRecoilValue(userState);
  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);

  useEffect(() => {
    // 클라이언트에서 받은 데이터를 Recoil 상태에 설정
    setApiData(apiData);
    const fetchSubjects = async () => {
      if (user.name !== "") {
        const subjects = await fetchSubscribedSubjects(user.email);
        setSubscribedSubjects(subjects); // 구독한 주제 설정
      }
    };

    fetchSubjects();
  }, [apiData, user]);
  console.log(subscribedSubjects);
  return (
    <Container $isLogin={user.name !== ""}>
      <LogoHeader />
      <YoutubeToday data={apiData} subjects={subscribedSubjects} />
      <Footer />
    </Container>
  );
}

const Container = styled.div<{ $isLogin: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Pretendard Variable";
  /* padding-top: ${(props) => (props.$isLogin ? "16px" : "76px")}; */
  padding-top: 76px;

  &::-webkit-scrollbar {
    display: none;
  }
  background-color: #f0f4ff;

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;
