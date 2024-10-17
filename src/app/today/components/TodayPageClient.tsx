// /app/components/LandingPageClient.tsx (클라이언트 컴포넌트)
"use client";

import { useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import ServiceIntroduce from "./ServiceIntroduce";
import LogoHeader from "@/common/LogoHeader";
import YoutubeToday from "./YoutubeToday";
import Footer from "../../components/Footer";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import GoogleLogin from "@/common/GoogleLogin";

interface LandingPageClientProps {
  apiData: any; // 서버에서 전달된 데이터
}

export default function LandingPageClient({ apiData }: LandingPageClientProps) {
  const setApiData = useSetRecoilState(dataState);
  const user = useRecoilValue(userState);

  useEffect(() => {
    // 클라이언트에서 받은 데이터를 Recoil 상태에 설정
    setApiData(apiData);
  }, [apiData, setApiData]);

  return (
    <Container $isLogin={user.name !== ""}>
      <LogoHeader />
      {user.name === "" && (
        <>
          <ServiceIntroduce />
        </>
      )}
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
  background-color: #f0f4ff;

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;
