"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styled, { css } from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import {
  parseSubscribersCount,
  parseVideoCountcribersCount,
  timeAgo,
} from "@/utils/formatter";

interface Channel {
  id: string;
  title: string;
  handle: string;
  thumbnail: string;
  banner: string;
  overview: string;
  sub_count: number;
  description: string;
}

interface ArticleData {
  id: string;
  title: string;
  thumbnail: string;
  upload_date: string;
  summary_data: {
    headline_title?: string;
    views?: number;
  };
}

// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

export default function ChannelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { channelHandle } = params as { channelHandle: string };

  const [channel, setChannel] = useState<Channel | null>(null);
  const [todayArticles, setTodayArticles] = useState<ArticleData[]>([]);
  const [pastArticles, setPastArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannelDetail = async () => {
      try {
        const res = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/detail?channel_handle=${channelHandle}`
        );
        if (!res.ok) throw new Error("채널 정보 요청 실패");
        const data = await res.json();
        setChannel(data.channel);
        setTodayArticles(data.today_articles || []);
        setPastArticles(data.past_articles || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannelDetail();
  }, [channelHandle]);

  if (loading) return <Wrapper>로딩 중...</Wrapper>;
  if (!channel) return <Wrapper>채널 정보를 불러오지 못했습니다.</Wrapper>;

  return (
    <Wrapper>
      <LogoHeader />

      <Banner bannerUrl={channel.banner} />
      <Card>
        <ChannelInfo>
          <ChannelThumb src={channel.thumbnail} />
          <ChannelText>
            <ChannelTitle>{channel.title}</ChannelTitle>
            <SubInfo>{channel.handle}</SubInfo>
            <Subscriber>
              구독자 {parseSubscribersCount(channel.sub_count)}
            </Subscriber>
          </ChannelText>
        </ChannelInfo>
        <Desc>{channel.overview || channel.description}</Desc>
      </Card>
      <SubContainer>
        <SectionTitle>📌 오늘 생성된 아티클</SectionTitle>
        {todayArticles.length > 0 ? (
          todayArticles.map((article) => (
            <ArticleCard
              key={article.id}
              onClick={() =>
                router.push(`/studio/channel/${channel.handle}/${article.id}`)
              }
            >
              <ArticleInfo>
                <ArticleTitle>
                  {article.summary_data?.headline_title}
                </ArticleTitle>
                <ArticleMeta>
                  조회수 {(article.summary_data?.views || 0).toLocaleString()}회
                  · {timeAgo(article.upload_date)}
                </ArticleMeta>
              </ArticleInfo>
              <ArticleThumb src={article.thumbnail} />
            </ArticleCard>
          ))
        ) : (
          <NoArticleMsg>오늘 생성된 영상 아티클이 없습니다.</NoArticleMsg>
        )}
      </SubContainer>

      <SubContainer>
        <SectionTitle>📁 지난 아티클</SectionTitle>
        {pastArticles.length > 0 ? (
          pastArticles.map((article) => (
            <ArticleCard
              key={article.id}
              onClick={() =>
                router.push(`/studio/channel/${channel.handle}/${article.id}`)
              }
            >
              <ArticleInfo>
                <ArticleTitle>
                  {article.summary_data?.headline_title}
                </ArticleTitle>
                <ArticleMeta>
                  조회수
                  {parseVideoCountcribersCount(
                    article.summary_data?.views || 0
                  ).toLocaleString()}
                  회 · {timeAgo(article.upload_date)}
                </ArticleMeta>
              </ArticleInfo>
              <ArticleThumb src={article.thumbnail} />
            </ArticleCard>
          ))
        ) : (
          <NoArticleMsg>등록된 과거 영상 아티클이 없습니다.</NoArticleMsg>
        )}
      </SubContainer>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 600px;
  margin: 0 auto;
  background: #f9f9f9;
  min-height: 900px;
`;

const Banner = styled.div<{ bannerUrl: string }>`
  height: 180px;
  background: ${({ bannerUrl }) =>
    bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : "#ccc"};
`;

const Card = styled.div`
  background: white;
  margin: -40px 16px 0;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SubContainer = styled.div`
  margin-left: 16px;
  margin-right: 16px;
  margin-top: 20px;
`;

const ChannelInfo = styled.div`
  display: flex;
  /* align-items: center; */
  /* margin-bottom: 12px; */
`;

const ChannelThumb = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
`;

const ChannelText = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
`;

const SubInfo = styled.div`
  font-size: 14px;
  color: #666;
  /* margin: 4px 0; */
`;
const Subscriber = styled.div`
  font-size: 14px;
  color: #777;
  /* margin-bottom: 6px; */
  margin-top: 8px;
`;

const Desc = styled.p`
  font-size: 14px;
  color: #444;
  margin-top: 12px;
  line-height: 128%;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin: 32px 0 8px;
`;

const ArticleCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fcfcfc;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  padding: 16px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f4f8ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
  }
`;

const ArticleInfo = styled.div`
  flex: 1;
`;

const ArticleTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  line-height: 132%;
  color: #222;
  margin-bottom: 8px;
`;

const ArticleMeta = styled.div`
  font-size: 14px;
  color: #888;
`;

const ArticleThumb = styled.img`
  width: 100px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  margin-left: 12px;
`;

const NoArticleMsg = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
`;
