// NewComponent.tsx
import React from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";

import Cook from "@/assets/yosum_cook.svg";
interface NewComponentProps {
  keyword: string;
}

const Information: React.FC<NewComponentProps> = ({ keyword }) => {
  const router = useRouter();

  const goToPage = (url: string) => router.push(url);

  return (
    <Container>
      <CookBox>
        <Cook />
      </CookBox>
      <TitleContainer>
        안녕하세요, 유티클을 만들고 있는 John입니다.<br></br> 먼저 구독해주셔서
        감사합니다. <br></br>
        <br></br>신청주신 키워드 "{keyword}"와 관련된 유튜브 아티클들은 차주
        월요일부터 생성될 예정입니다.<br></br> <br></br>차주 월요일에 연동해주신
        구글 계정 이메일로 안내 메일이 발송될 예정이니<br></br>
        <br></br> 꼭 확인 부탁드립니다!!
      </TitleContainer>
      <Description>
        👀 오늘 업로드된 19가지 주제의 유튜브 아티클은?<br></br> 👇지금 바로
        확인하기!
      </Description>
      <ServiceButton onClick={() => goToPage("/")}>
        오늘의 유튜브 아티클 확인하러가기
      </ServiceButton>
    </Container>
  );
};

export default Information;

const Container = styled.div`
  background-color: #f2f2f2;
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
`;

const CookBox = styled.div`
  margin-top: 24px;
`;

const TitleContainer = styled.div`
  font-size: 16px;
  margin-bottom: 10px;
  width: 340px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  line-height: 136%;
  margin-top: 20px;
`;

const Description = styled.p`
  font-size: 18px;
  margin-top: 20px;
  text-align: center;
  line-height: 136%;
`;

const ServiceButton = styled.button`
  width: 80%;
  height: 60px;
  background-color: #007bff;
  color: #ffffff;
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  margin-top: 20px;
  border-radius: 4px;
  margin-bottom: 40px;
`;
