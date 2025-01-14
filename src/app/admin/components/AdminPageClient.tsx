// /app/components/LandingPageClient.tsx (클라이언트 컴포넌트)
"use client";

import { useEffect, useState, useRef } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import Footer from "../../components/Footer";
import EditorIcon from "@/assets/editor.svg";
import EditorBizThumbnail from "@/assets/editor_biz.svg";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import { eidtorTopicState } from "@/store/editorTopic";
import { EDITOR_YOUTUBE_TOPICS } from "@/constants/editorTopic";
import TopicCard from "../../components/TopicCard";
import { timeAgo } from "../../utils/formatter";
import { EditorDataProps } from "@/types/dataProps";
import { off } from "process";

interface EditorPageClientProps {
  apiData: EditorDataProps[]; // 서버에서 전달된 데이터
}

export default function AdminPageClient() {
  const setApiData = useSetRecoilState(dataState);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [id, setId] = useState<string>(""); // 입력받은 id 상태
  const [section] = useState<string>("연애/결혼"); // 고정된 section 값
  console.log(id);
  const handleGenerate = async () => {
    try {
      const response = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("생성 실패");

      const data = await response.json();
      console.log("생성 완료:", data);
    } catch (error) {
      console.error(error);
      alert("아티클 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };
  const [data, setData] = useState<any>(null); // 응답 데이터 상태
  console.log(data);
  // API 요청 함수
  const fetchSummaryEditorVideo = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 60초 타임아웃

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://youticle.shop/editor/${encodeURIComponent(
          id
        )}?section=${encodeURIComponent(section)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json", // JSON 응답 요청
          },
          signal: controller.signal, // AbortController를 통한 타임아웃
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
      }

      const result = await response.json();
      if (result === "success") {
        const response = await fetch(
          `https://youticle.shop/editor/article/${id}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`첫 번째 요청 실패: HTTP ${response.status}`);
        }
        const result = await response.json();
        console.log(result);
      }
      setData(result); // 응답 데이터 설정
    } catch (err) {
      if (err.name === "AbortError") {
        console.error("요청 시간이 초과되었습니다.");
      } else {
        console.error("요청 실패:", err);
      }
    } finally {
      setIsLoading(false); // 로딩 종료
      clearTimeout(timeoutId); // 타임아웃 클리어
    }
  };

  return (
    <Container>
      <LogoHeader />
      {/* URL 입력 필드 */}
      {isLoading && <div className="spinner">로딩 중...</div>}
      <InputContainer>
        <Input
          type="text"
          placeholder="예: https://www.youtube.com/watch?v=abcd1234"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <Button onClick={fetchSummaryEditorVideo}>
          {" "}
          {isLoading ? "불러오는 중..." : "아티클 생성"}
        </Button>
      </InputContainer>
      <Footer />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 48px;
  background-color: #ffffff;
  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 500px;
  margin-bottom: 30px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: #ffffff;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;
