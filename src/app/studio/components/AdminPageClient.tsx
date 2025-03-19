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
import { useRouter } from "next/navigation";
import AdminIntroduce from "./AdminIntroduce";
import AdminArticleBeforeLogin from "./AdminAritcleBeforeLogin";
import TabAdminPageClient from "./TabAdminPageClient";
import TabMainPageClient from "./TabMainPageClient";

interface EditorPageClientProps {
  apiData: EditorDataProps[]; // 서버에서 전달된 데이터
}

export default function AdminPageClient() {
  const [isLeavingHome, setIsLeavingHome] = useState(false); // 페이지 전환 중 여부
  const router = useRouter();
  return (
    <Container>
      <LogoHeader
        onBackHome={() => {
          console.log("heelo");
          setIsLeavingHome(true); // 로딩 유지
          setTimeout(() => {
            router.push("/");
          }, 500);
        }}
      />
      {/* <AdminIntroduce />
      <AdminArticleBeforeLogin /> */}
      <TabMainPageClient />
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

const Guide = styled.p`
  font-size: 12px;
  color: #888;
  margin-top: -8px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  color: #333;
`;

const ArchiveSection = styled.div`
  margin-bottom: 40px;
  margin-top: 40px;
`;

const EditorFeedSection = styled.div`
  margin-bottom: 40px;
`;

const ArticleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ArticleCard = styled.div`
  display: flex;
  gap: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
`;

const Thumbnail = styled.img`
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 5px;
`;

const ArticleInfo = styled.div`
  flex: 1;
  h3 {
    font-size: 16px;
    margin: 0;
  }
  p {
    font-size: 14px;
    margin: 5px 0;
  }
  small {
    font-size: 12px;
    color: #777;
  }
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
