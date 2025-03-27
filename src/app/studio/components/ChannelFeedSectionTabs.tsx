"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { channelFeedRefreshTrigger } from "@/store/userChannelFeedStatus";
import { parseSubscribersCount, removeMarkTags } from "@/utils/formatter";

// 타입 선언
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
// API 기본 URL
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

export default function ChannelFeedSectionWithTabs() {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const refreshTrigger = useRecoilValue(channelFeedRefreshTrigger);

  // "다른 유저들" (history_feed) 관련 상태
  const [otherChannels, setOtherChannels] = useState<ChannelData[]>([]);
  const [loadingOthers, setLoadingOthers] = useState<boolean>(true);

  // "내 구독 채널" 관련 상태 (여기서는 세션스토리지에 저장된 데이터를 사용)
  const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
  const [loadingMySubs, setLoadingMySubs] = useState<boolean>(false);

  // 현재 탭 상태 (로그인되어 있으면 "mysubs", 아니면 "others")
  const [activeTab, setActiveTab] = useState<"mysubs" | "others">(
    user?.email ? "mysubs" : "others"
  );

  // ----------------- 다른 유저들 (history_feed) 불러오기 -----------------
  useEffect(() => {
    const fetchOtherChannels = async () => {
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/history_feed`
        );
        if (!response.ok) throw new Error("채널 데이터를 불러오지 못했습니다.");
        const data: ChannelData[] = await response.json();

        // channel_handle 기준 중복 제거 (가장 먼저 나온 것만 남김)
        const seen = new Map<string, ChannelData>();
        for (const item of data) {
          if (!seen.has(item.channel_handle)) {
            seen.set(item.channel_handle, item);
          }
        }
        // 최신순 정렬 (created_at 기준 내림차순)
        const uniqueChannels = Array.from(seen.values()).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOtherChannels(uniqueChannels);
      } catch (error) {
        console.error("채널 불러오기 오류:", error);
      } finally {
        setLoadingOthers(false);
      }
    };

    fetchOtherChannels();
  }, [refreshTrigger]);

  // ----------------- 내 구독 채널 불러오기 -----------------
  const GOOGLE_CLIENT_ID =
    "303228054178-8tl7e7t4tup4s3d08olhgff2ap28vvl2.apps.googleusercontent.com";

  async function fetchSubscriptions(token: string) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      if (data?.items) {
        setMySubscriptions(data.items);
        sessionStorage.setItem("mySubscriptions", JSON.stringify(data.items));
      }
    } catch (error) {
      console.error("구독 채널 불러오기 오류:", error);
    } finally {
      setLoadingMySubs(false);
    }
  }

  function loadSubsFromStorage() {
    const saved = sessionStorage.getItem("mySubscriptions");
    if (saved) {
      try {
        const parsedSubs: Subscription[] = JSON.parse(saved);
        // publishedAt 기준 내림차순 정렬
        parsedSubs.sort(
          (a, b) =>
            new Date(b.snippet.publishedAt).getTime() -
            new Date(a.snippet.publishedAt).getTime()
        );
        setMySubscriptions(parsedSubs);
      } catch (error) {
        console.error("구독 채널 파싱 오류:", error);
      }
    }
  }

  useEffect(() => {
    loadSubsFromStorage();
  }, []);

  async function handleRefreshSubs() {
    setLoadingMySubs(true);
    const savedToken = sessionStorage.getItem("myYoutubeToken");
    const savedExpire = sessionStorage.getItem("myYoutubeTokenExpire");
    const now = Date.now();

    if (savedToken && savedExpire && now < Number(savedExpire)) {
      await fetchSubscriptions(savedToken);
    } else {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            const now = Date.now();
            const expireMs = now + (tokenResponse.expires_in ?? 3600) * 1000;
            sessionStorage.setItem(
              "myYoutubeToken",
              tokenResponse.access_token
            );
            sessionStorage.setItem("myYoutubeTokenExpire", String(expireMs));
            await fetchSubscriptions(tokenResponse.access_token);
          } else {
            console.error("토큰 발급 실패");
            setLoadingMySubs(false);
          }
        },
      });
      tokenClient.requestAccessToken();
    }
  }
  const handleChannelClick = (channelId: string) => {
    router.push(`/studio/subscriptions/${channelId}`);
  };
  return (
    <FeedContainer>
      {user?.email && (
        <TabButtons>
          <TabButton
            isActive={activeTab === "mysubs"}
            onClick={() => setActiveTab("mysubs")}
          >
            내 구독 채널
          </TabButton>
          <TabButton
            isActive={activeTab === "others"}
            onClick={() => setActiveTab("others")}
          >
            다른 유저들의 채널
          </TabButton>
        </TabButtons>
      )}

      {activeTab === "mysubs" && user?.email ? (
        <MySubsWrapper>
          <TabTitle>내 구독 채널 목록</TabTitle>
          <HelpText>
            YouTube API를 통해 불러온 내 구독 채널 목록입니다.
            <br />
            토큰이 만료되었다면 아래 버튼을 눌러 다시 불러오세요.
          </HelpText>
          <ButtonRow>
            <RefreshButton onClick={handleRefreshSubs}>새로고침</RefreshButton>
          </ButtonRow>

          {loadingMySubs ? (
            <SkeletonContainer>
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </SkeletonContainer>
          ) : mySubscriptions.length === 0 ? (
            <EmptyMsg>아직 구독 채널이 없습니다. (불러오지 않음)</EmptyMsg>
          ) : (
            <SubsList>
              {mySubscriptions.map((sub: any) => {
                const snippet = sub?.snippet;
                if (!snippet) return null;
                const channelThumb =
                  snippet.thumbnails?.medium?.url ||
                  snippet.thumbnails?.default?.url ||
                  "";
                const channelTitle = snippet.title;
                const channelDesc =
                  snippet.description && snippet.description.trim().length > 0
                    ? snippet.description
                    : "채널 설명이 없습니다.";
                const channelId = snippet.resourceId?.channelId;

                return (
                  <SubsCard
                    key={sub.id}
                    onClick={() => handleChannelClick(channelId)}
                  >
                    <ThumbWrapper>
                      <SubsThumb src={channelThumb} alt={channelTitle} />
                    </ThumbWrapper>
                    <SubsInfo>
                      <SubsTitle>{channelTitle}</SubsTitle>
                      <SubsDesc>{channelDesc}</SubsDesc>
                    </SubsInfo>
                  </SubsCard>
                );
              })}
            </SubsList>
          )}
        </MySubsWrapper>
      ) : (
        <OthersWrapper>
          <TabTitle>다른 유저들이 모니터링 중인 채널</TabTitle>
          <Description>사용자가 등록하거나 변경한 채널 목록입니다.</Description>
          {loadingOthers ? (
            <SkeletonContainer>
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </SkeletonContainer>
          ) : otherChannels.length > 0 ? (
            otherChannels.map((channel) => {
              const daysAgo = Math.floor(
                (Date.now() - new Date(channel.created_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              // 채널 카드를 클릭하면 subscription 채널 상세페이지로 이동
              const handleClick = () => {
                router.push(`/studio/subscriptions/${channel.channel_handle}`);
              };
              return (
                <div key={channel.id}>
                  <EditorInfoRow>
                    <RegisterUser>{channel.user_name}</RegisterUser>
                    <RegisterTime>
                      {daysAgo === 0 ? "오늘" : `${daysAgo}일 전`}{" "}
                      {channel.history_type === "update"
                        ? "업데이트했습니다"
                        : "등록했습니다"}
                    </RegisterTime>
                  </EditorInfoRow>
                  <ChannelCard onClick={handleClick}>
                    <CardRow>
                      <CardThumbWrapper>
                        <ChannelThumb
                          src={channel.channel_thumbnail}
                          alt={channel.channel_title}
                        />
                      </CardThumbWrapper>
                      <CardBody>
                        <ChannelTitle>{channel.channel_title}</ChannelTitle>
                        <ChannelHandle>{channel.channel_handle}</ChannelHandle>
                        <Subscriber>
                          구독자 {parseSubscribersCount(channel.sub_count)}
                        </Subscriber>
                      </CardBody>
                    </CardRow>
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
            <EmptyMsg>등록된 채널이 없습니다.</EmptyMsg>
          )}
        </OthersWrapper>
      )}
    </FeedContainer>
  );
}

/* ---------------------- Styled Components ---------------------- */
const FeedContainer = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px 16px;
  margin-top: 40px;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  background-color: ${({ isActive }) => (isActive ? "#007bff" : "#f0f0f5")};
  color: ${({ isActive }) => (isActive ? "#fff" : "#333")};
  cursor: pointer;
`;

const TabTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const RefreshButton = styled.button`
  padding: 10px 14px;
  background-color: #007bff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

/* ========== MySubs (내 구독 채널) ========== */
const MySubsWrapper = styled.div`
  /* background: #fff;
  border-radius: 8px;
  padding: 16px; */
`;

const HelpText = styled.p`
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
`;

const SubsList = styled.ul`
  list-style: none;
  padding: 0;
`;

const SubsCard = styled.li`
  display: flex;
  align-items: center;
  background: #fafafa;
  background-color: #ffffff;
  border: 1px solid rgb(224, 224, 224);
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 16px 12px;
  margin-bottom: 16px;

  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
    background-color: #f9fcff;
  }
`;

const ThumbWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  overflow: hidden;
  margin-right: 12px;
`;

const SubsThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SubsInfo = styled.div`
  flex: 1;
`;

const SubsTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const SubsDesc = styled.p`
  font-size: 13px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* ========== Others (다른 유저들의 채널) ========== */
const OthersWrapper = styled.div``;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
  margin-bottom: 16px;
`;

const EditorInfoRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #444;
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
  background-color: #ffffff;
  border: 1px solid rgb(224, 224, 224);
  border-radius: 8px;
  padding: 16px 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
    background-color: #f9fcff;
  }
`;

const CardRow = styled.div`
  display: flex;
  align-items: center;
`;

const CardThumbWrapper = styled.div`
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
  font-size: 15px;
  font-weight: 700;
  color: #333;
`;

const ChannelHandle = styled.span`
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
`;

const Subscriber = styled.div`
  font-size: 13px;
  color: #999;
`;

/* Intro: 채널 설명을 2줄로 제한 */
const Intro = styled.p`
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ========== 공통 ========== */
const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonCard = styled.div`
  width: 100%;
  height: 70px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 37%, #f0f0f0 63%);
  background-size: 400% 100%;
  animation: ${shimmer} 1.4s ease infinite;
  border-radius: 8px;
`;

const EmptyMsg = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-top: 24px;
`;

/* ---------------------- Modal & Loading Overlays ---------------------- */
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
`;

const ModalContent = styled.div`
  background-color: #ffffff;
  border-radius: 6px;
  padding: 20px 16px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  position: relative;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
`;

const InfoMessage = styled.p`
  color: #333;
  margin-top: 10px;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 12px;
  line-height: 132%;
`;

const InfoDescription = styled.p`
  font-size: 14px;
  line-height: 1.4;
  color: #666;
  margin-bottom: 20px;
  text-align: left;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  z-index: 4000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LoadingSpinner = styled.div`
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  margin-top: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  line-height: 1.4;
  white-space: pre-line;
  text-align: center;
`;

const LoadingSubText = styled.p`
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.4;
  color: #000;
  white-space: pre-line;
  text-align: center;
`;

const PhoneInput = styled.input`
  width: 80%;
  padding: 12px;
  margin-top: 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
`;

const RegisterButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 14px;
  margin-top: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;
