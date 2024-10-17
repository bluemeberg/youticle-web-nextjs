"use client";

import styled from "styled-components";
import TodayIcon from "@/assets/today.svg";
import { useRouter } from "next/navigation";

const SERVICE_TITLE = "오늘의 유튜브 아티클";
const SERVICE_DESCRIPTION =
  "오늘 업로드된 주요 주제들의 영상들을 단 1초만에 아티클로 읽을 수 있습니다.";
const NO_SUBSCRIBED_TOPIC_MSG =
  "현재 구독 중인 주제가 없습니다. <br/>최대 3개의 관심 주제를 등록해주세요.";
const FREE_BENEFITS_TITLE = "🎁 무료 구독 혜택";
const FREE_BENEFITS_DESC = `
  <ul>
    <li>1️⃣ 매일 구독한 주제의 아티클 전문 읽기.</li>
    <li>2️⃣ 매일 이메일로 아티클 편하게 확인하기.</li>
    <li>3️⃣ 오늘 놓친 이전 아티클 무제한 조회하기.</li>
  </ul>`;

const ServiceIntroduce = () => {
  const router = useRouter();

  const goToPage = (url: string) => router.push(url);
  return (
    <Container>
      <ContentBox>
        <TitleContainer>
          <TodayIcon />
          <ServiceTitle>{SERVICE_TITLE}</ServiceTitle>
        </TitleContainer>
        <ServiceDesc>{SERVICE_DESCRIPTION}</ServiceDesc>
        <NoSubscribedTopicMsg>
          <NoSubsTitle>
            현재 구독 중인 주제가 없습니다. <br />
            3개의 관심 주제를 등록해주세요.
          </NoSubsTitle>
          <BenefitsContainer>
            <FreeBenefitsTitle>{FREE_BENEFITS_TITLE}</FreeBenefitsTitle>
            <FreeBenefitsDesc
              dangerouslySetInnerHTML={{ __html: FREE_BENEFITS_DESC }}
            />
            <ButtonContainer>
              <ServiceButton onClick={() => goToPage("my")}>
                관심 주제 무료 구독하러가기
              </ServiceButton>
            </ButtonContainer>
          </BenefitsContainer>
        </NoSubscribedTopicMsg>
      </ContentBox>
    </Container>
  );
};

export default ServiceIntroduce;

// 스타일 정의
const Container = styled.div`
  display: flex;
  justify-content: center;
  background-color: #f0f4ff;
`;

const ContentBox = styled.div`
  background-color: #f0f4ff;
  padding-left: 16px;
  padding-right: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const ServiceTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-left: 8px;
`;

const ServiceDesc = styled.p`
  font-size: 16px;
  color: #000;
  margin-bottom: 10px;
  font-weight: 500;
  line-height: 1.2;
`;

const NoSubscribedTopicMsg = styled.div`
  background-color: #f8f9fa;
  padding: 20px 16px 12px 16px;
  border-radius: 4px;
  margin-top: 20px;
`;

const NoSubsTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin-bottom: 20px;
  line-height: 1.2;
`;

const BenefitsContainer = styled.div`
  background-color: #e9f4ff;
  border-radius: 4px;
  padding: 20px 16px 12px 16px;
`;

const FreeBenefitsTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 16px;
`;

const FreeBenefitsDesc = styled.div`
  font-size: 16px;
  color: #000;
  font-weight: 400;
  line-height: 1.4;
  margin-top: 12px;
  li {
    margin-top: 4px;
  }
`;

const CTAButton = styled.button`
  background-color: #007bff;
  color: #ffffff;
  padding: 15px 30px;
  border-radius: 25px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;

  &:hover {
    background-color: #0056b3;
  }
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
  margin-top: 20px;
  border-radius: 4px;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
