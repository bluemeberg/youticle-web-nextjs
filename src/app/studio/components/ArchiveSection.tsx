"use client";

import React, { useState } from "react";
import styled from "styled-components";
import ChannelArchiveSection from "./ChannelArchiveSection";
import SingleVideoArchiveSection from "./SingleVideoArchiveSection";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
// "내 아카이브" 메인
const ArchiveSection: React.FC = () => {
  // 서브 탭: "channel" vs "single"
  const [subTab, setSubTab] = useState<"channel" | "single">("channel");
  const user = useRecoilValue(userState);
  return (
    <ArchiveContainer>
      <ArchiveTitle>{user.name}님의 아카이브</ArchiveTitle>
      <ArchiveDescription>
        생성된 아티클을 한곳에서 관리하세요.
      </ArchiveDescription>

      {/* 서브 탭 바 */}
      <SubTabBar>
        <SubTabButton
          isActive={subTab === "channel"}
          onClick={() => setSubTab("channel")}
        >
          🔖 채널 모니터링
        </SubTabButton>
        <SubTabButton
          isActive={subTab === "single"}
          onClick={() => setSubTab("single")}
        >
          🎬 영상 아티클
        </SubTabButton>
      </SubTabBar>

      <TabContent>
        {subTab === "channel" && <ChannelArchiveSection />}
        {subTab === "single" && <SingleVideoArchiveSection />}
      </TabContent>
    </ArchiveContainer>
  );
};

export default ArchiveSection;

/* ================= Styled ================= */

const ArchiveContainer = styled.div`
  padding: 16px 8px;
  background: #f9f9f9;
  border-radius: 8px;
`;

const ArchiveTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  margin-left: 8px;
  margin-right: 8px;
`;

const ArchiveDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  margin-left: 8px;
  margin-right: 8px;
`;

const SubTabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  margin-left: 8px;
  margin-right: 8px;
`;

const SubTabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  background-color: ${({ isActive }) => (isActive ? "#ffffff" : "#e6e6ff")};
  border: none;
  border-radius: 4px;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${({ isActive }) => (isActive ? "#007bff" : "#333")};
  box-shadow: ${({ isActive }) =>
    isActive ? "0px 2px 4px rgba(0,0,0,0.1)" : "none"};
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;

  &:hover {
    background-color: #fff;
    color: #007bff;
  }
`;

const TabContent = styled.div`
  /* background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px; */
`;
