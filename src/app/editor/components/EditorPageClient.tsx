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
import EditorTopicNav from "../components/EditorTopicNav";
import { EDITOR_YOUTUBE_TOPICS } from "@/constants/editorTopic";
import TopicCard from "../../components/TopicCard";
import { timeAgo } from "../../utils/formatter";
import EditorCard from "./EditorCard";
import { EditorDataProps } from "@/types/dataProps";
import EditorPickIntroduce from "./EditorPickIntroduce";
import { off } from "process";
import EditorArticle from "./EditorArticle";
import { useRouter } from "next/navigation";

interface EditorPageClientProps {
  apiData: EditorDataProps[]; // 서버에서 전달된 데이터
}

interface Editor {
  id: string;
  name: string;
  image: string;
  keyword: string;
}

export default function EditorPageClient({ apiData }: EditorPageClientProps) {
  const setApiData = useSetRecoilState(dataState);

  useEffect(() => {
    // 클라이언트에서 받은 데이터를 Recoil 상태에 설정
    setApiData(apiData);
  }, [apiData, setApiData]);
  const [isLeavingHome, setIsLeavingHome] = useState(false); // 페이지 전환 중 여부
  const router = useRouter();

  return (
    <Container>
      <LogoHeader
        onBackHome={() => {
          setIsLeavingHome(true); // 로딩 유지
          setTimeout(() => {
            router.push("/");
          }, 500);
        }}
      />
      <EditorPickIntroduce />
      <EditorArticle data={apiData} />
      <Footer />
      {/* 로딩 오버레이 */}
      {isLeavingHome && (
        <LoaderOverlay>
          <Spinner />
          <LoadingText>홈으로 이동 중..</LoadingText>
        </LoaderOverlay>
      )}
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
