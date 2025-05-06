"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { FaChevronRight } from "react-icons/fa";
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
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  // 검색 입력 처리
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 검색어에 따른 필터링
  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.snippet.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 채널 클릭 시 -> channelId 를 사용해 "/subscriptions/[channelId]" 페이지로 이동
  const handleChannelClick = (channelId: string) => {
    router.push(`/studio/subscriptions/${channelId}`);
  };

  return (
    <Container>
      <LogoHeader />
      <Title>내 구독 채널 목록</Title>
      <Subtitle>
        모니터링할 채널을 선택하면{" "}
        <Highlight>매일 새 영상을 자동 요약</Highlight>해 알려드립니다.
        <br />
        <SmallNote>(모니터링 없이도 개별 영상 아티클 변환 가능!)</SmallNote>
      </Subtitle>
      <SearchInput
        type="text"
        placeholder="채널 이름 검색..."
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {loading ? (
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      ) : (
        <FadeInContainer>
          {filteredSubscriptions.length > 0 ? (
            filteredSubscriptions.map((sub) => {
              const { snippet, statistics } = sub;
              const thumbUrl = snippet.thumbnails?.default?.url;
              const channelTitle = snippet.title;
              console.log(channelTitle, thumbUrl);
              const channelDesc =
                snippet.description && snippet.description.trim().length > 0
                  ? snippet.description
                  : "채널 설명이 없습니다.";
              const channelId = snippet.resourceId?.channelId;
              const subscriberCount = statistics?.subscriberCount
                ? `구독자 ${Number(
                    statistics.subscriberCount
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
                    {/* <ChannelStats>{subscriberCount}</ChannelStats> */}
                    <ChannelDesc>{channelDesc}</ChannelDesc>
                  </ChannelInfo>
                  <RightArrow>
                    <FaChevronRight size={20} color="#ccc" />
                  </RightArrow>
                </ChannelCard>
              );
            })
          ) : (
            <Message>불러온 구독 채널이 없습니다.</Message>
          )}
        </FadeInContainer>
      )}
    </Container>
  );
}

/* -------------------- Styled Components -------------------- */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 24px;
  background: #fff;
`;

const Title = styled.h2`
  margin: 72px 16px 8px;
  font-size: 18px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0 16px 16px;
  font-size: 15px;
  color: #555;
  line-height: 1.5;
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

const SearchInput = styled.input`
  display: block;
  width: calc(100% - 32px);
  margin: 0 16px 16px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Message = styled.p`
  margin-top: 72px;
  text-align: center;
  color: #999;
`;

const ChannelCard = styled.div`
  display: flex;
  align-items: flex-start;
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 16px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: 0.2s ease;
  &:hover {
    background: #f3f9ff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ChannelThumb = styled.img`
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 28px;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const RightArrow = styled.div`
  margin-left: 8px;
  display: flex;
  align-items: center;
`;

/* Loading Indicator Components */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #ccc;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/* FadeInContainer: 채널 정보 표시 시 부드럽게 나타나도록 적용 */
const FadeInContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-in-out;
`;
