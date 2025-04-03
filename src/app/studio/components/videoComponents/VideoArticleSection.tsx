"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { getUserByEmail } from "@/api/apiClient";

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingMessage2, setLoadingMessage2] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);

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
      fetchSummaryEditorVideo();
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
      const encodedUrl = encodeURIComponent(videoUrl);
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
      sessionStorage.setItem("myLikedVideos", JSON.stringify(allVideos));
      console.log("좋아요한 영상:", allVideos);
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

  // 플레이리스트 내 영상들 가져오기
  async function fetchPlaylistItems(
    playlistId: string,
    token: string
  ): Promise<any[]> {
    let allItems: any[] = [];
    let nextPageToken: string | undefined = undefined;
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
    return allItems;
  }

  async function handleFetchLikedVideosOrPlaylists() {
    const storedToken = sessionStorage.getItem("myYoutubeToken");
    const storedTokenExpire = sessionStorage.getItem("myYoutubeTokenExpire");
    const now = Date.now();
    if (storedToken && storedTokenExpire && now < Number(storedTokenExpire)) {
      setYoutubeToken(storedToken);
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
      router.push("/studio/videos");
      return;
    }
    initGoogleTokenClientForYoutube();
  }

  const initGoogleTokenClientForYoutube = () => {
    if (!window.google || !window.google.accounts) {
      alert("Google API 로드가 되지 않았습니다. 잠시 후 다시 시도해주세요.");
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
          router.push("/studio/subscriptions");
        } else {
          alert("토큰 발급 실패");
        }
      },
    });
    tokenClient.requestAccessToken();
  };

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
            좋아요/플레이리스트 불러오기
          </BlueButton>
          <GrayButton onClick={() => setShowManualForm((prev) => !prev)}>
            영상 링크 직접 입력하기
          </GrayButton>
        </ButtonGroup>
        {showManualForm && (
          <ManualInputContainer>
            <ManualTitle>유튜브 영상 URL을 입력하세요</ManualTitle>
            <ManualInputRow>
              <VideoUrlInput
                placeholder="https://www.youtube.com/watch?v=abcd1234"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <RegisterButtonColumn onClick={fetchSummaryEditorVideo}>
                아티클 생성하기
              </RegisterButtonColumn>
            </ManualInputRow>
            <HintDesc>
              URL을 복사해서 붙여넣거나, 공유 버튼으로 만든 링크도 OK!
            </HintDesc>
          </ManualInputContainer>
        )}
      </HeroSection>

      {/* Why Section */}
      <Section>
        <SectionTitle>왜 필요할까요?</SectionTitle>
        <SectionContent>
          유튜브 영상 전체를 시청하는 건 시간 낭비!
          <br />
          핵심 내용만 요약된 아티클로 빠르게 정보를 파악하세요.
        </SectionContent>
      </Section>

      {/* What Section */}
      <Section>
        <SectionTitle>무엇을 할 수 있나요?</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <CardTitle>긴 영상 AI 요약</CardTitle>
            <CardDesc>
              주요 내용을 요약해 드려, 긴 영상도 빠르게 파악할 수 있습니다.
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <CardTitle>자동 챕터 분할</CardTitle>
            <CardDesc>
              AI가 영상 구간을 자동으로 분할하여, 원하는 부분만 선택해 시청할 수
              있습니다.
            </CardDesc>
          </FeatureCard>
          <FeatureCard>
            <CardTitle>문서 저장</CardTitle>
            <CardDesc>
              요약된 아티클을 문서로 저장해 언제든 검색하고 확인할 수 있습니다.
            </CardDesc>
          </FeatureCard>
        </FeaturesGrid>
      </Section>

      {/* Final CTA Section */}
      <CTASection>
        <CTATitle>지금 바로 시작해보세요!</CTATitle>
        <CTAText>
          좋아요한 영상과 플레이리스트, 그리고 직접 입력한 영상 링크로
          <br />
          쉽고 빠르게 영상 요약 아티클을 생성해보세요.
        </CTAText>
        <CTAButton onClick={() => setShowManualForm(true)}>
          영상 링크 직접 입력하기
        </CTAButton>
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
            <InfoMessage>🙋 로그인이 필요합니다</InfoMessage>
            <InfoDescription>
              영상 요약 아티클 생성을 위해 Google 로그인 해주세요.
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
            <InfoMessage>❌ 오류 발생</InfoMessage>
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

/** ────────────────────────── Styled Components ────────────────────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  animation: ${fadeIn} 0.4s ease-in-out;
  font-family: "Pretendard Variable", sans-serif;
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 48px;
`;
const HeroTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #000;
  margin-bottom: 12px;
`;
const HeroSubtitle = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 24px;
`;
const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const BlueButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 14px;
  font-size: 15px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;
const GrayButton = styled.button`
  background-color: #f5f5f9;
  color: #333;
  font-weight: 600;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 14px;
  font-size: 15px;
  cursor: pointer;
  &:hover {
    background-color: #ebebf0;
  }
`;

const ManualInputContainer = styled.div`
  margin-top: 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 16px;
  text-align: left;
`;
const ManualTitle = styled.h3`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #222;
`;
const ManualInputRow = styled.div`
  display: flex;
  gap: 8px;
`;
const VideoUrlInput = styled.input`
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
  padding: 14px 16px;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;
const HintDesc = styled.p`
  margin-top: 6px;
  font-size: 13px;
  color: #777;
`;

const Section = styled.section`
  margin-bottom: 48px;
  text-align: center;
`;
const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 12px;
`;
const SectionContent = styled.p`
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  max-width: 480px;
  margin: 0 auto;
  white-space: pre-line;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;
const FeatureCard = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 16px;
`;
const CardTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #222;
  margin-bottom: 8px;
`;
const CardDesc = styled.p`
  font-size: 13px;
  color: #444;
  line-height: 1.4;
`;

const CTASection = styled.section`
  background-color: #f3f9ff;
  padding: 24px 16px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 40px;
`;
const CTATitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 12px;
`;
const CTAText = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: #444;
  margin-bottom: 16px;
`;
const CTAButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 14px 20px;
  font-size: 15px;
  cursor: pointer;
  &:hover {
    background-color: #005caf;
  }
`;

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
  z-index: 10000;
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

/** ────────────────────────── 구독 채널 카드 (가로 스크롤) ────────────────────────── */
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
