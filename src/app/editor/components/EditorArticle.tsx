"use client";

import React from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import styled from "styled-components";
import { EditorDataProps } from "@/types/dataProps";
import { EDITOR_YOUTUBE_TOPICS } from "@/constants/editorTopic";
import { timeAgo } from "../../utils/formatter";
import EditorCard from "./EditorCard";
import { off } from "process";
import TopicCard from "@/components/TopicCard";
interface EditorArticleProps {
  data: EditorDataProps[];
}

interface Editor {
  id: string;
  name: string;
  image: string;
  keywords: string[];
}

const YOUTUBE_TOPICS = [
  { topic: "전체", icon: "🌐" },
  { topic: "주식", icon: "📈" },
  { topic: "부동산", icon: "🏢" },
  { topic: "가상자산", icon: "💰" },
  { topic: "경제", icon: "💵" },
  { topic: "정치", icon: "🏛️" },
  { topic: "비즈니스/사업", icon: "💼" },
  { topic: "건강", icon: "🩺" },
  { topic: "피트니스", icon: "🏋️" },
  { topic: "연애/결혼", icon: "❤️" },
  { topic: "육아", icon: "👶" },
  { topic: "뷰티/메이크업", icon: "💄" },
  { topic: "여자 패션", icon: "👗" },
  { topic: "남자 패션", icon: "👔" },
  { topic: "요리", icon: "🍳" },
  { topic: "IT/테크", icon: "💻" },
  { topic: "인공지능", icon: "🤖" },
  { topic: "자동차", icon: "🚗" },
  { topic: "여행", icon: "✈️" },
  { topic: "과학", icon: "🔬" },
  { topic: "역사", icon: "📜" },
];

const EditorArticle = ({ data }: EditorArticleProps) => {
  const [isFixed, setIsFixed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const editors: Editor[] = [
    {
      id: "1",
      name: "유썸 투자",
      image: "/images/유썸스톡.png",
      keywords: ["주식", "부동산", "가상자산"],
    },
    {
      id: "2",
      name: "유썸 비즈",
      image: "/images/유썸비즈.png",
      keywords: ["비즈니스/사업"],
    },
    {
      id: "3",
      name: "유썸 메디컬",
      image: "/images/유썸메디컬.png",
      keywords: ["건강"],
    },
    {
      id: "4",
      name: "유썸 로맨틱",
      image: "/images/유썸로맨틱.png",
      keywords: ["연애/결혼"],
    },
    {
      id: "5",
      name: "유썸 AI/테크",
      image: "/images/유썸테크.png",
      keywords: ["인공지능", "IT/테크"],
    },
  ];
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null);

  useEffect(() => {
    const handleEditorScroll = () => {
      if (listRef.current) {
        const offsetTop = listRef.current.getBoundingClientRect().top;
        setIsFixed(offsetTop <= 52); // 고정 여부 업데이트
      }
    };
    window.addEventListener("scroll", handleEditorScroll);
    handleEditorScroll(); // 초기 실행

    return () => {
      window.removeEventListener("scroll", handleEditorScroll);
    };
  }, []);
  // 데이터 필터링 로직
  const filteredData = useMemo(() => {
    const filtered =
      selectedEditor === null
        ? data.filter((item) => Object.keys(item.summary_data).length !== 0) // summary_data가 빈 객체면 제외
        : data.filter(
            (item) =>
              Object.keys(item.summary_data).length !== 0 && // summary_data가 빈 객체면 제외
              item.section &&
              editors.some(
                (editor) =>
                  editor.name === selectedEditor &&
                  editor.keywords.some((keyword) =>
                    item.section.includes(keyword)
                  )
              )
          );
    // 복사본 생성 후 정렬
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.upload_date).getTime();
      const dateB = new Date(b.upload_date).getTime();
      return dateB - dateA;
    });
  }, [selectedEditor, data]);

  return (
    <>
      <EditorListContainer ref={listRef}>
        <EditorListContainerSub>
          <EditorList isFixed={isFixed}>
            {editors.map((editor) => (
              <EditorItem key={editor.id}>
                <EditorImage
                  src={editor.image}
                  alt={editor.name}
                  isSelected={selectedEditor === editor.name}
                  onClick={() =>
                    setSelectedEditor(
                      selectedEditor === editor.name ? null : editor.name
                    )
                  }
                />
                <EditorName isSelected={selectedEditor === editor.name}>
                  {editor.name}
                </EditorName>
              </EditorItem>
            ))}
          </EditorList>
        </EditorListContainerSub>
      </EditorListContainer>

      <EditorContainer>
        {filteredData.map((item, index) => {
          const topicInfo = YOUTUBE_TOPICS.find(
            (topic) => topic.topic === item.section
          );
          return (
            <>
              <Section>
                {topicInfo?.icon} {topicInfo?.topic || item.section}
              </Section>
              <TopicCard
                key={item.video_id}
                icon={topicInfo?.icon}
                subjects={[]}
                metricLabel=""
                metricValue={0}
                rank={0}
                {...item}
              />
            </>
          );
        })}
      </EditorContainer>
    </>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 48px;
  background-color: #ffffff;
  height: 100vh;
  /* &::-webkit-scrollbar {
    display: none;
  } */

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;

const EditorContainer = styled.div`
  margin-top: 12px;
  border-radius: 8px;
  margin-top
  background-color: #f9f9f9;
`;

const ArticleDate = styled.div`
  color: #494848;
  font-size: 14px;
  margin-bottom: 8px;
  margin-left: 4px;
`;

const EditorListContainer = styled.div.attrs(({ ref }) => ({ ref }))`
  background-color: #ffffff;
  position: relative; /* 부모 컨테이너의 기준점 설정 */
  margin-top: 12px;
`;

const EditorListContainerSub = styled.div`
  background-color: #f8f9fa;
  padding: 0;
`;

const EditorList = styled.div<{ isFixed: boolean }>`
  display: flex;
  gap: 10px;
  overflow-x: auto; /* 가로 스크롤 허용 */
  padding: 6px 12px 4px 12px;
  position: ${({ isFixed }) => (isFixed ? "fixed !important" : "relative")};
  top: ${({ isFixed }) => (isFixed ? "52px !important" : "auto")};
  width: ${({ isFixed }) => (isFixed ? "calc(100vw)" : "100%")};
  background-color: #fff;
  z-index: 10;
  max-width: 430px;
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 및 Edge */
  border-bottom: ${({ isFixed }) => (isFixed ? "1px solid #c4c4c4" : null)};
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
  image-rendering: crisp-edges;
  object-fit: cover;*/
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

export default EditorArticle;

const Section = styled.div`
  display: inline-flex; /* 텍스트 크기에 맞게 가로폭을 설정 */
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background-color: #f9fafc;
  padding: 6px 8px; /* 내부 여백 */
  border-radius: 4px; /* 둥근 테두리 */
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 넘치는 텍스트 말줄임표 처리 */
  box-sizing: border-box; /* 패딩 포함한 크기 계산 */
  color: #80858a; /* 구독 여부에 따른 색상 */
  height: 32px;
  border: 1px solid #c4c4c4; /* 구독 여부에 따른 테두리 */
  margin-left: 8px;
  margin-top: 12px;
`;
