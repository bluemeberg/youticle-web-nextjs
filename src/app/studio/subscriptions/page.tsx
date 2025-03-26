"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import LogoHeader from "@/common/LogoHeader";

/** 구독 채널 (YouTube API) */
interface Subscription {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
    resourceId: {
      kind: string;
      channelId: string;
    };
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
  // statistics (구독자 수 등)이 있다면 여기에 추가 가능
  statistics?: {
    subscriberCount: string;
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 세션스토리지에서 구독 채널 목록 가져오기
    const subsData = sessionStorage.getItem("mySubscriptions");
    if (subsData) {
      try {
        const parsedSubs: Subscription[] = JSON.parse(subsData);
        // publishedAt 기준 내림차순 정렬
        parsedSubs.sort(
          (a, b) =>
            new Date(b.snippet.publishedAt).getTime() -
            new Date(a.snippet.publishedAt).getTime()
        );
        setSubscriptions(parsedSubs);
      } catch (error) {
        console.error("구독 채널 파싱 오류:", error);
      }
    }
    setLoading(false);
  }, []);

  // 채널 클릭 시 -> channelId 를 사용해 "/subscriptions/[channelId]" 페이지로 이동
  const handleChannelClick = (channelId: string) => {
    router.push(`/studio/subscriptions/${channelId}`);
  };

  return (
    <Container>
      <LogoHeader />
      <Title>내 구독 채널 목록</Title>
      <Subtitle>
        모니터링할 채널을 선택하면 <Highlight>매일 새 영상을 요약</Highlight>해
        알려드립니다.
        <br />
        <SmallNote>(모니터링 없이도 개별 영상 아티클 변환 가능!)</SmallNote>
      </Subtitle>

      {loading ? (
        <Message>로딩 중...</Message>
      ) : subscriptions.length > 0 ? (
        subscriptions.map((sub) => {
          const snippet = sub.snippet;
          const thumbUrl = snippet.thumbnails?.medium?.url;
          const channelTitle = snippet.title;
          // 채널 설명이 없다면 기본 문구로 처리
          const channelDesc =
            snippet.description && snippet.description.trim().length > 0
              ? snippet.description
              : "채널 설명이 없습니다.";
          const channelId = snippet.resourceId?.channelId;

          // 예시로 구독자 정보가 statistics에 있다면 표시 (없으면 기본 문구)
          const subscriberCount = sub.statistics?.subscriberCount
            ? `구독자 ${Number(
                sub.statistics.subscriberCount
              ).toLocaleString()}명`
            : "구독자 정보 없음";

          return (
            <ChannelCard
              key={sub.id}
              onClick={() => handleChannelClick(channelId)}
            >
              <ChannelThumb src={thumbUrl} alt={channelTitle} />
              <ChannelInfo>
                <ChannelName>{channelTitle}</ChannelName>
                {/* <ChannelHandle>@{channelId}</ChannelHandle> */}
                {/* <ChannelStats>{subscriberCount}</ChannelStats> */}
                <ChannelDesc>{channelDesc}</ChannelDesc>
              </ChannelInfo>
              <RightArrow>›</RightArrow>
            </ChannelCard>
          );
        })
      ) : (
        <Message>불러온 구독 채널이 없습니다.</Message>
      )}
    </Container>
  );
}

/* -------------------- Styled Components -------------------- */
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 24px;
  background: #fff;
`;

const Title = styled.h2`
  margin: 16px;
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 700;
  margin-top: 72px;
`;

const Subtitle = styled.p`
  margin: 0 16px 16px;
  font-size: 14px;
  color: #555;
  line-height: 1.4;
`;

const Highlight = styled.span`
  color: #007bff;
  font-weight: 600;
`;

const SmallNote = styled.span`
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
`;

const Message = styled.p`
  margin-top: 72px;
  text-align: center;
  color: #999;
`;

const ChannelCard = styled.div`
  display: flex;
  align-items: center;
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
  margin: 16px 16px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: 0.2s ease;
  &:hover {
    background: #f3f9ff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ChannelThumb = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 24px;
  margin-right: 12px;
`;

const ChannelInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChannelName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #333;
`;

const ChannelHandle = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
`;

const ChannelStats = styled.div`
  font-size: 13px;
  color: #888;
  margin-top: 2px;
`;

const ChannelDesc = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #666;
  line-height: 1.3;

  /* 두 줄까지만 표시 & 나머지 숨김 */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 2줄로 자르기 */
  -webkit-box-orient: vertical; /* 수직 정렬 */
  overflow: hidden; /* 초과 내용 숨김 */

  /* 긴 단어(공백 없는 문자열)도 줄바꿈 허용 */
  white-space: normal; /* 기본 줄바꿈 허용 */
  word-break: break-word;
  overflow-wrap: break-word;
`;

const RightArrow = styled.div`
  margin-left: 8px;
  font-size: 24px;
  color: #ccc;
  align-self: center;
  transform: translateY(-1px);
`;
