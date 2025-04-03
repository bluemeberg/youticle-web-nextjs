"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import LogoHeader from "@/common/LogoHeader";
import { timeAgo } from "@/utils/formatter";

/** 인터페이스 정의 */
interface VideoItem {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails?: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
  contentDetails?: {
    duration?: string; // ISO8601 형식 예: "PT10M30S"
  };
}

interface Playlist {
  id: string;
  snippet: {
    title: string;
  };
}

interface PlaylistItemsMap {
  [playlistId: string]: VideoItem[];
}

/** ISO8601 기간 문자열을 초로 변환하는 함수 */
function parseISO8601Duration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  if (!matches) return 0;
  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/** 좋아요한 영상 및 플레이리스트 탭 UI */
export default function StudioVideos() {
  const router = useRouter();

  // 탭: "liked" or "playlists"
  const [activeTab, setActiveTab] = useState<"liked" | "playlists">("liked");

  // 좋아요한 영상, 플레이리스트 목록, 각 플레이리스트 아이템
  const [likedVideos, setLikedVideos] = useState<VideoItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistItemsMap, setPlaylistItemsMap] = useState<PlaylistItemsMap>(
    {}
  );
  const [activePlaylistId, setActivePlaylistId] = useState<string>("");

  // 세션스토리지에서 데이터 로드
  useEffect(() => {
    const likedData = sessionStorage.getItem("myLikedVideos");
    const playlistsData = sessionStorage.getItem("myPlaylists");
    const playlistItemsData = sessionStorage.getItem("myPlaylistItems");

    if (likedData) {
      try {
        const parsedLiked: VideoItem[] = JSON.parse(likedData);
        setLikedVideos(parsedLiked);
      } catch (e) {
        console.error("좋아요 영상 데이터 파싱 에러:", e);
      }
    }
    if (playlistsData) {
      try {
        const pls: Playlist[] = JSON.parse(playlistsData);
        setPlaylists(pls);
        if (pls.length > 0) {
          setActivePlaylistId(pls[0].id);
        }
      } catch (e) {
        console.error("플레이리스트 데이터 파싱 에러:", e);
      }
    }
    if (playlistItemsData) {
      try {
        setPlaylistItemsMap(JSON.parse(playlistItemsData));
      } catch (e) {
        console.error("플레이리스트 아이템 데이터 파싱 에러:", e);
      }
    }
  }, []);

  console.log("좋아요한 영상:", likedVideos);

  /** 아티클 변환 로직 (예시: 콘솔 출력) */
  const handleConvertToArticle = (videoId: string) => {
    console.log(`아티클 변환 요청: ${videoId}`);
    // 실제 구현에서는 router.push(`/studio/${videoId}?task_id=...`) 등으로 처리
  };

  // 좋아요한 영상 탭의 경우, 3분 미만 영상은 필터링
  const filteredLikedVideos = likedVideos.filter((vid) => {
    const duration = vid.contentDetails?.duration || "PT0S";
    return parseISO8601Duration(duration) >= 180;
  });

  //   // 플레이리스트 탭의 경우, 선택한 플레이리스트 내 영상도 3분 미만 영상 제외
  //   const filteredPlaylistVideos =
  //     playlistItemsMap[activePlaylistId]?.filter((vid) => {
  //       const duration = vid.contentDetails?.duration || "PT0S";
  //       return parseISO8601Duration(duration) >= 180;
  //     }) || [];

  return (
    <>
      <LogoHeader />
      <Container>
        <HeaderBox>
          <Title>내 영상 모음</Title>
          <Note>※ 3분 미만 영상(쇼츠)은 목록에서 제외됩니다.</Note>

          <TabContainer>
            <TabButton
              active={activeTab === "liked"}
              onClick={() => setActiveTab("liked")}
            >
              👍 좋아요 영상
            </TabButton>
            <TabButton
              active={activeTab === "playlists"}
              onClick={() => setActiveTab("playlists")}
            >
              📋 플레이리스트
            </TabButton>
            <TabHighlight activeTab={activeTab} />
          </TabContainer>
        </HeaderBox>

        {/* 좋아요 영상 탭 */}
        {activeTab === "liked" && (
          <VideoListContainer>
            {filteredLikedVideos.length === 0 ? (
              <NoData>좋아요한 영상이 없습니다.</NoData>
            ) : (
              filteredLikedVideos.map((vid) => (
                <VideoItemBox key={vid.id}>
                  <ThumbnailContainer>
                    <VideoThumb
                      src={
                        vid.snippet.thumbnails?.default?.url ||
                        "/images/no_video_thumb.jpg"
                      }
                      alt={vid.snippet.title}
                    />
                    <DurationOverlay>
                      {vid.contentDetails?.duration}
                    </DurationOverlay>
                  </ThumbnailContainer>
                  <VideoInfo>
                    <VideoTitle>{vid.snippet.title}</VideoTitle>
                    <VideoDate>{timeAgo(vid.snippet.publishedAt)}</VideoDate>
                    <PreviewButton
                      onClick={() => handleConvertToArticle(vid.id)}
                    >
                      아티클 변환
                    </PreviewButton>
                  </VideoInfo>
                </VideoItemBox>
              ))
            )}
          </VideoListContainer>
        )}

        {/* 플레이리스트 탭 */}
        {activeTab === "playlists" && (
          <PlaylistContainer>
            <PlaylistTabScroll>
              {playlists.map((pl) => (
                <PlaylistTab
                  key={pl.id}
                  active={activePlaylistId === pl.id}
                  onClick={() => setActivePlaylistId(pl.id)}
                >
                  {pl.snippet.title}
                </PlaylistTab>
              ))}
            </PlaylistTabScroll>
            <VideoListContainer>
              {playlistItemsMap[activePlaylistId].length > 0 ? (
                playlistItemsMap[activePlaylistId].map((video) => (
                  <VideoRow key={video.id}>
                    <ThumbWrapper>
                      <Thumbnail
                        src={
                          video.snippet?.thumbnails?.medium?.url ||
                          video.snippet?.thumbnails?.default?.url ||
                          "/images/default_thumbnail.png"
                        }
                        alt={video.snippet.title}
                      />
                    </ThumbWrapper>
                    <VideoInfo>
                      <VideoTitle>{video.snippet.title}</VideoTitle>
                    </VideoInfo>
                    <ConvertButton
                      onClick={() => handleConvertToArticle(video.id)}
                    >
                      아티클 변환
                    </ConvertButton>
                  </VideoRow>
                ))
              ) : (
                <NoData>선택한 플레이리스트에 영상이 없습니다.</NoData>
              )}
            </VideoListContainer>
          </PlaylistContainer>
        )}
      </Container>
    </>
  );
}

/* ────────── Styled Components ────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
  animation: ${fadeIn} 0.5s ease;
  font-family: "Pretendard Variable", sans-serif;
  margin-top: 52px;
`;

const HeaderBox = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const Note = styled.p`
  font-size: 13px;
  color: #777;
  margin-bottom: 16px;
`;

const TabContainer = styled.div`
  position: relative;
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 12px;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  background: none;
  border: none;
  color: ${({ active }) => (active ? "#007bff" : "#555")};
  font-weight: 600;
  font-size: 15px;
  padding: 12px;
  cursor: pointer;
  text-align: center;
  &:hover {
    color: #007bff;
  }
`;

const TabHighlight = styled.div<{ activeTab: "liked" | "playlists" }>`
  position: absolute;
  bottom: 0;
  height: 3px;
  background-color: #007bff;
  transition: 0.3s;
  width: 50%;
  left: ${({ activeTab }) => (activeTab === "liked" ? "0" : "50%")};
`;

const VideoListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NoData = styled.p`
  font-size: 14px;
  color: #999;
  margin-top: 16px;
`;

/** 영상 아이템 행 (플레이리스트 탭용) */
const VideoRow = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  gap: 10px;
`;

const ThumbWrapper = styled.div`
  width: 96px;
  height: 54px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
`;

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ConvertButton = styled.button`
  background: #007bff;
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    background-color: #005caf;
  }
`;

/** 좋아요 영상 탭용 */
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

/** 플레이리스트 구역 */
const PlaylistContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const PlaylistTabScroll = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 8px;
  margin-bottom: 8px;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;
const PlaylistTab = styled.button<{ active: boolean }>`
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid ${({ active }) => (active ? "#007bff" : "#ddd")};
  background: ${({ active }) => (active ? "#e7f1ff" : "#f9f9f9")};
  color: ${({ active }) => (active ? "#007bff" : "#333")};
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background: #eef6ff;
    border-color: #007bff;
    color: #007bff;
  }
`;

/** 모달, 로딩, 에러, 성공 등 */
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

const InfoMessage = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
`;

const InfoDescription = styled.p`
  font-size: 14px;
  line-height: 1.4;
  color: #666;
  margin-bottom: 16px;
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

const PhoneButtonRow = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

const SuccessModalOverlay = styled(ModalOverlay)`
  animation: ${fadeIn} 0.3s ease forwards;
`;

const SuccessModal = styled(ModalContent)`
  text-align: center;
  padding: 24px 20px;
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
