"use client"; // Ensure this is a client component

import styled from "styled-components";
import { useMemo, useState, useEffect } from "react";
import { DataProps } from "@/types/dataProps";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { dataState } from "@/store/data";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import RecommendCard from "./RecommendCard";
import CountdownTimer from "@/common/CountdownTimer";
import SortOptions from "@/common/SortOptions";
import { fetchStockVideo, fetchTopVideosBySection } from "@/api/apiClient";

interface RecommendProps {
  isUnsubscribedSection: boolean;
  section: string;
  videoId: string;
}

const RecommendDimmed = ({
  isUnsubscribedSection,
  section,
  videoId,
}: RecommendProps) => {
  const RECOMMEND_TITLE = `다음&nbsp;<span class='highlight'>${section}</span>&nbsp;유튜브 아티클 확인하기`;
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const setApiData = useSetRecoilState(dataState);
  const apiData = useRecoilValue<DataProps[]>(dataState);
  const [videos, setVideos] = useState<DataProps[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // console.log("recommend", detailData.section);
  useEffect(() => {
    async function loadVideos() {
      setLoading(true);
      try {
        if (section == "주식") {
          const data = await fetchStockVideo();
          setVideos(data);
        } else {
          const data = await fetchTopVideosBySection(section);
          setVideos(data);
        }
      } catch (error) {
        setError("Error fetching videos");
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, [section]);
  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const filteredAndSortedData = useMemo(() => {
    const filteredData = videos.filter(
      (item) => item.section === section && item.video_id !== videoId
    );
    const sortedData = filteredData.sort((a, b) => {
      if (sortCriteria === "engagement") {
        return b.score - a.score;
      } else {
        return b.views + b.likes * 10 - a.views + a.likes * 10;
      }
    });
    return sortedData;
  }, [videos, sortCriteria]);

  return (
    <Container $isUnsubscribed={isUnsubscribedSection}>
      <SubContainer>
        <RecommendTitle dangerouslySetInnerHTML={{ __html: RECOMMEND_TITLE }} />
        <CountdownTimer />
      </SubContainer>
      {filteredAndSortedData.map((item, index) => {
        const topicIcon = YOUTUBE_TOPICS.find(
          (topic) => topic.topic === item.section
        )?.icon;
        return <RecommendCard key={index} icon={topicIcon} {...item} />;
      })}
    </Container>
  );
};

export default RecommendDimmed;

// Add the prop type for $isUnsubscribed
const Container = styled.div<{ $isUnsubscribed: boolean }>`
  margin-top: ${"60px"};
`;

const SubContainer = styled.div`
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  padding-top: 32px;
`;

const RecommendTitle = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 32px;

  .highlight {
    font-weight: 700;
    color: black;
  }
`;
