"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { getUserByEmail } from "@/api/apiClient";
import Image from "next/image";
import howStepImage1 from "/public/images/SubsLandingSection.png";
import {
  MdOutlineFormatListNumbered,
  MdSubject,
  MdInsights,
} from "react-icons/md";
import { FaComments } from "react-icons/fa";

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}
// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8001";

const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

const GOOGLE_CLIENT_ID =
  "303228054178-8tl7e7t4tup4s3d08olhgff2ap28vvl2.apps.googleusercontent.com";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
}

export default function VideoAutoArticleSection() {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);

  // 영상 URL 입력 및 모달 상태
  const [videoUrl, setVideoUrl] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [showManualInputModal, setShowManualInputModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingMessage2, setLoadingMessage2] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [channelInput, setChannelInput] = useState("");

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 처음 렌더 시 sessionStorage에서 토큰 확인
  useEffect(() => {
    const storedToken = sessionStorage.getItem("myYoutubeToken");
    if (storedToken) {
      setYoutubeToken(storedToken);
    }
  }, []);

  // 유튜브 URL에서 Video ID 추출 (유효하지 않으면 null 반환)
  const extractVideoId = (urlOrId: string): string | null => {
    try {
      const url = new URL(urlOrId);
      if (url.hostname === "youtu.be") {
        return url.pathname.slice(1);
      }
      if (url.hostname.includes("youtube.com")) {
        if (url.pathname === "/watch") {
          return url.searchParams.get("v");
        }
        if (url.pathname.startsWith("/live/")) {
          return url.pathname.split("/")[2];
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // ─────────────────────────────────────────
  // [A] 로그인 성공 시 처리
  // ─────────────────────────────────────────
  const handleLoginSuccess = async (loginUser: User) => {
    setShowLoginModal(false);
    if (!loginUser.email) return;
    try {
      const data = await getUserByEmail(loginUser.email, loginUser.displayName);
      setUserState({
        name: loginUser.displayName,
        email: loginUser.email,
        picture: loginUser.photoURL,
        id: data.id,
      });
      // 자동 진행: 입력값 검증 후 영상 아티클 생성 함수 호출
      if (!videoUrl.trim()) {
        setErrorMessage("🚨 유튜브 URL을 입력해주세요.");
        setShowErrorModal(true);
        return;
      }
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        setErrorMessage("🚨 올바른 유튜브 URL을 입력해주세요.");
        setShowErrorModal(true);
        return;
      }
      // (C) 로딩 시작
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      setIsLoading(true);
      setLoadingMessage("아티클 구조 설계 중...");
      setLoadingMessage2(
        "영상 길이에 따라 최대 1분이 소요될 수 있습니다.\n페이지를 떠나도 생성은 계속 진행됩니다😀"
      );
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/process/${encodeURIComponent(
            videoId
          )}?user_id=${encodeURIComponent(data.id)}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
            },
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          if (response.status === 400) {
            const errorData = await response.json();
            setErrorMessage(errorData.detail);
            setShowErrorModal(true);
          } else {
            throw new Error(`HTTP 오류: ${response.status}`);
          }
          return;
        }

        // (D) task_id가 있으면 해당 편집 화면으로 이동
        const { task_id } = await response.json();
        router.push(`/studio/${videoId}?task_id=${task_id}`);
      } catch (err) {
        console.error("요청 실패:", err);
        setErrorMessage("🚨 아티클 생성 중 문제가 발생했습니다.");
        setShowErrorModal(true);
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
        setLoadingMessage("");
        setLoadingMessage2("");
      }
    } catch (err) {
      console.error("로그인 후 오류:", err);
      setErrorMessage("로그인 처리 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    }
  };

  // ─────────────────────────────────────────
  // [B] 영상 아티클 생성 함수
  // ─────────────────────────────────────────
  const fetchSummaryEditorVideo = async () => {
    if (!user.email) {
      setShowLoginModal(true);
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMessage("유튜브 영상 URL을 입력해주세요!");
      setShowErrorModal(true);
      return;
    }
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setErrorMessage("올바른 유튜브 URL을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    setIsLoading(true);
    setLoadingMessage("영상 분석 중...");
    setLoadingMessage2("영상 길이에 따라 최대 1분 정도 걸릴 수 있어요!");

    try {
      const encodedUrl = encodeURIComponent(videoId);
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/${encodedUrl}?user_id=${user.id}`,
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
        } else {
          setErrorMessage(
            "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요!"
          );
        }
        setShowErrorModal(true);
        return;
      }
      const { task_id } = await response.json();
      router.push(`/studio/${videoId}?task_id=${task_id}`);
    } catch (err) {
      console.error("아티클 생성 에러:", err);
      setErrorMessage("아티클 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setShowErrorModal(true);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };

  // ─────────────────────────────────────────
  // [C] YouTube OAuth 및 좋아요/플레이리스트 불러오기
  // ─────────────────────────────────────────
  const filterKeywords = ["노래", "음악", "playlist", "플레이리스트"];

  // 좋아요한 영상 불러오기
  async function fetchLikedVideos(token: string) {
    try {
      let allVideos: any[] = [];
      let nextPageToken: string | undefined = undefined;
      do {
        const res: any = await fetch(
          `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&myRating=like&maxResults=20${
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
          allVideos = allVideos.concat(data.items);
        }
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);
      // 필터 적용: 각 영상의 title, description, tags에 지정 키워드가 있으면 제외
      const filteredVideos = allVideos.filter((video: any) => {
        const { title, description, tags } = video.snippet;
        const combinedText = `${title || ""} ${description || ""} ${
          tags ? tags.join(" ") : ""
        }`;
        return !filterKeywords.some((keyword) =>
          combinedText.toLowerCase().includes(keyword.toLowerCase())
        );
      });
      sessionStorage.setItem("myLikedVideos", JSON.stringify(filteredVideos));
      console.log("좋아요한 영상:", filteredVideos);
    } catch (err) {
      console.error("좋아요 영상 불러오기 오류:", err);
      setErrorMessage("좋아요한 영상 가져오는 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    }
  }

  // 플레이리스트 불러오기
  async function fetchPlaylists(token: string) {
    try {
      let allPlaylists: any[] = [];
      let nextPageToken: string | undefined = undefined;
      do {
        const res: any = await fetch(
          `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=20${
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
          allPlaylists = allPlaylists.concat(data.items);
        }
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);
      sessionStorage.setItem("myPlaylists", JSON.stringify(allPlaylists));
      console.log("플레이리스트:", allPlaylists);
      return allPlaylists;
    } catch (err) {
      console.error("플레이리스트 불러오기 오류:", err);
      setErrorMessage("플레이리스트 가져오는 중 문제가 발생했습니다.");
      setShowErrorModal(true);
      return [];
    }
  }

  // 플레이리스트 내 영상들 가져오기 (duration 및 tags/타이틀/설명 필터링 포함, OAuth 토큰 사용)
  async function fetchPlaylistItems(
    playlistId: string,
    token: string
  ): Promise<any[]> {
    let allItems: any[] = [];
    let nextPageToken: string | undefined = undefined;

    // 1. PlaylistItems API 호출 (snippet, contentDetails 포함)
    do {
      const url = new URL(
        "https://youtube.googleapis.com/youtube/v3/playlistItems"
      );
      url.searchParams.set("part", "snippet,contentDetails");
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("playlistId", playlistId);
      if (nextPageToken) {
        url.searchParams.set("pageToken", nextPageToken);
      }
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (data.items) {
        allItems = allItems.concat(data.items);
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    // 2. 영상 ID 추출 (중복 제거)
    const videoIds = Array.from(
      new Set(allItems.map((item) => item.snippet.resourceId.videoId))
    ).join(",");

    // 3. Videos API 호출 (snippet 및 contentDetails 포함하여 tags, title, description, duration 정보 확보)
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "snippet,contentDetails");
    videosUrl.searchParams.set("id", videoIds);
    const videosRes = await fetch(videosUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const videosData = await videosRes.json();

    // 4. videoId별 영상 정보 매핑 생성
    const videoInfoMap: { [key: string]: any } = {};
    if (videosData.items) {
      videosData.items.forEach((video: any) => {
        videoInfoMap[video.id] = video;
      });
    }

    // 5. 필터링할 키워드 정의 (대소문자 구분 없이)
    const filterKeywords = ["노래", "음악", "playlist", "플레이리스트"];

    // 6. 필터링: 각 영상의 title, description, tags에 키워드가 포함되어 있다면 제외
    const filteredItems = allItems.filter((item) => {
      const videoId = item.snippet.resourceId.videoId;
      const videoInfo = videoInfoMap[videoId];
      if (!videoInfo) return true; // 정보가 없으면 그대로 유지
      const { title, description, tags } = videoInfo.snippet;
      const combinedText = `${title || ""} ${description || ""} ${
        tags ? tags.join(" ") : ""
      }`;
      // 키워드가 하나라도 포함되어 있으면 false (제외)
      return !filterKeywords.some((keyword) =>
        combinedText.toLowerCase().includes(keyword.toLowerCase())
      );
    });

    // 7. 각 항목에 duration 정보 병합
    const itemsWithDuration = filteredItems.map((item) => {
      const videoId = item.snippet.resourceId.videoId;
      const videoInfo = videoInfoMap[videoId];
      const duration = videoInfo?.contentDetails?.duration || "";
      return {
        ...item,
        duration,
      };
    });

    return itemsWithDuration;
  }

  async function handleOfflineFetchLikedVideosOrPlaylists() {
    router.push("/studio/videos");
    return;
  }

  const openManualInputModal = () => {
    // if (!user.email) {
    //   // 로그인되지 않은 경우는 여전히 showLoginModal 처리
    //   setShowLoginModal(true);
    //   return;
    // }
    setShowManualInputModal(true);
  };

  async function handleFetchLikedVideosOrPlaylists() {
    // 로딩 시작
    setIsLoading(true);
    setLoadingMessage("유튜브 데이터 불러오는 중...");
    setLoadingMessage2("좋아요한 영상/내 플레이리스트를 불러오고 있어요!🙋");
    const storedToken = sessionStorage.getItem("myYoutubeToken");
    const storedTokenExpire = sessionStorage.getItem("myYoutubeTokenExpire");
    const now = Date.now();

    if (storedToken && storedTokenExpire && now < Number(storedTokenExpire)) {
      setYoutubeToken(storedToken);

      try {
        await fetchLikedVideos(storedToken);
        const playlists = await fetchPlaylists(storedToken);
        // 각 플레이리스트의 영상 아이템도 함께 불러오기
        const playlistItemsMap: { [key: string]: any[] } = {};
        for (const playlist of playlists) {
          const items = await fetchPlaylistItems(playlist.id, storedToken);
          playlistItemsMap[playlist.id] = items;
        }
        sessionStorage.setItem(
          "myPlaylistItems",
          JSON.stringify(playlistItemsMap)
        );
        // 모든 작업 완료 후 라우터 이동
        router.push("/studio/videos");
      } catch (error) {
        console.error("좋아요/플레이리스트 불러오기 오류:", error);
        setErrorMessage("데이터를 불러오는 중 문제가 발생했습니다.");
        setShowErrorModal(true);
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
        setLoadingMessage2("");
      }
      return;
    }

    // 토큰이 없거나 만료된 경우: 새로운 토큰 클라이언트 요청
    initGoogleTokenClientForYoutube();
    // initGoogleTokenClientForYoutube의 콜백 내부에서 router.push와 함께
    // 로딩 상태를 해제하도록 처리하거나, 별도로 타임아웃 후 setIsLoading(false) 처리 가능
  }

  const initGoogleTokenClientForYoutube = () => {
    if (!window.google || !window.google.accounts) {
      alert("Google API 로드가 되지 않았습니다. 잠시 후 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      callback: async (resp: TokenResponse) => {
        if (resp.access_token) {
          const now = Date.now();
          const expireMs = now + (resp.expires_in ?? 3600) * 1000;
          sessionStorage.setItem("myYoutubeToken", resp.access_token);
          sessionStorage.setItem("myYoutubeTokenExpire", String(expireMs));
          setYoutubeToken(resp.access_token);
          try {
            await fetchLikedVideos(resp.access_token);
            const playlists = await fetchPlaylists(resp.access_token);
            const playlistItemsMap: { [key: string]: any[] } = {};
            for (const playlist of playlists) {
              const items = await fetchPlaylistItems(
                playlist.id,
                resp.access_token
              );
              playlistItemsMap[playlist.id] = items;
            }
            sessionStorage.setItem(
              "myPlaylistItems",
              JSON.stringify(playlistItemsMap)
            );
            router.push("/studio/videos");
          } catch (error) {
            console.error("Token client callback error:", error);
            setErrorMessage("데이터 불러오기 중 문제가 발생했습니다.");
            setShowErrorModal(true);
          } finally {
            setIsLoading(false);
            setLoadingMessage("");
            setLoadingMessage2("");
          }
        } else {
          alert("토큰 발급 실패");
          setIsLoading(false);
        }
      },
    });
    tokenClient.requestAccessToken();
  };

  interface ManualInputModalProps {
    onClose: () => void;
  }

  function ManualInputModal({ onClose }: ManualInputModalProps) {
    const [showHintImages, setShowHintImages] = useState(false);
    const toggleHintImages = () => setShowHintImages((prev) => !prev);

    return (
      <ModalOverlay>
        <ModalContent>
          <ModalClose onClick={onClose}>×</ModalClose>
          <InfoMessage>영상 링크 직접 입력</InfoMessage>
          <InfoDescription>
            양질의 유튜브 영상의 핵심 내용을 빠르게 확인해보세요!
          </InfoDescription>

          <ModalInputRow>
            <VideoUrlInput
              placeholder="https://www.youtube.com/watch?v=abcd1234"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </ModalInputRow>

          <RegisterButtonColumn onClick={fetchSummaryEditorVideo}>
            아티클 생성하기
          </RegisterButtonColumn>

          <HintBox>
            <HintTitle>유튜브 @채널핸들명 찾기</HintTitle>
            <InfoDescription>
              채널 홈 화면 상단에서 <strong>@아이디</strong>를 확인할 수
              있습니다.
            </InfoDescription>
            {/* 펼치기 토글 등은 필요 시 추가 */}
            <ToggleHintButton onClick={toggleHintImages}>
              {showHintImages ? "이미지 접기 ▲" : "가이드 이미지 보기 ▼"}
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

  const [showHintImages, setShowHintImages] = useState(false);
  const toggleHintImages = () => setShowHintImages((prev) => !prev);
  // ─────────────────────────────────────────
  // JSX 렌더링
  // ─────────────────────────────────────────
  return (
    <Container>
      {/* Hero Section */}
      <HeroSection>
        <HeroTitle>유튜브 영상 요약 & 아티클 생성</HeroTitle>
        <HeroSubtitle>
          긴 영상의 핵심을 바로 텍스트로 확인하고,
          <br />
          집중 시청을 도와드립니다.
        </HeroSubtitle>
        <ButtonGroup>
          <BlueButton onClick={handleFetchLikedVideosOrPlaylists}>
            좋아요한 영상/플레이리스트 불러오기
          </BlueButton>
          {/* <GrayButton onClick={() => setShowManualInputModal(true)}>
            영상 링크로 즉시 요약 아티클 확인하기
          </GrayButton> */}
        </ButtonGroup>
        <Separator>또는</Separator>
        <InlineForm>
          <VideoUrlInput
            placeholder="https://www.youtube.com/watch?v=abcd1234"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <GrayButton onClick={fetchSummaryEditorVideo}>
            영상 즉시 요약하기{" "}
          </GrayButton>
        </InlineForm>
        {/** 가이드 이미지 토글 **/}

        <ToggleHintButton onClick={() => setShowHintImages((v) => !v)}>
          {showHintImages ? "가이드 접기 ▲" : "영상 URL 입력 가이드 ▼"}
        </ToggleHintButton>
        {showHintImages && (
          <HintImageScrollContainer>
            <HintImage src="/images/YoutubeHandleGuide1.png" alt="예시1" />
            <HintImage src="/images/YoutubeHandleGuide2.png" alt="예시2" />
          </HintImageScrollContainer>
        )}
        {showManualInputModal && (
          <ManualInputModal onClose={() => setShowManualInputModal(false)} />
        )}
        <HeroVideoWrapper>
          <Video
            ref={videoRef}
            src="/videos/hero_output_video_250412.mp4"
            // poster="/images/What유티클2.png"
            muted
            autoPlay
            playsInline
            loop
            webkit-playsinline="true"
          />
        </HeroVideoWrapper>
      </HeroSection>

      {/* Landing / Why Section */}
      <LandingSection>
        <WhySection>
          <SectionTitle>🤔 왜 필요할까요?</SectionTitle>
          <WhyText>
            쏟아지는 유튜브 영상 속에서 <br />
            전체 영상을 다 보려면 시간이 많이 들 수밖에 없습니다.
            <br />
            <br />
            아티클 생성 솔루션은 크리에이터의 콘텐츠 기획과 <br /> 시청자의 핵심
            정보 파악 모두에 도움을 줍니다.
            <br />
            <br />
            빠른 요약으로 시간을 절약하고, <br /> 보다 전략적인 의사결정을
            해보세요.
          </WhyText>
        </WhySection>
      </LandingSection>

      {/* Features Section */}
      <FeaturesSection>
        <SectionTitle>어떤 기능이 있나요?</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>
              <MdOutlineFormatListNumbered size={36} color="#007bff" />
            </FeatureIcon>
            <CardTitle>5줄 핵심 요약</CardTitle>
            <CardDesc>
              영상의 주요 내용을 5줄로 간결하게 정리해 드립니다.
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <MdSubject size={36} color="#007bff" />
            </FeatureIcon>
            <CardTitle>최대 10문단 상세 요약</CardTitle>
            <CardDesc>
              긴 영상도 최대 10개 문단까지 체계적으로 요약해 드립니다.
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <FaComments size={36} color="#007bff" />
            </FeatureIcon>
            <CardTitle>댓글 인사이트 요약</CardTitle>
            <CardDesc>
              영상의 댓글들을 한데 모아, <br />
              시청자들의 반응과 주요 의견을 추려낼 수 있어요.
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>
              <MdInsights size={36} color="#007bff" />
            </FeatureIcon>
            <CardTitle>주제별 핵심 인사이트 제공</CardTitle>
            <CardDesc>
              영상 주제에 맞춰 주요 포인트를 자동으로 선별해 <br /> 더욱 깊이
              있는 정보를 얻을 수 있어요.
            </CardDesc>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      {/* How Section */}
      {/* <HowSection>
        <SectionTitle>어떻게 사용하나요?</SectionTitle>
        <StepsRow>
          <StepBox>
            <StepIcon>1</StepIcon>
            <StepText>
              내 유튜브 데이터 가져오기 <br />
              <span>(좋아요한 영상, 플레이리스트 등)</span> <br />
              또는 영상 링크 직접 입력
            </StepText>
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
            <StepText>
              아티클 생성 클릭 <br />
              <br />
              <span>
                - 5줄 요약, 상세 요약, 댓글 인사이트 등의 결과를 차례로 생성
              </span>
            </StepText>
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
        </StepsRow>
      </HowSection> */}

      {/* CTA Section */}
      <CTASection>
        <CTATitle>지금 바로 시작해 보세요!</CTATitle>
        <CTAText>
          좋아요한 영상이나 플레이리스트를 가져오거나,
          <br />
          직접 입력한 링크로 쉽게 핵심 요약을 만들어 보세요.
        </CTAText>
        <CTAButton onClick={handleFetchLikedVideosOrPlaylists}>
          좋아요한 영상, 플레이리스트 불러오기
        </CTAButton>
        <CTAButtonSecondary onClick={() => setShowManualInputModal(true)}>
          영상 링크로 즉시 요약 아티클 확인하기
        </CTAButtonSecondary>
      </CTASection>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingMessage>{loadingMessage}</LoadingMessage>
          <SubMessage>{loadingMessage2}</SubMessage>
        </LoadingOverlay>
      )}

      {/* 로그인 모달 */}
      {showLoginModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowLoginModal(false)}>×</ModalClose>
            <InfoMessage>로그인이 필요해요</InfoMessage>
            <InfoDescription>
              영상 요약 아티클 기능을 사용하려면 Google 로그인이 필요합니다.
            </InfoDescription>
            <GoogleLogin onLoginSuccess={handleLoginSuccess} />
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 에러 모달 */}
      {showErrorModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowErrorModal(false)}>×</ModalClose>
            <InfoMessage>문제가 발생했어요</InfoMessage>
            <InfoDescription>{errorMessage}</InfoDescription>
            <ModalButton onClick={() => setShowErrorModal(false)}>
              확인
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

/* ────────── Styled Components ────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px 80px;
  animation: ${fadeIn} 0.5s ease-in-out;
  font-family: "Pretendard Variable", sans-serif;
`;

const HeroSection = styled.section`
  margin: 24px 16px;
  margin-top: 40px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-in-out;
`;
const HeroTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-bottom: 12px;
`;
const HeroSubtitle = styled.p`
  font-size: 16px;
  color: #444;
  line-height: 1.4;
  margin-bottom: 24px;
`;
const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const Separator = styled.div`
  text-align: center;
  font-size: 14px;
  color: #666;
  margin: 12px 0;
`;
const InlineForm = styled.div`
  display: flex;
  gap: 4px;
  margin: 4px 0;
  flex-direction: column;
`;
const HeroVideoWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  margin-top: 80px;
`;
const Video = styled.video`
  width: 88%;
  object-fit: contain; /* 잘리지 않도록 contain */
`;

const BlueButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  padding: 16px 20px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

// 1) Secondary용 OutlineButton 추가
const OutlineButton = styled.button`
  background: white;
  color: #007bff;
  font-weight: 700;
  border: 2px solid #007bff;
  border-radius: 6px;
  padding: 14px 20px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: rgba(0, 123, 255, 0.1);
  }
`;
const GrayButton = styled.button`
  background-color: #f0f0f5;
  color: #333;
  font-weight: 600;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 14px 16px;
  font-size: 16px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  &:hover {
    background-color: #e4e4eb;
  }
`;

const LandingSection = styled.section`
  margin: 24px 16px;
`;
const WhySection = styled.section`
  margin-top: 60px;
`;
const WhyText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #444;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-top: 80px;
  margin-bottom: 24px;
  color: #000;
  text-align: center;
`;

// Features Section Styled Components
const FeaturesSection = styled.section`
  margin-top: 80px;
`;
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
const FeatureIcon = styled.div`
  margin-bottom: 12px;
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

// How Section Styled Components
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
  span {
    font-size: 15px;
    font-weight: 300;
  }
`;
const HowVideoWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  margin-top: 20px;
  margin-bottom: 60px;
`;
const StepImageBox = styled.div`
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 60px;
`;

// CTA Section Styled Components
const CTASection = styled.section`
  margin-top: 100px;
  padding: 40px 12px;
  background-color: #f3f9ff;
  border-radius: 8px;
  text-align: center;
`;
const CTATitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 132%;
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

// Loading & Modal Components
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: rgba(255, 255, 255, 0.86);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const LoadingSpinner = styled.div`
  width: 44px;
  height: 44px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
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
const LoadingMessage = styled.p`
  margin-top: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  line-height: 1.4;
  white-space: pre-line;
  text-align: center;
`;
const SubMessage = styled.p`
  margin-top: 8px;
  font-size: 14px;
  color: #000;
  line-height: 1.4;
  white-space: pre-line;
  text-align: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9900;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalContent = styled.div`
  width: 90%;
  max-width: 360px;
  background: #fff;
  border-radius: 6px;
  padding: 20px 16px;
  text-align: center;
  position: relative;
`;
const ModalClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 20px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
`;
const InfoMessage = styled.h3`
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
  white-space: pre-line;
`;
const ModalButton = styled.button`
  display: block;
  width: 100%;
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 15px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

// 구독 채널 카드, 입력, 힌트 등
const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding: 16px;
  margin-bottom: 32px;
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
  padding: 12px;
  width: 120px;
  flex-shrink: 0;
  text-align: center;
`;
const ChannelThumb = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  object-fit: cover;
  margin-bottom: 8px;
`;

const ChannelName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const ChannelSubs = styled.div`
  font-size: 12px;
  color: #777;
`;

const ModalInputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const VideoUrlInput = styled.input`
  flex: 1;
  padding: 16px;
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
  padding: 14px 16px;
  font-size: 14px;
  width: 100%;
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
  margin-top: 32px;
`;
const HintTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #333;
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
