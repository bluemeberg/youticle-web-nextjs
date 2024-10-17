import React from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";

const WhatContainer = styled.section`
  background-color: #f5faff;
  padding: 60px 20px;
  text-align: center;
  width: 100%;
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

const MorningUpdate = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  margin-top: 40px;
`;

const WhatSectionDes = styled.p`
  font-size: 16px;
  font-weight: 400;
  line-height: 140%;
  margin-bottom: 24px;
`;

const ServiceButton = styled.button`
  width: 100%;
  height: 60px;
  background-color: #007bff;
  color: #ffffff;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  margin-top: 26px;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
// img 태그 스타일 적용
const YoutubeThumbnail = styled.img`
  width: 92%;
`;

const WhatSection: React.FC = () => {
  const router = useRouter();

  const goToPage = (url: string) => router.push(url);
  return (
    <WhatContainer>
      <SectionTitle>What 유티클?</SectionTitle>
      <SectionSubtitle>
        매일 아침 7시 30분, <br />
        최신 유튜브 아티클을 받아보세요.
      </SectionSubtitle>
      <WhatSectionDes>
        최대 3개 관심 주제를 구독하고 어제, 오늘 업로드된
        <br />
        각 주제 별 양질의 국내/해외 영상들을
        <br />
        매일 아침 7시 30분에 아티클로 제공해 드립니다.
        <br />
      </WhatSectionDes>
      <MorningUpdate>
        <YoutubeThumbnail src="/images/What유티클2.png" />
      </MorningUpdate>
      <ButtonContainer>
        <ServiceButton onClick={() => goToPage("subject")}>
          지금 바로 무료 구독하러가기 👉🏻
        </ServiceButton>
      </ButtonContainer>
    </WhatContainer>
  );
};

export default WhatSection;
