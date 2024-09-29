"use client";

import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import { useState } from "react";
import Dropdown from "./components/Dropdown";
import FirstIcon from "@/assets/first.svg";
import SecondIcon from "@/assets/second.svg";
import ThirdIcon from "@/assets/third.svg";
import Footer from "@/components/Footer";

const SERVICE_TITLE =
  "유튜브 영상 정보의 홍수 속에서 <br/> 나만 똑똑하게 시청하는 방법.";
const SERVICE_DESCRIPTION =
  "관심 키워드를 구독해서 관련된 최신 영상들을 매일 아티클로 빠르고 편하게 읽어보세요! ";

const My = () => {
  const [value, setValue] = useState("");
  const [isServiceVaild, setIsServiceVaild] = useState(false);
  const [currentTab, setCurrentTab] = useState("데일리");

  const handleChange = (e: any) => setValue(e.target.value);
  const clickFirstBtn = () => setIsServiceVaild(true);
  const handleTabClick = (tab: string) => setCurrentTab(tab);

  return (
    <Container>
      <LogoHeader />
      {isServiceVaild ? (
        <ServiceContents>
          <Tabs>
            <Tab
              isSelected={currentTab === "데일리"}
              onClick={() => handleTabClick("데일리")}
            >
              데일리
            </Tab>
            <Tab
              isSelected={currentTab === "위클리"}
              onClick={() => handleTabClick("위클리")}
            >
              위클리
            </Tab>
          </Tabs>
          <InputSection>
            <Title>
              {currentTab === "데일리" ? "매일" : "매주"} 키워드 관련된 최신
              유튜브 영상을 아티클로 읽어드립니다.
            </Title>
            <KeywordInput
              type="text"
              value={value}
              onChange={handleChange}
              placeholder="관심 키워드를 등록해주세요!"
            />
            <Dropdown />
            <ServiceButton>
              {currentTab === "데일리" ? "데일리" : "위클리"} 구독하기
            </ServiceButton>
          </InputSection>
          <Introduce>
            <BlockSection>
              <BlockTitle>
                📌 {currentTab === "데일리" ? "데일리" : "위클리"} 키워드 구독
                기능 소개
              </BlockTitle>
              <Block>
                <div>
                  <FirstIcon /> 영상 선정 범위 :{" "}
                  {currentTab === "데일리" ? "1" : "7"}일 전 ~ 오늘 업로드된
                  영상
                </div>
                <div>
                  <SecondIcon /> 아티클 갯수 최대{" "}
                  {currentTab === "데일리" ? "3" : "6"}개 제공
                </div>
                <div>
                  <ThirdIcon /> 구독 즉시 첫 발행 후{" "}
                  {currentTab === "데일리" ? "매일" : "매주"} 오전 7시에 발행{" "}
                </div>
              </Block>
            </BlockSection>
            <BlockSection>
              <BlockTitle> 🙋 이런 키워드를 추천해요!</BlockTitle>
              <Block>
                <div>
                  <FirstIcon /> 정보의 소재가 시시각각 변하는 키워드
                </div>
                <div>
                  <SecondIcon /> 매일 정보가 쏟아지는 소재
                </div>
                <div>
                  💡 예시 : 엔비디아 - 주식 / GPT - 인공지능 / 아이폰16 - IT테크
                  등
                </div>
              </Block>
            </BlockSection>
            <BlockSection>
              <BlockTitle>🚨 이것만 주의해주세요!</BlockTitle>
              <Block>
                <span>
                  주기가 짧기 때문에 정보가 많지 않은 키워드는 아티클이 제공되지
                  않을 수 있습니다. 해당 키워드는 위클리 주기로 추천드립니다!
                </span>
              </Block>
            </BlockSection>
          </Introduce>
        </ServiceContents>
      ) : (
        <NoServiceContents>
          <ServiceTitle dangerouslySetInnerHTML={{ __html: SERVICE_TITLE }} />
          <ServiceDesc
            dangerouslySetInnerHTML={{ __html: SERVICE_DESCRIPTION }}
          />
          <ServiceInput
            value={value}
            onChange={handleChange}
            placeholder={`평소 관심있는 키워드를 등록해주세요.\n(ex, 엔비디아, 애플, 피부 관리 등)`}
          />
          <ServiceButton onClick={clickFirstBtn}>
            지금 바로 무료 체험하기
          </ServiceButton>
        </NoServiceContents>
      )}
      <Footer />
    </Container>
  );
};

export default My;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Pretendard Variable";
  padding-top: 66px;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;

const ServiceContents = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Tabs = styled.div`
  width: 100%;
  height: 46px;
  display: flex;
`;

const Tab = styled.div<{ isSelected: boolean }>`
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px 8px 0px 0px;
  background-color: ${({ isSelected }) => (isSelected ? "#30d5c8" : "#D9D9D9")};

  font-size: 16px;
  font-weight: 600;
  color: ${({ isSelected }) => (isSelected ? "#000000" : "#6A6A6A")};
`;

const InputSection = styled.div`
  display: flex;
  height: auto;
  flex-direction: column;
  padding: 28px 20px 48px 20px;
`;

const Introduce = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 24px 0 14px;
`;

const BlockSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 28px;
`;

const BlockTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  line-height: 22px;
  text-align: left;
  margin-bottom: 8px;
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 14px 20px 14px 20px;
  border: 1px solid #aeaeae;

  div {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
    text-align: left;
  }

  span {
    font-family: "Pretendard Variable";
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    text-align: left;
  }
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  text-align: left;
`;

const KeywordInput = styled.input`
  height: 52px;
  border: none;
  border-radius: 4px;
  background-color: #f3f3f3;
  padding: 16px 21px;
  margin-top: 16px;
  margin-bottom: 16px;

  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  text-align: left;

  &::placeholder {
    color: #939393;
    font-size: 16px;
    font-weight: 600;
    line-height: 19.09px;
    text-align: left;
  }

  &:focus {
    outline: none;
  }
`;

const NoServiceContents = styled.div`
  width: 100%;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  margin-bottom: 50px;
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
