"use client";

import React, { useRef, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { channelFeedRefreshTrigger } from "@/store/userChannelFeedStatus";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { getUserByEmail } from "@/api/apiClient";
import {
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
} from "@/utils/formatter";
import ChannelFeedSectionWithTabs from "../ChannelFeedSectionTabs";
import {
  FaBell,
  FaPlayCircle,
  FaClipboardList,
  FaUserCheck,
} from "react-icons/fa";
import Image from "next/image";
import heroImage from "/public/images/What유티클2.png";
import howStepImage1 from "/public/images/SubsLandingSection.png";
import howStepImage2 from "/public/images/How유티클.png";
import { parse } from "path";
/** 채널 정보 타입 */
interface ChannelData {
  id: string;
  user_id: number;
  user_name: string;
  channel_handle: string;
  channel_title: string;
  description: string;
  overview: string;
  channel_thumbnail: string;
  banner: string;
  sub_count: number;
  view_count: number;
  video_count: number;
  created_at: string;
}

interface RegisteredChannelData {
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

/** 영상 정보 타입 */
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
}

/** API Endpoint */
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";
// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";

/** 메인 컴포넌트 */
export default function ChannelAutoArticleSection() {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);
  const setFeedRefresh = useSetRecoilState(channelFeedRefreshTrigger);

  // 채널 입력 및 등록/변경 상태
  const [channelInput, setChannelInput] = useState("");
  const [registeredChannel, setRegisteredChannel] =
    useState<RegisteredChannelData | null>(null);
  const [todayArticles, setTodayArticles] = useState<VideoData[]>([]);

  // 모달/로딩/에러 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingMessage2, setLoadingMessage2] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // 카카오톡 번호 등록 모달
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // 채널 변경 모달 (내 구독 채널 목록 or 직접입력)
  const [showChangeModal, setShowChangeModal] = useState(false);

  // 신규 사용자용, 채널 직접 입력 창 토글
  const [showManualForm, setShowManualForm] = useState(false);
  const handleManualButton = () => setShowManualForm((prev) => !prev);
  const GOOGLE_CLIENT_ID =
    "303228054178-8tl7e7t4tup4s3d08olhgff2ap28vvl2.apps.googleusercontent.com";
  // ========= 채널 등록 로직 =========
  const handleRegister = () => {
    if (!user.email) {
      // 로그인 안됐으면 모달 표시
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
    // 최초 등록 시 최신 영상 아티클 즉시 생성 (최대 5분)
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
      // 등록 후 바로 해당 영상의 아티클 편집 화면으로 이동
      router.push(
        `/studio/channel/${channelInput}/${video_id}?task_id=${task_id}`
      );
    } catch (err) {
      console.error("채널 등록 오류:", err);
      setErrorMessage("채널 등록 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };

  // ========= 채널 변경 로직 =========
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
      // 등록 채널 다시 조회
      await fetchRegisteredChannel();
      // 오늘 생성된 아티클도 새로고침
      await fetchTodayArticles(user.id);
      // 피드 갱신
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

  // 실제 변경 API (모달에서 구독채널 직접 선택/입력)
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

  const handleCancelChange = () => {
    setIsEditing(false);
    setChannelInput("");
  };

  // ========= 로그인 + 폰번호 등록 =========
  const handleLoginSuccess = async (loginUser: User) => {
    setShowLoginModal(false);
    try {
      // DB에서 유저 등록 or 조회
      const data = await getUserByEmail(loginUser.email, loginUser.displayName);
      setUserState({
        name: loginUser.displayName,
        email: loginUser.email,
        picture: loginUser.photoURL,
        id: data.id,
      });

      // 이미 채널이 있는지 확인
      const res = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${data.id}`
      );
      const json = await res.json();
      const existingChannel = json[0];
      if (existingChannel) {
        // 이미 채널이 등록되어 있다면 등록 불가 안내
        setRegisteredChannel(existingChannel);
        setErrorMessage(
          `이미 '${existingChannel.title}' 채널이 등록되어 있습니다.\n채널 변경을 원하신다면 "채널 변경하기" 버튼을 이용해주세요.`
        );
        setShowErrorModal(true);
        return;
      }

      // 폰번호 없으면 -> 폰번호 입력 모달
      if (!data.phone) {
        setShowPhoneModal(true);
      } else {
        // 폰번호 있다면 곧바로 채널 등록 진행
        handleRegisterAfterLogin();
      }
    } catch (err) {
      console.error("로그인 후 사용자 정보 업데이트 실패:", err);
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

  // ========= 오늘 아티클 & 채널 조회 =========
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
      // 로그아웃 or user reset
      setRegisteredChannel(null);
      setTodayArticles([]);
      return;
    }
    fetchRegisteredChannel();
    fetchTodayArticles(user.id);
  }, [user.id]);

  // 등록된 채널 개요 (overview -> description)
  const truncateOrOverview = () => {
    if (!registeredChannel) return "";
    if (registeredChannel.overview)
      return removeMarkTags(registeredChannel.overview);

    const desc = registeredChannel.description || "";
    return desc.length <= 160 ? desc : desc.slice(0, 160) + "...";
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
  /** 구독 채널 불러오기 */
  async function handleGoogleSignInForSubscriptions() {
    // sessionStorage에서 토큰과 만료 시각을 가져옵니다.
    const storedToken = sessionStorage.getItem("myYoutubeToken");
    const storedTokenExpire = sessionStorage.getItem("myYoutubeTokenExpire");
    const now = Date.now();

    // 토큰이 존재하고 만료 시각이 아직 미래라면 바로 구독 채널 정보를 불러옵니다.
    if (storedToken && storedTokenExpire && now < Number(storedTokenExpire)) {
      const subscriptions = await fetchAllSubscriptions(storedToken);
      sessionStorage.setItem("mySubscriptions", JSON.stringify(subscriptions));
      router.push("/studio/subscriptions");
      return;
    }

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
  const [showHintImages, setShowHintImages] = useState(false);

  // 2. 토글 핸들러 함수 추가
  const toggleHintImages = () => setShowHintImages((prev) => !prev);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 비디오가 뷰포트에 들어왔을 때 재생하도록 IntersectionObserver 사용
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 뷰포트에 들어오면 자동 재생
            videoElement.play().catch((err) => {
              console.error("비디오 자동 재생 실패:", err);
            });
            observer.unobserve(videoElement);
          }
        });
      },
      {
        threshold: 0.5, // 뷰포트의 50% 이상 보일 때 재생
      }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, []);
  const refreshTrigger = 0;
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/history_feed`
        );
        if (!response.ok) throw new Error("Failed to fetch channel data");

        const data: ChannelData[] = await response.json();

        // 중복 제거: channel_handle 기준으로 최초 항목만 남김
        const seen = new Map<string, ChannelData>();
        for (const item of data) {
          if (!seen.has(item.channel_handle)) {
            seen.set(item.channel_handle, item);
          }
        }

        // 최신 순 정렬 (created_at 내림차순)
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

  const [showManualInputModal, setShowManualInputModal] = useState(false);

  // (A) "채널 직접 입력하기" 버튼 클릭 -> 모달 열기
  const openManualInputModal = () => {
    // if (!user.email) {
    //   // 로그인되지 않은 경우는 여전히 showLoginModal 처리
    //   setShowLoginModal(true);
    //   return;
    // }
    setShowManualInputModal(true);
  };

  // (B) 모달 내부에서 실제 채널 등록 로직
  const handleManualChannelRegister = async (channelHandle: string) => {
    if (!user.email) {
      // 로그인 안됐으면 모달 표시
      setShowLoginModal(true);
      return;
    }
    setChannelInput(channelHandle);
    await handleRegisterAfterLogin();
    // handleRegisterAfterLogin은 이미 내부에서 채널 등록 로직을 처리
    setShowManualInputModal(false);
  };

  return (
    <SectionWrapper>
      {/* ================= Hero + Landing Sections (New) ================= */}
      {!registeredChannel && (
        <>
          {/* Hero Section */}
          <HeaderContainer>
            <HeroTitle>유튜브 채널 요약 & 알림 서비스</HeroTitle>
            <HeroSubtitle>
              중요한 영상을 빠르게 텍스트 아티클로 확인하고,
              <br />
              신규 영상 자동 요약 알림까지 받아보세요!
            </HeroSubtitle>
            {/* [모니터링 시작하기] 섹션 */}
            <ButtonGroup>
              <BlueButton onClick={handleGoogleSignInForSubscriptions}>
                유튜브 구독 채널 불러오기
              </BlueButton>
              <GrayButton onClick={openManualInputModal}>
                채널 직접 입력하기
              </GrayButton>
            </ButtonGroup>
            {showManualInputModal && (
              <ManualInputModal
                onClose={() => setShowManualInputModal(false)}
                onRegister={handleManualChannelRegister}
              />
            )}
            {showManualInputModal && (
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
                  {/* 펼치기 토글 등은 필요 시 추가 */}
                  <ToggleHintButton onClick={toggleHintImages}>
                    {" "}
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
            {/* <HeroImageWrapper>
              <Image
                src={heroImage}
                alt="Hero"
                placeholder="blur"
                style={{ width: "80%", maxWidth: 400, height: "auto" }}
              />
            </HeroImageWrapper> */}
            <HeroVideoWrapper>
              <Video
                ref={videoRef}
                src="/videos/output5.mp4"
                poster="/images/What유티클2.png"
                muted
                autoPlay
                playsInline
                loop
                webkit-playsinline="true"
              />
            </HeroVideoWrapper>
          </HeaderContainer>

          {/* =========== Landing Section =========== */}
          <LandingSection>
            {/* (A) Why Section */}
            {/* <SectionHeading>
              <EmojiIcon>🤔</EmojiIcon> 왜 필요할까요?
            </SectionHeading> */}
            <WhySection>
              <SectionTitle>🤔 왜 필요할까요?</SectionTitle>

              <WhyText>
                구독 중인 채널 영상이 쌓이는데, <br />
                막상 다 챙겨보긴 어렵죠.
                <br />
                유티클은 매일 아침 새 영상을 간편히 요약해주고,
                <br />
                놓친 영상도 아카이브에 저장해 <br />
                언제든 다시 볼 수 있게 해줍니다.
              </WhyText>
            </WhySection>

            {/* (B) What Section (주요 기능) */}
            {/* What (Features) Section */}
            <FeaturesSection>
              <SectionTitle>💡 무엇을 할 수 있나요?</SectionTitle>
              <FeaturesGrid>
                <FeatureCard>
                  <IconWrapper>
                    <FaPlayCircle size={32} color="#007bff" />
                  </IconWrapper>
                  <CardTitle>개별 영상 아티클 변환</CardTitle>
                  <CardDesc>
                    관심 있는 영상을 선택하면
                    <br />
                    핵심만 추린 요약본을 즉시 생성!
                  </CardDesc>
                </FeatureCard>
                <FeatureCard>
                  <IconWrapper>
                    <FaBell size={32} color="#007bff" />
                  </IconWrapper>
                  <CardTitle>신규 영상 자동 요약 후 카톡 알림</CardTitle>
                  <CardDesc>
                    채널에 새로 올라온 영상을 자동 감지 후
                    <br />
                    다음날 아침 7시에 카톡으로 안내!
                  </CardDesc>
                </FeatureCard>
                <FeatureCard>
                  <IconWrapper>
                    <FaClipboardList size={32} color="#007bff" />
                  </IconWrapper>
                  <CardTitle>아카이브 제공</CardTitle>
                  <CardDesc>
                    바빠서 못 봤던 영상 아티클도
                    <br />
                    언제든 다시 찾아볼 수 있어요.
                  </CardDesc>
                </FeatureCard>
                {/* <FeatureCard>
                  <IconWrapper>
                    <FaUserCheck size={32} color="#007bff" />
                  </IconWrapper>
                  <CardTitle>간단한 사용법</CardTitle>
                  <CardDesc>
                    Google 계정만 있으면
                    <br />
                    채널 등록 후 바로 이용 가능!
                  </CardDesc>
                </FeatureCard> */}
              </FeaturesGrid>
            </FeaturesSection>

            {/* (C) How Section */}
            <HowSection>
              <SectionTitle>⚙️ 어떻게 이용하나요?</SectionTitle>

              <StepsRow>
                <StepBox>
                  <StepIcon>1</StepIcon>
                  <StepText>구독 채널 불러오기 or 관심 채널 직접 입력</StepText>
                  <StepImageBox>
                    <Image
                      src={howStepImage1}
                      alt="단계1 예시"
                      style={{ width: "90%", height: "auto" }}
                    />
                  </StepImageBox>
                </StepBox>

                <StepBox>
                  <StepIcon>2</StepIcon>
                  <StepText>채널 개별 영상 아티클 생성</StepText>
                  <HowVideoWrapper>
                    <Video
                      ref={videoRef}
                      src="/videos/make_output.mp4"
                      poster="/images/What유티클2.png"
                      muted
                      autoPlay
                      playsInline
                      loop
                      webkit-playsinline="true"
                    />
                  </HowVideoWrapper>
                </StepBox>

                <StepBox>
                  <StepIcon>3</StepIcon>
                  <StepText>
                    채널 모니터링 등록 후 카톡 알림 확인 <br />
                    (신규 영상 업로드 시 다음날 아침 7시에 카톡 알람)
                  </StepText>
                  <HowVideoWrapper>
                    <Video
                      ref={videoRef}
                      src="/videos/monitoring_output.mp4"
                      poster="/images/What유티클2.png"
                      muted
                      autoPlay
                      playsInline
                      loop
                      webkit-playsinline="true"
                    />
                  </HowVideoWrapper>
                </StepBox>
              </StepsRow>
            </HowSection>
            <SectionTitle>다른 유저들이 모니터링 중인 채널</SectionTitle>
            <ScrollContainer>
              {channels.map((channel) => (
                <ChannelCard key={channel.id}>
                  <ChannelHeader>
                    <ThumbWrapper>
                      <ChannelThumb
                        src={channel.channel_thumbnail}
                        alt={channel.channel_title}
                      />
                    </ThumbWrapper>
                    <ChannelTitle>{channel.channel_title}</ChannelTitle>
                    <ChannelHandle>{channel.channel_handle}</ChannelHandle>
                  </ChannelHeader>
                  <ChannelDescription>
                    {parseSubscribersCount(channel.sub_count)}
                  </ChannelDescription>
                  {/* <ChannelDate>
                    {new Date(channel.created_at).toLocaleString()}
                  </ChannelDate> */}
                </ChannelCard>
              ))}
            </ScrollContainer>
            {/* (D) Testimonials Section */}
            {/* <SectionHeading>
              <EmojiIcon>✨</EmojiIcon> 사용자 후기
            </SectionHeading> */}
            <TestimonialGrid>
              {/* 후기 1 */}
              <TestimonialCard>
                {/* 상단에 페르소나 정보 */}
                <PersonaInfo>
                  <PersonaName>김00님, (20초, 대학생)</PersonaName>
                  <PersonaSub>교육 관련 채널 구독중</PersonaSub>
                </PersonaInfo>
                {/* 문제 & 해결 */}
                <QuoteText>
                  &quot;전공 관련 공부할때 해외 대학 채널들을 참고하고 있었는데
                  영상을 자동 번역해서 요약해주니까 <br /> 핵심 내용을 빠르게
                  파악할 수 있어서 자료 공부 시간을 훨씬 단축시키고
                  있어요.&quot;
                </QuoteText>
              </TestimonialCard>

              {/* 후기 2 */}
              <TestimonialCard>
                <PersonaInfo>
                  <PersonaName>이00님 (30초, 회사원)</PersonaName>
                  <PersonaSub>재테크 유튜브 광팬</PersonaSub>
                </PersonaInfo>
                <QuoteText>
                  &quot;구독 채널들이 자꾸 쌓여서 못 보고 넘어가니 <br />
                  마음에 짐이 됐었거든요.
                  <br />
                  이제 유티클이 새 영상 올라오면 다음날 카톡으로
                  <br />
                  자동 요약을 보내주니 &quot;놓칠 일&quot;이 없어져서 너무
                  좋습니다.&quot;
                </QuoteText>
              </TestimonialCard>

              {/* 후기 3 */}
              <TestimonialCard>
                <PersonaInfo>
                  <PersonaName>박00님, (20후, 프리랜서 디자이너)</PersonaName>
                  <PersonaSub>여러 테크 채널 구독 중</PersonaSub>
                </PersonaInfo>
                <QuoteText>
                  &quot;AI 트렌드에 따라가느라 여러 테크 채널들 구독해놨는데
                  카톡으로 요약본 먼저 살펴보고 정말 볼만한 영상인지 판단할 수
                  있어요.
                  <br />
                  결국 시간 절약 + 맞춤 정보만 쏙쏙 골라 보는 느낌입니다.&quot;
                </QuoteText>
              </TestimonialCard>
            </TestimonialGrid>
            {/* (E) Final CTA */}
            <FinalCTASection>
              <CTAContainer>
                <CTATitle>관심 채널 영상, 자동으로 요약받아보세요!</CTATitle>
                <CTAText>
                  해외 채널도 자동 번역·요약해서 <br />
                  카톡으로 전송해 드립니다.
                  <br />
                  늘 쌓여 있던 영상들, 이제 빠르게 확인하고
                  <br />
                  놓치지 마세요!
                </CTAText>

                {/* 1) 유튜브 구독 채널 불러오기 버튼 */}
                <CTAButton onClick={handleGoogleSignInForSubscriptions}>
                  유튜브 구독 채널 불러오기
                </CTAButton>

                {/* 2) 채널 직접 입력하기 버튼 */}
                <CTAButtonSecondary onClick={openManualInputModal}>
                  채널 직접 입력하기
                </CTAButtonSecondary>
              </CTAContainer>
            </FinalCTASection>
          </LandingSection>
        </>
      )}

      {/* ================= 등록된 채널 UI ================= */}
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

            {/* 오늘 생성된 아티클 */}
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

      {registeredChannel && <ChannelFeedSectionWithTabs />}
      {/* 다른 유저들 채널 목록 */}

      {/* 로딩 오버레이 */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingBox>
            <Spinner />
            <LoadingMessage>{loadingMessage}</LoadingMessage>
            <SubMessage>{loadingMessage2}</SubMessage>
          </LoadingBox>
        </LoadingOverlay>
      )}

      {/* 에러 모달 */}
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

      {/* 로그인 모달 */}
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

      {/* 폰번호 입력 모달 */}
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

      {/* 채널 변경 모달 */}
      {showChangeModal && (
        <ChangeChannelModal
          onClose={() => setShowChangeModal(false)}
          onUpdateChannel={performChannelUpdate}
        />
      )}
    </SectionWrapper>
  );
}

/* ------------------ ChangeChannelModal 컴포넌트 ------------------ */
interface ChangeChannelModalProps {
  onClose: () => void;
  onUpdateChannel: (newHandle: string) => void;
}

/* ------------------ Styled Components ------------------ */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SectionWrapper = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px 80px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

/** Hero / Landing Header */
const HeaderContainer = styled.div`
  margin: 24px 16px;
  margin-top: 40px;
  align-items: center;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-in-out;
`;
const HeroTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #000;
`;
const HeroSubtitle = styled.p`
  font-size: 16px;
  line-height: 1.4;
  color: #444;
  margin-bottom: 24px;
`;
const HeroImageWrapper = styled.div`
  flex: 1;
  display: flex;
  margin-top: 60px;
  justify-content: center;
`;
const KeyCopy = styled.h2`
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 12px;
`;

/** 모니터링 섹션 */
const MonitorSection = styled.section`
  background-color: #f7faff;
  padding: 16px;
  margin: 0 16px 24px;
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

/** 버튼들 */
const BlueButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  padding: 14px 20px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

// const GrayButton = styled.button`
//   background-color: #f0f0f5;
//   color: #333;
//   font-weight: 700;
//   font-size: 15px;
//   border: 1px solid #ccc;
//   border-radius: 6px;
//   padding: 14px;
//   width: 100%;
//   cursor: pointer;
//   &:hover {
//     background-color: #dedee3;
//   }
// `;

/** 직접 입력 폼 */
const ManualInputContainer = styled.div`
  margin-top: 16px;
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  padding: 12px;
  animation: ${fadeIn} 0.3s ease;
`;
// Styled Components
const HeroVideoWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  margin-top: 80px;
`;

// Styled Components
const HowVideoWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  margin-top: 20px;
  margin-bottom: 60px;
`;

const Video = styled.video`
  width: 88%;
  object-fit: contain; /* 잘리지 않도록 contain */
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
const ModalInputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;
const ChannelInput = styled.input`
  flex: 1;
  padding: 14px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const RegisterButtonColumn = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  padding: 14px;
  font-size: 16px;
  width: 100%;
  margin-bottom: 12px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

const HintBox = styled.div`
  background: #f8f9fa;
  border: 1px solid #d8dee2;
  border-radius: 8px;
  padding: 14px 18px;
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
    color: #777;
    font-style: italic;
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
/** ------ Landing Section (Why / What / How / Testimonials / Final CTA) ------ */
const LandingSection = styled.section`
  margin: 24px 16px;
`;
const WhySection = styled.section`
  margin-top: 60px;
`;
const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  margin-top: 80px;
  color: #000;
  text-align: center;
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
const WhyText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #444;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
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
  font-size: 18px;
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
const FeaturesSection = styled.section`
  margin-top: 80px;
`;
/** What Section - Features */
const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  align-items: stretch;
`;
const FeatureCard = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
  transition: 0.2s;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const HowSection = styled.section`
  margin-top: 60px;
`;
const StepsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  margin-bottom: 24px;
  text-align: center;
`;
const StepBox = styled.div`
  /* width: 220px; */
  /* background: #f8f9fa; */
  border-radius: 8px;
  padding: 16px;
  margin: 0 auto;
`;
const StepIcon = styled.div`
  background: #007bff;
  color: #fff;
  font-weight: 700;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StepText = styled.p`
  font-size: 16px;
  color: #000;
  margin-bottom: 20px;
  font-weight: 500;
  line-height: 140%;
`;
const StepImageBox = styled.div`
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 60px;
`;

const IconWrapper = styled.div`
  margin-bottom: 12px;
`;

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 24px;
  margin-top: 40px;
`;

const TestimonialCard = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
`;
const Quote = styled.p`
  font-size: 14px;
  font-style: italic;
  color: #333;
  margin-bottom: 12px;
`;
const Author = styled.div`
  font-size: 13px;
  color: #777;
`;

const FinalCTASection = styled.section`
  margin-top: 100px;
  /* padding: 24px 16px;
  background: #f0f0f5; */
  border-radius: 8px;
  text-align: center;
`;
const CTAContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;
const CTATitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
`;
const CTAText = styled.p`
  font-size: 16px;
  color: #444;
  line-height: 1.4;
  margin-bottom: 20px;
`;
const CTAButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 14px 24px;
  font-size: 16px;
  width: 100%;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;
const CTAButtonSecondary = styled.button`
  background-color: #f0f0f5;
  color: #333;
  font-weight: 700;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 14px 20px;
  font-size: 16px;
  margin-top: 8px;
  width: 100%;
  cursor: pointer;
  &:hover {
    background-color: #dedee3;
  }
`;
/** ------ 등록된 채널 UI ------ */
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
  /* margin-right: 12px; */
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
  margin-top: 8px;
  /* margin-bottom: 4px; */
  color: #222;
  text-align: center;
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

const GrayButton = styled.button`
  flex: 1;
  background-color: #f0f0f5;
  color: #333;
  font-weight: 600;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: #e4e4eb;
  }
`;

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

/** 로딩/에러/로그인/폰번호 모달 */
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
const RegisterButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  padding: 14px;
  font-size: 16px;
  margin-top: 16px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;
/* ------------------ ChangeChannelModal ------------------ */
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

  // 예시 구독채널 (실제로는 GIS API 결과)
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

interface ManualInputModalProps {
  onClose: () => void;
  onRegister: (channelHandle: string) => void;
}

function ManualInputModal({ onClose, onRegister }: ManualInputModalProps) {
  const [localChannelInput, setLocalChannelInput] = useState("");
  const [showHintImages, setShowHintImages] = useState(false);
  const toggleHintImages = () => setShowHintImages((prev) => !prev);
  // "등록하기" 버튼 시 호출
  const handleSubmit = () => {
    // if (!localChannelInput.trim()) {
    //   alert("채널 핸들을 입력해주세요.");
    //   return;
    // }
    onRegister(localChannelInput.trim()); // 부모로 전달
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalClose onClick={onClose}>×</ModalClose>
        <InfoMessage>채널 직접 입력</InfoMessage>
        <InfoDescription>
          등록할 유튜브 채널 핸들이나 URL을 입력해주세요.
        </InfoDescription>

        <ModalInputRow>
          <ChannelInput
            placeholder="@ExampleChannel"
            value={localChannelInput}
            onChange={(e) => setLocalChannelInput(e.target.value)}
          />
        </ModalInputRow>

        <RegisterButtonColumn onClick={handleSubmit}>
          채널 불러오기
        </RegisterButtonColumn>

        <HintBox>
          <HintTitle>유튜브 @채널핸들명 찾기</HintTitle>
          <HintDesc>
            채널 홈 화면 상단에서 <strong>@아이디</strong>를 확인할 수 있습니다.
          </HintDesc>
          {/* 펼치기 토글 등은 필요 시 추가 */}
          <ToggleHintButton onClick={toggleHintImages}>
            {" "}
            {showHintImages ? "접기 ▲" : "가이드 이미지 보기 ▼"}
          </ToggleHintButton>
          {showHintImages && (
            <HintImageScrollContainer>
              <HintImage src="/images/YoutubeHandleGuide1.png" alt="예시1" />
              <HintImage src="/images/YoutubeHandleGuide2.png" alt="예시2" />
            </HintImageScrollContainer>
          )}
        </HintBox>
      </ModalContent>
    </ModalOverlay>
  );
}

/* ----- ChangeChannelModal 스타일 ----- */
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
const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 비율 예시, 원하는 비율로 조정 */
  overflow: hidden;
`;

const VideoPlayer = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* iOS에서 인라인 재생 */
  /* playsinline, webkit-playsinline 등 속성은 아래 JSX 부분에서 설정 */
`;
const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;

const ChannelCard = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  min-width: 128px;
  max-width: 128px;
`;

const ChannelHeader = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const ChannelDescription = styled.p`
  font-size: 14px;
  color: #666;
`;

const ChannelDate = styled.div`
  font-size: 12px;
  color: #999;
`;
/* 기존 TestimonialCard 안에 쓸 추가 스타일 */

const PersonaInfo = styled.div`
  margin-bottom: 20px;
  text-align: center;
`;

const PersonaName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
`;

const PersonaSub = styled.div`
  font-size: 13px;
  color: #777;
`;

const QuoteText = styled.p`
  font-size: 15px; /* 기존 14px에서 조금 증가 */
  line-height: 140%; /* 가독성 향상 */
  color: #333;
  margin-bottom: 0; /* 내부 여백을 줄이거나 조정 */
  text-align: center;
  white-space: pre-line; /* 줄바꿈 허용 */
`;
