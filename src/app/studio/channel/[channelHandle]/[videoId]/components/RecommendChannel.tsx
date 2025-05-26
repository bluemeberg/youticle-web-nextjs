"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { DataProps } from "@/types/dataProps";
import CountdownTimer from "@/common/CountdownTimer";
import {
  ChannelArticle,
  fetchChannelDetail,
  fetchStockVideo,
  fetchTopVideosBySection,
} from "@/api/apiClient";
import RecommendCard from "@/detail/[id]/components/RecommendCard";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import { usePathname } from "next/navigation";

interface RecommendProps {
  section: string;
  videoId: string;
}

const RecommendChannel: React.FC<RecommendProps> = ({ section, videoId }) => {
  const pathname = usePathname();
  // 1) pathname 에서 channel_handle 꺼내기
  //    예: "/studio/channel/@ttimestv/ngWu-utN_Tc"
  const [, , , channelHandle] = pathname.split("/");
  // channelHandle === "@ttimestv"
  const [videos, setVideos] = useState<DataProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelArticles, setChannelArticles] = useState<ChannelArticle[]>([]);
  const [todayArticles, setTodayArticles] = useState<ChannelArticle[]>([]);
  const [pastArticles, setPastArticles] = useState<ChannelArticle[]>([]);

  const [channelInfo, setChannelInfo] = useState<any>(null); // Channel info (e.g., name, description, thumbnail)

  const uticleToday = useMemo(() => {
    return videos
      .filter((v) => v.section === section && v.video_id !== videoId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [videos, section, videoId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data =
          section === "주식"
            ? await fetchStockVideo()
            : await fetchTopVideosBySection(section);
        setVideos(data);
      } catch {
        setError("영상 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [section]);
  // 3) channelHandle 로 채널 상세 API 호출
  useEffect(() => {
    if (loading) return;
    if (!channelHandle) return;

    fetchChannelDetail(channelHandle)
      .then((res) => {
        // API 응답에서 today_articles와 past_articles를 각각 상태로 저장
        // 현재 보고 있는 videoId는 제외
        const today = res.today_articles.filter(
          (a: ChannelArticle) => a.id !== videoId
        );
        const past = res.past_articles.filter(
          (a: ChannelArticle) => a.id !== videoId
        );

        setTodayArticles(today);
        setPastArticles(past);
        setChannelInfo({ channel: res.channel });
      })
      .catch(() => {
        console.warn("채널 아티클 조회 실패");
      });
  }, [loading, channelHandle, videoId]);

  // 3) 채널 아티클은 업로드 날짜(desc) 순으로 정렬
  const sameChannel = [...channelArticles].sort(
    (a, b) =>
      new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
  );
  console.log(sameChannel);
  console.log(channelInfo);
  return (
    <Container>
      {/* 1. Channel Info */}
      {channelInfo && (
        <ChannelInfoSection>
          <ChannelThumbnail
            src={channelInfo.channel.thumbnail}
            alt={channelInfo.channel.title}
          />
          <ChannelDetails>
            <ChannelName>{channelInfo.channel.title}</ChannelName>
            <ChannelDescription>
              {channelInfo.channel.description}
            </ChannelDescription>
          </ChannelDetails>
        </ChannelInfoSection>
      )}

      {/* 오늘 업로드된 아티클 */}
      {todayArticles.length > 0 && (
        <Section>
          <SectionHeader>오늘 업로드된 아티클</SectionHeader>
          <CardList>
            {todayArticles.map((item) => (
              <RecommendCard
                key={item.video_id}
                {...item}
                icon={
                  YOUTUBE_TOPICS.find((t) => t.topic === item.section)?.icon
                }
                source=""
                path=""
              />
            ))}
          </CardList>
        </Section>
      )}

      {/* 지난 아티클 */}
      {pastArticles.length > 0 && (
        <Section>
          <SectionHeader>지난 아티클</SectionHeader>
          <CardList>
            {pastArticles.map((item) => (
              <RecommendCard
                key={item.video_id}
                {...item}
                icon={
                  YOUTUBE_TOPICS.find((t) => t.topic === item.section)?.icon
                }
                source=""
                path=""
              />
            ))}
          </CardList>
        </Section>
      )}
      {/* 3. 유티클 투데이 섹션 */}
      <Section>
        <SubContainer>
          <RecommendTitle
            dangerouslySetInnerHTML={{
              __html: `<span class='highlight'>유티클 투데이</span>에서 다음 <span class='highlight'>${section} </span>아티클 확인하기!`,
            }}
          />
          <CountdownTimer />
        </SubContainer>

        <SubRecommend>
          📌 유티클 AI 알고리즘을 통해 <span>오늘</span> 업로드된{" "}
          <span>{section}</span> 영상 중 참여도 높은 영상을 선정해 자동 요약된
          아티클을 제공합니다.
        </SubRecommend>
        <CardList>
          {uticleToday.map((item) => (
            <RecommendCard
              key={item.video_id}
              {...item}
              icon={YOUTUBE_TOPICS.find((t) => t.topic === item.section)?.icon}
              source="detail"
              path="detail"
            />
          ))}
        </CardList>
      </Section>
    </Container>
  );
};

export default RecommendChannel;

// ─── Styled Components ───

const Container = styled.div`
  margin-top: 80px;
`;

const ChannelInfoSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
`;

const ChannelThumbnail = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-right: 16px;
`;

const ChannelDetails = styled.div``;

const ChannelName = styled.h3`
  font-size: 18px;
  font-weight: 700;
`;

const ChannelDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin-top: 8px;
  line-height: 124%;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 3줄로 제한 */
  -webkit-box-orient: vertical;
  overflow: hidden; /* 초과된 텍스트를 숨김 */
  text-overflow: ellipsis; /* '...'으로 표시 */
`;
const Section = styled.div`
  margin-bottom: 40px;
`;
const SubContainer = styled.div`
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  padding-top: 32px;
  margin-top: 180px;
`;

const SectionHeader = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 16px;
`;

const RecommendTitle = styled.div`
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 40px;
  .highlight {
    font-weight: 700;
    color: black;
  }
`;

const SubRecommend = styled.div`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-top: 60px;
  span {
    font-weight: 700;
  }
`;

const ErrorMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: red;
`;
