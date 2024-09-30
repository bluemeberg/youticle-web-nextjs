"use client";

import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { keywordState } from "@/store/keyword";

const SERVICE_TITLE =
  "유튜브 영상 정보의 홍수 속에서 <br/> 나만 똑똑하게 시청하는 방법.";
const SERVICE_DESCRIPTION =
  "관심 키워드를 구독해서 관련된 최신 영상들을 매일 아티클로 빠르고 편하게 읽어보세요! ";

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
      <ServiceInput
        value={keyword.daily}
        onChange={handleChange}
        placeholder={`평소 관심있는 키워드를 등록해주세요.\n(ex, 엔비디아, 애플, 피부 관리 등)`}
      />
      <ServiceButton onClick={() => goToPage("my")}>
        지금 바로 무료 체험하기
      </ServiceButton>
    </Container>
  );
};

export default ServiceIntro;

const Container = styled.div`
  width: 100%;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
`;

const ServiceTitle = styled.span`
  font-size: 24px;
  font-weight: 800;
  line-height: 140%;
  margin-bottom: 18px;
`;

const ServiceDesc = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 22.4px;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
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
  text-align: center;

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
`;
