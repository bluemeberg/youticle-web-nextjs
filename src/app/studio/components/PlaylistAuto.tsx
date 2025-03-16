"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";

/** 예시 인터페이스 */
interface PlaylistProgress {
  playlistUrl: string;
  totalVideos: number;
  completed: number;
  status: "IN_PROGRESS" | "DONE";
}

const PlaylistAutoArticleSection: React.FC = () => {
  const user = useRecoilValue(userState);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [progressList, setProgressList] = useState<PlaylistProgress[]>([]);

  const handleRegisterPlaylist = () => {
    if (!user.email) {
      setErrorMessage("로그인이 필요한 기능입니다.");
      return;
    }
    if (!playlistUrl) {
      setErrorMessage("플레이리스트 URL을 입력해주세요.");
      return;
    }
    // TODO: 실제 API 호출
    const newProgress: PlaylistProgress = {
      playlistUrl,
      totalVideos: 10, // 예시
      completed: 0,
      status: "IN_PROGRESS",
    };
    setProgressList([...progressList, newProgress]);
    setPlaylistUrl("");
    setErrorMessage("");
  };

  return (
    <Container>
      <SectionTitle>플레이리스트 전체변환</SectionTitle>
      <Description>
        공개된 유튜브 플레이리스트를 등록하면, 영상 전부를 순차적으로 아티클로
        만들어드립니다.
      </Description>

      <InputBox>
        <Input
          placeholder="플레이리스트 URL"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
        />
        <Button onClick={handleRegisterPlaylist}>등록하기</Button>
      </InputBox>
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      <ProgressTitle>진행 현황</ProgressTitle>
      {progressList.map((pl, idx) => (
        <PlaylistCard key={idx}>
          <p>
            플레이리스트:
            <strong> {pl.playlistUrl}</strong>
          </p>
          <p>
            총 {pl.totalVideos}개 영상 중{" "}
            <strong>
              {pl.completed}/{pl.totalVideos}
            </strong>{" "}
            완료
          </p>
          <p>
            상태:{" "}
            <strong>
              {pl.status === "IN_PROGRESS" ? "생성 중" : "완료됨"}
            </strong>
          </p>
        </PlaylistCard>
      ))}
    </Container>
  );
};

export default PlaylistAutoArticleSection;

/* ============ Styled ============ */
const Container = styled.div`
  margin-top: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
`;

const InputBox = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const ErrorMessage = styled.div`
  font-size: 14px;
  color: #ff3b3b;
  margin-bottom: 8px;
`;

const ProgressTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const PlaylistCard = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  p {
    font-size: 14px;
    margin: 4px 0;
  }
  strong {
    font-weight: 600;
    color: #000;
  }
`;
