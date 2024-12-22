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
  const [isFixed, setIsFixed] = useState(false);
  const selectedTopic = useRecoilValue(eidtorTopicState);
  const setSelectedTopic = useSetRecoilState(eidtorTopicState);
  const setApiData = useSetRecoilState(dataState);
  const sortOptionsRef = useRef<HTMLDivElement>(null);
  const EDITOR_TITLE = "유티클 에디터 픽";
  const EDITOR_SUBTITLE =
    "카테고리 별 유티클 에디터들이 선정한 영상을 아티클로 제공하고 있습니다.";
  const user = useRecoilValue(userState);
  useEffect(() => {
    // 클라이언트에서 받은 데이터를 Recoil 상태에 설정
    setApiData(apiData);
  }, [apiData, setApiData]);
  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);

    if (sortOptionsRef.current) {
      const { top } = sortOptionsRef.current.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + top - 94 - 112,
        behavior: "smooth",
      });
    }
  };

  // article_date를 기준으로 오름차순 정렬
  const sortedApiData = [...apiData].sort((a, b) => {
    return (
      new Date(b.article_date).getTime() - new Date(a.article_date).getTime()
    );
  });

  const editors: Editor[] = [
    {
      id: "1",
      name: "유썸 테크",
      image: "/images/editor1.png",
      keyword: "인공지능",
    },
    {
      id: "2",
      name: "유썸 경제",
      image: "/images/editor2.png",
      keyword: "경제",
    },
    {
      id: "3",
      name: "유썸 뷰티",
      image: "/images/editor3.png",
      keyword: "뷰티/메이크업",
    },
    {
      id: "4",
      name: "유썸 여행",
      image: "/images/editor4.png",
      keyword: "여행",
    },
    {
      id: "5",
      name: "유썸 여행",
      image: "/images/editor4.png",
      keyword: "여행",
    },
  ];
  const [selectedEditor, setSelectedEditor] = useState<string>("전체");

  return (
    <Container>
      <LogoHeader />
      <EditorPickIntroduce />
      {/* <TopicNavContainer>
        <EditorTopicNav
          $isFixed={isFixed}
          selectedTopic={selectedTopic}
          handleTopicClick={handleTopicClick}
        ></EditorTopicNav>
      </TopicNavContainer> */}
      <EditorListContainer>
        <EditorList>
          {/* 전체 보기 추가 */}
          {/* <EditorItem
          isSelected={selectedEditor === "전체"}
          onClick={() => setSelectedEditor("전체")}
        >
          <EditorImage src="/images/all.png" alt="전체 보기" />
          <EditorName>전체</EditorName>
        </EditorItem> */}
          {editors.map((editor) => (
            <EditorItem key={editor.id}>
              <EditorImage
                src={editor.image}
                alt={editor.name}
                isSelected={selectedEditor === editor.keyword}
                onClick={() => setSelectedEditor(editor.keyword)}
              />
              <EditorName isSelected={selectedEditor === editor.keyword}>
                {editor.name}
              </EditorName>
            </EditorItem>
          ))}
        </EditorList>
      </EditorListContainer>

      {/* <EditorInfoContainer>
        <EditorBizThumbnail />
        <EditorInfoTitleContainer>
          <EditorInfoTitle>유썸 비즈</EditorInfoTitle>
          <EditorInfoDescription>
            양질의 유튜브 비즈니스/사업 관련 영상을 읽어드립니다.
          </EditorInfoDescription>
        </EditorInfoTitleContainer>
      </EditorInfoContainer> */}
      <EditorContainer>
        {sortedApiData.map((item, index) => {
          const topicIcon = EDITOR_YOUTUBE_TOPICS.find(
            (topic) => topic.topic === item.section
          )?.icon;
          return (
            <div key={item.video_id}>
              <ArticleDate>{timeAgo(item.article_date)} 업로드</ArticleDate>
              <EditorCard icon={topicIcon} {...item} />
            </div>
          );
        })}
      </EditorContainer>
      <Footer />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: #ffffff;
  height: 100vh;
  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;

const TopicNavContainer = styled.div`
  padding: 0;
  width: 100%;
`;

const EditorContainer = styled.div`
  padding: 20px 12px;
`;

const EditorTitle = styled.span`
  font-size: 24px;
  font-weight: 800;
  line-height: 28.64px;
  color: rgba(0, 123, 255, 1);
  letter-spacing: -1px;
  margin-bottom: 12px;
  margin-left: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EditorSubTitle = styled.div`
  font-size: 16px;
  font-weight: 400;
  line-height: 120%;
  margin-left: 12px;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const EditorInfoContainer = styled.div`
  display: flex;
  margin-left: 12px;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 0.5px solid #ababab;
  margin-right: 12px;
  margin-top: 20px;
`;

const EditorInfoTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const EditorInfoTitle = styled.div`
  font-size: 16px;
  margin-bottom: 4px;
  font-weight: 700;
  margin-left: 8px;
`;

const EditorInfoDescription = styled.div`
  font-size: 14px;
  margin-left: 8px;
`;

const ArticleDate = styled.div`
  color: #494848;
  font-size: 14px;
  margin-bottom: 8px;
  margin-left: 4px;
`;

const EditorListContainer = styled.div`
  position: relative;
`;

const EditorList = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto; /* 가로 스크롤 허용 */
  padding: 16px 12px;

  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 및 Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }
`;

const EditorItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border: none; /* EditorItem 자체에는 테두리 제거 */
  transition: all 0.3s ease-in-out;
  min-width: 80px; /* 최소 너비 */
  flex-shrink: 0; /* 스크롤 시 아이템이 줄어들지 않도록 설정 */
`;

const EditorImage = styled.img<{ isSelected: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-bottom: 8px;
  border: ${({ isSelected }) =>
    isSelected
      ? "2px solid #007bff"
      : "2px solid #ddd"}; /* 선택된 경우 파란색 테두리 */
  transition: border 0.3s ease-in-out;
`;

const EditorName = styled.span<{ isSelected: boolean }>`
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${({ isSelected }) =>
    isSelected
      ? "rgba(0, 123, 255, 1)"
      : "transparent"}; /* 선택된 경우 배경색 변경 */
  color: ${({ isSelected }) =>
    isSelected ? "white" : "black"}; /* 선택된 경우 배경색 변경 */
  transition: background-color 0.3s ease-in-out;
`;
