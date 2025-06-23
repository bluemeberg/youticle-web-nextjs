"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import styled from "styled-components";
import { isDesktop } from "react-device-detect";

interface TopicNavProps {
  $isFixed: boolean;
  selectedTopic: string;
  handleTopicClick: (topic: string) => void;
  subjects: string[];
  unSubscribe: string[];
  showSubscribedOnly: boolean;
  subscribedSubjects: string[]; // 구독한 주제 전달
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

const TopicNav = ({
  $isFixed,
  selectedTopic,
  handleTopicClick,
  subjects,
  unSubscribe,
  showSubscribedOnly,
  subscribedSubjects,
}: TopicNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTopics = useMemo(() => {
    if (showSubscribedOnly && subjects.length > 0) {
      // 구독 중 키워드만 표시 (전체 포함)
      const subscribedTopics = YOUTUBE_TOPICS.filter(({ topic }) =>
        subscribedSubjects.includes(topic)
      );

      // 전체를 포함한 배열 반환
      return [{ topic: "전체", icon: "🌐" }, ...subscribedTopics];
    }
    if (!showSubscribedOnly && subscribedSubjects.length > 0) {
      // 전체 토픽 중 구독 키워드를 전체 다음으로 배치
      console.log(subscribedSubjects);
      const allTopics = YOUTUBE_TOPICS.filter(({ topic }) => topic === "전체");
      console.log(allTopics, "전체");
      const subscribedTopics = YOUTUBE_TOPICS.filter(({ topic }) =>
        subscribedSubjects.includes(topic)
      );
      console.log(subscribedTopics, "구독주제");
      const otherTopics = YOUTUBE_TOPICS.filter(
        ({ topic }) => topic !== "전체" && !subscribedSubjects.includes(topic)
      );
      console.log(otherTopics, "다른주제");

      return [...allTopics, ...subscribedTopics, ...otherTopics];
    }

    // 기본적으로 전체 토픽 반환
    return YOUTUBE_TOPICS;
  }, [subjects, unSubscribe]);
  const [clientSelected, setClientSelected] = useState<string>("");

  useEffect(() => {
    setClientSelected(selectedTopic);
  }, [selectedTopic]);
  const [hasScrolled, setHasScrolled] = useState(false);

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
    <>
      <Container
        ref={containerRef}
        $isFixed={$isFixed}
        $hasScrolled={hasScrolled}
      >
        {filteredTopics.map(({ topic, icon }) => (
          <Topic
            key={topic}
            onClick={() => handleTopicClick(topic)}
            selected={clientSelected === topic}
            isSubscribed={subscribedSubjects.includes(topic)} // 구독된 주제 색상 변경
          >
            {icon}
            <span>{topic}</span>
          </Topic>
        ))}
      </Container>
      <Subtitle $isFixed={$isFixed}>
        {/* 아이콘 + 텍스트 */}
        <span style={{ marginRight: 6 }}>
          {YOUTUBE_TOPICS.find(({ topic }) => topic === selectedTopic)?.icon ||
            "🌐"}
        </span>
        {selectedTopic === "전체"
          ? "전체 TOP5 영상"
          : `${selectedTopic} TOP5 영상`}
      </Subtitle>
    </>
  );
};

export default TopicNav;

const Container = styled.div<{ $isFixed: boolean; $hasScrolled: boolean }>`
  display: flex;
  flex-wrap: nowrap; /* 한 줄로 강제 배치 */
  overflow-x: scroll;
  gap: 12px;
  padding: 12px 16px;
  position: ${({ $isFixed }) => ($isFixed ? "fixed" : "relative")};
  top: ${({ $isFixed }) => ($isFixed ? "52px" : "auto")};
  width: 100%;
  max-width: 430px;
  background-color: #fff;
  z-index: 10;
  padding-bottom: 20px;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  transition: top 1s ease; /* 위치 변경 시 부드러운 애니메이션 */
`;

const Topic = styled.div<{ selected: boolean; isSubscribed: boolean }>`
  flex: 0 0 auto;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 6px;
  border-radius: 8px;
  background-color: ${(props) => (props.selected ? "#007BFF" : "#F0F4FF")};
  color: ${(props) =>
    props.selected ? "#fff" : props.isSubscribed ? "#007BFF" : "#737373"};
  border: ${(props) =>
    props.isSubscribed ? "1px solid #007BFF" : "1px solid transparent"};
  font-size: 14px;

  cursor: pointer;

  span {
    font-family: var(--font-Pretendard);
    font-size: 14px;
    font-weight: ${(props) => (props.selected ? 700 : 400)};
    white-space: nowrap;
    text-align: center;
  }
`;
const Subtitle = styled.div<{ $isFixed: boolean }>`
  /* 네비게이션 컨테이너와 같은 padding */
  padding: 20px 16px 8px 16px;
  /* 텍스트 스타일 */
  font-size: 18px;
  font-weight: 700;
  color: #000;
  /* 배경을 아주 연하게 줘서 구분 */
  background-color: #fff;
  /* 탭 하단 경계와 컬러를 맞춤 */
  /* border-bottom: 1px solid #dde2e6; */

  /* fixed 상태일 땐 네비 바로 아래에 붙이기 */
  position: ${({ $isFixed }) => ($isFixed ? "fixed" : "relative")};
  top: ${({ $isFixed }) => ($isFixed ? "112px" : "auto")};
  width: 100%;
  z-index: ${({ $isFixed }) => ($isFixed ? 9 : "auto")};

  /* 네비 및 본문 컨테이너와 동일한 max-width & centering */
  max-width: 430px;
  margin: 0 auto;
`;
