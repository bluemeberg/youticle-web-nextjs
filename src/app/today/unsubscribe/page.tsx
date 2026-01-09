"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import React from "react";
import TopicCard from "../../components/TopicCard";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { unsubscribedDataState } from "@/store/unsubscribeData";
import TopicNav from "../../components/TopicNav";
import LogoHeader from "@/common/LogoHeader";
import styled from "styled-components";
import { DataProps } from "@/types/dataProps";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import GoToTopBtn from "@/common/GoToTopBtn";
import CountdownTimer from "@/common/CountdownTimer";
import SortOptions from "@/common/SortOptions";
import { topicState } from "@/store/topic";

const UnsubscribePage = () => {
  const setSelectedTopic = useSetRecoilState(topicState);
  const selectedTopic = useRecoilValue(topicState);
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortOptionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const unsubscribedData = useRecoilValue(unsubscribedDataState);

  // "전체"를 포함한 미구독 주제 목록 생성
  const unsubscribedTopics = [
    "전체",
    ...Array.from(new Set(unsubscribedData.map((item) => item.section))),
  ];

  useEffect(() => {
    // 페이지 로드 시 "전체" 필터 선택
    setSelectedTopic("전체");

    if (unsubscribedData.length === 0) {
      console.error("미구독 데이터가 없습니다.");
      router.push("/");
    }
  }, [setSelectedTopic, unsubscribedData, router]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollRefTop = scrollRef.current.getBoundingClientRect().top;
        setIsFixed(scrollRefTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const filteredAndSortedData = useMemo(() => {
    const filteredData = unsubscribedData.filter((item) => {
      return selectedTopic === "전체" || item.section === selectedTopic;
    });
    const sortedData = filteredData.sort((a, b) => {
      if (sortCriteria === "engagement") {
        return b.score - a.score;
      } else {
        return b.views + b.likes * 10 - a.views + a.likes * 10;
      }
    });
    return sortedData;
  }, [selectedTopic, sortCriteria, unsubscribedData]);

  return (
    <Container>
      <LogoHeader />
      <SubContainer>
        <Title>미구독 중인 키워드 아티클</Title>
        <CountdownTimer scrollRef={scrollRef} />
        <TopicNavContainer>
          {/* <TopicNav
            $isFixed={isFixed}
            selectedTopic={selectedTopic}
            handleTopicClick={handleTopicClick}
            subjects={[]} // 구독 주제 전달
            unSubscribe={unsubscribedTopics} // "전체" 포함 미구독 주제 전달
          /> */}
        </TopicNavContainer>
      </SubContainer>
      <SortOptions
        ref={sortOptionsRef}
        isFixed={isFixed}
        sortCriteria={sortCriteria}
        tooltipVisible={tooltipVisible}
        setTooltipVisible={setTooltipVisible}
        handleSortClick={handleSortClick}
        handleClickIcon={handleClickIcon}
        variant="default"
      />
      {/* {filteredAndSortedData.map((item, index) => {
        const topicIcon = YOUTUBE_TOPICS.find(
          (topic) => topic.topic === item.section
        )?.icon;
        return <TopicCard key={item.video_id} icon={topicIcon} {...item} />;
      })} */}
    </Container>
  );
};

export default UnsubscribePage;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
`;

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 52px;

  font-family: "Pretendard Variable";
  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SubContainer = styled.div`
  background-color: #f8f9fa;
  padding: 24px 12px 12px 12px;
`;

const TopicNavContainer = styled.div`
  padding: 0;
  margin-left: -20px;
  background-color: #f8f9fa;
`;
