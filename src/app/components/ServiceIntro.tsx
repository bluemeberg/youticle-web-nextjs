"use client";

import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { keywordState } from "@/store/keyword";
import LandingThumb from "@/assets/yousum_thumb.svg";
const SERVICE_TITLE =
  "유튜브 영상 정보의 홍수 속에서 <br/> 나만 똑똑하게 시청하는 방법.";
const SERVICE_DESCRIPTION =
  "500시간이 넘는 영상이 매 분마다 업로드되는 시대, <br/>오늘 업로드된 주요 주제의 영상들을  <br/>매일 아티클로 빠르고 편하게 읽어보세요.";

const ServiceIntro = () => {
  const [keyword, setKeyword] = useRecoilState(keywordState);

  const handleChange = (e: any) => {
    setKeyword({
      ...keyword,
      daily: e.target.value,
    });
  };

  const router = useRouter();
  const goToPage = (url: string) => router.push(url);

  return (
    <Container>
      <ServiceTitle dangerouslySetInnerHTML={{ __html: SERVICE_TITLE }} />
      <ServiceDesc dangerouslySetInnerHTML={{ __html: SERVICE_DESCRIPTION }} />
      {/* <ServiceInput
        value={keyword.daily}
        onChange={handleChange}
        placeholder={`평소 관심있는 키워드를 등록해주세요.\n(ex, 엔비디아, 애플, 피부 관리 등)`}
      /> */}
      {/* Topic Menu */}
      <TopicMenu>
        {/* 첫 번째 카테고리 그룹 */}
        <TopicGroup>
          <Topic>
            <TopicIcon>📈</TopicIcon>주식
          </Topic>
          <Topic>
            <TopicIcon>🏢</TopicIcon>부동산
          </Topic>
          <Topic>
            <TopicIcon>💰</TopicIcon>가상자산
          </Topic>
          <Topic>
            <TopicIcon>🏛️</TopicIcon>정치
          </Topic>
          <Topic>
            <TopicIcon>💼</TopicIcon>비즈니스/사업
          </Topic>
        </TopicGroup>
        <TopicDivider />

        {/* 두 번째 카테고리 그룹 */}
        <TopicGroup>
          <Topic>
            <TopicIcon>🩺</TopicIcon>건강
          </Topic>
          <Topic>
            <TopicIcon>🏋️</TopicIcon>피트니스/운동
          </Topic>
          <Topic>
            <TopicIcon>⚽</TopicIcon>스포츠
          </Topic>
        </TopicGroup>
        <TopicDivider />

        {/* 세 번째 카테고리 그룹 */}
        <TopicGroup>
          <Topic>
            <TopicIcon>❤️</TopicIcon>연애/결혼
          </Topic>
          <Topic>
            <TopicIcon>👶</TopicIcon>육아
          </Topic>
          <Topic>
            <TopicIcon>💄</TopicIcon>뷰티/메이크업
          </Topic>
          <Topic>
            <TopicIcon>👗</TopicIcon>패션
          </Topic>
          <Topic>
            <TopicIcon>🍳</TopicIcon>요리
          </Topic>
          <Topic>
            <TopicIcon>🎮</TopicIcon>게임
          </Topic>
        </TopicGroup>
        <TopicDivider />

        {/* 네 번째 카테고리 그룹 */}
        <TopicGroup>
          <Topic>
            <TopicIcon>💻</TopicIcon>IT/테크
          </Topic>
          <Topic>
            <TopicIcon>🤖</TopicIcon>인공지능
          </Topic>
          <Topic>
            <TopicIcon>🚗</TopicIcon>자동차
          </Topic>
        </TopicGroup>
      </TopicMenu>
      <ServiceButton onClick={() => goToPage("subject")}>
        관심 주제 무료 구독하러가기
      </ServiceButton>
      {/* <ImgContainer>
        <LandingThumb />
      </ImgContainer> */}
    </Container>
  );
};

export default ServiceIntro;

const Container = styled.div`
  width: 100%;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  background-color: #f0f4ff;
  align-items: center;
`;

const ServiceTitle = styled.span`
  font-size: 24px;
  font-weight: 800;
  line-height: 120%;
  margin-bottom: 18px;
  margin-top: 24px;
`;

const ServiceDesc = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 22.4px;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  text-align: center;
`;

const ServiceInput = styled.textarea`
  width: 100%;
  height: 70px;
  padding: 16px 13px;
  border-radius: 4px;
  background: #f3f3f3;
  border: none;
  resize: none;
  font-family: "Pretendard Variable";
  font-size: 20px;
  font-weight: 600;
  line-height: 40px;
  text-align: left;

  &::placeholder {
    white-space: pre-wrap;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: #939393;
    text-align: left;
  }

  &:focus {
    outline: none;
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
  margin-top: 26px;
  border-radius: 4px;
  margin-bottom: 32px;
`;

const ImgContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 60px;
`;

const TopicMenu = styled.div``;

const TopicGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  justify-content: center;
`;

const Topic = styled.div`
  background-color: #f9fafc;
  padding: 10px 12px;
  border-radius: 4px;
  display: flex;
  font-size: 14px;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const TopicIcon = styled.span`
  font-size: 18px;
`;

const TopicDivider = styled.hr`
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 10px 0;
`;
