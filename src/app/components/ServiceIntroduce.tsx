"use client";

import styled from "styled-components";
import TodayIcon from "@/assets/today.svg";
import { useRouter } from "next/navigation";

interface ServiceIntroduceProps {
  subjects: string[]; // 추가된 subjects prop
}
const getCurrentDateWithDay = () => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2); // 뒤 두 자리만 추출
  const month = (today.getMonth() + 1).toString().padStart(2, "0"); // 월은 0부터 시작
  const day = today.getDate().toString().padStart(2, "0");
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekDay = weekDays[today.getDay()]; // 요일 가져오기
  return `${year}.${month}.${day} (${weekDay})`; // YYYY.MM.DD (요일) 형식
};

const SERVICE_TITLE = "오늘의 유튜브 아티클";
const SERVICE_DESCRIPTION =
  "오늘 업로드된 주요 키워드의 영상들을 단 1초만에 아티클로 읽을 수 있습니다.";
const NO_SUBSCRIBED_TOPIC_MSG =
  "❗️현재 구독 중인 키워드가 없습니다. <br/>최대 3개의 관심 주제를 등록해주세요.";
const FREE_BENEFITS_TITLE = "🎁 무료 구독 혜택";
const FREE_BENEFITS_DESC = `
  <ul>
    <li>1️⃣ 매일 구독한 키워드의 아티클 전문 읽기.</li>
    <li>2️⃣ 매일 이메일로 아티클 편하게 확인하기.</li>
    <li>3️⃣ 오늘 놓친 이전 아티클 무제한 조회하기.</li>
  </ul>`;

const ServiceIntroduce = ({ subjects }: ServiceIntroduceProps) => {
  const router = useRouter();
  console.log(subjects.length);
  const goToPage = (url: string) => router.push(url);
  const currentDateWithDay = getCurrentDateWithDay();

  return (
    <Container>
      <ContentBox>
        <CurrentDate>{currentDateWithDay}</CurrentDate>
        <TitleContainer>
          <TodayIcon />
          <ServiceTitle>{SERVICE_TITLE}</ServiceTitle>
        </TitleContainer>
        <Announcement>
          <Title>
            오늘 업로드된 주요 영상들을 자동 요약된 아티클로 읽어보세요!
          </Title>
          <Description>
            <Highlight>구독한 키워드</Highlight>의 아티클은{" "}
            <Highlight>내용 전문</Highlight>을 읽을 수 있고, <br />
            구독 없이도 일부 내용을 미리 확인할 수 있습니다.
          </Description>
        </Announcement>{" "}
        {subjects.length === 0 ? ( // 구독 주제가 없을 때만 노출
          <>
            <ButtonContainer>
              <ServiceButton onClick={() => goToPage("subject")}>
                관심 키워드 무료 구독하러가기
              </ServiceButton>
            </ButtonContainer>
          </>
        ) : (
          <ButtonContainer>
            <ServiceButton
              change={subjects.length !== 0}
              onClick={() => goToPage("/subject/modify")}
            >
              구독 키워드 변경하기
            </ServiceButton>
          </ButtonContainer>
        )}
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
  font-family: "Pretendard Variable";
  width: 100%;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;
const CurrentDate = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  margin-bottom: 8px;
`;
const ContentBox = styled.div`
  background-color: #f0f4ff;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
`;

const ServiceTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-left: 4px;
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
const ServiceButton = styled.button<{ change?: boolean }>`
  width: 100%;
  height: 60px;
  background-color: ${(props) => (props.change ? "#000" : "#007bff")};
  color: #ffffff;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  border-radius: 4px;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
const Announcement = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: #000;
  margin-bottom: 12px;
  line-height: 128%;
  font-family: "Pretendard Variable";
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 132%;
  font-weight: 400;
  color: #000;
  font-family: "Pretendard Variable";
`;

const Highlight = styled.span`
  color: #000;
  font-weight: 700;
`;

const CallToAction = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-top: 16px;
`;
