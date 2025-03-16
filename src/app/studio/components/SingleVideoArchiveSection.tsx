"use client";

import React, { useEffect, useState, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { useRouter } from "next/navigation";
import {
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
} from "@/utils/formatter";
import LikeIcon from "@/assets/like_icon.svg";
import ViewIcon from "@/assets/view_icon.svg";
interface ArchiveVideo {
  video_id: string;
  title: string;
  duration: string;
  upload_date: string;
  thumbnail: string;
  views: number;
  likes: number;
  summary_data: {
    short_summary?: string;
    headline_title: string;
  };
  article_date: string;
  channel_details: {
    channel_id: string;
    channel_name: string;
    channel_thumbnail: string;
    channel_subscribers: number;
  };
}

const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

export default function ArchiveSection() {
  const user = useRecoilValue(userState);
  const [archiveData, setArchiveData] = useState<ArchiveVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user.email) return;
    setIsLoading(true);

    fetch(`${NEXT_PUBLIC_API_BASE_URL}/editor/admin/videos/${user.id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setArchiveData(data);
      })
      .catch((err) => console.error("Failed to fetch archive data:", err))
      .finally(() => setTimeout(() => setIsLoading(false), 500));
  }, [user]);

  const sortedData = useMemo(() => {
    return [...archiveData].sort(
      (a, b) =>
        new Date(b.article_date).getTime() - new Date(a.article_date).getTime()
    );
  }, [archiveData]);

  if (isLoading) {
    return (
      <LoadingOverlay>
        <Spinner />
        <LoadingText>불러오는 중...</LoadingText>
      </LoadingOverlay>
    );
  }

  if (archiveData.length === 0) {
    return (
      <EmptyWrapper>
        <EmptyIcon>📂</EmptyIcon>
        <EmptyTitle>아직 내 아카이브에 영상이 없습니다.</EmptyTitle>
        <EmptyDesc>영상 아티클을 생성하면 이곳에서 관리할 수 있어요.</EmptyDesc>
      </EmptyWrapper>
    );
  }

  return (
    <Container>
      {sortedData.map((item) => (
        <ArchiveCard
          key={item.video_id}
          onClick={() => router.push(`/studio/${item.video_id}`)}
        >
          <CardHeader>
            <Title>{item.summary_data?.headline_title}</Title>
          </CardHeader>
          <BodyContainer>
            <Body>
              <Summary>
                <ShortSummary>
                  {removeMarkTags(item.summary_data?.short_summary || "")}
                </ShortSummary>
              </Summary>
            </Body>
            <ChannelInfoContainer>
              <Thumbnail src={item.thumbnail} />
              <VideoInfo>
                <ViewIcon />
                <span> {formatViews(item.views)}</span>
                <LikeIcon /> <span> {formatLikes(item.likes)}</span>
              </VideoInfo>
            </ChannelInfoContainer>
          </BodyContainer>
          <ChannelInfo>
            <ProfileImage src={item.channel_details.channel_thumbnail} />
            <ProfileInfo>
              <Name>{item.channel_details.channel_name}</Name>
              <SubsUpload>
                <Subscriber>
                  {parseSubscribersCount(
                    item.channel_details.channel_subscribers
                  )}
                </Subscriber>
                <UploadTime>{timeAgo(item.upload_date)}</UploadTime>
              </SubsUpload>
            </ProfileInfo>
          </ChannelInfo>
        </ArchiveCard>
      ))}
    </Container>
  );
}

function formatViews(num: number) {
  if (num >= 10000) return (num / 10000).toFixed(1) + "만회";
  if (num >= 1000) return (num / 1000).toFixed(1) + "천회";
  return num + "회";
}

function formatLikes(num: number) {
  if (num >= 10000) return (num / 10000).toFixed(1) + "만";
  if (num >= 1000) return (num / 1000).toFixed(1) + "천";
  return String(num);
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ArchiveCard = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #ddd;
  padding: 16px;
  margin-top: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    background-color: #f7faff;
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  margin-top: 4px;
`;

const BodyContainer = styled.div`
  display: flex;
  width: 100%;
`;

const Body = styled.div`
  display: flex;
  max-width: 64%;
  min-width: 64%;
`;

const Summary = styled.div`
  border-radius: 4px;
  margin-right: 12px;
`;

const ShortSummary = styled.div`
  font-size: 16px;
  line-height: 140%;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(60, 60, 61);
  text-overflow: ellipsis;
  margin-top: -2px;
`;

const ChannelInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-basis: 40%;
  max-width: 40%;
`;

const Thumbnail = styled.img`
  object-fit: cover;
  border-radius: 4px;
  width: 100%;
  height: auto;
  aspect-ratio: 132 / 72;
`;

const VideoInfo = styled.div`
  display: flex;
  font-size: 12px;
  align-items: center;
  margin-top: 4px;
  color: #696868;
  span {
    margin-right: 8px;
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  margin-top: 12px;
`;

const ProfileImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(217, 217, 217, 1);
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Name = styled.span`
  font-size: 14px;
  line-height: 128%;
`;

const UploadTime = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
`;

const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80px;
  color: #777;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const EmptyDesc = styled.div`
  font-size: 13px;
  color: #999;
`;

const LoadingOverlay = styled.div`
  position: relative;
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #555;
`;

const rotate = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 4px solid #ddd;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
  margin-bottom: 8px;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: #666;
`;
const SubsUpload = styled.div`
  display: flex;
`;
const Subscriber = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
  margin-right: 8px;
`;
