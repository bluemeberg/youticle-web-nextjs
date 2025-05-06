"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import Image from "next/image";

// 예시 아이콘 (react-icons)
import {
  FaBell,
  FaPlayCircle,
  FaClipboardList,
  FaUserCheck,
} from "react-icons/fa";

// 예시 이미지 (실제 파일은 public 폴더에 위치)
import heroImage from "/public/images/What유티클2.png";
import howStepImage1 from "/public/images/How유티클.png";
import howStepImage2 from "/public/images/How유티클.png";

// ========================== COMPONENT ==========================
export default function LandingPage() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroTitle>유튜브 채널 요약 & 알림 서비스</HeroTitle>
          <HeroSubtitle>
            중요한 영상을 빠르게 텍스트 &apos;아티클&apos;로 확인하고,
            <br />
            신규 영상 자동 요약 알림까지 받아보세요!
          </HeroSubtitle>
          <CTARow>
            <PrimaryButton>유튜브 구독 채널 불러오기</PrimaryButton>
            <SecondaryButton>관심 채널 직접 입력하기</SecondaryButton>
          </CTARow>
        </HeroContent>
        <HeroImageWrapper>
          <Image
            src={heroImage}
            alt="Hero"
            placeholder="blur"
            style={{ width: "100%", maxWidth: 400, height: "auto" }}
          />
        </HeroImageWrapper>
      </HeroSection>

      {/* Why Section */}
      <WhySection>
        <SectionTitle>왜 필요할까요?</SectionTitle>
        <WhyText>
          구독 중인 채널 영상이 쌓이는데, 막상 다 챙겨보긴 어렵죠.
          <br />
          유티클은 매일 아침 새 영상을 간편히 요약해주고,
          <br />
          놓친 영상도 아카이브에 저장해 언제든 다시 볼 수 있게 해줍니다.
        </WhyText>
      </WhySection>

      {/* What (Features) Section */}
      <FeaturesSection>
        <SectionTitle>무엇을 할 수 있나요?</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <IconWrapper>
              <FaPlayCircle size={32} color="#007bff" />
            </IconWrapper>
            <CardTitle>개별 영상 아티클 변환</CardTitle>
            <CardDesc>
              관심 있는 영상을 선택하면
              <br />
              핵심만 추린 요약본을 즉시 생성!
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper>
              <FaBell size={32} color="#007bff" />
            </IconWrapper>
            <CardTitle>신규 영상 자동 알림</CardTitle>
            <CardDesc>
              매일 아침 채널에 새로 올라온 영상을
              <br />
              자동 감지 후 카톡으로 안내!
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper>
              <FaClipboardList size={32} color="#007bff" />
            </IconWrapper>
            <CardTitle>아카이브</CardTitle>
            <CardDesc>
              바빠서 못 봤던 영상도
              <br />
              언제든 다시 찾아볼 수 있어요.
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <IconWrapper>
              <FaUserCheck size={32} color="#007bff" />
            </IconWrapper>
            <CardTitle>간단한 사용법</CardTitle>
            <CardDesc>
              Google 계정만 있으면
              <br />
              채널 등록 후 바로 이용 가능!
            </CardDesc>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      {/* ========== 4) HOW SECTION (단계별 설명 + 이미지 예시) ========== */}
      <HowSection>
        <SectionTitle>어떻게 이용하나요?</SectionTitle>

        <StepsRow>
          <StepBox>
            <StepIcon>1</StepIcon>
            <StepText>Google 계정으로 로그인</StepText>
            <StepImageBox>
              <Image
                src={howStepImage1}
                alt="단계1 예시"
                style={{ width: "100%", height: "auto" }}
              />
            </StepImageBox>
          </StepBox>

          <StepBox>
            <StepIcon>2</StepIcon>
            <StepText>관심 채널 직접 입력 or 구독 채널 불러오기</StepText>
            <StepImageBox>
              <Image
                src={howStepImage2}
                alt="단계2 예시"
                style={{ width: "100%", height: "auto" }}
              />
            </StepImageBox>
          </StepBox>

          <StepBox>
            <StepIcon>3</StepIcon>
            <StepText>개별 영상 요약 or 채널 전체 등록</StepText>
          </StepBox>

          <StepBox>
            <StepIcon>4</StepIcon>
            <StepText>카톡 알림 &amp; 아카이브로 편리하게 확인</StepText>
          </StepBox>
        </StepsRow>
      </HowSection>

      {/* Testimonials Section */}
      <TestimonialSection>
        <SectionTitle>사용자 후기</SectionTitle>
        <TestimonialGrid>
          <TestimonialCard>
            <Quote>“영상 시청 시간이 확 줄었어요!”</Quote>
            <Author>- 홍길동</Author>
          </TestimonialCard>
          <TestimonialCard>
            <Quote>“카톡으로 요약본이 오니까 너무 편해요.”</Quote>
            <Author>- 김철수</Author>
          </TestimonialCard>
          <TestimonialCard>
            <Quote>“아카이브 덕에 예전 영상도 쉽게 찾아봅니다.”</Quote>
            <Author>- 이영희</Author>
          </TestimonialCard>
        </TestimonialGrid>
      </TestimonialSection>

      {/* Final CTA */}
      <FinalCTASection>
        <CTAContainer>
          <CTATitle>지금 바로 시작해보세요!</CTATitle>
          <CTAText>
            관심 채널 영상, 다 챙겨보기 힘들다면
            <br />
            영상 요약과 자동 알림으로 시간을 절약하세요.
          </CTAText>
          <CTAButton>회원가입 / 로그인</CTAButton>
        </CTAContainer>
      </FinalCTASection>
    </PageWrapper>
  );
}

/* ---------------------- Styled Components ---------------------- */

const fadeIn = keyframes`
  0% { opacity:0; transform: translateY(10px); }
  100% { opacity:1; transform: translateY(0); }
`;

const PageWrapper = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px 80px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

/* ===== Hero Section ===== */
const HeroSection = styled.section`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  margin-top: 40px;
  gap: 24px;

  @media (min-width: 768px) {
    flex-direction: column;
    gap: 40px;
  }
`;
const HeroContent = styled.div`
  flex: 1;
  text-align: center;
`;
const HeroTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #000;
`;
const HeroSubtitle = styled.p`
  font-size: 16px;
  line-height: 1.4;
  color: #444;
  margin-bottom: 24px;
`;
const CTARow = styled.div`
  display: flex;
  gap: 12px;
  flex-direction: column;
`;
const PrimaryButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 14px 20px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;
const SecondaryButton = styled.button`
  background-color: #f0f0f5;
  color: #333;
  font-weight: 700;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 14px 20px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #dedee3;
  }
`;
const HeroImageWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

/* ===== Why Section ===== */
const WhySection = styled.section`
  margin-top: 60px;
`;
const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #000;
  text-align: center;
`;
const WhyText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #444;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

/* ===== Features (What) Section ===== */
const FeaturesSection = styled.section`
  margin-top: 60px;
`;
const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  align-items: stretch;
`;
const FeatureCard = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
  transition: 0.2s;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;
const IconWrapper = styled.div`
  margin-bottom: 12px;
`;
const CardTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #333;
`;
const CardDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 132%;
`;

/* 4) How Section */
const HowSection = styled.section`
  margin-top: 60px;
`;
const StepsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  margin-bottom: 24px;
  text-align: center;
`;
const StepBox = styled.div`
  width: 220px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin: 0 auto;
`;
const StepIcon = styled.div`
  background: #007bff;
  color: #fff;
  font-weight: 700;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StepText = styled.p`
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
`;
const StepImageBox = styled.div`
  margin-top: 8px;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
`;

/* ===== Testimonials Section ===== */
const TestimonialSection = styled.section`
  margin-top: 60px;
`;
const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 24px;
`;
const TestimonialCard = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
`;
const Quote = styled.p`
  font-size: 14px;
  font-style: italic;
  color: #333;
  margin-bottom: 12px;
`;
const Author = styled.div`
  font-size: 13px;
  color: #777;
`;

/* ===== Demo (미리보기) Section ===== */
const DemoSection = styled.section`
  margin-top: 60px;
`;
const DemoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;
const DemoCard = styled.div`
  flex: 1;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
`;
const DemoDesc = styled.p`
  margin-top: 12px;
  font-size: 14px;
  color: #555;
`;

/* ===== Final CTA Section ===== */
const FinalCTASection = styled.section`
  margin-top: 60px;
  padding: 40px 16px;
  background: #f0f0f5;
  border-radius: 8px;
  text-align: center;
`;
const CTAContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;
const CTATitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
`;
const CTAText = styled.p`
  font-size: 14px;
  color: #444;
  line-height: 1.4;
  margin-bottom: 20px;
`;
const CTAButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 14px 24px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;
