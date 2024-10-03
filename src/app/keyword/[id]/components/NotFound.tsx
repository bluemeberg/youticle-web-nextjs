"use client";

import styled from "styled-components";
import { useRouter } from "next/navigation";

import NotFoundIcon from "@/assets/404page.svg"; // Ensure SVGs are handled correctly in Next.js
import LogoHeader from "@/common/LogoHeader";

const NotFoundPage = () => {
  const router = useRouter();

  const goHome = () => router.push("/");

  return (
    <Container>
      <LogoHeader />
      <NotFoundIcon />
      <Description>앗, 해당 아티클 URL이 유효하지 않습니다.</Description>
      <Description>(아티클 조회기간이 만료됐을수도 있습니다😭)</Description>

      <GoHomePage>
        <Description>오늘 업로드된 18가지 주요 주제의</Description>
        <Description>
          유튜브 아티클들은 지금 바로 확인하실수 있습니다!
        </Description>
        <GoHomePageBtn onClick={goHome}>
          오늘의 유튜브 아티클 확인하러가기
        </GoHomePageBtn>
      </GoHomePage>
    </Container>
  );
};

export default NotFoundPage;

const Container = styled.div`
  padding-top: 76px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Description = styled.span`
  font-family: var(--font-Pretendard);
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  text-align: center;
`;

const GoHomePage = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 56px;

  span {
    font-weight: 300;
    line-height: 19.2px;
  }
`;

const GoHomePageBtn = styled.button`
  /* width: calc(100vw - 40px); */
  height: 60px;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  margin-top: 13px;

  font-family: var(--font-Pretendard);
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
`;
