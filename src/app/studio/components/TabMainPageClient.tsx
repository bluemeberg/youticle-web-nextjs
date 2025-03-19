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
import { useRouter } from "next/navigation";

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
  const [isLeavingHome, setIsLeavingHome] = useState(false); // 페이지 전환 중 여부
  const router = useRouter();
  return (
    <PageContainer>
      <LogoHeader
        onBackHome={() => {
          console.log("heelo");
          setIsLeavingHome(true); // 로딩 유지
          setTimeout(() => {
            router.push("/");
          }, 500);
        }}
      />

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
      {isLeavingHome && (
        <LoaderOverlay>
          <Spinner />
          <LoadingText>홈으로 이동 중..</LoadingText>
        </LoaderOverlay>
      )}
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
// 로딩 오버레이 스타일
const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  /* 스크롤 할 필요가 없다면 오버레이 내부만 overflow: hidden; 가능 */
`;
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 5px solid white;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: white;
  margin-top: 10px;
  font-size: 16px;
`;
