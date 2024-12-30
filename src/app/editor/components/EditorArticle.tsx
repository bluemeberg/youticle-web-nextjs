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
import { YOUTUBE_TOPICS } from "@/constants/topic";
interface EditorArticleProps {
  data: EditorDataProps[];
}

interface Editor {
  id: string;
  name: string;
  image: string;
  keywords: string[];
}

const EditorArticle = ({ data }: EditorArticleProps) => {
  const [isFixed, setIsFixed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const editors: Editor[] = [
    {
      id: "1",
      name: "유썸 스톡",
      image: "/images/유썸스톡.svg",
      keywords: ["주식"],
    },
    {
      id: "2",
      name: "유썸 비즈",
      image: "/images/유썸비즈.svg",
      keywords: ["비즈니스/사업"],
    },
    {
      id: "3",
      name: "유썸 웰빙",
      image: "/images/유썸건강.svg",
      keywords: ["건강"],
    },
    {
      id: "4",
      name: "유썸 로맨틱",
      image: "/images/유썸로맨틱.svg",
      keywords: ["연애/결혼"],
    },
    {
      id: "5",
      name: "유썸 AI/테크",
      image: "/images/유썸AI테크.svg",
      keywords: ["인공지능", "IT/테크"],
    },
  ];
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null);

  useEffect(() => {
    console.log(listRef.current);
    const handleEditorScroll = () => {
      if (listRef.current) {
        const offsetTop = listRef.current.getBoundingClientRect().top;
        console.log(offsetTop);
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
        ? data
        : data.filter(
            (item) =>
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

  console.log(isFixed);

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
          const topicIcon = YOUTUBE_TOPICS.find(
            (topic) => topic.topic === item.section
          )?.icon;
          return (
            <TopicCard
              key={item.video_id}
              icon={topicIcon}
              subjects={[]}
              {...item}
            />
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
