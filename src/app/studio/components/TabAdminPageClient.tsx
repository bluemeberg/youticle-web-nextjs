"use client";

import React, { useState } from "react";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import Footer from "@/components/Footer";

// 섹션 컴포넌트들
import ChannelAutoArticleSection from "./ChannelAuto";
import PlaylistAutoArticleSection from "./PlaylistAuto";
import SingleVideoArticleSection from "./SingleVideoSection";
import ArchiveSection from "./ArchiveSection";

export default function TabAdminPageClient() {
  const [activeTab, setActiveTab] = useState<
    "channelAuto" | "playlistAuto" | "singleVideo" | "myArchive"
  >("channelAuto");

  return (
    <PageContainer>
      <LogoHeader />

      <TabContainer>
        <TabButton
          isActive={activeTab === "channelAuto"}
          onClick={() => setActiveTab("channelAuto")}
        >
          채널 자동 아티클
        </TabButton>
        <TabButton
          isActive={activeTab === "playlistAuto"}
          onClick={() => setActiveTab("playlistAuto")}
        >
          플레이리스트 전체변환
        </TabButton>
        <TabButton
          isActive={activeTab === "singleVideo"}
          onClick={() => setActiveTab("singleVideo")}
        >
          나만의 아티클
        </TabButton>
        <TabButton
          isActive={activeTab === "myArchive"}
          onClick={() => setActiveTab("myArchive")}
        >
          내 아카이브
        </TabButton>
      </TabContainer>

      <TabContent>
        {activeTab === "channelAuto" && <ChannelAutoArticleSection />}
        {activeTab === "playlistAuto" && <PlaylistAutoArticleSection />}
        {activeTab === "singleVideo" && <SingleVideoArticleSection />}
        {activeTab === "myArchive" && <ArchiveSection />}
      </TabContent>

      <Footer />
    </PageContainer>
  );
}

/* ================ Styled ================ */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #eaeaea;
  margin-top: 72px;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 12px 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  border: none;
  background-color: #ffffff;
  cursor: pointer;
  color: ${({ isActive }) => (isActive ? "#007bff" : "#666")};
  border-bottom: 3px solid
    ${({ isActive }) => (isActive ? "#007bff" : "transparent")};

  &:hover {
    color: #007bff;
  }
`;

const TabContent = styled.div`
  padding: 16px;
`;
