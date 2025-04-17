"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  useSearchParams,
  useRouter,
  useParams,
  usePathname,
} from "next/navigation";
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
  duration?: string;
}

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}

// ISO8601 형식의 duration 문자열을 초로 변환하는 함수
function parseISO8601Duration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  if (!matches) return 0;
  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// 초를 mm:ss 형식의 문자열로 변환하는 함수
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";
// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";

// pending action 타입 (채널 등록 vs. 영상 아티클 생성)
type PendingAction = "registerChannel" | "convertArticle" | null;

export default function ChannelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { channelId } = params as { channelId: string };
  const pathname = usePathname();

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
  // 성공 팝업 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    "채널 모니터링 등록이 완료되었습니다. 등록하신 채널의 신규 영상 업로드 시 유티클 요약본 카톡 알림을 확인해주세요."
  );

  // Recoil user 상태
  const setUser = useSetRecoilState(userState);
  const user = useRecoilValue(userState);
  const [phoneNumber, setPhoneNumber] = useState(""); // 입력받을 번호

  // pending action 및 선택된 videoId
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
      const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!YOUTUBE_API_KEY) {
        throw new Error("YouTube API key is missing.");
      }
      // (A) 채널 정보 가져오기
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

      // (B) 업로드 재생목록 ID 가져오기
      const detailRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${cId}&key=${YOUTUBE_API_KEY}`
      );
      const detailJson = await detailRes.json();
      if (!detailJson.items || detailJson.items.length === 0) {
        throw new Error("업로드 재생목록 정보를 찾을 수 없습니다.");
      }
      const uploadsPlaylistId =
        detailJson.items[0].contentDetails.relatedPlaylists.uploads;

      // (C) 최신 50개 영상 정보 가져오기
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
      );
      const playlistJson = await playlistRes.json();

      // videoId 목록 추출 (콤마 구분)
      const videoIds = (playlistJson.items || [])
        .map((item: any) => item.snippet.resourceId.videoId)
        .join(",");

      // 각 영상의 duration 정보를 가져오기
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      );
      const videosJson = await videosRes.json();
      const durationMap: Record<string, string> = {};
      (videosJson.items || []).forEach((video: any) => {
        durationMap[video.id] = video.contentDetails.duration;
      });

      // VideoItem 배열 생성 (3분 미만 영상은 필터링 - 쇼츠 영상 제외 안내)
      const items: VideoItem[] = (playlistJson.items || [])
        .map((item: any) => {
          const vidId = item.snippet.resourceId.videoId;
          const isoDuration = durationMap[vidId];
          const seconds = parseISO8601Duration(isoDuration);
          if (seconds < 180) return null; // 3분 미만 영상 제외
          return {
            videoId: vidId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt.split("T")[0],
            thumbnailUrl: item.snippet.thumbnails?.medium?.url,
            duration: formatDuration(seconds),
          };
        })
        .filter((item: any) => item !== null);
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

  // 영상 아티클 생성 함수 (기존 코드 유지)
  async function fetchSummaryEditorVideo(videoId: string) {
    if (!user?.email) {
      setPendingAction("convertArticle");
      setPendingVideoId(videoId);
      setShowLoginModal(true);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    setIsCreatingArticle(true);
    setLoadingMessage("아티클 구조 설계 중...");
    setLoadingMessage2(
      "영상 길이에 따라 최대 1분 소요될 수 있습니다.\n페이지를 떠나도 생성은 계속 진행됩니다!"
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

  // 채널 모니터링 등록 함수 (영상 정보는 불러오지 않고 채널만 등록)
  async function handleChannelMonitoring() {
    // 채널 모니터링 등록 성공 시 성공 팝업 띄움
    setSuccessMessage(
      "채널 모니터링 등록이 완료되었습니다. 카톡 알림을 확인해주세요."
    );
    setShowSuccessModal(true);
    return;
    if (!user?.email) {
      setPendingAction("registerChannel");
      setShowLoginModal(true);
      return;
    }
    const data = await getUserByEmail(user.email, user.displayName);
    const regRes = await fetch(
      `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${data.id}`
    );
    const json = await regRes.json();
    const existingChannel = json[0];
    if (existingChannel) {
      setErrorMessage(
        `이미 등록된 채널이 있습니다: "${existingChannel.title}".\n채널 변경을 원하시면 "채널 변경하기" 기능을 이용해주세요.`
      );
      setShowErrorModal(true);
      return;
    }
    // 여기서는 채널 핸들이 아닌, 채널 ID를 그대로 사용하여 등록 API 호출
    try {
      setIsCreatingArticle(true);
      setLoadingMessage("채널 모니터링 등록 중...");
      setLoadingMessage2("잠시만 기다려주세요.");
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/channel_by_id/${encodeURIComponent(
          channelData!.id
        )}?user_id=${user.id}`,
        {
          method: "GET",
          headers: { accept: "application/json" },
        }
      );
      if (!response.ok) {
        if (response.status === 400) {
          const errData = await response.json();
          setErrorMessage(errData.detail);
        } else {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        return;
      }
      // 채널 모니터링 등록 성공 시 성공 팝업 띄움
      setSuccessMessage(
        "채널 모니터링 등록이 완료되었습니다. 카톡 알림을 확인해주세요."
      );
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("채널 모니터링 등록 오류:", err);
      setErrorMessage(
        err.message || "채널 모니터링 등록 중 문제가 발생했습니다."
      );
    } finally {
      setIsCreatingArticle(false);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  }

  // 영상 아티클 변환 버튼 핸들러 (기존 코드 유지)
  function handleVideoArticle(videoId: string) {
    if (!user?.email) {
      setPendingAction("convertArticle");
      setPendingVideoId(videoId);
      setShowLoginModal(true);
    } else {
      fetchSummaryEditorVideo(videoId);
    }
  }

  // 뒤로가기 버튼 클릭 시, 구독 상세 페이지라면 /studio/subscriptions로 이동하도록 수정
  const handleGoBackStudio = () => {
    if (pathname.startsWith("/studio/subscriptions/")) {
      router.push("/studio");
    } else {
      router.push("/studio");
    }
  };

  // 로그인 성공 콜백
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
    if (pendingAction === "registerChannel") {
      setPendingAction(null);
      const regRes = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${data.id}`
      );
      const json = await regRes.json();
      const existingChannel = json[0];
      if (existingChannel) {
        setErrorMessage(
          `이미 등록된 채널이 있습니다: "${existingChannel.title}".\n채널 변경을 원하시면 "채널 변경하기" 기능을 이용해주세요.`
        );
        setShowErrorModal(true);
        return;
      }
      if (!data.phone) {
        console.log(data);
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

  // 휴대폰 번호 등록 함수
  const [phoneInput, setPhoneInput] = useState("");
  const savePhoneNumberAndRegister = async () => {
    const trimmed = phoneInput.trim();
    if (trimmed.length === 0) {
      setErrorMessage("휴대폰 번호를 입력해주세요.");
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
    } catch (err: any) {
      console.error("폰번호 등록 오류:", err);
      setErrorMessage("전화번호 등록 중 문제가 발생했습니다.");
    }
  };
  const handleSkipPhoneRegistration = () => {
    setShowPhoneModal(false);
    // 전화번호 입력 없이 채널 모니터링 등록 진행
  };
  // ---------------------- Render ----------------------
  if (loading) {
    return (
      <Container>
        <LogoHeader />
        <CenteredLoading>
          <LoadingSpinner />
          <LoadingText>채널 정보를 불러오는 중입니다.</LoadingText>
        </CenteredLoading>
      </Container>
    );
  }
  //   if (errorMsg) {
  //     return (
  //       <Container>
  //         <LogoHeader />
  //         <Message>{errorMsg}</Message>
  //       </Container>
  //     );
  //   }
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
        {/* 채널 모니터링 등록 리마인드 메시지 */}
        <InfoBox>
          채널 모니터링 등록 시, 등록한 채널의 신규 영상을 매일 아침 7시에
          모니터링하여 생성된 요약본이 카톡으로 전송되며, 아카이브를 통해 언제든
          다시 확인 가능합니다.
        </InfoBox>
      </InfoCard>

      <SectionTitle>최신 영상 목록</SectionTitle>
      {/* 쇼츠(3분 미만 영상) 제외 안내 */}
      <NoteText>※ 참고: 3분 미만 영상(쇼츠)은 목록에서 제외됩니다.</NoteText>
      {videoItems.length === 0 ? (
        <Message>최근 업로드 영상이 없습니다.</Message>
      ) : (
        <VideoList>
          {videoItems.map((vid) => (
            <VideoItemBox key={vid.videoId}>
              <ThumbnailContainer>
                <VideoThumb
                  src={vid.thumbnailUrl || "/images/no_video_thumb.jpg"}
                  alt={vid.title}
                />
                <DurationOverlay>{vid.duration}</DurationOverlay>
              </ThumbnailContainer>
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

      {showPhoneModal && (
        <ModalOverlay>
          <ModalContent>
            {/* 예: 폰 이모지 or 아이콘 */}
            <EmojiWrapper>📱</EmojiWrapper>
            <ModalTitle>카카오톡 알림을 위한 번호 등록</ModalTitle>
            <ModalDescription>
              채널 모니터링 알림을 받으려면 휴대폰 번호가 필요합니다.
              <br />
              🔒 입력하신 번호는 <strong>알림 발송 용도</strong>로만 안전하게
              사용됩니다.
            </ModalDescription>

            <PhoneInput
              placeholder="예: 010-1234-5678"
              value={phoneInput}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <PhoneButtonRow>
              <PhoneRegisterButton onClick={savePhoneNumberAndRegister}>
                번호 등록
              </PhoneRegisterButton>
              <SkipButton onClick={handleSkipPhoneRegistration}>
                채널 모니터링 등록 나중에 하기
              </SkipButton>
            </PhoneButtonRow>
          </ModalContent>
        </ModalOverlay>
      )}

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

      {showSuccessModal && (
        <SuccessModalOverlay>
          <SuccessModal>
            {/* 임팩트 아이콘/이모지 */}
            <SuccessIcon>🎉</SuccessIcon>

            <SuccessTitle>채널 모니터링 등록 완료!</SuccessTitle>

            <SuccessMessage>
              이제 유튜브 채널의 신규 영상이 업로드되면 <br />
              다음날 아침 7시에 요약본을 카톡으로 전달합니다.
              {"\n"}놓친 영상도 아카이브에서 언제든 다시 볼 수 있습니다!
            </SuccessMessage>

            <SuccessButton
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/studio"); // 스튜디오로 이동
              }}
            >
              확인
            </SuccessButton>
            {/* 필요하다면 추가 버튼 */}
            {/* <SuccessButton onClick={() => router.push("/studio/archive")}>
          아카이브 보러가기
        </SuccessButton> */}
          </SuccessModal>
        </SuccessModalOverlay>
      )}
    </Container>
  );
}

/* ---------------------- Styled Components ---------------------- */
const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

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
  height: 160px;
  background-position: center;
  background-size: cover;
  margin-top: 40px;
`;
const BannerPlaceholder = styled.div`
  width: 100%;
  height: 160px;
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
  width: 56px;
  height: 56px;
  border-radius: 28px;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ButtonRow = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
`;

const PhoneButtonRow = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const MonitorButton = styled.button`
  flex: 1;
  background: #007bff;
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
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin-top: 40px;
  margin-left: 16px;
`;

const NoteText = styled.p`
  font-size: 14px;
  color: #888;
  margin-left: 16px;
  margin-top: 8px;
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
  transition: background 0.2s;
  &:hover {
    background: #f2faff;
  }
`;

const ThumbnailContainer = styled.div`
  position: relative;
  margin-right: 12px;
`;

const VideoThumb = styled.img`
  width: 160px;
  height: 90px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
`;

const DurationOverlay = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  padding: 2px 4px;
  border-radius: 4px;
`;

const VideoInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const VideoTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VideoDate = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 4px;
`;

const VideoDuration = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 4px;
`;

const PreviewButton = styled.button`
  margin-top: 8px;
  align-self: flex-start;
  background-color: #0066cc;
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
const EmojiWrapper = styled.div`
  font-size: 36px;
  margin-bottom: 12px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const ModalDescription = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 20px;
  white-space: pre-line;
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

const CenteredLoading = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const PhoneInput = styled.input`
  width: 80%;
  padding: 12px;
  margin-top: 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
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

const PhoneRegisterButton = styled.button`
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
  width: 80%;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;
const SkipButton = styled.button`
  flex: 1;
  background-color: #ddd;
  color: #333;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 14px;
  font-size: 14px;
  margin-top: 12px;
  width: 80%;
  cursor: pointer;
  &:hover {
    background-color: #bbb;
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
  font-weight: 700;
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

/* Success Modal (등록 완료 팝업) */
const SuccessModalOverlay = styled(ModalOverlay)`
  animation: ${fadeIn} 0.3s ease forwards;
`;

const SuccessModal = styled(ModalContent)`
  text-align: center;
  padding: 24px 20px; /* 여백 좀 더 넉넉하게 */
  animation: ${fadeIn} 0.3s ease forwards;
  border: 2px solid #007bff;
`;

const SuccessIcon = styled.div`
  font-size: 40px;
  margin-bottom: 16px;
  color: #007bff;
`;

const SuccessTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 12px;
`;

const SuccessMessage = styled.p`
  font-size: 14px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.4;
  white-space: pre-line;
`;

const SuccessButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const SuccessButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 12px;
  width: 80%;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #005bb5;
  }
`;

/* InfoBox: 추가 안내 박스 */
const InfoBox = styled.div`
  background-color: #e8f4ff;
  border: 1px solid #b3d4fc;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: #005bb5;
  margin-top: 12px;
  line-height: 132%;
`;
