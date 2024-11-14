"use client";

import { useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import styled, { keyframes } from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import PreYoutubeToday from "./PreYoutubeToday";
import Footer from "./Footer";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import ServiceIntro from "./ServiceIntro";
import HeroSection from "./HeroSection"; // 분리된 HeroSection import
import HowSection from "./HowSection";
import WhatSection from "./WhatSection";
import RecommendSection from "./RecommendSection";
import { useRouter } from "next/navigation";

// 컴포넌트 스타일 정의
const Container = styled.div<{ $isLogin: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  /* padding-top: ${(props) => (props.$isLogin ? "16px" : "52px")}; */
  padding-top: 52px;
  background-color: #ffffff;
  font-family: "Pretendard Variable";
`;

const ClosingSection = styled.section`
  background-color: #007bff;
  width: 100%;
  padding: 60px 20px;
  text-align: center;
  color: #ffffff;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  color: #ffffff;
  margin-bottom: 20px;
  line-height: 148%;
  font-weight: 900;
`;

const SectionSubtitle = styled.p`
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 8px;
  margin-top: 40px;
  font-weight: 700;
`;

const TransitionText = styled.p`
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 40px;
  font-weight: 500;
`;

const ClosingButton = styled.button`
  background-color: #ffffff;
  color: #007bff;
  padding: 15px 30px;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const ServiceButton = styled.button`
  width: 100%;
  height: 60px;
  background-color: #ffff;
  color: #007bff;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid #ffffff; /* 테두리 추가 */
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); /* 그림자 추가 */
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

// Main 컴포넌트
export default function LandingPageClient() {
  const setApiData = useSetRecoilState(dataState);
  const user = useRecoilValue(userState);
  const router = useRouter();

  const goToPage = (url: string) => router.push(url);
  // useEffect(() => {
  //   setApiData(apiData);
  // }, [apiData, setApiData]);

  // 구독
  return (
    <Container $isLogin={user.name !== ""}>
      <LogoHeader />
      <ServiceIntro />
      <PreYoutubeToday />
      {/* 분리된 HeroSection 컴포넌트 사용 */}
      <HeroSection />
      {/* How 유티클 Section */}
      <HowSection />

      {/* What 유티클 Section */}
      <WhatSection />

      {/* 분리된 RecommendationSection 컴포넌트 */}
      <RecommendSection />

      {/* Closing Section */}
      <ClosingSection>
        <SectionTitle>
          지금 바로 관심 키워드 구독하고,
          <br /> 매일 최신 유튜브 아티클을 <br /> 받아보세요!
        </SectionTitle>

        <SectionSubtitle>
          👀 당장 내일 아침부터 중요한 정보 놓치지 말기!
        </SectionSubtitle>

        <ButtonContainer>
          <ServiceButton onClick={() => goToPage("subject")}>
            지금 바로 무료 구독하러가기 👉🏻
          </ServiceButton>
        </ButtonContainer>
      </ClosingSection>

      <Footer />
    </Container>
  );
}
