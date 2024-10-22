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
const SUBS_TODAY_TITLE = "구독 중인 주제의 아티클";
interface YoutubeTodayProps {
  data: DataProps[];
  subjects: string[]; // 추가된 subjects prop
}

const YoutubeToday = ({ data, subjects }: YoutubeTodayProps) => {
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
    const filteredData = clientData.filter((item) => {
      // 구독한 주제가 있으면
      if (subjects.length > 0) {
        // 선택된 주제가 "전체"일 경우 구독한 주제만 보여줌
        if (selectedTopic === "전체") {
          return subjects.includes(item.section);
        }
        // 선택된 주제가 구독한 주제 중 하나일 경우 해당 주제로 필터링
        return (
          subjects.includes(selectedTopic) && item.section === selectedTopic
        );
      }

      // 구독한 주제가 없으면 선택된 주제로 필터링
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

  // 구독중인 주제 서버 불러오기
  // 주제가 있다면

  return (
    <Container>
      <SubContainer>
        {subjects.length > 0 ? (
          <TodayTitle $isSubs={true}>{SUBS_TODAY_TITLE}</TodayTitle>
        ) : (
          <TodayTitle>{TODAY_TITLE}</TodayTitle>
        )}
        {subjects.length > 0 && (
          <ChangeSubjectButton>관심 주제 변경</ChangeSubjectButton>
        )}
        <CountdownTimer scrollRef={scrollRef} />
        <TopicNavContainer>
          <TopicNav
            $isFixed={isFixed}
            selectedTopic={selectedTopic}
            handleTopicClick={handleTopicClick}
            subjects={subjects} // 구독 주제 전달
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
      <UnSubsArticleInfo>
        <UnSubsArticleInfoDescription>
          구독중인 아티클을 다 보셨나요? <br /> 미구독중인 주제의 아티클도
          구경해보세요!
        </UnSubsArticleInfoDescription>
        <UnSubsArticleInfoButton>
          미구독중인 아티클 확인하러가기
        </UnSubsArticleInfoButton>
      </UnSubsArticleInfo>
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

const ChangeSubjectButton = styled.div`
  background-color: #000;
  padding: 12px 16px;
  color: white;
  width: 140px;
  display: flex;
  justify-content: center;
  border-radius: 4px;
  font-weight: 500;
  margin-top: -12px;
  margin-bottom: 32px;
`;

const TodayTitle = styled.span<{
  $isSubs: boolean;
}>`
  font-size: 24px;
  font-weight: 700;
  line-height: 28.64px;
  color: ${({ $isSubs }) => ($isSubs ? "#007BFF" : "#000")};
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

const UnSubsArticleInfo = styled.div`
  background-color: #f0f4ff;
  padding: 20px 32px;
  display: flex;
  flex-direction: column;
  margin: 20px;
  border-radius: 8px;
  border: 1px solid #007bff;
  margin-bottom: 40px;
`;

const UnSubsArticleInfoDescription = styled.div`
  margin-bottom: 24px;
  line-height: 132%;
`;

const UnSubsArticleInfoButton = styled.div`
  background-color: black;
  color: white;
  padding: 12px 40px;
  border-radius: 4px;
`;
