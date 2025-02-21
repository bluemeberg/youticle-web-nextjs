// /app/components/LandingPageClient.tsx (혹은 /app/admin/AdminPageClient.tsx)
"use client";

import { useState } from "react";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import Footer from "@/components/Footer";
import ChannelAutoArticleSection from "./ChannelAuto";
import SingleVideoArticleSection from "./SingleVideoSection";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";

/** 피드에서 보여줄 히스토리 아이템 예시 */
interface ChannelHistoryItem {
  id: number;
  userName: string;
  channelName: string;
  action: "REGISTER" | "CHANGE" | "UNREGISTER";
  createdAt: string; // 시간
}

export default function TabAdminPageClient() {
  const user = useRecoilValue(userState);
  const [activeTab, setActiveTab] = useState<"channelAuto" | "singleVideo">(
    "channelAuto" // 기본 탭: 채널 자동 아티클
  );

  // 예: 더미 데이터. 실제로는 API 통해 불러옴
  const channelHistory: ChannelHistoryItem[] = [
    {
      id: 1,
      userName: "Alice",
      channelName: "@YahooFinance",
      action: "REGISTER",
      createdAt: "2023-10-01 10:30:00",
    },
    {
      id: 2,
      userName: "Bob",
      channelName: "@OldChannel -> @NewChannel",
      action: "CHANGE",
      createdAt: "2023-10-01 09:20:00",
    },
  ];

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
          isActive={activeTab === "singleVideo"}
          onClick={() => setActiveTab("singleVideo")}
        >
          나만의 아티클
        </TabButton>
      </TabContainer>

      <TabContent>
        {activeTab === "channelAuto" && <ChannelAutoArticleSection />}
        {activeTab === "singleVideo" && <SingleVideoArticleSection />}
      </TabContent>

      {/* 피드(히스토리) 섹션 */}
      <FeedSection>
        <FeedTitle>채널 등록/변경 히스토리</FeedTitle>
        {channelHistory.map((item) => (
          <FeedCard key={item.id}>
            <FeedUser>{item.userName} 님</FeedUser>
            <FeedAction>
              {item.action === "REGISTER" && (
                <>
                  <strong>채널 등록:</strong> {item.channelName}
                </>
              )}
              {item.action === "CHANGE" && (
                <>
                  <strong>채널 변경:</strong> {item.channelName}
                </>
              )}
              {item.action === "UNREGISTER" && (
                <>
                  <strong>채널 해제:</strong> {item.channelName}
                </>
              )}
            </FeedAction>
            <FeedTime>{item.createdAt}</FeedTime>
          </FeedCard>
        ))}
      </FeedSection>

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

const FeedSection = styled.div`
  margin: 20px 16px;
  background-color: #fafafa;
  border-radius: 8px;
  padding: 16px;
`;

const FeedTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const FeedCard = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
`;

const FeedUser = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const FeedAction = styled.div`
  margin-top: 4px;
  font-size: 14px;
  strong {
    color: #007bff;
    margin-right: 4px;
  }
`;

const FeedTime = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #999;
`;
