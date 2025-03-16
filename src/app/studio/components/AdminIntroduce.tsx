"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { getUserByEmail } from "@/api/apiClient";
// import { dataState } from "@/store/data";  // If needed

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}

// API base URL
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

export default function AdminIntroduce() {
  const router = useRouter();
  // const setApiData = useSetRecoilState(dataState); // If you need data store
  const setUser = useSetRecoilState(userState);
  const user = useRecoilValue(userState);

  /** 영상 URL/ID 입력 */
  const [id, setId] = useState<string>("");
  /** 로딩, 에러, 모달 */
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingMessage2, setLoadingMessage2] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /** [1] 유튜브 URL → Video ID 추출 */
  const extractVideoId = (urlOrId: string): string | null => {
    try {
      const url = new URL(urlOrId);
      if (url.hostname === "youtu.be") {
        // e.g. youtu.be/XXXX
        return url.pathname.slice(1);
      }
      if (url.hostname.includes("youtube.com")) {
        if (url.pathname === "/watch") {
          return url.searchParams.get("v");
        }
        if (url.pathname.startsWith("/live/")) {
          return url.pathname.split("/")[2];
        }
      }
      return null;
    } catch (error) {
      return null; // If not a valid URL, user might be directly pasting ID
    }
  };

  /** [2] 메인 영상 생성 함수 */
  const fetchSummaryEditorVideo = async () => {
    // (A) 로그인 여부
    if (!user.email) {
      setShowLoginModal(true);
      return;
    }
    // (B) URL/ID 유효성
    if (!id.trim()) {
      setErrorMessage("🚨 유튜브 URL을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    const videoId = extractVideoId(id);
    if (!videoId) {
      setErrorMessage("🚨 올바른 유튜브 URL을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    // (C) 로딩 시작
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    setIsLoading(true);
    setLoadingMessage("아티클 구조 설계 중...");
    setLoadingMessage2(
      "영상 길이에 따라 최대 1분이 소요될 수 있습니다.\n페이지를 떠나도 생성은 계속 진행됩니다😀"
    );

    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/${encodeURIComponent(
          videoId
        )}?user_id=${encodeURIComponent(user.id)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          setErrorMessage(errorData.detail);
          setShowErrorModal(true);
        } else {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        return;
      }

      // (D) task_id가 있으면 해당 편집 화면으로 이동
      const { task_id } = await response.json();
      router.push(`/studio/${videoId}?task_id=${task_id}`);
    } catch (err) {
      console.error("요청 실패:", err);
      setErrorMessage("🚨 아티클 생성 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };

  /** [3] 로그인 성공 시 */
  const handleLoginSuccess = async (loginUser: User) => {
    setShowLoginModal(false);
    if (!loginUser.email) return;

    // (A) DB 내 유저 확인/등록
    const data = await getUserByEmail(loginUser.email, loginUser.displayName);
    setUser({
      name: loginUser.displayName,
      email: loginUser.email,
      picture: loginUser.photoURL,
      id: data.id,
    });

    // (B) 자동 진행
    if (!id.trim()) {
      setErrorMessage("🚨 유튜브 URL을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    const videoId = extractVideoId(id);
    if (!videoId) {
      setErrorMessage("🚨 올바른 유튜브 URL을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    // 영상 요청
    fetchSummaryEditorVideo();
  };

  return (
    <Wrapper>
      <GuideText>양질의 유튜브 영상 링크를 입력해보세요!</GuideText>
      <RegisterCard>
        {/* 안내 문구 (GuideText) */}
        {/* (A) 입력 영역 */}
        <InputRow>
          <UrlInput
            placeholder="https://www.youtube.com/watch?v=abcd1234"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </InputRow>
        <Guide>
          유튜브 URL을 복사해서 붙여넣거나, 공유 버튼으로 생성된 링크를
          입력하세요.
        </Guide>

        {/* (B) 버튼 영역 */}
        <ButtonRow>
          <RegisterButton onClick={fetchSummaryEditorVideo}>
            아티클 생성하기
          </RegisterButton>
        </ButtonRow>
      </RegisterCard>

      {/* (C) 로딩 오버레이 */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingMessage>{loadingMessage}</LoadingMessage>
          <SubMessage>{loadingMessage2}</SubMessage>
        </LoadingOverlay>
      )}

      {/* (D) 로그인 모달 */}
      {showLoginModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowLoginModal(false)}>×</ModalClose>
            <InfoMessage>🙋 로그인이 필요합니다.</InfoMessage>
            <InfoDescription>
              나만의 아티클 생성을 위해 로그인해주세요.
            </InfoDescription>
            <GoogleLogin onLoginSuccess={handleLoginSuccess} />
          </ModalContent>
        </ModalOverlay>
      )}

      {/* (E) 에러 모달 */}
      {showErrorModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowErrorModal(false)}>×</ModalClose>
            <InfoMessage>❌ 아티클 생성 실패</InfoMessage>
            <InfoDescription>{errorMessage}</InfoDescription>
            <ModalButton onClick={() => setShowErrorModal(false)}>
              확인
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}

/* =============== Styled =============== */

/** 최상위 Wrapper (배경 + 레이아웃) */
const Wrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background-color: #f0f4ff;
  font-family: "Pretendard Variable";
  padding: 16px;
`;

/** 카드 (RegisterCard) */
const RegisterCard = styled.div`
  border-radius: 8px;
  margin-bottom: 20px;
  /* padding: 16px; */
  /* box-shadow: 0 2px 5#141212c05); */
  /* margin: 0 16px; */
`;

/** 안내 문구 (GuideText) */
const GuideText = styled.p`
  font-size: 16px;
  color: #000;
  margin-bottom: 12px;
  line-height: 1.4;
  font-weight: 600;
  margin-top: 16px;
`;

/** 입력 영역 (InputRow) */
const InputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;
const UrlInput = styled.input`
  flex: 1;
  padding: 16px;
  font-size: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

/** 가이드 문구 (Guide) */
const Guide = styled.p`
  font-size: 12px;
  color: #616161;
  margin-top: 6px;
`;

/** 버튼 영역 (ButtonRow) + 버튼 (RegisterButton) */
const ButtonRow = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
`;
const RegisterButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  padding: 14px;
  font-size: 16px;
  margin-top: 16px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

/** 로딩 오버레이 */
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const LoadingSpinner = styled.div`
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
const LoadingMessage = styled.p`
  margin-top: 20px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 132%;
  white-space: pre-line;
`;
const SubMessage = styled.p`
  margin-top: 12px;
  font-size: 14px;
  line-height: 132%;
  color: #fff;
  text-align: center;
  white-space: pre-line;
`;

/** 모달 공통 */
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background-color: #ffffff;
  border-radius: 6px;
  padding: 20px 16px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  position: relative;
`;
const ModalClose = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
`;
const InfoMessage = styled.p`
  color: #333;
  margin-top: 10px;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 12px;
  line-height: 132%;
`;
const InfoDescription = styled.p`
  font-size: 14px;
  line-height: 1.4;
  color: #666;
  margin-bottom: 20px;
  text-align: left;
`;
const ModalButton = styled.button`
  background-color: #007bff;
  color: white;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  padding: 14px;
  width: 100%;
  cursor: pointer;
  font-size: 16px;
  &:hover {
    background-color: #0056b3;
  }
`;
