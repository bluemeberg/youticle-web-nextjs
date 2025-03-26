"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import LogoHeader from "@/common/LogoHeader";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import {
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
} from "@/utils/formatter";
import { getUserByEmail } from "@/api/apiClient";

interface BrandingSettings {
  image?: {
    bannerExternalUrl?: string;
  };
}

interface ChannelSnippet {
  title: string;
  description: string;
  publishedAt?: string;
  thumbnails?: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
  customUrl?: string;
}

interface ChannelData {
  id: string;
  snippet: ChannelSnippet;
  statistics?: {
    subscriberCount: number;
  };
  brandingSettings?: BrandingSettings;
}

interface VideoItem {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl?: string;
}

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}

const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

// 추가: pending action 타입 (채널 등록 vs. 영상 아티클 생성)
type PendingAction = "registerChannel" | "convertArticle" | null;

export default function ChannelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { channelId } = params as { channelId: string };

  // Channel & Video 정보 상태
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 아티클 생성 상태
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingMessage2, setLoadingMessage2] = useState("");

  // 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Recoil user 상태
  const setUser = useSetRecoilState(userState);
  const user = useRecoilValue(userState);
  const [phoneNumber, setPhoneNumber] = useState(""); // 입력받을 번호

  // 추가: pending action 상태 (로그인 후 실행할 작업) 및 선택된 videoId (영상 아티클 생성용)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);

  // ----------------- 채널 상세 정보 및 영상 목록 불러오기 -----------------
  useEffect(() => {
    if (!channelId) {
      setErrorMsg("채널 ID가 유효하지 않습니다.");
      setLoading(false);
      return;
    }
    fetchChannelDetail(channelId);
  }, [channelId]);

  async function fetchChannelDetail(cId: string) {
    try {
      // Use your API key from env variables
      const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!YOUTUBE_API_KEY) {
        throw new Error("YouTube API key is missing.");
      }
      // (A) Fetch channel info (snippet, brandingSettings, statistics) using the API key
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings,statistics&id=${cId}&key=${YOUTUBE_API_KEY}`
      );
      if (!channelRes.ok) {
        throw new Error(
          `채널 정보를 가져오지 못했습니다. (status: ${channelRes.status})`
        );
      }
      const channelJson = await channelRes.json();
      if (!channelJson.items || channelJson.items.length === 0) {
        throw new Error("해당 채널 정보를 찾을 수 없습니다.");
      }
      const channelInfo = channelJson.items[0];
      setChannelData({
        id: channelInfo.id,
        snippet: channelInfo.snippet,
        statistics: channelInfo.statistics,
        brandingSettings: channelInfo.brandingSettings,
      });

      // (B) Fetch contentDetails to get the uploads playlist ID
      const detailRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${cId}&key=${YOUTUBE_API_KEY}`
      );
      const detailJson = await detailRes.json();
      if (!detailJson.items || detailJson.items.length === 0) {
        throw new Error("업로드 재생목록 정보를 찾을 수 없습니다.");
      }
      const uploadsPlaylistId =
        detailJson.items[0].contentDetails.relatedPlaylists.uploads;

      // (C) Fetch the latest 10 videos from the uploads playlist
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`
      );
      const playlistJson = await playlistRes.json();
      console.log(playlistJson);
      const items: VideoItem[] =
        playlistJson.items?.map((item: any) => {
          const vidId = item.snippet.resourceId.videoId;
          return {
            videoId: vidId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt.split("T")[0],
            thumbnailUrl: item.snippet.thumbnails?.medium?.url,
          };
        }) || [];
      setVideoItems(items);
      setLoading(false);
    } catch (err: any) {
      console.error("채널 상세 정보 로드 오류:", err);
      setErrorMsg(
        err.message || "채널 정보를 가져오는 중 오류가 발생했습니다."
      );
      setLoading(false);
    }
  }

  // ----------------- 영상 아티클 생성 함수 -----------------
  async function fetchSummaryEditorVideo(videoId: string) {
    if (!user?.email) {
      // 로그인하지 않은 경우, pending action 등록 후 로그인 모달 띄우기
      setPendingAction("convertArticle");
      setPendingVideoId(videoId);
      setShowLoginModal(true);
      return;
    }
    // (휴대폰 번호 확인 로직은 필요 시 추가)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    setIsCreatingArticle(true);
    setLoadingMessage("아티클 구조 설계 중...");
    setLoadingMessage2(
      "영상 길이에 따라 최대 1분이 소요될 수 있습니다.\n페이지를 떠나도 생성은 계속 진행됩니다!"
    );
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/${encodeURIComponent(
          videoId
        )}?user_id=${encodeURIComponent(user.id)}`,
        {
          method: "GET",
          headers: { accept: "application/json" },
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          setErrorMsg(errorData.detail);
        } else {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        return;
      }
      const { task_id } = await response.json();
      router.push(`/studio/${videoId}?task_id=${task_id}`);
    } catch (err: any) {
      console.error("아티클 생성 요청 실패:", err);
      setErrorMsg(err.message || "아티클 생성 중 문제가 발생했습니다.");
    } finally {
      setIsCreatingArticle(false);
      clearTimeout(timeoutId);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  }

  // ----------------- 채널 모니터링 등록 (채널 등록 API 호출) -----------------
  async function handleChannelMonitoring() {
    if (!user?.email) {
      // 로그인하지 않은 경우, pending action 등록 후 로그인 모달 띄우기
      setPendingAction("registerChannel");
      setShowLoginModal(true);
      return;
    }
    const data = await getUserByEmail(user.email, user.name);
    const regRes = await fetch(
      `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${data.id}`
    );
    const json = await regRes.json();
    const existingChannel = json[0];
    if (existingChannel) {
      // 이미 등록된 채널이 있다면 등록 불가 안내
      setErrorMessage(
        `이미 등록된 채널이 있습니다: "${existingChannel.title}".\n채널 변경 을 원하시면 "채널 변경하기" 기능을 이용해주세요.`
      );
      setShowErrorModal(true);
      return;
    }
    // 채널 핸들: customUrl가 있으면 사용, 없으면 title 사용
    const channelHandle =
      channelData?.snippet.customUrl || channelData?.snippet.title;
    if (!channelHandle) {
      setErrorMsg("채널 핸들을 확인할 수 없습니다.");
      return;
    }
    try {
      setIsCreatingArticle(true); // 재사용: 모니터링 등록도 로딩 표시
      setLoadingMessage("채널 모니터링 등록 중...");
      setLoadingMessage2("잠시만 기다려주세요.");
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/channel/${encodeURIComponent(
          channelHandle
        )}?user_id=${user.id}`,
        {
          method: "GET",
          headers: { accept: "application/json" },
        }
      );
      if (!response.ok) {
        if (response.status === 400) {
          const errData = await response.json();
          setErrorMsg(errData.detail);
        } else {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        return;
      }
      const { task_id, video_id } = await response.json();
      router.push(
        `/studio/channel/${channelHandle}/${video_id}?task_id=${task_id}`
      );
    } catch (err: any) {
      console.error("채널 모니터링 등록 오류:", err);
      setErrorMsg(err.message || "채널 모니터링 등록 중 문제가 발생했습니다.");
    } finally {
      setIsCreatingArticle(false);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  }

  // ----------------- 영상 아티클 변환 버튼 클릭 핸들러 -----------------
  function handleVideoArticle(videoId: string) {
    if (!user?.email) {
      setPendingAction("convertArticle");
      setPendingVideoId(videoId);
      setShowLoginModal(true);
    } else {
      fetchSummaryEditorVideo(videoId);
    }
  }

  const handleGoBackStudio = () => {
    router.push(`/studio`);
  };
  // ----------------- 로그인 성공 콜백 -----------------
  const handleLoginSuccess = async (loginUser: {
    email: string;
    displayName: string;
    photoURL: string;
  }) => {
    setShowLoginModal(false);
    if (!loginUser.email) return;
    const data = await getUserByEmail(loginUser.email, loginUser.displayName);
    setUser({
      name: loginUser.displayName,
      email: loginUser.email,
      picture: loginUser.photoURL,
      id: data.id,
    });
    const regRes = await fetch(
      `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${data.id}`
    );
    const json = await regRes.json();
    const existingChannel = json[0];
    if (existingChannel) {
      // 이미 등록된 채널이 있다면 등록 불가 안내
      setErrorMessage(
        `이미 등록된 채널이 있습니다: "${existingChannel.title}".\n채널 변경 을 원하시면 "채널 변경하기" 기능을 이용해주세요.`
      );
      setShowErrorModal(true);
      return;
    }
    // 로그인 성공 후, 저장된 pending action에 따라 자동 실행
    if (pendingAction === "registerChannel") {
      setPendingAction(null);
      // 채널 등록 정보가 없으면, 전화번호가 없으면 휴대폰 번호 등록 모달 표시, 있으면 자동 등록
      if (!data.phone) {
        setShowPhoneModal(true);
      } else {
        handleChannelMonitoring();
      }
    } else if (pendingAction === "convertArticle" && pendingVideoId) {
      const videoId = pendingVideoId;
      setPendingAction(null);
      setPendingVideoId(null);
      fetchSummaryEditorVideo(videoId);
    }
  };

  // ----------------- 휴대폰 번호 등록 함수 -----------------
  const [phoneInput, setPhoneInput] = useState("");
  const savePhoneNumberAndRegister = async () => {
    const trimmed = phoneInput.trim();
    if (!/^010-\d{4}-\d{4}$/.test(trimmed)) {
      setErrorMsg("올바른 휴대폰 번호를 입력해주세요. 예: 010-1234-5678");
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
      // 번호 등록 후 사용자가 다시 영상 아티클 변환 버튼을 눌러 진행
    } catch (err: any) {
      console.error("폰번호 등록 오류:", err);
      setErrorMsg("전화번호 등록 중 문제가 발생했습니다.");
    }
  };

  // ---------------------- Render ----------------------
  if (loading) {
    return (
      <Container>
        <LogoHeader />
        <Message>로딩 중...</Message>
      </Container>
    );
  }
  if (errorMsg) {
    return (
      <Container>
        <LogoHeader />
        <Message>{errorMsg}</Message>
      </Container>
    );
  }
  if (!channelData) {
    return (
      <Container>
        <LogoHeader />
        <Message>채널 정보를 찾을 수 없습니다.</Message>
      </Container>
    );
  }

  const bannerUrl = channelData?.brandingSettings?.image?.bannerExternalUrl;
  const snippet = channelData.snippet;
  const subscriberCount = channelData.statistics?.subscriberCount || 0;

  return (
    <Container>
      <LogoHeader />
      {bannerUrl ? (
        <Banner style={{ backgroundImage: `url(${bannerUrl})` }} />
      ) : (
        <BannerPlaceholder>배너 이미지가 없습니다.</BannerPlaceholder>
      )}

      <InfoCard>
        <Row>
          <Thumb
            src={
              snippet.thumbnails?.medium?.url || "/images/no_channel_thumb.png"
            }
            alt={snippet.title}
          />
          <ChannelMeta>
            <Title>{snippet.title}</Title>
            <SubCount>구독자 {parseSubscribersCount(subscriberCount)}</SubCount>
          </ChannelMeta>
        </Row>
        <Description>{snippet.description}</Description>
        <ButtonRow>
          <MonitorButton onClick={handleChannelMonitoring}>
            {isCreatingArticle ? "등록 중..." : "채널 모니터링 등록"}
          </MonitorButton>
        </ButtonRow>
      </InfoCard>

      <SectionTitle>최신 영상 목록</SectionTitle>
      {videoItems.length === 0 ? (
        <Message>최근 업로드 영상이 없습니다.</Message>
      ) : (
        <VideoList>
          {videoItems.map((vid) => (
            <VideoItemBox key={vid.videoId}>
              <VideoThumb
                src={vid.thumbnailUrl || "/images/no_video_thumb.jpg"}
                alt={vid.title}
              />
              <VideoInfo>
                <VideoTitle>{vid.title}</VideoTitle>
                <VideoDate>{timeAgo(vid.publishedAt)}</VideoDate>
                <PreviewButton onClick={() => handleVideoArticle(vid.videoId)}>
                  아티클 변환
                </PreviewButton>
              </VideoInfo>
            </VideoItemBox>
          ))}
        </VideoList>
      )}

      {/* 로그인 모달 */}
      {showLoginModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowLoginModal(false)}>×</ModalClose>
            <InfoMessage>🙋 로그인이 필요합니다</InfoMessage>
            <InfoDescription>
              영상 아티클 생성 및 채널 모니터링 등록을 위해 Google 계정으로
              로그인해주세요.
            </InfoDescription>
            <GoogleLogin onLoginSuccess={handleLoginSuccess} />
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 휴대폰 번호 입력 모달 */}
      {showPhoneModal && (
        <ModalOverlay>
          <ModalContent>
            <InfoMessage>휴대폰 번호 입력</InfoMessage>
            <InfoDescription>
              카카오톡 알림을 위해 휴대폰 번호를 입력해주세요. 예: 010-1234-5678
            </InfoDescription>
            <PhoneInput
              placeholder="010-1234-5678"
              value={phoneInput}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <RegisterButton onClick={savePhoneNumberAndRegister}>
              확인
            </RegisterButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 로딩 오버레이 (아티클 생성/채널 등록 진행 중) */}
      {isCreatingArticle && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>{loadingMessage}</LoadingText>
          <LoadingSubText>{loadingMessage2}</LoadingSubText>
        </LoadingOverlay>
      )}

      {showErrorModal && (
        <ErrorModalOverlay>
          <ErrorModal>
            <ErrorTitle>⚠️ 안내</ErrorTitle>
            <ErrorMessageText>{errorMessage}</ErrorMessageText>
            <ErrorCloseButton onClick={handleGoBackStudio}>
              닫기
            </ErrorCloseButton>
          </ErrorModal>
        </ErrorModalOverlay>
      )}
    </Container>
  );
}

/* ---------------------- Styled Components ---------------------- */
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Message = styled.p`
  text-align: center;
  margin-top: 72px;
  color: #555;
`;

const Banner = styled.div`
  width: 100%;
  height: 140px;
  background-position: center;
  background-size: cover;
  margin-top: 40px;
`;
const BannerPlaceholder = styled.div`
  width: 100%;
  height: 140px;
  background-color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  margin-top: 40px;
`;

const InfoCard = styled.div`
  background: #fff;
  margin: -40px 16px 16px;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Thumb = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  object-fit: cover;
  margin-right: 12px;
`;

const ChannelMeta = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #333;
`;

const SubCount = styled.span`
  font-size: 14px;
  color: #666;
`;

const Description = styled.p`
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.4;
  color: #444;
`;

const ButtonRow = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
`;

const MonitorButton = styled.button`
  flex: 1;
  background: #0066cc;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: #005bb5;
  }
`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #222;
  margin-left: 16px;
  margin-top: 40px;
  margin-bottom: 12px;
`;

const VideoList = styled.div`
  margin: 0 16px 32px;
`;

const VideoItemBox = styled.div`
  display: flex;
  background: #f8f8f8;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 8px;
  transition: 0.2s;
  &:hover {
    background: #f2faff;
  }
`;

const VideoThumb = styled.img`
  width: 120px;
  height: 68px;
  border-radius: 6px;
  object-fit: cover;
`;

const VideoInfo = styled.div`
  flex: 1;
  margin-left: 10px;
  display: flex;
  flex-direction: column;
`;

const VideoTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
`;

const VideoDate = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 4px;
`;

const PreviewButton = styled.button`
  margin-top: 8px;
  align-self: flex-start;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

/* ----- Modal & Loading Overlays ----- */
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
const ErrorModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20000;
`;

const ErrorModal = styled.div`
  background-color: #fff;
  padding: 20px 16px;
  border-radius: 6px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ErrorTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 12px;
`;

const ErrorMessageText = styled.p`
  font-size: 14px;
  color: #444;
  margin-bottom: 20px;
  line-height: 1.4;
`;

const ErrorCloseButton = styled.button`
  background-color: #000;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #676767;
  }
`;
