// src/app/archive/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecoilValue, useSetRecoilState } from "recoil";
import styled from "styled-components";
import { userState } from "@/store/user";
import LogoHeader from "@/common/LogoHeader";
import { keyframes } from "styled-components";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";
import { getUserByEmail } from "@/api/apiClient";
// (VideoItem, CurrentChannel, PreviousChannel 등 타입 정의도 동일하게 복사)
interface VideoItem {
  title: string;
  section: string;
  thumbnail: string;
  upload_date: string;
  summary_data: {
    headline_title?: string;
  };
  article_date: string;
  duration?: string;
  views: number;
  video_id: string;
}

interface CurrentChannel {
  channel_title: string;
  channel_handle: string;
  channel_id: string;
  channel_thumbnail: string;
  subscribed_at: string;
  today_articles: VideoItem[];
  past_articles: VideoItem[];
}

interface PreviousChannel {
  channel_title: string;
  channel_handle: string;
  channel_id: string;
  channel_thumbnail: string;

  subscribed_at: string;
  unsubscribed_at: string;
  videos: VideoItem[];
}

interface CurrentResponse {
  current_channels: CurrentChannel[];
}

interface PreviousResponse {
  previous_channels: PreviousChannel[];
}

// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

const ArchiveChannelPage: React.FC = () => {
  const router = useRouter();
  const [currentChannels, setCurrentChannels] = useState<CurrentChannel[]>([]);
  const [previousChannels, setPreviousChannels] = useState<PreviousChannel[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const user = useRecoilValue(userState);
  const setUser = useSetRecoilState(userState);
  // Fetch archive data whenever user.id changes
  useEffect(() => {
    // if user isn't logged in yet, skip fetching
    if (!user.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [resCurrent, resPrev] = await Promise.all([
          fetch(
            `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/archive/current/${user.id}`
          ),
          fetch(
            `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/archive/history/${user.id}`
          ),
        ]);
        const dataCurrent: CurrentResponse = await resCurrent.json();
        const dataPrev: PreviousResponse = await resPrev.json();
        setCurrentChannels(dataCurrent.current_channels || []);
        setPreviousChannels(dataPrev.previous_channels || []);
      } catch (err) {
        console.error("Error fetching archive data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);
  // 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const data = await getUserByEmail(
        result.user.email!,
        result.user.displayName!
      );
      setUser({
        name: result.user.displayName!,
        email: result.user.email!,
        picture: result.user.photoURL!,
        id: data.id,
      });
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };
  // 로그인 전 안내 화면
  if (!user.email) {
    return (
      <>
        <LoginPromptWrapper>
          <LogoHeader />
          <ArchiveTitle>🔖 내 아카이브</ArchiveTitle>
          <ArchiveDescription>
            생성된 아티클을 한곳에서 관리하세요.
          </ArchiveDescription>
          <PromptBox>
            <PromptTitle>💡 로그인이 필요합니다</PromptTitle>
            <PromptDesc>
              아카이브를 보려면 Google 로그인이 필요해요.
              <br />
            </PromptDesc>
            <BrowserWarning>
              ⚠️ 카카오톡 인앱 브라우저에서는 <br />
              Google 로그인이 지원되지 않습니다.
              <br />
              <br />
              Safari, Chrome, Samsung Internet 등
              <br />
              외부 브라우저에서 시도해 주세요.
            </BrowserWarning>
            <LoginButton onClick={handleGoogleLogin}>
              Google 계정으로 로그인
            </LoginButton>
          </PromptBox>
        </LoginPromptWrapper>
      </>
    );
  }

  if (loading) {
    return (
      <LoadingOverlay>
        <Spinner />
        <LoadingText>로딩 중...</LoadingText>
      </LoadingOverlay>
    );
  }
  const noCurrentChannels = currentChannels.length === 0;
  const noPreviousChannels = previousChannels.length === 0;
  const isAllEmpty =
    currentChannels.length === 0 && previousChannels.length === 0;

  return (
    <ArchiveWrapper>
      <LogoHeader />
      <ArchiveTitle>내 아카이브</ArchiveTitle>
      <ArchiveDescription>
        생성된 아티클을 한곳에서 관리하세요.
      </ArchiveDescription>
      {isAllEmpty && (
        <EmptyWrapper>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyText>현재 구독 중이거나 이전에 등록한 채널이 없어요!</EmptyText>
          <EmptySubText>새로운 채널을 등록하고 모니터링해보세요.</EmptySubText>
        </EmptyWrapper>
      )}

      {/* ===== (1) 현재 구독 채널 ===== */}
      {!noCurrentChannels && (
        <>
          <SubSectionTitleCurrent>현재 구독 채널</SubSectionTitleCurrent>
          {currentChannels.map((chan) => (
            <ChannelCard key={chan.channel_handle}>
              <ChannelHeader>
                <ChannelThumb
                  src={
                    chan.channel_thumbnail || "https://via.placeholder.com/60"
                  }
                  alt={chan.channel_handle}
                />
                <ChannelInfo>
                  <ChannelName>{chan.channel_title}</ChannelName>
                  <ChannelHandle>{chan.channel_handle}</ChannelHandle>
                  <SubText>
                    등록 시작:{" "}
                    {new Date(chan.subscribed_at).toLocaleDateString()}
                  </SubText>
                </ChannelInfo>
              </ChannelHeader>

              {/* 오늘 생성된 아티클 */}
              <ArticleGroup>
                <SectionTitle>📌 오늘 생성된 아티클</SectionTitle>
                {chan.today_articles.length === 0 ? (
                  <NoArticleMsg>
                    오늘 생성된 아티클이 없습니다. <br />
                    내일 오전 7시에 다시 확인해주세요!
                  </NoArticleMsg>
                ) : (
                  chan.today_articles.map((vid) => (
                    <ArticleCard
                      key={vid.title}
                      onClick={() =>
                        router.push(
                          `/studio/channel/${chan.channel_handle}/${vid.video_id}`
                        )
                      }
                    >
                      <ArticleInfo>
                        <ArticleTitle>
                          {vid.summary_data.headline_title}
                        </ArticleTitle>
                        <ArticleMeta>
                          조회수 {vid.views.toLocaleString()}회 ·{" "}
                          {new Date(vid.article_date).toLocaleDateString(
                            "ko-KR",
                            {
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )}
                        </ArticleMeta>
                      </ArticleInfo>
                      <ArticleThumb src={vid.thumbnail} alt={vid.title} />
                    </ArticleCard>
                  ))
                )}
              </ArticleGroup>

              {/* 이전 생성된 아티클 */}
              <ArticleGroup>
                <SectionTitle>📁 이전 생성된 아티클</SectionTitle>
                {chan.past_articles.length === 0 ? (
                  <NoArticleMsg>
                    등록된 과거 영상 아티클이 없습니다.
                  </NoArticleMsg>
                ) : (
                  chan.past_articles.map((vid) => (
                    <ArticleCard
                      key={vid.title}
                      onClick={() =>
                        router.push(
                          `/studio/channel/${chan.channel_handle}/${vid.video_id}`
                        )
                      }
                    >
                      <ArticleInfo>
                        <ArticleTitle>
                          {vid.summary_data.headline_title}
                        </ArticleTitle>
                        <ArticleMeta>
                          조회수 {vid.views.toLocaleString()}회 ·{" "}
                          {new Date(vid.article_date).toLocaleDateString(
                            "ko-KR",
                            {
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )}
                        </ArticleMeta>
                      </ArticleInfo>
                      <ArticleThumb src={vid.thumbnail} alt={vid.title} />
                    </ArticleCard>
                  ))
                )}
              </ArticleGroup>
            </ChannelCard>
          ))}
        </>
      )}

      {/* ===== (2) 이전 등록 채널 ===== */}
      {!noPreviousChannels && (
        <>
          <SubSectionTitle>이전 등록 채널</SubSectionTitle>
          {previousChannels.map((chan) => (
            <ChannelCard key={chan.channel_handle}>
              <ChannelHeader>
                <ChannelThumb
                  src={
                    chan.channel_thumbnail || "https://via.placeholder.com/60"
                  }
                  alt={chan.channel_handle}
                />
                <ChannelInfo>
                  <ChannelName>{chan.channel_title}</ChannelName>
                  <ChannelHandle>{chan.channel_handle}</ChannelHandle>
                  <SubText>
                    구독기간:{" "}
                    {new Date(chan.subscribed_at).toLocaleDateString()} ~{" "}
                    {chan.unsubscribed_at
                      ? new Date(chan.unsubscribed_at).toLocaleDateString()
                      : "미해지"}
                  </SubText>
                </ChannelInfo>
              </ChannelHeader>

              {chan.videos.length === 0 ? (
                <NoArticleMsg>등록된 과거 영상 아티클이 없습니다.</NoArticleMsg>
              ) : (
                chan.videos.map((vid) => (
                  <ArticleCard
                    key={vid.title}
                    onClick={() =>
                      router.push(
                        `/studio/channel/${chan.channel_handle}/${vid.video_id}`
                      )
                    }
                  >
                    <ArticleInfo>
                      <ArticleTitle>
                        {vid.summary_data.headline_title}
                      </ArticleTitle>{" "}
                      <ArticleMeta>
                        조회수 {vid.views.toLocaleString()}회 ·{" "}
                        {new Date(vid.article_date).toLocaleDateString(
                          "ko-KR",
                          {
                            month: "2-digit",
                            day: "2-digit",
                          }
                        )}
                      </ArticleMeta>
                    </ArticleInfo>
                    <ArticleThumb src={vid.thumbnail} alt={vid.title} />
                  </ArticleCard>
                ))
              )}
            </ChannelCard>
          ))}
        </>
      )}
    </ArchiveWrapper>
  );
};

export default ArchiveChannelPage;

/** Styled components 아래에 동일하게 복사 **/

const ArchiveWrapper = styled.div`
  /* padding: 16px; */
  background-color: #f8f9fb;
  min-height: 100vh;
  padding-top: 20px;
`;

const ArchiveTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #333;
  margin-top: 52px;
  margin-left: 8px;
`;

const ArchiveDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 32px;
  margin-left: 8px;
`;

const SubSectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin: 40px 0 12px;
  color: #222;
  margin-left: 8px;
  margin-right: 8px;
`;

const SubSectionTitleCurrent = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin: 32px 0 12px;
  color: #222;
  margin-left: 8px;
  margin-right: 8px;
`;

/* 빈 화면일 때 UX 안내 */
const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60px;
  color: #777;
`;
const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;
const EmptyText = styled.p`
  font-size: 14px;
  font-weight: 600;
`;
const EmptySubText = styled.p`
  font-size: 13px;
  margin-top: 4px;
  color: #999;
`;

/** 채널 카드 */
const ChannelCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin-right: 8px;
  margin-left: 8px;
`;

const ChannelHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ChannelThumb = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  object-fit: cover;
  margin-right: 12px;
`;

const ChannelInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #333;
`;
const ChannelHandle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #888;
`;

const SubText = styled.div`
  font-size: 13px;
  color: #888;
  margin-top: 8px;
`;

/** 아티클 영역 */
const ArticleGroup = styled.div`
  margin-top: 12px;
`;

const TodayIndicator = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e67e22;
  margin-bottom: 6px;
`;

const PastIndicator = styled(TodayIndicator)`
  color: #3498db;
`;

// const ArticleCard = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   background: #fcfcfc;
//   border: 1px solid #eaeaea;
//   border-radius: 10px;
//   padding: 12px 14px;
//   margin-bottom: 10px;
//   cursor: pointer;
//   transition: all 0.2s ease;

//   &:hover {
//     background-color: #f4f8ff;
//     transform: translateY(-2px);
//     box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
//   }
// `;

// const ArticleInfo = styled.div`
//   flex: 1;
// `;

// const ArticleTitle = styled.div`
//   font-size: 15px;
//   font-weight: 600;
//   color: #222;
//   margin-bottom: 4px;
// `;

// const ArticleMeta = styled.div`
//   font-size: 13px;
//   color: #888;
//   margin-top: 4px;
// `;

// const ArticleThumb = styled.img`
//   width: 100px;
//   height: 64px;
//   border-radius: 6px;
//   object-fit: cover;
//   margin-left: 12px;
//   flex-shrink: 0;
// `;

const LoadingMessage = styled.p`
  text-align: center;
  margin-top: 40px;
  color: #555;
`;
const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 24px 0 6px;
  color: #222;
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
  flex-shrink: 0;
`;
const NoArticleMsg = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
  line-height: 132%;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LoadingOverlay = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #ddd;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 12px;
`;
const LoadingText = styled.div`
  font-size: 16px;
  color: #555;
  font-weight: 500;
`;

const LoginPromptWrapper = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fb;
  flex-direction: column;
`;
const PromptBox = styled.div`
  background: #fff;
  padding: 32px 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 360px;
`;
const PromptTitle = styled.h2`
  font-size: 20px;
  margin-bottom: 8px;
  font-weight: 700;
`;
const PromptDesc = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #000;
  margin-bottom: 24px;
  white-space: pre-line;
`;
const BrowserWarning = styled.div`
  color: #007bff; /* 붉은 계열로 경고 느낌 강조 */
  background: #f0f4ff; /* 연한 배경으로 구분 */
  border: 1px solid #007bff; /* 강조 테두리 */
  font-size: 14px;
  padding: 12px;
  border-radius: 6px;
  margin: 12px 0; /* 위아래 간격 */
  line-height: 1.5;
  text-align: center;
`;

const LoginButton = styled.button`
  background-color: #007bff;
  color: #fff;
  padding: 16px 32px;
  font-size: 16px;
  margin-top: 16px;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;
