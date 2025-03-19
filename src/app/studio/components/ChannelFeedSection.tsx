"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { parseSubscribersCount, removeMarkTags } from "@/utils/formatter";
import { useRecoilValue } from "recoil";
import { channelFeedRefreshTrigger } from "@/store/userChannelFeedStatus";

interface ChannelData {
  id: string;
  user_id: number;
  user_name: string;
  channel_handle: string;
  channel_title: string;
  channel_description: string;
  channel_overview: string;
  channel_thumbnail: string;
  channel_banner: string;
  sub_count: number;
  created_at: string;
  history_type: string;
}

// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

const ChannelFeedSection: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const refreshTrigger = useRecoilValue(channelFeedRefreshTrigger);
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/history_feed`
        );
        if (!response.ok) throw new Error("Failed to fetch channel data");

        const data: ChannelData[] = await response.json();
        // ✅ 중복 제거 로직: channel_handle 기준 가장 최근 것만 남김
        const seen = new Map<string, ChannelData>();
        for (const item of data) {
          if (!seen.has(item.channel_handle)) {
            seen.set(item.channel_handle, item); // 처음 나온 핸들만 추가
          }
        }

        // 최신순 보장하려면 Map -> Array 후 다시 정렬
        const uniqueChannels = Array.from(seen.values()).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setChannels(uniqueChannels);
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [refreshTrigger]);

  return (
    <FeedContainer>
      <FeedTitle>채널 등록 이력</FeedTitle>
      <Description>사용자가 등록하거나 변경한 채널 목록입니다.</Description>

      {loading ? (
        <SkeletonContainer>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </SkeletonContainer>
      ) : channels.length > 0 ? (
        channels.map((channel) => {
          const daysAgo = Math.floor(
            (Date.now() - new Date(channel.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const handleClick = () => {
            router.push(`/studio/channel/${channel.channel_handle}`);
          };

          return (
            <div key={channel.id}>
              <EditorInfoRow>
                <RegisterUser>{channel.user_name}</RegisterUser>
                <RegisterTime>
                  님이 {daysAgo === 0 ? "오늘" : `${daysAgo}일 전에`}{" "}
                  {channel.history_type === "update"
                    ? "업데이트했습니다."
                    : "최초 등록했습니다."}
                </RegisterTime>
              </EditorInfoRow>
              <ChannelCard onClick={handleClick}>
                <ChannelCardWrapper>
                  <ThumbWrapper>
                    <ChannelThumb
                      src={channel.channel_thumbnail}
                      alt={channel.channel_title}
                    />
                  </ThumbWrapper>
                  <CardBody>
                    <ChannelTitle>{channel.channel_title}</ChannelTitle>
                    <ChannelHandle>{channel.channel_handle}</ChannelHandle>
                    <Subscriber>
                      구독자 {parseSubscribersCount(channel.sub_count)}
                    </Subscriber>
                  </CardBody>
                </ChannelCardWrapper>
                <Intro>
                  {removeMarkTags(channel.channel_overview) ||
                    channel.channel_description ||
                    "채널 설명이 없습니다."}
                </Intro>
              </ChannelCard>
            </div>
          );
        })
      ) : (
        <NoChannels>등록된 채널이 없습니다.</NoChannels>
      )}
    </FeedContainer>
  );
};

export default ChannelFeedSection;

const FeedContainer = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px 16px;
  margin-top: 40px;
`;

const FeedTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
`;

const EditorInfoRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
  color: #444;
  margin-top: 20px;
`;

const RegisterUser = styled.span`
  font-weight: 600;
  margin-right: 4px;
  color: #333;
`;

const RegisterTime = styled.span`
  font-size: 12px;
  color: #666;
`;

const ChannelCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #ffffff;
  border: 1px solid rgb(224, 224, 224);
  border-radius: 8px;
  padding: 16px 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
    background-color: #f9fcff;
  }
`;
const ChannelCardWrapper = styled.div`
  display: flex;
`;
const ThumbWrapper = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 30px;
  overflow: hidden;
  margin-right: 12px;
`;

const ChannelThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ChannelTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #333;
  /* margin-bottom: 2px; */
`;

const Subscriber = styled.div`
  font-size: 14px;
  color: #777;
  margin-bottom: 6px;
`;

const Intro = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 132%;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoChannels = styled.p`
  font-size: 14px;
  color: #555;
  padding: 16px 0;
  text-align: center;
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SkeletonCard = styled.div`
  width: 100%;
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
`;
const ChannelHandle = styled.span`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;
