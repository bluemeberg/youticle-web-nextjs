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
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [isFixed, setIsFixed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortOptionsRef = useRef<HTMLDivElement>(null);
  const [clientData, setClientData] = useState<DataProps[]>([]);

  useEffect(() => {
    // API 호출하여 데이터 가져오기
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://youticle.shop/briefing/top_videos/engagement",
          // "http://0.0.0.0:8000/briefing/top_videos/engagement",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        setClientData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
      <Divider />
      {/* <SampleCard />
      <SampleCard1 /> */}
      {clientData.map((item, index) => {
        const topicIcon = YOUTUBE_TOPICS.find(
          (topic) => topic.topic === item.section
        )?.icon;
        return <TopicCard key={item.video_id} icon={topicIcon} {...item} />;
      })}
      <ButtonContainer>
        <ServiceButton onClick={() => goToPage("today ")}>
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
  padding: 24px 8px;
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
  margin-left: 8px;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-start;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 1px;
  background-color: #d9d9d9;
  margin-bottom: 20px;
`;

const TodaySubTitle = styled.span`
  font-size: 16px;
  font-weight: 400;
  margin-left: 8px;
  line-height: 132%;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  text-align: left; /* 변경: 좌측 정렬로 */
  justify-content: flex-start; /* 변경: 좌측 정렬 유지 */
`;

const ServiceButton = styled.button`
  width: 100%;
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
