"use client";

import styled from "styled-components";

const LoadingLayout = styled.main`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f4f6fb;
  color: #0f172a;
  padding: 32px;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 5px solid rgba(15, 23, 42, 0.15);
  border-top-color: rgba(59, 130, 246, 0.8);
  animation: spin 0.9s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingMessage = styled.p`
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: #334155;
`;

export default function BriefingLoading() {
  return (
    <LoadingLayout>
      <Spinner aria-label="로딩 중" />
      <LoadingMessage>브리핑을 불러오고 있어요…</LoadingMessage>
    </LoadingLayout>
  );
}
