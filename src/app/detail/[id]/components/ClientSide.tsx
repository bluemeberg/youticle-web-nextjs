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
import {
  formatSummary,
  getOrCreateAnonId,
  parseTimeStringToSeconds,
  removeMarkTags,
} from "@/utils/formatter";
import { timeAgo } from "@/utils/formatter";
import { isDesktop } from "react-device-detect";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { userState } from "@/store/user";
import { fetchSubscribedSubjects, logCtaClick } from "@/api/apiClient";
import CommentsInsightSection from "@/editor/[id]/components/CommentInsightSection";
import CommentsInsightSectionDimmed from "@/editor/[id]/components/CommentInsightDimmed";
import Recommend from "./Recommend";

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
    logCtaClick(
      "player_item_click",
      user?.id,
      user?.email,
      getOrCreateAnonId()
    );
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
  const [isArticleVisible, setIsArticleVisible] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const [articleHeight, setArticleHeight] = useState(0);

  // 요약 섹션 높이 재계산
  useEffect(() => {
    if (articleRef.current) {
      setArticleHeight(articleRef.current.scrollHeight);
    }
  }, [detailData, isArticleVisible]);

  // 1) 페이지 오픈 로깅
  useEffect(() => {
    logCtaClick(
      "page_open",
      user?.id ?? null,
      detailData.video_id ?? null,
      getOrCreateAnonId()
    );
  }, []);

  const handleMoreClick = () => {
    const next = !isArticleVisible;
    setIsArticleVisible(next);
    logCtaClick(
      isArticleVisible ? "summary_collapse" : "summary_expand",
      user?.id ?? null,
      detailData.video_id ?? null,
      getOrCreateAnonId()
    );
    if (next) {
      // 펼칠 때만 스크롤
      setTimeout(() => {
        articleRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        window.scrollBy({ top: -76, behavior: "smooth" });
      }, 0);
    }
  };
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  // calculate split for TOC sections
  const sections = detailData.summary_data.section;
  const sectionCount = sections.length;
  const isMultiPart = sectionCount >= 8;
  const midIndex = Math.ceil(sectionCount / 2);

  // 1) refs
  const previewRef = useRef<HTMLDivElement>(null);

  // 2) thresholds fire-once 관리
  const firedCollapsed = useRef<Set<number>>(new Set());
  const firedExpanded = useRef<Set<number>>(new Set());
  const THRESHOLDS = [30, 50, 70, 90];
  useEffect(() => {
    const handleScroll = () => {
      let percent = 0;

      if (!isArticleVisible) {
        // ● 접힌 상태: 페이지 전체 scroll 기준
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const viewH = window.innerHeight;
        const maxScroll = docHeight - viewH;
        if (maxScroll <= 0) return;
        percent = (scrollY / maxScroll) * 100;
      } else {
        // ● 펼친 상태: 상세 요약 영역 기준
        const el = articleRef.current;
        if (!el) return;
        const scrollY = window.scrollY;
        const elTop = el.getBoundingClientRect().top + window.scrollY;
        const relativeY = scrollY - elTop;
        const maxScroll = el.scrollHeight - window.innerHeight;
        if (relativeY < 0 || maxScroll <= 0) return;
        percent = (relativeY / maxScroll) * 100;
      }

      // 0~100 clamp
      percent = Math.min(Math.max(percent, 0), 100);
      const firedSet = isArticleVisible
        ? firedExpanded.current
        : firedCollapsed.current;

      THRESHOLDS.forEach((threshold) => {
        if (percent >= threshold && !firedSet.has(threshold)) {
          firedSet.add(threshold);
          const eventName = isArticleVisible
            ? `summary_expanded_${threshold}`
            : `summary_collapsed_${threshold}`;
          logCtaClick(
            eventName,
            user?.id ?? null,
            detailData.video_id ?? null,
            getOrCreateAnonId()
          );
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isArticleVisible, detailData.video_id, user]);
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
      {/** 5줄 핵심 요약 배치 **/}
      {detailData.summary_data.five_lines_summary && (
        <>
          <FiveLineSummarySection>
            <FiveLineTitle>📌 TL;DR : 핵심 요약 5가지</FiveLineTitle>
            <FiveLineList>
              {(detailData.summary_data.five_lines_summary ?? []).map(
                (point, idx) => (
                  <FiveLineListWrapper key={idx}>
                    {/* <FiveLineListWrapperIndex>
                            {NUMBER_EMOJIS[idx]}
                          </FiveLineListWrapperIndex> */}
                    {/* <Timeline> */}
                    {/* <PlayIcon width={16} height={16} /> */}
                    {/* <span>00:05</span>
                    </Timeline> */}
                    <Timeline
                      onClick={() =>
                        handleTocItemClick(
                          parseTimeStringToSeconds(point.start_time)
                        )
                      }
                    >
                      {/* <PlayIcon width={16} height={16} /> */}
                      <span>{point.start_time}</span>
                    </Timeline>
                    <li key={idx}> {formatSummary(point.content)}</li>
                  </FiveLineListWrapper>
                )
              )}
            </FiveLineList>
          </FiveLineSummarySection>
        </>
      )}
      <MainBodyTitle>📝 상세 요약 본문</MainBodyTitle>
      <TOC>
        <div className="toc-header">목차</div>
        <ContentWrapper
          fullPadding={detailData.summary_data.section.length < 8}
        >
          {isMultiPart ? (
            <>
              <PartCard>
                <PartHeader>1부</PartHeader>
                {sections.slice(0, midIndex).map((sec, i) => (
                  <Item key={`part1-${i}`}>{removeMarkTags(sec.title)}</Item>
                ))}
              </PartCard>
              <PartCard>
                <PartHeader>2부</PartHeader>
                {sections.slice(midIndex).map((sec, i) => (
                  <Item key={`part2-${i}`}>{removeMarkTags(sec.title)}</Item>
                ))}
              </PartCard>
            </>
          ) : (
            sections.map((sec, i) => (
              <Item key={i}>{removeMarkTags(sec.title)}</Item>
            ))
          )}
          <PartCard>
            <PartHeader>추가 인사이트</PartHeader>
            <Item>🧠 유티클 &apos;{detailData.section}&apos; 인사이트</Item>
            {detailData.summary_data.comment_insight && (
              <Item>👥 시청자 댓글 인사이트 TOP3</Item>
            )}
          </PartCard>
        </ContentWrapper>
      </TOC>
      <MoreButton onClick={handleMoreClick}>
        {isArticleVisible ? "간단히 보기" : "상세 요약 더보기"}
      </MoreButton>
      <ArticleWrapper
        expanded={isArticleVisible}
        maxHeight={articleHeight + 1500}
        ref={articleRef}
      >
        <Contents
          detailData={detailData}
          thumbnails={thumbnails.length > 0 ? thumbnails : []}
          handleTocItemClick={handleTocItemClick}
        />
      </ArticleWrapper>
      <RecommendWrapper
        $hasDimmedItem={false}
        $tocItemHeight={0}
        $isUnsubscribedSection={false} // 새로운 속성 추가
      >
        <Recommend
          section={detailData.section}
          videoId={detailData.video_id}
          isUnsubscribedSection={false}
        />
      </RecommendWrapper>
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
  .toc-header {
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: #000;
    color: #fff;
    font-size: 20px;
    font-weight: 800;
    border-radius: 4px;
    margin-bottom: 8px;
  }
`;
// 1) ContentWrapper: 세로 스택
const ContentWrapper = styled.div<{ fullPadding: boolean }>`
  overflow: hidden;
  padding: ${({ fullPadding }) => (fullPadding ? "20px" : "0px")};
  transition: max-height 0.3s ease;
  display: flex;
  flex-direction: column; /* ← 가로가 아니라 세로로 */
  gap: 8px;
  background: ${({ fullPadding }) => (fullPadding ? "#f8f8f8" : "transparent")};
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
  /* padding: 20px;
  background-color: #f7faff; */
  /* border-radius: 8px; */
  /* border: 1px solid #b4c2ff; */
`;

const Divider = styled.div`
  /* 굵은 구분선 */
  height: 2px;
  background-color: #e0e0e0;
  margin: 24px 16px;
`;

const FiveLineTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  margin-top: 20px;
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
  font-size: 20px;
  font-weight: 700;
  margin: 40px 16px 4px;
`;

const FiveLineListWrapper = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const FiveLineListWrapperIndex = styled.div`
  margin-top: 4px;
  margin-right: 4px;
`;

const Timeline = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  /* padding: 12px 0px 12px 8px; */
  /* border: 1px solid #007bff; */
  border-radius: 8px;
  background-color: #eaf4ff;
  /* margin-left: 4px; */
  cursor: pointer;
  transition: all 0.3s ease;
  max-height: 32px;
  margin-right: 8px;
  &:hover {
    background-color: #007bff;
    span {
      color: white;
    }
  }

  svg {
    width: 14px;
    height: 14px;
    fill: #007bff;
    transition: fill 0.2s ease;
  }

  span {
    font-size: 12px;
    font-weight: 600;
    color: #007bff;
    transition: color 0.2s ease;
    min-width: 56px;
  }
`;
const MoreButton = styled.button`
  position: relative;
  z-index: 10;
  display: block;
  margin: 32px 16px 24px;
  width: calc(100% - 32px);
  padding: 16px 0;
  background-color: #007bff;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  &:hover {
    background-color: #0056b3;
  }
`;
const ArticleWrapper = styled.div<{ expanded: boolean; maxHeight: number }>`
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.3s ease;
  max-height: ${(p) => (p.expanded ? `${p.maxHeight}px` : "0px")};
  opacity: ${(p) => (p.expanded ? 1 : 0)};
  margin-top: 32px;
`;

const RecommendWrapper = styled.div<{
  $hasDimmedItem: boolean;
  $isUnsubscribedSection: boolean;
  $tocItemHeight: number;
}>`
  margin-top: ${(props) =>
    props.$hasDimmedItem && props.$isUnsubscribedSection
      ? `240px`
      : props.$hasDimmedItem
      ? `${(360 / props.$tocItemHeight) * props.$tocItemHeight}px`
      : `100px`};
  z-index: ${(props) => (props.$hasDimmedItem ? `500` : "0")};
  padding-left: 16px;
  padding-right: 16px;
`;

// 2) PartCard: full-width 카드
const PartCard = styled.div`
  width: 100%; /* ← 전체 폭 차지 */
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  line-height: 160%;
`;

// 부 제목 강조
const PartHeader = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 12px;
  display: inline-block;
  background: #969696;
  color: #fff;
  padding: 4px 20px;
  border-radius: 4px;
`;

// 기존 ul/li 대신 쓸 아이템
const Item = styled.div`
  position: relative;
  margin-bottom: 16px;
  /* line-height: 1.4; */
  font-size: 18px;
  font-weight: 600;
`;
const InsightBlock = styled.div`
  border-top: 1px solid #eee;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InsightTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #444;
`;
