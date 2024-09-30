"use client";

import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import { useState } from "react";
import Dropdown from "./components/Dropdown";
import Footer from "@/components/Footer";
import { useRecoilState } from "recoil";
import { keywordState } from "@/store/keyword";
import ServiceDescription from "./components/ServiceDescription";
import SampleArticle from "./components/SampleArticle";

const My = () => {
  const [currentTab, setCurrentTab] = useState("데일리");
  const [topic, setTopic] = useState("");
  const [directTopic, setDirectTopic] = useState("");
  const [keyword, setKeyword] = useRecoilState(keywordState);

  const handleChangeKeyword = (e: any, currentTab: string) => {
    if (currentTab === "데일리") {
      setKeyword({
        ...keyword,
        daily: e.target.value,
      });
    } else {
      setKeyword({
        ...keyword,
        weekly: e.target.value,
      });
    }
  };

  const handleChangeTopic = (option: string) => setTopic(option);

  const handleChangeDirectTopic = (e: any) => setDirectTopic(e.target.value);

  const handleTabClick = (tab: string) => setCurrentTab(tab);

  return (
    <Container>
      <LogoHeader />
      <ServiceContents>
        <Tabs>
          <Tab
            $isSelected={currentTab === "데일리"}
            onClick={() => handleTabClick("데일리")}
          >
            데일리
          </Tab>
          <Tab
            $isSelected={currentTab === "위클리"}
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
            value={currentTab === "데일리" ? keyword.daily : keyword.weekly}
            onChange={(e) => handleChangeKeyword(e, currentTab)}
            placeholder="관심 키워드를 등록해주세요!"
          />
          <Dropdown topic={topic} handleChangeTopic={handleChangeTopic} />
          {topic === "기타" && (
            <KeywordInput
              type="text"
              value={directTopic}
              onChange={(e) => handleChangeDirectTopic(e)}
              placeholder="키워드 주제를 직접 입력해주세요!"
            />
          )}
          <ServiceButton>
            {currentTab === "데일리" ? "데일리" : "위클리"} 구독하기
          </ServiceButton>
        </InputSection>
        <ServiceDescription currentTab={currentTab} />
      </ServiceContents>
      <SampleArticle />
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

const Tab = styled.div<{ $isSelected: boolean }>`
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px 8px 0px 0px;
  background-color: ${({ $isSelected }) =>
    $isSelected ? "#30d5c8" : "#D9D9D9"};

  font-size: 16px;
  font-weight: 600;
  color: ${({ $isSelected }) => ($isSelected ? "#000000" : "#6A6A6A")};
`;

const InputSection = styled.div`
  display: flex;
  height: auto;
  flex-direction: column;
  padding: 28px 20px 48px 20px;
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
