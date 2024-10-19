"use client"; // Ensure this is a client component

import styled from "styled-components";
import { useMemo, useState, useEffect } from "react";
import { DataProps } from "@/types/dataProps";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { dataState } from "@/store/data";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import RecommendCard from "./RecommendCard";
import EditorBizThumbnail from "@/assets/editor_biz.svg";

interface RecommendProps {
  detailData: DataProps;
}

const Recommend = ({ detailData }: RecommendProps) => {
  const RECOMMEND_TITLE = `👇 다음&nbsp;<span class='highlight'>${detailData.section}</span>&nbsp;유튜브 아티클 확인하기`;
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const setApiData = useSetRecoilState(dataState);
  const apiData = useRecoilValue<DataProps[]>(dataState);
  const [recommendData, setRecommendData] = useState<DataProps[]>([]);
  useEffect(() => {
    const getData = async () => {
      try {
        // 서버사이드에서 데이터 패칭
        const response = await fetch(
          "https://claying.shop/editor/all/article",
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("API 요청 실패");
        }

        const apiData = await response.json();
        setRecommendData(apiData);
      } catch (error) {
        console.error("Error fetching top videos:", error);
      }
    };
    getData();
  }, [setRecommendData]);

  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const filteredAndSortedData = useMemo(() => {
    const filteredData = recommendData.filter(
      (item) => item.video_id !== detailData.video_id
    );
    // const sortedData = filteredData.sort((a, b) => {
    //   if (sortCriteria === "engagement") {
    //     return b.score - a.score;
    //   } else {
    //     return b.views + b.likes * 10 - a.views + a.likes * 10;
    //
    // });
    return filteredData;
  }, [recommendData, sortCriteria]);

  return (
    <Container>
      <EditorInfoContainer>
        <EditorBizThumbnail />
        <EditorInfoTitleContainer>
          <EditorInfoTitle>유썸 비즈의 다음 아티클 확인하기 👇</EditorInfoTitle>
        </EditorInfoTitleContainer>
      </EditorInfoContainer>
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
`;

const EditorInfoContainer = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 0.5px solid #d5d5d5;
  padding-bottom: 8px;
  margin-bottom: 20px;
`;

const EditorInfoTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const EditorInfoTitle = styled.div`
  font-size: 16px;
  margin-bottom: 4px;
  font-weight: 700;
  margin-left: 8px;
`;
