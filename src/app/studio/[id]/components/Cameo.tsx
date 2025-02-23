// EditorCameo.tsx
"use client";

import React from "react";
import styled from "styled-components";

interface EditorCameoProps {
  message: string;
}

const EditorCameo: React.FC<EditorCameoProps> = ({ message }) => {
  return (
    <CameoContainer>
      <Avatar src="/images/유썸건강.svg" alt="Editor Avatar" />
      <Bubble>
        <BubbleTitle>유티클 에디터</BubbleTitle>
        <BubbleMessage>{message}</BubbleMessage>
      </Bubble>
    </CameoContainer>
  );
};

export default EditorCameo;

// 스타일
const CameoContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: #fffceb;
  border: 1px solid #ffd686;
  padding: 12px;
  border-radius: 8px;
  margin: 24px 16px; // 아티클 양 옆 여백
`;

const Avatar = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
`;

const Bubble = styled.div`
  display: flex;
  flex-direction: column;
`;

const BubbleTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #333;
`;

const BubbleMessage = styled.div`
  font-size: 14px;
  line-height: 1.4;
  color: #555;
`;
