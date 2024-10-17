import React from "react";
import styled from "styled-components";

// How Section Styled Components
const HowContainer = styled.section`
  background-color: #ffffff;
  padding: 60px 20px;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  color: #007bff;
  margin-bottom: 20px;
  font-weight: 900;
`;

const SectionSubtitle = styled.p`
  font-size: 24px;
  color: #000000;
  font-weight: 900;
  margin-bottom: 30px;
  line-height: 132%;
`;

const AiProcess = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
`;

const HowSectionDes = styled.p`
  font-size: 16px;
  font-weight: 400;
  line-height: 140%;
`;

// img 태그 스타일 적용
const YoutubeThumbnail = styled.img`
  width: 92%;
`;

const HowSection: React.FC = () => {
  return (
    <HowContainer>
      <SectionTitle>How 유티클?</SectionTitle>
      <SectionSubtitle>
        유튜브 영상, 이제
        <br />
        빠르고 편하게 읽어보세요.
      </SectionSubtitle>
      <HowSectionDes>
        유튜브 영상을 빠르고 쉽게 읽을 수 있는 <br />
        아티클 형태로 제공하는 서비스. <br />
        AI 모델이 자동으로 영상 핵심 내용을 요약해서 <br />
        아티클로 생성합니다.
      </HowSectionDes>
      <AiProcess>
        <YoutubeThumbnail src="/images/How유티클.png" alt="how 썸네일" />
      </AiProcess>
    </HowContainer>
  );
};

export default HowSection;
