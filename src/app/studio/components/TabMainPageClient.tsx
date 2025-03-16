"use client";

import React, { useState } from "react";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import Footer from "@/components/Footer";
// 기존: ArticleCreateSection → 이름 변경 가능 (예: MonitorChannelSection)
import ArticleCreateSection from "./ArticleCreateSection";
// 기존: ArchiveSection → 이름 변경 가능 (예: MyLibrarySection)
import ArchiveSection from "./ArchiveSection";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { userState } from "@/store/user";

/**
 * 상단 메인 탭 두 개:
 * 1) 영상 아티클 (기존: 아티클 생성)
 * 2) 내 라이브러리 (기존: 내 아카이브)
 */
export default function TabMainPageClient() {
  const [mainTab, setMainTab] = useState<"videoArticle" | "myLibrary">(
    "videoArticle"
  );
  const user = useRecoilValue(userState);
  // 로그인 안 된 상태라면 'myLibrary' 탭 숨기고, 항상 'videoArticle' 탭만 표시
  console.log(user);

  return (
    <PageContainer>
      <LogoHeader />

      {/* 메인 탭 (Pill 스타일) */}
      {!!user.email && (
        <MainTabBar>
          <MainTabButton
            isActive={mainTab === "videoArticle"}
            onClick={() => setMainTab("videoArticle")}
          >
            유튜브 아티클 생성
          </MainTabButton>
          <MainTabButton
            isActive={mainTab === "myLibrary"}
            onClick={() => setMainTab("myLibrary")}
          >
            내 아카이브
          </MainTabButton>
        </MainTabBar>
      )}

      <MainTabContent>
        {mainTab === "videoArticle" && <ArticleCreateSection />}
        {mainTab === "myLibrary" && <ArchiveSection />}
      </MainTabContent>
    </PageContainer>
  );
}

/* ============= Styled ============= */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

/** 상단 메인 탭을 Pill 스타일로 구현 */
const MainTabBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  background: #e9f4ff; /* 파스텔톤 배경 */
  border-radius: 12px 12px 0px 0px;
  margin: 16px auto 0 auto; /* 가운데 정렬, 위 약간 여백 */
  padding: 8px 16px;
  width: 100%;
`;

const MainTabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease;

  /** 활성화된 탭은 흰 배경 + 파란 텍스트 */
  background-color: ${({ isActive }) => (isActive ? "#ffffff" : "transparent")};
  color: ${({ isActive }) => (isActive ? "#007bff" : "#666")};
  box-shadow: ${({ isActive }) =>
    isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none"};

  &:hover {
    color: #007bff;
  }
`;

const MainTabContent = styled.div`
  flex: 1;
  background-color: #fafafa;
`;
