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

  return (
    <Container>
      <LogoHeader />
      <EditorPickIntroduce />
      <EditorArticle data={apiData} />
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
