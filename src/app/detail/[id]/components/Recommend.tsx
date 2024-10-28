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

interface RecommendProps {
  detailData: DataProps;
}

const Recommend = ({ detailData }: RecommendProps) => {
  const RECOMMEND_TITLE = `다음&nbsp;<span class='highlight'>${detailData.section}</span>&nbsp;유튜브 아티클 확인하기`;
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const setApiData = useSetRecoilState(dataState);
  const apiData = useRecoilValue<DataProps[]>(dataState);

  useEffect(() => {
    const getData = async () => {
      try {
        // 서버사이드에서 데이터 패칭
        const response = await fetch(
          "https://youticle.shop/briefing/top_videos/",
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("API 요청 실패");
        }

        const apiData = await response.json();
        setApiData(apiData);
      } catch (error) {
        console.error("Error fetching top videos:", error);
      }
    };
    if (apiData.length === 0) {
      getData();
    }
  }, [setApiData]);

  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const filteredAndSortedData = useMemo(() => {
    const filteredData = apiData.filter(
      (item) =>
        item.section === detailData.section &&
        item.video_id !== detailData.video_id
    );
    const sortedData = filteredData.sort((a, b) => {
      if (sortCriteria === "engagement") {
        return b.score - a.score;
      } else {
        return b.views + b.likes * 10 - a.views + a.likes * 10;
      }
    });
    return sortedData;
  }, [apiData, sortCriteria]);

  return (
    <Container>
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

export default Recommend;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  margin-top: -80px;
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
  font-size: 18px;
  font-weight: 400;
  margin-bottom: 32px;

  .highlight {
    font-weight: 700;
    color: black;
  }
`;
