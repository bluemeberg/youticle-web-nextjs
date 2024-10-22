"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { isDesktop } from "react-device-detect";
// import { YOUTUBE_TOPICS } from "@/constants/topic";

interface TopicNavProps {
  $isFixed: boolean;
  selectedTopic: string;
  handleTopicClick: (topic: string) => void;
  subjects: string[]; // 추가된 subjects prop
}

// 주제 목록 및 아이콘을 정의합니다.
const YOUTUBE_TOPICS = [
  { topic: "전체", icon: "🌐" },
  { topic: "주식", icon: "📈" },
  { topic: "부동산", icon: "🏢" },
  { topic: "가상자산", icon: "💰" },
  { topic: "경제", icon: "💵" }, // "경제" 항목 추가
  { topic: "정치", icon: "🏛️" },
  { topic: "비즈니스/사업", icon: "💼" },
  { topic: "건강", icon: "🩺" },
  { topic: "피트니스", icon: "🏋️" },
  { topic: "스포츠", icon: "⚽" },
  { topic: "연애/결혼", icon: "❤️" },
  { topic: "육아", icon: "👶" },
  { topic: "뷰티/메이크업", icon: "💄" },
  { topic: "여자 패션", icon: "👗" },
  { topic: "남자 패션", icon: "👔" },
  { topic: "요리", icon: "🍳" },
  { topic: "게임", icon: "🎮" },
  { topic: "IT/테크", icon: "💻" },
  { topic: "인공지능", icon: "🤖" },
  { topic: "자동차", icon: "🚗" },
];

const TopicNav = ({
  $isFixed,
  selectedTopic,
  handleTopicClick,
  subjects, // 추가된 props
}: TopicNavProps) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 구독 주제가 있을 경우, 해당 주제로만 필터링
  const filteredTopics =
    subjects.length > 0
      ? YOUTUBE_TOPICS.filter(({ topic }) => subjects.includes(topic))
      : YOUTUBE_TOPICS;

  const navSize = Math.ceil(filteredTopics.length / 3);
  const topicGroups = [
    filteredTopics.slice(0, navSize),
    filteredTopics.slice(navSize, navSize * 2),
    filteredTopics.slice(navSize * 2, filteredTopics.length),
  ];

  const [clientSelected, setClientSelected] = useState<string>("");

  useEffect(() => {
    setClientSelected(selectedTopic);
  }, [selectedTopic]);

  const [isClientDesktop, setIsClientDesktop] = useState(false);
  useEffect(() => {
    // 클라이언트에서만 isDesktop 값을 설정
    setIsClientDesktop(isDesktop);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setHasScrolled(containerRef.current.scrollLeft > 0);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <Container
      ref={containerRef}
      $isDesktop={isClientDesktop}
      $isFixed={$isFixed}
      $hasScrolled={hasScrolled}
      flexDirection={subjects.length > 0 ? "row" : "column"} // subjects에 따라 가로/세로 정렬 결정
    >
      {topicGroups.map((chunk, index) => (
        <Column key={index}>
          {chunk.map(({ topic, icon }) => (
            <Topic
              key={topic}
              onClick={() => handleTopicClick(topic)}
              selected={clientSelected === topic}
            >
              {icon}
              <span>{topic}</span>
            </Topic>
          ))}
        </Column>
      ))}
    </Container>
  );
};

export default TopicNav;

const Container = styled.div<{
  $isDesktop: boolean;
  $isFixed: boolean;
  $hasScrolled: boolean;
  flexDirection: string; // 추가된 props
}>`
  max-width: ${({ $isDesktop }) => ($isDesktop ? "400px" : "none")};
  display: flex;
  flex-direction: ${({ flexDirection }) =>
    flexDirection}; // props로 받아서 설정
  gap: 12px;
  padding: 12px 0;

  margin-left: ${({ $isFixed, $hasScrolled }) =>
    $isFixed ? ($hasScrolled ? "0" : "20px") : $hasScrolled ? "0" : "20px"};
  width: ${(props) =>
    props.$isFixed ? "calc(100% + 20px)" : "calc(100% + 20px)"};
  transition: margin-left 0.3s ease;

  position: ${(props) => (props.$isFixed ? "fixed" : "static")};
  top: ${(props) => (props.$isFixed ? "52px" : "auto")};
  /* z-index: ${(props) => (props.$isFixed ? 0 : 0)}; */

  overflow-x: scroll;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  background-color: #f8f9fa;
`;

const Column = styled.div`
  display: flex;
  gap: 12px;
`;

const Topic = styled.div<{ selected: boolean }>`
  width: auto;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 6px;
  border-radius: 8px;
  background-color: ${(props) => (props.selected ? "#007BFF" : "#F0F4FF")};
  color: ${(props) => (props.selected ? "#fff" : "#737373")};

  font-size: 14px;
  span {
    font-family: var(--font-Pretendard);
    font-size: 14px;
    font-weight: ${(props) => (props.selected ? 700 : 400)};
    line-height: 14.32px;
    white-space: nowrap;
    text-align: center;
  }
`;
