"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import TopicCard from "../../components/TopicCard";
import { DataProps } from "@/types/dataProps";
import TodayIcon from "@/assets/today.svg";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import GoToTopBtn from "@/common/GoToTopBtn";
import CountdownTimer from "@/common/CountdownTimer";
import SortOptions from "@/common/SortOptions";
import TopicNav from "../../components/TopicNav";
import { topicState } from "@/store/topic";
import { useRecoilValue, useSetRecoilState } from "recoil";

const TODAY_TITLE = "미구독 중인 주제의 아티클";

interface YoutubeTodayProps {
  data: DataProps[];
}

const YoutubeToday = ({ data }: YoutubeTodayProps) => {
  const selectedTopic = useRecoilValue(topicState);
  const setSelectedTopic = useSetRecoilState(topicState);
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortOptionsRef = useRef<HTMLDivElement>(null);

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

  const [clientData, setClientData] = useState<DataProps[]>([]);

  useEffect(() => {
    // 클라이언트 측에서만 데이터를 세팅 (서버와 클라이언트의 데이터를 일치시키기 위해 초기 데이터 사용)
    setClientData(data);
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    const filteredData = clientData.filter(
      (item) => selectedTopic === "전체" || item.section === selectedTopic
    );
    const sortedData = filteredData.sort((a, b) => {
      if (sortCriteria === "engagement") {
        return b.score - a.score;
      } else {
        return b.views + b.likes * 10 - a.views + a.likes * 10;
      }
    });
    return sortedData;
  }, [clientData, selectedTopic, sortCriteria]);

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

  return (
    <Container>
      <SubContainer>
        <TodayTitle>{TODAY_TITLE}</TodayTitle>
        <CountdownTimer scrollRef={scrollRef} />
        <TopicNavContainer>
          <TopicNav
            $isFixed={isFixed}
            selectedTopic={selectedTopic}
            handleTopicClick={handleTopicClick}
          ></TopicNav>
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
      {filteredAndSortedData.map((item, index) => {
        const topicIcon = YOUTUBE_TOPICS.find(
          (topic) => topic.topic === item.section
        )?.icon;
        return <TopicCard key={item.video_id} icon={topicIcon} {...item} />;
      })}
      <GoToTopBtn isVisible={isFixed} />
    </Container>
  );
};

export default YoutubeToday;

const Container = styled.div`
  width: 100%;
  background-color: #ffff;
  display: flex;
  flex-direction: column;
  margin-top: 36px;
  font-family: "Pretendard Variable";
`;

const SubContainer = styled.div`
  background-color: #f8f9fa;
  padding: 24px 12px 12px 12px;
`;

const TodayTitle = styled.span`
  font-size: 24px;
  font-weight: 700;
  line-height: 28.64px;
  color: #000;
  letter-spacing: -1px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 4px;
  margin-top: 12px;
`;

const TodaySubTitle = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 132%;
  margin-bottom: 24px;
  margin-left: 4px;
  display: flex;
  align-items: center;
`;

const TopicNavContainer = styled.div`
  padding: 0;
  margin-left: -20px;
  background-color: #f8f9fa;
`;
