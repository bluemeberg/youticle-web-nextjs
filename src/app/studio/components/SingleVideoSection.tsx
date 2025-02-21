// app/components/SingleVideoArticleSection.tsx
"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";

/**
 * 단일 영상 -> 바로 아티클 생성
 */
const SingleVideoArticleSection: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const user = useRecoilValue(userState);

  const handleCreateArticle = async () => {
    if (!user.email) {
      setStatusMessage("로그인이 필요합니다");
      return;
    }
    if (!videoUrl) {
      setStatusMessage("유튜브 URL을 입력해주세요");
      return;
    }
    setStatusMessage("아티클 생성 중...");
    // 실제 API 연동
    // ...
    setStatusMessage("아티클이 성공적으로 생성되었습니다!");
  };

  return (
    <Wrapper>
      <Title>단일 영상 아티클</Title>
      <Desc>유튜브 영상 링크를 입력해 아티클을 만들어보세요.</Desc>

      <InputRow>
        <VideoInput
          placeholder="https://www.youtube.com/watch?v=abcd1234"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <CreateButton onClick={handleCreateArticle}>생성하기</CreateButton>
      </InputRow>
      {statusMessage && <Status>{statusMessage}</Status>}
    </Wrapper>
  );
};

export default SingleVideoArticleSection;

/* styled */
const Wrapper = styled.div`
  margin-top: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
`;
const Desc = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
`;
const InputRow = styled.div`
  display: flex;
  gap: 8px;
`;
const VideoInput = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;
const CreateButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;
const Status = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: #007bff;
`;
