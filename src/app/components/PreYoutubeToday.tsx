"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import TopicCard from "./TopicCard";
import { DataProps } from "@/types/dataProps";
import TodayIcon from "@/assets/today.svg";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import GoToTopBtn from "@/common/GoToTopBtn";
import CountdownTimerCenter from "./CountdownTimerCenter";
import SortOptions from "@/common/SortOptions";
import TopicNav from "./TopicNav";
import { topicState } from "@/store/topic";
import { useRecoilValue, useSetRecoilState } from "recoil";
import SampleCard from "../my/components/SampleCard";
import SampleCard1 from "../my/components/SampleCard1";
import { useRouter } from "next/navigation";

const TODAY_TITLE = "👀 오늘의 유튜브 아티클 맛보기";

interface YoutubeTodayProps {
  data: DataProps[];
}

const YoutubeToday = () => {
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

  // useEffect(() => {
  //   // 클라이언트 측에서만 데이터를 세팅 (서버와 클라이언트의 데이터를 일치시키기 위해 초기 데이터 사용)
  //   setClientData(data);
  // }, [data]);

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
  const router = useRouter();

  const goToPage = (url: string) => router.push(url);

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
      <TodayTitle>{TODAY_TITLE}</TodayTitle>
      <TodaySubTitle>
        오늘 업로드된 주요 영상들을 아티클로 읽어보세요! <br />
        구독 없이도 아티클 일부 내용들을 미리 볼 수 있습니다.
      </TodaySubTitle>
      <CountdownTimerCenter />
      <SampleCard />
      <SampleCard1 />
      {/* {filteredAndSortedData.map((item, index) => {
        const topicIcon = YOUTUBE_TOPICS.find(
          (topic) => topic.topic === item.section
        )?.icon;
        return <TopicCard key={item.video_id} icon={topicIcon} {...item} />;
      })} */}
      <ButtonContainer>
        <ServiceButton onClick={() => goToPage("today")}>
          더 많은 아티클을 확인하고 싶다면? 👉🏻
        </ServiceButton>
      </ButtonContainer>
      <GoToTopBtn isVisible={isFixed} />
    </Container>
  );
};

export default YoutubeToday;

const Container = styled.div`
  width: 100%;
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
`;

const TodayTitle = styled.span`
  font-size: 24px;
  font-weight: 800;
  line-height: 28.64px;
  letter-spacing: -1px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  justify-content: center;
`;

const TodaySubTitle = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 132%;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
`;

const ServiceButton = styled.button`
  width: 80%;
  height: 60px;
  background-color: #007bff;
  color: #ffffff;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  margin-top: 26px;
  border-radius: 4px;
  margin-bottom: 32px;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
