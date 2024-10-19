import React from "react";
import styled, { keyframes } from "styled-components";

// Hero Section Styled Components
const HeroContainer = styled.section`
  background-color: #e9f5ff;
  padding: 60px 20px;
  text-align: center;
  width: 100%;
  font-family: "Pretendard Variable";
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  color: #007bff;
  margin-bottom: 20px;
  font-weight: 900;
`;

const HeroSectionDes = styled.p`
  font-size: 16px;
  font-weight: 400;
  line-height: 140%;
`;

const SectionSubtitle = styled.p`
  font-size: 24px;
  color: #000000;
  font-weight: 900;
  margin-bottom: 30px;
  line-height: 132%;
`;

const HeroVisuals = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
`;

// img 태그 스타일 적용
const YoutubeThumbnail = styled.img`
  width: 92%;
`;

const CtaButton = styled.button`
  background-color: #007bff;
  color: #ffffff;
  padding: 15px 30px;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 20px;

  &:hover {
    background-color: #0056b3;
  }
`;

const HeroSection: React.FC = () => {
  return (
    <HeroContainer>
      <SectionTitle>Why 유티클?</SectionTitle>
      <SectionSubtitle>
        쏟아지는 유튜브 콘텐츠, <br />
        시간의 한계를 극복하다
      </SectionSubtitle>
      <HeroSectionDes>
        1분당 500시간의 이상의 영상이
        <br /> 업로드되고 있는 유튜브 인프라 속에서 <br /> 양질의 영상을 모두
        시청하기에는 <br />
        물리적인 시간의 제약을 가지고 있습니다.
      </HeroSectionDes>
      <HeroVisuals>
        <YoutubeThumbnail src="/images/why유티클.png" alt="유튜브 썸네일" />
      </HeroVisuals>
    </HeroContainer>
  );
};

export default HeroSection;
