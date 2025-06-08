"use client";

import React, { useState } from "react";
import styled from "styled-components";
// 하위 섹션들
import ChannelAutoArticleSection from "./ChannelAuto";
import ChannelAutoArticleSectionWithSubs from "./channelComponents/ChannelAutoArticleSectionWithSubs";
import SingleVideoArticleSection from "./SingleVideoSection";
// import PlaylistAutoArticleSection from "./PlaylistAutoArticleSection";

const ArticleCreateSection: React.FC = () => {
  const [subTab, setSubTab] = useState<
    "channelAuto" | "playlistAuto" | "singleVideo"
  >("singleVideo");

  return (
    <Container>
      <SubTabBar>
        {/* 플레이리스트 기능 필요 시 활성화
        <SubTabButton
          isActive={subTab === "playlistAuto"}
          onClick={() => setSubTab("playlistAuto")}
        >
          플레이리스트 전체변환
        </SubTabButton>
        */}
        <SubTabButton
          isActive={subTab === "singleVideo"}
          onClick={() => setSubTab("singleVideo")}
        >
          유튜브 영상 즉시 요약
        </SubTabButton>
        <SubTabButton
          isActive={subTab === "channelAuto"}
          onClick={() => setSubTab("channelAuto")}
        >
          유튜브 채널 자동 요약
        </SubTabButton>
      </SubTabBar>

      <SubTabContent>
        {subTab === "singleVideo" && <SingleVideoArticleSection />}
        {/* {subTab === "channelAuto" && <ChannelAutoArticleSection />} */}
        {subTab === "channelAuto" && <ChannelAutoArticleSectionWithSubs />}

        {/*subTab === "playlistAuto" && <PlaylistAutoArticleSection />*/}
      </SubTabContent>
    </Container>
  );
};

export default ArticleCreateSection;

/* ============ Styled ============ */
const Container = styled.div`
  background-color: #f0f4ff;
  /* border-radius: 8px; */
  /* padding-left: 16px;
  padding-right: 16px;
  padding-top: 16px; */
  /* padding: 16px; */
`;

const SubTabBar = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  /* margin-bottom: 12px; */
  margin-left: 16px;
  margin-right: 16px;
  padding-top: 16px;
`;

const SubTabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 10px 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  border: none;
  background-color: #f0f4ff;
  cursor: pointer;
  color: ${({ isActive }) => (isActive ? "#007bff" : "#666")};
  border-bottom: 2px solid
    ${({ isActive }) => (isActive ? "#007bff" : "transparent")};

  &:hover {
    color: #007bff;
  }
`;

const SubTabContent = styled.div`
  /* padding: 8px 0; */
`;
