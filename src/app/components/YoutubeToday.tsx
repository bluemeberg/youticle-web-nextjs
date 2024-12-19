"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import styled from "styled-components";
import TopicCard from "./TopicCard";
import { DataProps } from "@/types/dataProps";
import TodayIcon from "@/assets/today.svg";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import GoToTopBtn from "@/common/GoToTopBtn";
import CountdownTimer from "@/common/CountdownTimer";
import SortOptions from "@/common/SortOptions";
import TopicNav from "./TopicNav";
import { topicState } from "@/store/topic";
import { useRecoilValue, useSetRecoilState, useResetRecoilState } from "recoil";
import { unsubscribedDataState } from "@/store/unsubscribeData";
import { userState } from "@/store/user";

const TODAY_TITLE = "미구독 중인 키워드 아티클";
const SUBS_TODAY_TITLE = "구독 중인 키워드 아티클";
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
  const router = useRouter();
  const setUnsubscribedData = useSetRecoilState(unsubscribedDataState);
  const resetUnsubscribedData = useResetRecoilState(unsubscribedDataState);
  const user = useRecoilValue(userState);

  // 미구독 데이터 필터링
  const unsubscribedData = data.filter(
    (item) => !subjects.includes(item.section)
  );

  // useEffect(() => {
  //   if (subjects.length > 0) {
  //     setSelectedTopic(subjects[0]);
  //   }
  //   resetUnsubscribedData();
  // }, [subjects, setSelectedTopic, resetUnsubscribedData]);

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);

    if (sortOptionsRef.current) {
      const { top } = sortOptionsRef.current.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + top - 94 - 68,
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

  // Unsubscribe 페이지로 이동하며 미구독 데이터를 전달하는 함수
  const handleUnsubscribeClick = () => {
    setUnsubscribedData(unsubscribedData);
    router.push("/today/unsubscribe");
  };
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false); // 토글 상태

  const filteredAndSortedData = useMemo(() => {
    const filteredData = clientData.filter((item) => {
      if (showSubscribedOnly && subjects.length > 0) {
        // showSubscribedOnly가 true이고 subjects가 있을 때
        if (selectedTopic === "전체") {
          return subjects.includes(item.section);
        }
        return (
          subjects.includes(selectedTopic) && item.section === selectedTopic
        );
      }

      // subjects가 없을 때 전체 데이터 반환
      return selectedTopic === "전체" || item.section === selectedTopic;
    });

    // 데이터 정렬
    const sortedData = filteredData.sort((a, b) => {
      if (sortCriteria === "engagement") {
        return b.score - a.score;
      }
      return b.views + b.likes * 10 - (a.views + a.likes * 10);
    });

    return sortedData;
  }, [clientData, showSubscribedOnly, subjects, selectedTopic, sortCriteria]);

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

  const handleChangeSubjectClick = () => {
    router.push("/subject/modify");
  };

  const filteredSubjects = showSubscribedOnly
    ? subjects
    : YOUTUBE_TOPICS.map((t) => t.topic);

  return (
    <Container>
      <Header>
        {subjects.length > 0 && ( // 구독한 주제가 있을 때만 렌더링
          <ToggleContainer>
            <ToggleLabel>📌 구독중인 키워드 아티클만 보기</ToggleLabel>
            <ToggleButtonContainer>
              <ToggleButton
                isActive={showSubscribedOnly}
                onClick={() => {
                  setShowSubscribedOnly(true); // 구독 키워드 보기 활성화
                  setSelectedTopic("전체"); // 섹션 초기화
                }}
              >
                ON
              </ToggleButton>
              <ToggleButton
                isActive={!showSubscribedOnly}
                onClick={() => {
                  setShowSubscribedOnly(false); // 구독 키워드 보기 비활성화
                  setSelectedTopic("전체"); // 섹션 초기화
                }}
              >
                OFF
              </ToggleButton>
            </ToggleButtonContainer>
          </ToggleContainer>
        )}
      </Header>
      <SubContainer ref={scrollRef}>
        <TopicNavContainer>
          <TopicNav
            $isFixed={isFixed}
            selectedTopic={selectedTopic}
            handleTopicClick={handleTopicClick}
            subjects={filteredSubjects} // 구독 주제 전달
            unSubscribe={[]}
            showSubscribedOnly={showSubscribedOnly}
            subscribedSubjects={subjects} // 구독 주제 전달 (색상 변경용)
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
        return (
          <TopicCard
            key={item.video_id}
            icon={topicIcon}
            subjects={subjects}
            {...item}
          />
        );
      })}
      {/* {subjects.length > 0 && (
        <UnSubsArticleInfo>
          <UnSubsArticleInfoDescription>
            구독중인 아티클을 다 보셨나요? <br /> 미구독중인 키워드의 아티클도
            구경해보세요!
          </UnSubsArticleInfoDescription>
          <UnSubsArticleInfoButton onClick={handleUnsubscribeClick}>
            미구독중인 아티클 확인하러가기
          </UnSubsArticleInfoButton>
        </UnSubsArticleInfo>
      )} */}
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
  margin-top: 4px;
  font-family: "Pretendard Variable";
`;

// SubContainer modified to use React.forwardRef
const SubContainer = styled.div.attrs(({ ref }) => ({ ref }))`
  background-color: #fff;
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
const ToggleButtonContainer = styled.div`
  display: flex;
  gap: 8px; /* 버튼 간 간격 */
`;
const TodayTitle = styled.span<{
  $isSubs?: boolean;
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

const TopicNavContainer = styled.div`
  padding: 0;
  background-color: #f8f9fa;
`;

const UnSubsArticleInfo = styled.div`
  background-color: #f0f4ff;
  padding: 20px 20px;
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
  display: flex;
  justify-content: center;
  font-weight: 500;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  border: 1px solid #e9e9e9;
  width: 100%;
  margin-left: 16px;
  margin-right: 16px;
  margin-top: 8px;
  border-radius: 4px;
`;

const ToggleLabel = styled.span`
  font-size: 14px;
  font-weight: 400;
`;

const ToggleButton = styled.button<{ isActive: boolean }>`
  width: 60px;
  height: 30px;
  background-color: ${(props) => (props.isActive ? "#007bff" : "#F0F4FF")};
  color: ${(props) => (props.isActive ? "#fff" : "#737373")};
  font-weight: ${(props) => (props.isActive ? 700 : 400)};
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;
