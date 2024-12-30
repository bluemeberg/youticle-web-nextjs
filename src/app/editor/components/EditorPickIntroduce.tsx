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

const SERVICE_TITLE = "📌 유티클 에디터 픽";
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

const EditorPickIntroduce = () => {
  const router = useRouter();
  const goToPage = (url: string) => router.push(url);
  const currentDateWithDay = getCurrentDateWithDay();

  return (
    <Container>
      <ContentBox>
        <TitleContainer>
          {/* <TodayIcon /> */}
          <ServiceTitle>{SERVICE_TITLE}</ServiceTitle>
        </TitleContainer>
        <Announcement>
          <Title>
            키워드 별 에디터들이 선정한 양질의 유튜브 영상을 읽어드려서
            인사이트를 전달합니다.
          </Title>
        </Announcement>
      </ContentBox>
    </Container>
  );
};

export default EditorPickIntroduce;

// 스타일 정의
const Container = styled.div`
  display: flex;
  justify-content: center;
  background-color: #f0f4ff;
  font-family: "Pretendard Variable";
  width: 100%;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const ContentBox = styled.div`
  background-color: #f0f4ff;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 12px;
  padding-top: 28px;
  margin-top: 4px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ServiceTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-left: 4px;
`;

const Announcement = styled.div``;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: #000;
  margin-bottom: 12px;
  line-height: 128%;
  font-family: "Pretendard Variable";
`;
