"use client";

import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import YouTube, { YouTubeProps } from "react-youtube";
import { useRecoilValue, useSetRecoilState } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import Contents from "./Contents";
import VideoCard from "./VideoCard";
import {
  DataProps,
  StockAnalysis,
  RealEstateAnalysis,
  RecommendedTool,
  EconomicTrend,
  MarketAnalysisEconomy,
  InvestmentStrategyEconomy,
  RelatedTechnology,
  StrategicInsight,
  BusinessTrend,
  ApplicationTip,
  RelatedTool,
} from "@/types/dataProps";
import { playerState } from "@/store/player";
import { base64ToBlobUrl } from "@/utils/base64";
import { formatSummary } from "@/utils/formatter";
import { timeAgo } from "@/utils/formatter";
import { isDesktop } from "react-device-detect";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { userState } from "@/store/user";
import { fetchSubscribedSubjects } from "@/api/apiClient";
import CommentsInsightSection from "@/editor/[id]/components/CommentInsightSection";
import CommentsInsightSectionDimmed from "@/editor/[id]/components/CommentInsightDimmed";

interface ClientSideProps {
  id: string;
  detailData: DataProps;
}

const ClientSide = ({ id, detailData }: ClientSideProps) => {
  console.log(detailData);
  const [videoPlayer, setVideoPlayer] = useState<any>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isPlayerVisible = useRecoilValue(playerState);
  const setIsPlayerVisible = useSetRecoilState(playerState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    setVideoPlayer(event.target);
    setIsLoading(false);
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    if (!event.data) {
      const player = event.target;
      player.playVideo();
    }
  };

  const [isClientDesktop, setIsClientDesktop] = useState(false);
  useEffect(() => {
    // 클라이언트에서만 isDesktop 값을 설정
    setIsClientDesktop(isDesktop);
  }, []);

  const handleTocItemClick = (start: number) => {
    if (!isPlayerVisible) setIsPlayerVisible(true);

    if (videoPlayer) {
      videoPlayer.seekTo(start, true);
      videoPlayer.playVideo();
    }
  };

  const opts: YouTubeProps["opts"] = {
    height: "202",
    playerVars: {
      autoplay: 0,
      rel: 0,
      disablekb: 1,
    },
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollRefTop = scrollRef.current.getBoundingClientRect().top;
        setIsFixed(scrollRefTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();
    setIsLoading(true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // useEffect(() => {
  //   const fetchThumbnails = async () => {
  //     try {
  //       // API 호출
  //       // const thumbnailResponse = await fetch(
  //       //   `https://youticle.shop/briefing/images/${id}`
  //       // );

  //       const thumbnailResponse = await fetch(
  //         `https://youticle.shop/briefing/capture_frames/${id}`
  //       );

  //       if (!thumbnailResponse.ok) {
  //         throw new Error("Failed to fetch thumbnails");
  //       }

  //       // // JSON 데이터 파싱
  //       // const thumbnailData: string[] = await thumbnailResponse.json();

  //       // // 파일 이름을 숫자 기준으로 정렬
  //       // const sortedThumbnails = thumbnailData.sort((a, b) => {
  //       //   const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
  //       //   const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
  //       //   return numA - numB;
  //       // });

  //       const thumbnailData = await thumbnailResponse.json();
  //       const sortedThumbnails = thumbnailData
  //         .sort((a: any, b: any) => {
  //           const numA = parseInt(a.filename.match(/\d+/)?.[0] || "0", 10);
  //           const numB = parseInt(b.filename.match(/\d+/)?.[0] || "0", 10);
  //           return numA - numB;
  //         })
  //         .map(({ content }: any) => base64ToBlobUrl(content));

  //       // 정렬된 파일 이름을 상태로 설정
  //       setThumbnails(sortedThumbnails);
  //     } catch (error) {
  //       console.error("Error fetching thumbnails:", error);
  //       setThumbnails([]);
  //     }
  //   };
  //   fetchThumbnails();
  // }, [id]);
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false); // 페이지 전환 중 여부
  const [isLeavingHome, setIsLeavingHome] = useState(false); // 페이지 전환 중 여부
  const [isInsightVisible, setIsInsightVisible] = useState(false);
  const user = useRecoilValue(userState);
  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  useEffect(() => {
    const fetchSubjects = async () => {
      if (user.name !== "") {
        const subjects = await fetchSubscribedSubjects(user.email, user.name);
        console.log("로그인 후 구독한 키워드", subjects);
        setSubscribedSubjects(subjects); // 구독한 주제 설정
        // if (subjects.length === 0) {
        //   setShowPopup(true); // Show popup if no subscribed subjects
        // }
      }
    };
    fetchSubjects();
  }, [user]);

  return (
    <Container $isFixed={isFixed}>
      <LogoHeader
        title={isFixed ? `${detailData.summary_data.headline_title}` : ""}
        onBack={() => {
          setIsLeaving(true); // 로딩 유지
          setTimeout(() => {
            router.push("/");
          }, 500);
        }}
        onBackHome={() => {
          setIsLeavingHome(true); // 로딩 유지
          setTimeout(() => {
            router.push("/");
          }, 500);
        }}
      />
      {/* 로딩 오버레이 */}
      {isLeaving && (
        <LoaderOverlay>
          <Spinner />
          <LoadingText>이전 페이지로 이동 중...</LoadingText>
        </LoaderOverlay>
      )}
      {/* 로딩 오버레이 */}
      {isLeavingHome && (
        <LoaderOverlay>
          <Spinner />
          <LoadingText>홈으로 이동 중..</LoadingText>
        </LoaderOverlay>
      )}
      <PageInfo ref={scrollRef}>
        <Category>{detailData.section}</Category>
        <Title>{detailData.summary_data.headline_title}</Title>
        <UploadContainer>
          <Upload>업로드 {timeAgo(detailData.upload_date)} </Upload> *
          <Upload>{detailData.duration}</Upload>
        </UploadContainer>
      </PageInfo>
      <VideoContainer
        ref={videoContainerRef}
        $isFixed={isFixed}
        $isDesktop={isDesktop}
      >
        {isLoading && <Loader />}
        <YouTube
          videoId={id}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          style={{
            display: isLoading ? "none" : isPlayerVisible ? "block" : "none",
          }}
        />
      </VideoContainer>
      {/* Conditionally render overview based on the section */}
      {/* 채널 소개 */}
      <VideoCard
        thumbnail={detailData.thumbnail}
        title={detailData.title}
        channelName={detailData.channel_details.channel_name}
        subscriber={detailData.channel_details.channel_subscribers}
        upload_date={detailData.upload_date}
        description={detailData.summary_data.channel_overview}
        channel_thumbnail={detailData.channel_details.channel_thumbnail}
      />
      <OverviewTitle>📹 영상 소개</OverviewTitle>
      <Preview $isFixed={isFixed}>
        {formatSummary(detailData.summary_data.short_summary)}
      </Preview>
      {detailData.summary_data.comment_insight &&
        Object.keys(detailData.summary_data.comment_insight).length > 0 && (
          <>
            <CommentAnalysisWrapper>
              <AnalysisTitle>💬 시청자 반응 빠르게 알아보기</AnalysisTitle>
              <AnalysisDesc>
                AI가 댓글을 분석해 <strong>{detailData.section}</strong>과
                관련한 주요 감상 포인트를 정리했습니다. 시청자들은 어떤 의견을
                남겼을까요?
              </AnalysisDesc>
              <ToggleButton2
                onClick={() => {
                  if (typeof window !== "undefined" && window.gtag) {
                    window.gtag("event", "comment_toggle_click", {
                      event_category: "engagement",
                      event_label: isInsightVisible
                        ? "Collapse Comment Insight"
                        : "Expand Comment Insight",
                      value: 1,
                    });
                  }

                  setIsInsightVisible(!isInsightVisible);
                }}
              >
                {isInsightVisible ? "▲ 댓글 분석 접기" : "▼ 댓글 분석 보기"}
              </ToggleButton2>
            </CommentAnalysisWrapper>
            {/* user 정보가 있고 구독중인 키워드라면 commentInsight 활성화 */}

            {/* user 정보가 있고 구독중인 키워드가 없다면 commentInsightDimmed 활성화 */}

            {/* user 정보가 없다면 commentInsightDimmed 활성화 */}

            {isInsightVisible && (
              <>
                {user.name !== "" &&
                subscribedSubjects.includes(detailData.section) ? (
                  // ✅ 유저 정보 존재 + 구독한 키워드 있음 → 전체 공개
                  <CommentsInsightSection
                    data={detailData.summary_data.comment_insight}
                    isLoggedIn={true}
                  />
                ) : user.name !== "" && subscribedSubjects.length === 0 ? (
                  // ✅ 유저 정보 존재 + 구독한적 없음 → 일부 차단 & 구독 유도
                  <CommentsInsightSectionDimmed
                    data={detailData.summary_data.comment_insight}
                    section={detailData.section}
                    isLoggedIn={true}
                    isUnsubscribed={true} // 🚨 미구독 상태 전달
                    isNeverSubscribed={true}
                    videoId={detailData.video_id}
                    subscribedSubjects={subscribedSubjects}
                  />
                ) : user.name !== "" &&
                  subscribedSubjects.length > 0 &&
                  !subscribedSubjects.includes(detailData.section) ? (
                  // ✅ 유저 정보 존재 + 구독한 키워드 없음 → 일부 차단 & 구독 유도
                  <CommentsInsightSectionDimmed
                    data={detailData.summary_data.comment_insight}
                    section={detailData.section}
                    isLoggedIn={true}
                    isUnsubscribed={true} // 🚨 미구독 상태 전달
                    isNeverSubscribed={false}
                    videoId={detailData.video_id}
                    subscribedSubjects={subscribedSubjects}
                  />
                ) : (
                  // ✅ 유저 정보 없음 (비로그인 상태) → 전체 차단 & 로그인/구독 유도
                  <CommentsInsightSectionDimmed
                    data={detailData.summary_data.comment_insight}
                    section={detailData.section}
                    isLoggedIn={false}
                    isUnsubscribed={true} // 🚨 구독한 적 없음 정보 전달
                    isNeverSubscribed={true}
                    videoId={detailData.video_id}
                    subscribedSubjects={subscribedSubjects}
                  />
                )}
              </>
            )}
          </>
        )}
      <TOC>
        <div>목차</div>
        <div>
          {detailData.summary_data.section.map(({ title }, index) => (
            <span key={index}>{title} </span>
          ))}
        </div>
      </TOC>

      <Contents
        detailData={detailData}
        thumbnails={thumbnails.length > 0 ? thumbnails : []}
        handleTocItemClick={handleTocItemClick}
      />

      {/* <Preview $isFixed={isFixed}>
        <div>
          <span>🔎 미리보기</span>
          {formatSummary(detailData.summary_data.short_summary)}
        </div>
      </Preview> */}
    </Container>
  );
};

export default ClientSide;

const Container = styled.div<{ $isFixed: boolean }>`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: white;
  /* height: fit-content;
  min-height: calc(100vh + 813px); // 기본 100vh + 추가 813px */
`;

const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  margin-bottom: 16px;
`;

const Category = styled.span`
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  color: #007bff;
  margin-bottom: 12px;
`;

const Analysis = styled.p`
  font-size: 16px;
  line-height: 140%;
  background-color: #f9f9f9;
  padding: 16px 12px;
  border-radius: 4px;
  margin-top: 12px;
  margin-left: 16px;
  margin-right: 16px;
  margin-bottom: 40px;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 800;
  line-height: 24px;
  margin-bottom: 4px;
`;

const UploadContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const Upload = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 14.4px;
  margin-right: 4px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;

const Preview = styled.div<{ $isFixed: boolean }>`
  padding: 20px;
  background-color: #f9f9f9;
  margin-top: ${(props) => (props.$isFixed ? "12px" : "12px")};
  margin-left: 16px;
  margin-right: 16px;
  margin-bottom: 32px;
  div {
    display: flex;
    flex-direction: column;
    background-color: #f2f2f2;
    padding: 20px;
    gap: 12px;
  }

  span {
    display: block;
    font-family: "Pretendard Variable";
    font-size: 16px;
  }

  span:first-child {
    font-weight: 600;
  }

  span.line-break {
    font-weight: 400;
    line-height: 160%;
    margin-bottom: 8px;
  }
`;

const TOC = styled.div`
  margin-top: 20px;
  padding: 0 16px;
  span {
    line-height: 132%;
  }
  div:first-child {
    height: 44px;
    padding: 10px 16px 10px 16px;
    background-color: rgba(0, 0, 0, 1);
    font-size: 20px;
    font-weight: 800;
    line-height: 24px;
    color: rgba(255, 255, 255, 1);
  }

  div:nth-child(2) {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background-color: rgb(248, 248, 248);
    font-size: 18px;
    font-weight: 600;
    line-height: 132%;
  }
`;

const VideoContainer = styled.div<{ $isFixed: boolean; $isDesktop: boolean }>`
  position: ${(props) => (props.$isFixed ? "fixed" : "static")};
  top: ${(props) => (props.$isFixed ? "52px" : "auto")};
  left: ${(props) => (props.$isFixed ? "0" : "auto")};
  z-index: ${(props) => (props.$isFixed ? 1000 : 0)};
  display: flex;

  div {
    width: 100vw;

    iframe {
      width: 100vw;
      max-width: ${({ $isDesktop }) => ($isDesktop ? "420px" : "none")};
    }
  }
`;

const LoaderAnimation = keyframes`
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: 200px 0;
    }
`;

const Loader = styled.div`
  width: 360px;
  height: 202px;
  background: #f0f0f0;
  background-image: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${LoaderAnimation} 1.5s infinite;
`;

const OverviewTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-top: 40px;
  margin-left: 16px;
`;
// 로딩 오버레이 스타일
const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  /* 스크롤 할 필요가 없다면 오버레이 내부만 overflow: hidden; 가능 */
`;
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 5px solid white;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
const LoadingText = styled.div`
  color: white;
  margin-top: 10px;
  font-size: 16px;
`;

/* 🔹 스타일 */
const CommentAnalysisWrapper = styled.div`
  background-color: #f9f9f9;
  padding: 20px;
  /* border-radius: 8px; */
  margin-bottom: 16px;
  margin-left: 16px;
  margin-right: 16px;
`;

const AnalysisTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
`;

const AnalysisDesc = styled.p`
  font-size: 14px;
  line-height: 1.2;
  color: #444;
  margin-top: 12px;
  strong {
    font-weight: 700;
  }
`;

const ToggleButton2 = styled.button`
  background-color: #007bff;
  color: #fff;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  font-size: 14px;
  &:hover {
    background-color: #0056b3;
  }
`;

/** ⬇️ 5줄 핵심 요약 섹션 추가 */
const FiveLineSummarySection = styled.div`
  margin: 0 16px 32px 16px;
  padding: 20px;
  background-color: #f7faff;
  /* border-radius: 8px; */
  border: 1px solid #b4c2ff;
`;

const Divider = styled.div`
  /* 굵은 구분선 */
  height: 2px;
  background-color: #e0e0e0;
  margin: 24px 16px;
`;

const FiveLineTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
`;

const FiveLineList = styled.ul`
  /* list-style-type: "• "; */
  li {
    font-size: 16px;
    margin-bottom: 12px;
    line-height: 1.4;
  }
`;

/** 본문 시작 타이틀 추가 */
const MainBodyTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  margin: 24px 16px 12px;
`;

const FiveLineListWrapper = styled.div`
  display: flex;
`;

const FiveLineListWrapperIndex = styled.div`
  margin-top: 4px;
  margin-right: 4px;
`;
