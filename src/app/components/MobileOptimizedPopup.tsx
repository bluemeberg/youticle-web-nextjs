"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

const MobileOptimizedPopup = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    // 로컬 스토리지를 확인해 팝업 표시 여부 결정
    const popupDismissed = localStorage.getItem("popupDismissed");

    if (!popupDismissed) {
      // User-Agent 기반 디바이스 감지
      const userAgent = navigator.userAgent.toLowerCase();
      const isDesktopDevice =
        !userAgent.includes("mobi") &&
        !userAgent.includes("android") &&
        !userAgent.includes("tablet");

      setIsDesktop(isDesktopDevice);

      if (isDesktopDevice) {
        setIsPopupVisible(true);
      }
    }
  }, []);

  const handleClosePopup = () => {
    setIsPopupVisible(false);
    localStorage.setItem("popupDismissed", "true");
  };

  if (!isPopupVisible) return null;

  return (
    <PopupOverlay>
      <PopupContainer>
        <Message>
          📌 유티클은 <strong>모바일 브라우저</strong>에 최적화되어 있습니다.
          <br />
          <br />
          최적의 경험을 위해 모바일 기기에서 접속해 보세요!
        </Message>
        <CloseButton onClick={handleClosePopup}>닫기</CloseButton>
      </PopupContainer>
    </PopupOverlay>
  );
};

export default MobileOptimizedPopup;

// Styled Components
const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContainer = styled.div`
  background: #ffffff;
  padding: 20px 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 320px;
`;

const Message = styled.div`
  font-size: 16px;
  line-height: 1.4;
  margin-bottom: 16px;
  color: #333;
  font-family: "Pretendard Variable";
  font-weight: 700;
`;

const CloseButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 32px;
  border-radius: 4px;
  font-size: 16px;
  font-family: "Pretendard Variable";
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;
