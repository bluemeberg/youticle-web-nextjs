// /app/components/LandingPageClient.tsx (클라이언트 컴포넌트)
"use client";

import { useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import YoutubeToday from "./YoutubeToday";
import Footer from "./Footer";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import ServiceIntro from "./ServiceIntro";

interface LandingPageClientProps {
  apiData: any; // 서버에서 전달된 데이터
}

export default function LandingPageClient({ apiData }: LandingPageClientProps) {
  const setApiData = useSetRecoilState(dataState);
  const user = useRecoilValue(userState);
  console.log(user);
  useEffect(() => {
    setApiData(apiData);
  }, [apiData, setApiData]);

  return (
    <Container $isLogin={user.name !== ""}>
      <LogoHeader />
      {!user.name && <ServiceIntro />}
      <YoutubeToday data={apiData} />
      <Footer />
    </Container>
  );
}

const Container = styled.div<{ $isLogin: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Pretendard Variable";
  padding-top: ${(props) => (props.$isLogin ? "16px" : "76px")};

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;
