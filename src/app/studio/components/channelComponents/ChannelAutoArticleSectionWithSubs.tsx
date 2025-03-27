"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import ChannelFeedSection from "../ChannelFeedSection";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { useRouter } from "next/navigation";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { getUserByEmail } from "@/api/apiClient";
import {
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
} from "@/utils/formatter";
import { channelFeedRefreshTrigger } from "@/store/userChannelFeedStatus";
import ChannelFeedSectionWithTabs from "../ChannelFeedSectionTabs";

const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

// ----------------- 타입 선언 -----------------
interface ChannelData {
  id: string;
  user_id: number;
  user_name: string;
  channel_handle: string;
  title: string;
  description: string;
  overview: string;
  thumbnail: string;
  banner: string;
  sub_count: number;
  view_count: number;
  video_count: number;
  created_at: string;
}

interface VideoData {
  video_id: string;
  title: string;
  section: string;
  upload_date: string;
  duration: string;
  thumbnail: string;
  views: number;
  [key: string]: any;
}

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  // Add other properties as needed
}

// ----------------- 메인 컴포넌트 -----------------
export default function ChannelAutoArticleSection() {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);
  const setFeedRefresh = useSetRecoilState(channelFeedRefreshTrigger);

  // 채널 등록/변경 및 오늘 생성된 아티클 상태
  const [channelInput, setChannelInput] = useState("");
  const [registeredChannel, setRegisteredChannel] =
    useState<ChannelData | null>(null);
  const [todayArticles, setTodayArticles] = useState<VideoData[]>([]);

  // 모달/로딩/에러 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingMessage2, setLoadingMessage2] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showChangeModal, setShowChangeModal] = useState(false);

  // 채널 직접 입력 폼 토글 (신규 사용자용)
  const [showManualForm, setShowManualForm] = useState(false);
  const handleManualButton = () => setShowManualForm((prev) => !prev);

  const GOOGLE_CLIENT_ID =
    "303228054178-8tl7e7t4tup4s3d08olhgff2ap28vvl2.apps.googleusercontent.com";
  // ----------------- 채널 등록/변경 로직 -----------------
  const handleRegister = () => {
    if (!user.email) {
      setShowLoginModal(true);
      return;
    }
    handleRegisterAfterLogin();
  };

  const handleRegisterAfterLogin = async () => {
    if (!channelInput.trim()) {
      setErrorMessage("채널 핸들이나 URL을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    setIsLoading(true);
    setLoadingMessage(
      "✨ 지금은 최초 등록이므로 최신 영상의 아티클을 즉시 생성 중이에요."
    );
    setLoadingMessage2(
      "※ 다음부터는 매일 아침 7시에 자동으로 새 영상을 감지하여 아티클로 만들어드려요."
    );
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/channel/${encodeURIComponent(
          channelInput
        )}?user_id=${user.id}`,
        {
          method: "GET",
          headers: { accept: "application/json" },
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        if (response.status === 400) {
          const errData = await response.json();
          setErrorMessage(errData.detail);
          setShowErrorModal(true);
        } else {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        return;
      }
      const { task_id, video_id } = await response.json();
      router.push(
        `/studio/channel/${channelInput}/${video_id}?task_id=${task_id}`
      );
    } catch (err) {
      console.error("등록 오류:", err);
      setErrorMessage("채널 등록 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };

  const handleUpdateChannel = async () => {
    if (!channelInput.trim() || !registeredChannel) {
      setErrorMessage("변경할 채널 핸들을 입력해주세요!");
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);
    setLoadingMessage("채널 정보를 업데이트 중...");
    setLoadingMessage2("다음날 오전 7시부터 신규 채널을 모니터링합니다!");
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/update/${
          user.id
        }?old_handle=${encodeURIComponent(
          registeredChannel.channel_handle
        )}&new_handle=${encodeURIComponent(channelInput)}`,
        {
          method: "PUT",
          headers: { accept: "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("채널 변경 실패");
      }
      await fetchRegisteredChannel();
      await fetchTodayArticles(user.id);
      setFeedRefresh((prev) => prev + 1);
      setIsEditing(false);
      setChannelInput("");
    } catch (err) {
      console.error("채널 변경 오류:", err);
      setErrorMessage("채널 변경 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };

  // API 호출 로직: 채널 변경 (새 채널 핸들 사용)
  const performChannelUpdate = async (newHandle: string) => {
    if (!newHandle.trim() || !registeredChannel) {
      setErrorMessage("변경할 채널 핸들을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);
    setLoadingMessage("채널 정보를 업데이트 중...");
    setLoadingMessage2("다음날 오전 7시부터 신규 채널을 모니터링합니다!");

    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/update/${
          user.id
        }?old_handle=${encodeURIComponent(
          registeredChannel.channel_handle
        )}&new_handle=${encodeURIComponent(newHandle)}`,
        {
          method: "PUT",
          headers: { accept: "application/json" },
        }
      );
      if (!response.ok) throw new Error("채널 변경 실패");
      await fetchRegisteredChannel();
      await fetchTodayArticles(user.id);
      setFeedRefresh((prev) => prev + 1);
      setIsEditing(false);
      setChannelInput("");
    } catch (err) {
      console.error("채널 변경 오류:", err);
      setErrorMessage("채널 변경 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };
  const handleCancelChange = () => {
    setIsEditing(false);
    setChannelInput("");
  };

  // ----------------- 로그인 & 폰번호 등록 -----------------
  const handleLoginSuccess = async (loginUser: {
    email: string;
    displayName: string;
    photoURL: string;
  }) => {
    setShowLoginModal(false);
    try {
      const data = await getUserByEmail(loginUser.email, loginUser.displayName);
      setUserState({
        name: loginUser.displayName,
        email: loginUser.email,
        picture: loginUser.photoURL,
        id: data.id,
      });
      const res = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${data.id}`
      );
      const json = await res.json();
      const existingChannel = json[0];
      if (existingChannel) {
        setRegisteredChannel(existingChannel);
        setErrorMessage(
          `이미 '${existingChannel.title}' 채널이 등록되어 있습니다.\n채널 변경을 원하신다면 &quot;채널 변경하기&quot; 버튼을 이용해주세요.`
        );
        setShowErrorModal(true);
        return;
      }
      if (!data.phone) {
        setShowPhoneModal(true);
      } else {
        handleRegisterAfterLogin();
      }
    } catch (err) {
      console.error("로그인 후 사용자 데이터 업데이트 오류:", err);
    }
  };

  const savePhoneNumberAndRegister = async () => {
    const trimmed = phoneNumber.trim();
    if (!/^010-\d{4}-\d{4}$/.test(trimmed)) {
      setErrorMessage("올바른 번호를 입력해주세요 (예: 010-1234-5678).");
      setShowErrorModal(true);
      return;
    }
    try {
      const res = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/users/phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, phone_number: trimmed }),
      });
      if (!res.ok) throw new Error("폰번호 저장 실패");
      setShowPhoneModal(false);
      handleRegisterAfterLogin();
    } catch (err) {
      console.error("폰번호 등록 오류:", err);
      setErrorMessage("전화번호 등록 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    }
  };

  // ----------------- 오늘 아티클 & 채널 조회 -----------------
  const fetchTodayArticles = async (userId: number) => {
    try {
      const res = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/archive/today/${userId}`
      );
      if (!res.ok) throw new Error("아티클 조회 실패");
      const json = await res.json();
      setTodayArticles(json.today_articles || []);
    } catch (err) {
      console.error("오늘 아티클 조회 실패:", err);
    }
  };

  const fetchRegisteredChannel = async () => {
    try {
      const res = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${user.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setRegisteredChannel(data[0] || null);
      }
    } catch (err) {
      console.error("채널 조회 실패:", err);
    }
  };

  useEffect(() => {
    if (!user.id) {
      setRegisteredChannel(null);
      setTodayArticles([]);
      return;
    }
    fetchRegisteredChannel();
    fetchTodayArticles(user.id);
  }, [user.id]);

  const truncateOrOverview = () => {
    if (!registeredChannel) return "";
    if (registeredChannel.overview)
      return removeMarkTags(registeredChannel.overview);
    const desc = registeredChannel.description || "";
    return desc.length <= 160 ? desc : desc.slice(0, 160) + "...";
  };

  // ----------------- GIS 및 유튜브 API 연동 -----------------

  const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any | null>(null);

  // 1. 상태 추가
  const [showHintImages, setShowHintImages] = useState(false);

  // 2. 토글 핸들러 함수 추가
  const toggleHintImages = () => setShowHintImages((prev) => !prev);

  const fetchSubscriptions = async (token: string) => {
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
      setMySubscriptions(data.items || []);
      return data.items;
    } catch (error) {
      console.error("YouTube 구독 목록 불러오기 오류:", error);
      return [];
    }
  };

  async function fetchAllSubscriptions(token: string): Promise<any[]> {
    let allSubs: any[] = [];
    let nextPageToken: string | undefined = undefined;
    do {
      const res: Response = await fetch(
        `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50${
          nextPageToken ? `&pageToken=${nextPageToken}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      if (data.items) {
        allSubs = allSubs.concat(data.items);
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);
    return allSubs;
  }

  async function fetchMyYoutubeChannelInfo(token: string) {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&mine=true",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();
    console.log("내 유튜브 채널 정보:", data);
  }

  function handleGoogleSignInForWatchLater() {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      callback: (resp: any) => {
        if (resp.access_token) {
          fetchWatchLaterVideos(resp.access_token);
        } else {
          alert("토큰 발급 실패");
        }
      },
    });
    tokenClient.requestAccessToken();
  }

  async function fetchWatchLaterVideos(token: string) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet&maxResults=25&playlistId=WL",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      console.log("🎬 나중에 볼 동영상 리스트:", data.items);
      return data.items;
    } catch (error) {
      console.error("Watch Later 불러오기 오류:", error);
      return [];
    }
  }

  async function fetchMyPlaylists(token: string) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      console.log("📂 내 플레이리스트 목록:", data.items);
      return data.items;
    } catch (error) {
      console.error("플레이리스트 불러오기 오류:", error);
      return [];
    }
  }

  async function fetchLikedVideos(token: string) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=LL&maxResults=25",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      console.log("👍 좋아요한 영상들:", data.items);
      return data.items;
    } catch (error) {
      console.error("좋아요 영상 불러오기 오류:", error);
      return [];
    }
  }

  async function fetchUserInfo(token: string) {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const info = await res.json();
      console.log("🔎 User Info:", info);
      return info;
    } catch (error) {
      console.error("유저 정보 불러오기 오류:", error);
      return null;
    }
  }

  /** 구독 채널 불러오기 */
  async function handleGoogleSignInForSubscriptions() {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      callback: async (resp: TokenResponse) => {
        if (resp.access_token) {
          // (1) 발급받은 액세스 토큰과 만료 시점 sessionStorage 저장
          const now = Date.now();
          const expireMs = now + (resp.expires_in ?? 3600) * 1000;
          sessionStorage.setItem("myYoutubeToken", resp.access_token);
          sessionStorage.setItem("myYoutubeTokenExpire", String(expireMs));

          // (2) 구독 목록 가져오기
          const subscriptions = await fetchAllSubscriptions(resp.access_token);

          // (3) 구독 목록도 sessionStorage에 저장 (stringify)
          sessionStorage.setItem(
            "mySubscriptions",
            JSON.stringify(subscriptions)
          );

          // (4) "구독 채널 목록 페이지"로 이동
          router.push("/studio/subscriptions");
        } else {
          alert("토큰 발급 실패");
        }
      },
    });
    tokenClient.requestAccessToken();
  }

  // ----------------- 실제 렌더링 -----------------
  return (
    <SectionWrapper>
      {/* 등록된 채널이 없는 경우: 신규 사용자용 소개 섹션 */}
      <HeaderContainer>
        <KeyCopy>
          관심 채널 영상, 다 챙겨보기 힘드셨나요?
          <br />
          이제 핵심만 빠르게 받아보세요!
        </KeyCopy>
      </HeaderContainer>
      {!registeredChannel && (
        <>
          <MonitorSection>
            <MonitorTitle>👇 채널 모니터링, 지금 바로 시작하기</MonitorTitle>
            <ButtonGroup>
              <BlueButton onClick={handleGoogleSignInForSubscriptions}>
                유튜브 구독 채널 등록하기
              </BlueButton>
              <GrayButton onClick={handleManualButton}>
                채널 직접 입력하기
              </GrayButton>
            </ButtonGroup>
            {/* 직접 입력 폼: 입력창과 버튼을 같은 행에 배치 */}
            {showManualForm && (
              <ManualInputContainer>
                <ManualTitle>채널 핸들이나 URL을 입력해주세요</ManualTitle>
                <ManualInputRow>
                  <ChannelInput
                    placeholder="@ExampleChannel"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                  />
                  <RegisterButtonColumn onClick={handleRegister}>
                    채널 등록하기
                  </RegisterButtonColumn>
                </ManualInputRow>
                <HintBox>
                  <HintTitle>유튜브에서 @채널핸들명을 어디서 찾나요?</HintTitle>
                  <HintDesc>
                    채널 홈 화면 상단에서 <strong>@아이디(핸들)</strong>을
                    확인할 수 있어요.
                    <br />
                    아래 가이드 이미지처럼, 채널 이름 아래쪽에 보이는{" "}
                    <em>@...</em> 문구가 바로 핸들명입니다.
                  </HintDesc>
                  <ToggleHintButton onClick={toggleHintImages}>
                    {showHintImages ? "접기 ▲" : "가이드 이미지 보기 ▼"}
                  </ToggleHintButton>
                  {showHintImages && (
                    <HintImageScrollContainer>
                      <HintImage
                        src="/images/YoutubeHandleGuide1.png"
                        alt="예시1"
                      />
                      <HintImage
                        src="/images/YoutubeHandleGuide2.png"
                        alt="예시2"
                      />
                    </HintImageScrollContainer>
                  )}
                </HintBox>
              </ManualInputContainer>
            )}
          </MonitorSection>
          <LandingSection>
            <SectionHeading>
              <EmojiIcon>🤔</EmojiIcon> 유튜브 채널 모니터링 왜 필요할까요?
            </SectionHeading>
            <InfoCard>
              <CardTitle>
                &ldquo;구독 중인 채널의 영상 시청을 자꾸 미루지 않나요?&rdquo;
              </CardTitle>
              <CardDesc>
                좋아하는 채널 영상이라도 전부 시청하긴 쉽지 않죠.
                <br />
                핵심만 빠르게 파악하고, 궁금한 부분은 영상으로 확인하세요!
              </CardDesc>
            </InfoCard>
            <SectionHeading>
              <EmojiIcon>💡</EmojiIcon> 유티클이 무엇을 해주나요?
            </SectionHeading>
            <InfoCard>
              <CardTitle>
                &ldquo;매일 신규 영상을 대신 정리해서 카톡으로
                전달드립니다.&rdquo;
              </CardTitle>
              <CardDesc>
                매일 아침 7시에 새 영상 요약본을 카톡으로 받아보세요.
                <br />
                놓친 영상도 아카이브에 자동 저장되어 언제든 다시 꺼내볼 수
                있어요.
              </CardDesc>
            </InfoCard>
            <SectionHeading>
              <EmojiIcon>⚙️</EmojiIcon> 어떻게 이용하나요?
            </SectionHeading>
            <InfoCard>
              <CardTitle>“사용법은 간단해요.”</CardTitle>
              <CardDesc>
                1) 유튜브 데이터 권한 연동
                <br />
                2) 구독 채널 불러오기 (채널 직접 입력도 가능)
                <br />
                3) 모니터링할 채널 등록하기
                <br />
                4) 휴대폰 번호 등록 후 카톡 알림 받기
              </CardDesc>
            </InfoCard>
            <SectionHeading>
              <EmojiIcon>✨</EmojiIcon> 바쁘신가요? 걱정하지 마세요!
            </SectionHeading>
            <InfoCard>
              <CardTitle>“아카이브로 언제든 다시 확인 가능”</CardTitle>
              <CardDesc>
                당일에 시간이 없어도, 요약본은 아카이브에 저장됩니다.
                <br />
                나중에 확인하고 싶을 때 언제든 꺼내보세요.
              </CardDesc>
            </InfoCard>
          </LandingSection>
        </>
      )}

      {/* 등록된 채널이 있을 경우: 채널 등록 현황 UI */}
      {registeredChannel && (
        <RegisteredContainer>
          {registeredChannel.banner && (
            <BannerArea bannerUrl={registeredChannel.banner}>
              <BannerOverlay />
            </BannerArea>
          )}
          <CardWrapper>
            <ChannelRow>
              <ThumbWrapper>
                <ChannelThumb
                  src={registeredChannel.thumbnail}
                  alt={registeredChannel.title}
                />
              </ThumbWrapper>
              <ChannelInfo>
                <ChannelTitle>{registeredChannel.title}</ChannelTitle>
                <ChannelHandle>
                  {registeredChannel.channel_handle}
                </ChannelHandle>
                <SubCount>
                  {parseSubscribersCount(registeredChannel.sub_count)} 구독
                </SubCount>
              </ChannelInfo>
            </ChannelRow>
            <ChannelDesc>{truncateOrOverview()}</ChannelDesc>
            <TodayArticleSection>
              <TodaySectionTitle>📌 오늘 생성된 아티클</TodaySectionTitle>
              {todayArticles.length === 0 ? (
                <EmptyToday>
                  <EmptyMsg>
                    오늘 생성된 아티클이 없습니다.
                    <br />
                    내일 오전 7시에 다시 확인해주세요!
                  </EmptyMsg>
                </EmptyToday>
              ) : (
                todayArticles.map((art) => (
                  <ArticleCard
                    key={art.video_id}
                    onClick={() =>
                      router.push(
                        `/studio/channel/${registeredChannel.channel_handle}/${art.video_id}`
                      )
                    }
                  >
                    <ArticleInfo>
                      <ArticleTitle>
                        {art.summary_data.headline_title}
                      </ArticleTitle>
                      <ArticleMeta>
                        조회수 {art.views?.toLocaleString()}회 ·{" "}
                        {timeAgo(art.upload_date)}
                      </ArticleMeta>
                    </ArticleInfo>
                    <ArticleThumb src={art.thumbnail} alt={art.title} />
                  </ArticleCard>
                ))
              )}
            </TodayArticleSection>
            {!isEditing ? (
              <ButtonRow>
                <GrayButton onClick={() => setShowChangeModal(true)}>
                  채널 변경하기
                </GrayButton>
              </ButtonRow>
            ) : (
              <EditSection>
                <EditLabel>채널 변경</EditLabel>
                <NoticeMessage>
                  <strong>채널을 변경</strong>하면 내일부터 새 채널을
                  모니터링합니다.
                </NoticeMessage>
                <InputRow>
                  <UrlInput
                    placeholder="@NewChannelHandle"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                  />
                </InputRow>
                <EditGuide>채널 핸들이나 URL을 입력해주세요.</EditGuide>
                <ButtonRow>
                  <ApplyButton onClick={handleUpdateChannel}>
                    변경 적용
                  </ApplyButton>
                  <CancelButton onClick={handleCancelChange}>
                    변경 취소
                  </CancelButton>
                </ButtonRow>
              </EditSection>
            )}
          </CardWrapper>
        </RegisteredContainer>
      )}

      {/* 5) 다른 유저들이 등록한 채널 목록 */}
      <ChannelFeedSectionWithTabs />

      {/* 로딩/에러/로그인/폰번호 모달 */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingBox>
            <Spinner />
            <LoadingMessage>{loadingMessage}</LoadingMessage>
            <SubMessage>{loadingMessage2}</SubMessage>
          </LoadingBox>
        </LoadingOverlay>
      )}

      {showErrorModal && (
        <ModalOverlay>
          <ModalContent>
            <InfoMessage>⚠️ 안내</InfoMessage>
            <InfoDescription>{errorMessage}</InfoDescription>
            <CloseButton onClick={() => setShowErrorModal(false)}>
              닫기
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {showLoginModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowLoginModal(false)}>×</ModalClose>
            <InfoMessage>로그인이 필요합니다</InfoMessage>
            <InfoDescription>
              채널 등록 전 Google 로그인 해주세요.
            </InfoDescription>
            <GoogleLogin onLoginSuccess={handleLoginSuccess} />
          </ModalContent>
        </ModalOverlay>
      )}

      {showPhoneModal && (
        <ModalOverlay>
          <ModalContent>
            <InfoMessage>카카오톡 알림을 위한 번호</InfoMessage>
            <InfoDescription>
              매일 오전 7시에 채널 요약본을 카톡으로 전달해 드려요!
            </InfoDescription>
            <PhoneInput
              placeholder="010-0000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <RegisterButton onClick={savePhoneNumberAndRegister}>
              확인
            </RegisterButton>
          </ModalContent>
        </ModalOverlay>
      )}
      {/* 채널 변경 모달 (두 가지 선택지를 제공) */}
      {showChangeModal && (
        <ChangeChannelModal
          onClose={() => setShowChangeModal(false)}
          onUpdateChannel={performChannelUpdate}
        />
      )}
    </SectionWrapper>
  );
}

// ----------------- GIS 및 유튜브 API 관련 함수 -----------------

// ----------------- 스타일 정의 -----------------
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SectionWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 40px;
`;

/** ---- 헤더 (키 카피) ---- */
const HeaderContainer = styled.div`
  margin: 24px 16px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const KeyCopy = styled.h2`
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 12px;
`;

/** ---- 모니터링 섹션 ---- */
const MonitorSection = styled.section`
  background-color: #f7faff;
  padding: 16px;
  margin: 0 16px;
  margin-bottom: 24px;
  border-radius: 8px;
  border: 1px solid #e2e2e2;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const MonitorTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #222;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** 파란 버튼 & 회색 버튼 */
const BlueButton = styled.button`
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

const GrayButton = styled.button`
  background-color: #f0f0f5;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  width: 100%;
  cursor: pointer;
  &:hover {
    background-color: #dedee3;
  }
`;

/** 직접 입력 폼 (입력창과 버튼을 한 줄에 배치) */
const ManualInputContainer = styled.div`
  margin-top: 16px;
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  padding: 12px;
  animation: ${fadeIn} 0.3s ease;
`;

const ManualTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const ManualInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ChannelInput = styled.input`
  flex: 1;
  padding: 14px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const SmallGuide = styled.p`
  margin-top: 6px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  strong {
    color: #000;
  }
  em {
    color: #777;
    font-style: italic;
  }
`;

/** ---- 랜딩 섹션 (WHY / WHAT / HOW / PLUS) ---- */
const LandingSection = styled.section`
  margin: 24px 16px;
`;

const SectionHeading = styled.h3`
  margin-top: 48px;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const EmojiIcon = styled.span`
  font-size: 18px;
`;

const InfoCard = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  animation: ${fadeIn} 0.4s ease;
`;

const CardTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #222;
  line-height: 1.4;
`;

const CardDesc = styled.p`
  margin-top: 6px;
  font-size: 14px;
  color: #444;
  line-height: 1.32;
  white-space: pre-line;
`;

/** ---- 등록된 채널 섹션 ---- */
const RegisteredContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

interface BannerProps {
  bannerUrl: string;
}
const BannerArea = styled.div<BannerProps>`
  height: 160px;
  background: ${({ bannerUrl }) =>
    bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : "#ccc"};
  position: relative;
`;

const BannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.25);
`;

const CardWrapper = styled.div`
  margin: -60px 16px 0;
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  padding: 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ChannelRow = styled.div`
  display: flex;
  align-items: center;
`;

const ThumbWrapper = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  overflow: hidden;
  margin-right: 12px;
`;

const ChannelThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ChannelInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelTitle = styled.h4`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #222;
`;

const ChannelHandle = styled.span`
  font-size: 13px;
  color: #666;
`;

const SubCount = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #666;
`;

const ChannelDesc = styled.div`
  margin-top: 12px;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
`;

const TodayArticleSection = styled.div`
  margin-top: 24px;
`;

const TodaySectionTitle = styled.h5`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #222;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
`;

const EmptyToday = styled.div`
  padding: 16px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 6px;
  text-align: center;
`;

const EmptyMsg = styled.p`
  font-size: 13px;
  color: #666;
  line-height: 1.4;
`;

const ArticleCard = styled.div`
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fcfcfc;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: 0.2s;
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
  color: #222;
`;

const ArticleMeta = styled.div`
  margin-top: 4px;
  font-size: 12px;
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

const ButtonRow = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
`;
const ChangeButton = styled.button`
  flex: 1;
  background-color: #f0f0f5;
  color: #333;
  font-weight: 600;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #e4e4eb;
  }
`;
/** 채널 변경 섹션 */
const EditSection = styled.div`
  margin-top: 16px;
  background: #fafafa;
  border: 1px dashed #ccc;
  border-radius: 6px;
  padding: 12px;
`;

const EditLabel = styled.div`
  display: inline-block;
  background: #e0f2ff;
  color: #007bff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  margin-bottom: 8px;
`;

const NoticeMessage = styled.p`
  background: #f7f7f7;
  font-size: 13px;
  font-weight: 600;
  color: #000;
  line-height: 1.3;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 12px;
`;

const InputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const UrlInput = styled.input`
  padding: 12px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const EditGuide = styled.p`
  margin-top: 4px;
  font-size: 12px;
  color: #616161;
`;

const ApplyButton = styled.button`
  flex: 1;
  background: #007bff;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
`;

const CancelButton = styled.button`
  flex: 1;
  background: #e0e0e0;
  color: #333;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
`;

/** 등록 전 직접 입력 폼에서 Input 옆에 배치할 버튼용 Row */

const RegisterCard = styled.div`
  margin: 0 16px;
  border-radius: 8px;
`;

const ChannelInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const RegisterGuide = styled.p`
  margin-top: 6px;
  font-size: 12px;
  color: #616161;
`;

const RegisterButtonColumn = styled.button`
  /* flex: 1; */
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  padding: 14px;
  font-size: 15px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

const RegisterButton = styled.button`
  flex: 1;
  /* margin-top: 12px; */
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  padding: 14px;
  font-size: 15px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

/** ---- 로딩/에러 모달 ---- */
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LoadingBox = styled.div`
  width: 80%;
  text-align: center;
`;

const LoadingMessage = styled.p`
  margin-top: 20px;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  line-height: 1.4;
  white-space: pre-line;
`;

const SubMessage = styled.p`
  margin-top: 10px;
  font-size: 13px;
  color: #000;
  line-height: 1.4;
  white-space: pre-line;
  text-align: center;
`;

const Spinner = styled.div`
  margin: 0 auto 16px;
  width: 32px;
  height: 32px;
  border: 4px solid #ddd;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContent = styled.div`
  width: 90%;
  max-width: 360px;
  background: #fff;
  padding: 20px 16px;
  border-radius: 4px;
  text-align: center;
  position: relative;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  border: none;
  background: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
`;

const InfoMessage = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
`;

const InfoDescription = styled.p`
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  white-space: pre-line;
`;

const CloseButton = styled.button`
  background: #000;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 8px 14px;
  cursor: pointer;
`;

const PhoneInput = styled.input`
  margin-top: 8px;
  width: 80%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;
const HintBox = styled.div`
  background: #f8f9fa; /* 은은한 연회색 톤 */
  border: 1px solid #d8dee2; /* 더 부드러운 테두리 */
  border-radius: 8px;
  padding: 14px 18px;
  /* margin: 0 16px 16px; */
  margin-top: 12px;
`;

const HintTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #333;
`;

const HintDesc = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  margin-bottom: 10px;

  strong {
    color: #000;
  }

  em {
    font-style: italic;
    color: #777;
  }
`;

const ToggleHintButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: #007bff;
  background: none;
  border: none;
  margin-top: 6px;
  padding: 0;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const HintImageScrollContainer = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-top: 10px;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;

const HintImage = styled.img`
  width: 70%;
  max-width: 260px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
`;
// ------------------------------------------------------------------
// 위 컴포넌트는 기존 채널 등록 전후의 UI 및 GIS(구글 아이덴티티 서비스)를 통한 유튜브 API 연동
// 기능(구독 채널, 좋아요 영상, 나중에 볼 영상 등)을 모두 포함하고 있습니다.
// 등록된 채널이 있으면 HeaderContainer, MonitorSection, LandingSection을 숨기고,
// 대신 등록된 채널 정보를 보여줍니다.
// 또한, "채널 직접 입력하기"를 선택하면 입력창 오른쪽에 "채널 불러오기" 버튼이 함께 나타납니다.
// ------------------------------------------------------------------

// ---------------------- ChangeChannelModal 컴포넌트 ----------------------
interface ChangeChannelModalProps {
  onClose: () => void;
  onUpdateChannel: (newHandle: string) => void;
}
function ChangeChannelModal({
  onClose,
  onUpdateChannel,
}: ChangeChannelModalProps) {
  const [activeMethod, setActiveMethod] = useState<"subs" | "manual">("subs");
  const [manualHandle, setManualHandle] = useState("");

  // 예시: 상위 컴포넌트에서 구독 채널 정보를 prop으로 받거나 API를 통해 불러오도록 구성 가능
  const dummySubscriptions = [
    { id: "1", snippet: { title: "내구독채널A", channelId: "ChannelA" } },
    { id: "2", snippet: { title: "내구독채널B", channelId: "ChannelB" } },
  ];

  const handleSelectSubs = (sub: any) => {
    const newHandle = `@${sub.snippet?.channelId || sub.snippet?.title}`;
    onUpdateChannel(newHandle);
  };

  const handleManualSubmit = () => {
    if (!manualHandle.trim()) {
      alert("채널 핸들을 입력해주세요.");
      return;
    }
    onUpdateChannel(manualHandle.trim());
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalClose onClick={onClose}>×</ModalClose>
        <InfoMessage>채널 변경</InfoMessage>
        <ModalTabRow>
          <ModalTab
            isActive={activeMethod === "subs"}
            onClick={() => setActiveMethod("subs")}
          >
            내 구독 채널
          </ModalTab>
          <ModalTab
            isActive={activeMethod === "manual"}
            onClick={() => setActiveMethod("manual")}
          >
            직접 입력
          </ModalTab>
        </ModalTabRow>
        {activeMethod === "subs" ? (
          <SubsContainer>
            <p>구독 채널 중에서 변경할 채널을 선택하세요.</p>
            {dummySubscriptions.map((sub) => (
              <SubsItem key={sub.id}>
                <SubsName>{sub.snippet.title}</SubsName>
                <SelectBtn onClick={() => handleSelectSubs(sub)}>
                  선택
                </SelectBtn>
              </SubsItem>
            ))}
          </SubsContainer>
        ) : (
          <ManualContainer>
            <label>새 채널 핸들 (@ 포함)</label>
            <ManualInput
              placeholder="@NewChannelHandle"
              value={manualHandle}
              onChange={(e) => setManualHandle(e.target.value)}
            />
            <ApplyBtn onClick={handleManualSubmit}>변경 적용</ApplyBtn>
          </ManualContainer>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}
// 모달 내부 스타일 (ChangeChannelModal)
const ModalTabRow = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const ModalTab = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid
    ${({ isActive }) => (isActive ? "#007bff" : "transparent")};
  background-color: #fff;
  color: ${({ isActive }) => (isActive ? "#007bff" : "#333")};
  cursor: pointer;
`;

const SubsContainer = styled.div`
  text-align: left;
  p {
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }
`;

const SubsItem = styled.div`
  display: flex;
  justify-content: space-between;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 6px;
  padding: 8px;
  align-items: center;
`;

const SubsName = styled.span`
  flex: 1;
  font-size: 14px;
`;

const SelectBtn = styled.button`
  background: #fffae0;
  border: 1px solid #ccc;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
`;

const ManualContainer = styled.div`
  text-align: left;
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: #333;
  }
`;

const ManualInput = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 14px;
  margin-bottom: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ApplyBtn = styled.button`
  width: 100%;
  background: #007bff;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export { ChannelAutoArticleSection };
