"use client";

import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import YouTube, { YouTubeProps } from "react-youtube";
import { useRecoilValue, useSetRecoilState } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import { DataProps } from "@/types/dataProps";
import { formatSummary, removeMarkTags } from "@/utils/formatter";
import { playerState } from "@/store/player";
import { base64ToBlobUrl } from "@/utils/base64";
import { isDesktop } from "react-device-detect";
import { timeAgo } from "@/utils/formatter";
import VideoCard from "@/detail/[id]/components/VideoCard";
import ThreadModal from "./ThreadModal";
import { useRouter } from "next/navigation";
import CommentsInsightSection from "./CommentInsightSection";
import Contents from "./Contents";
import { userState } from "@/store/user";
import PlayIcon from "@/assets/play.svg";
import Recommend from "@/detail/[id]/components/Recommend";

interface ClientSideProps {
  id: string;
  detailData: DataProps;
}

const ClientSide = ({ id, detailData }: ClientSideProps) => {
  console.log(id);
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
  // Server-side data fetching using fetch with no-store
  const EDITOR_ARTICLE_API_LOCAL_URL = "http://0.0.0.0:8000/editor/all/article";
  const EDITOR_ARTICLE_API_URL = "https://youticle.shop/editor/all/article";
  // useEffect(() => {
  //   const fetchThumbnails = async () => {
  //     try {
  //       const thumbnailResponse = await fetch(
  //         `https://youticle.shop/editor/capture_frames/${id}`
  //       );
  //       if (!thumbnailResponse.ok)
  //         throw new Error("Failed to fetch thumbnails");

  //       const thumbnailData = await thumbnailResponse.json();
  //       const sortedThumbnails = thumbnailData
  //         .sort((a: any, b: any) => {
  //           const numA = parseInt(a.filename.match(/\d+/)?.[0] || "0", 10);
  //           const numB = parseInt(b.filename.match(/\d+/)?.[0] || "0", 10);
  //           return numA - numB;
  //         })
  //         .map(({ content }: any) => base64ToBlobUrl(content));

  //       setThumbnails(sortedThumbnails);
  //     } catch (error) {
  //       console.error("Error fetching thumbnails:", error);
  //     }
  //   };

  //   fetchThumbnails();
  // }, [id]);

  const [isExpanded, setIsExpanded] = useState(false);
  const sections = detailData.summary_data.section || [];
  // 접혔을 때와 펼쳤을 때의 maxHeight를 관리 (문자열 단위 "px")
  const [maxHeight, setMaxHeight] = useState("0px");

  // 1) 처음/갱신 시 목차 전체 높이를 측정하여 expanded 상태에 따라 maxHeight를 설정
  useEffect(() => {
    if (contentRef.current) {
      // 실제 콘텐츠 전체 높이
      const fullHeight = contentRef.current.scrollHeight;

      if (isExpanded) {
        // 펼친 상태: 전체 높이로 설정
        setMaxHeight(`${fullHeight}px`);
      } else {
        // 접힌 상태: 5개 정도만 보여줄 높이를 임의로 계산
        // (정밀 계산 필요하면 5개 항목 높이만큼 미리 측정해야 함)
        // 간단히 "200px"처럼 고정값을 써도 됨
        setMaxHeight("260px");
      }
    }
  }, [isExpanded, sections]);

  // // 목차 데이터를 최대 5개까지만 표시
  const visibleSections =
    sections.length <= 5
      ? sections
      : isExpanded
      ? sections
      : sections.slice(0, 5);
  const toggleView = () => {
    setIsExpanded((prev) => !prev);
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState("0px"); // 초기 높이

  // 높이를 계산하는 함수
  const calculateHeight = () => {
    if (contentRef.current) {
      const totalHeight = contentRef.current.scrollHeight; // 전체 높이
      return isExpanded ? `${totalHeight}px` : `${totalHeight / 2}px`; // 절반 높이 or 전체 높이
    }
    return "0px";
  };
  const user = useRecoilValue(userState);

  // 상태 변화 시 높이 재계산
  useEffect(() => {
    setContentHeight(calculateHeight());
  }, [isExpanded, detailData]);

  // (2) 모달 열림 상태
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);

  // (3) "스레드 생성하기" 버튼 클릭 핸들러
  const handleOpenThreadModal = () => {
    setIsThreadModalOpen(true);
  };
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false); // 페이지 전환 중 여부
  const [isLeavingHome, setIsLeavingHome] = useState(false); // 페이지 전환 중 여부
  const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

  const [isInsightVisible, setIsInsightVisible] = useState(false);

  return (
    <Container $isFixed={isFixed}>
      <LogoHeader
        title={isFixed ? `${detailData.summary_data.headline_title}` : ""}
        onBack={() => {
          console.log("hello, back start");
          setIsLeaving(true); // 로딩 유지
          setTimeout(() => {
            router.back();
          }, 1500);
        }}
      />
      {/* 로딩 오버레이 */}
      {isLeaving && (
        <LoaderOverlay>
          <Spinner />
          <p>이전 페이지로 이동 중...</p>
        </LoaderOverlay>
      )}
      {/* 로딩 오버레이 */}
      {isLeavingHome && (
        <LoaderOverlay>
          <Spinner />
          <p>홈으로 이동 중..</p>
        </LoaderOverlay>
      )}
      {/* (5) 모달 렌더링 */}
      {isThreadModalOpen && (
        <ThreadModal
          videoId={id}
          onClose={() => setIsThreadModalOpen(false)}
          section={detailData.section}
        />
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
        {/* {formatSummary(detailData.summary_data.short_summary)} */}
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
                    <Timeline>
                      {/* <PlayIcon width={16} height={16} /> */}
                      <span>00:05</span>
                    </Timeline>
                    <li key={idx}> {formatSummary(point)}</li>
                  </FiveLineListWrapper>
                )
              )}
            </FiveLineList>
          </FiveLineSummarySection>
        </>
      )}
      <MoreButton>상세 요약 내용 더보기</MoreButton>
      {/* <Divider /> */}
      {/* (B) "아티클 본문" 타이틀 추가 */}
      <MainBodyTitle>📝 아티클 본문 살펴보기</MainBodyTitle>
      <TOC>
        <div className="toc-header">목차</div>

        <ContentWrapper
          ref={contentRef}
          fullPadding={sections.length < 8} // ← 여기에!
          style={{
            /* 8개 이상일 때만 스크롤 제한, 아니면 full-height */
            maxHeight: sections.length >= 8 ? maxHeight : undefined,
            overflow: sections.length >= 8 ? "hidden" : "visible",
          }}
        >
          {sections.length >= 8 ? (
            <>
              {/* 1부 */}
              <PartCard>
                <PartHeader>1부</PartHeader>
                {sections.slice(0, 5).map((sec, i) => (
                  <Item key={i}>{removeMarkTags(sec.title)}</Item>
                ))}
              </PartCard>

              {/* 2부 (펼쳤을 때만) */}
              {isExpanded && (
                <PartCard>
                  <PartHeader>2부</PartHeader>
                  {sections.slice(5, 10).map((sec, i) => (
                    <Item key={i + 5}>{removeMarkTags(sec.title)}</Item>
                  ))}
                </PartCard>
              )}
            </>
          ) : (
            /* 8개 미만일 땐 그냥 쭉 나열 */
            sections.map((sec, i) => (
              <Item key={i}>{removeMarkTags(sec.title)}</Item>
            ))
          )}
        </ContentWrapper>

        {/* 8개 이상일 때만 토글 버튼 표시 */}
        {sections.length >= 8 && (
          <ToggleButton onClick={toggleView}>
            {isExpanded ? "간단히 보기" : "더 보기"}
          </ToggleButton>
        )}
      </TOC>

      <Contents
        detailData={detailData}
        thumbnails={thumbnails}
        handleTocItemClick={handleTocItemClick}
        taskStatus="Success"
      />
      {detailData.summary_data.comment_insight && (
        <>
          <CommentAnalysisWrapper>
            <AnalysisTitle>💬 시청자 반응 빠르게 알아보기</AnalysisTitle>
            <AnalysisDesc>
              AI가 댓글을 분석해 <strong>{detailData.section}</strong>과 관련한
              주요 감상 포인트를 정리했습니다. 시청자들은 어떤 의견을
              남겼을까요?
            </AnalysisDesc>
            {/* <ToggleButton2
              onClick={() => setIsInsightVisible(!isInsightVisible)}
            >
              {isInsightVisible ? "▲ 댓글 분석 접기" : "▼ 댓글 분석 보기"}
            </ToggleButton2> */}
          </CommentAnalysisWrapper>
          {/* isInsightVisible이 true일 때만 댓글 분석 섹션 표시 */}
          {isInsightVisible && (
            <CommentsInsightSection
              data={
                detailData.summary_data.comment_insight ?? {
                  "1st": "",
                  "1st_comments": [],
                  "2nd": "",
                  "2nd_comments": [],
                  "3rd": "",
                  "3rd_comments": [],
                }
              }
              isLoggedIn={true}
            />
          )}{" "}
        </>
      )}
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
      {/* (2) 하단 플로팅 버튼 */}
      {user.id == 3 && (
        <FloatingButton onClick={handleOpenThreadModal}>
          스레드 생성하기
        </FloatingButton>
      )}
    </Container>
  );
};

export default ClientSide;
/** 💡 애니메이션 */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;
const Container = styled.div<{ $isFixed: boolean }>`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: white;
  animation: ${fadeIn} 0.6s ease-in-out;
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
  margin-bottom: 24px;
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
    line-height: 148%;
    margin-bottom: 8px;
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
  font-size: 22px;
  font-weight: 700;
  margin-top: 40px;
  margin-left: 16px;
`;
const TOC = styled.div`
  margin-top: 12px;
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
  }
`;

// 2) PartCard: full-width 카드
const PartCard = styled.div`
  width: 100%; /* ← 전체 폭 차지 */
  background: #f8f8f8;
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
  background: #007bff;
  color: #fff;
  padding: 4px 8px;
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
// 1) ContentWrapper: 세로 스택
const ContentWrapper = styled.div<{ fullPadding: boolean }>`
  overflow: hidden;
  padding: ${({ fullPadding }) => (fullPadding ? "20px" : "0px")};
  transition: max-height 0.3s ease;
  display: flex;
  flex-direction: column; /* ← 가로가 아니라 세로로 */
  gap: 16px;
  background: #f8f8f8;
`;

const ToggleButton = styled.button`
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  background-color: transparent;
  color: #007bff;
  border: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
// (6) 모달 열기 버튼 스타일
const ThreadCreateButton = styled.button`
  display: block;
  margin: 24px auto;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;
const FloatingButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000; /* 본문 위에 보이도록 충분히 높은 값 */
  padding: 14px 18px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #0056b3;
  }
`;

// 로딩 오버레이 스타일
const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  /* 스크롤 할 필요가 없다면 오버레이 내부만 overflow: hidden; 가능 */
`;
const Spinner = styled.div`
  width: 30px;
  height: 30px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #007bff;
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

/** ⬇️ 5줄 핵심 요약 섹션 추가 */
const FiveLineSummarySection = styled.div`
  margin: 0 16px 32px 16px;
  /* padding: 20px; */
  /* background-color: #f7faff; */
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
/** 본문 시작 타이틀 추가 */
const MainBodyTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  margin: 24px 16px 12px;
`;

const MoreButton = styled.button`
  display: block;
  margin: 0 16px 24px;
  width: calc(100% - 32px);
  padding: 12px 0;
  background-color: #007bff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  &:hover {
    background-color: #0056b3;
  }
`;

const FiveLineListWrapper = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const FiveLineListWrapperIndex = styled.div`
  margin-top: 4px;
  margin-right: 4px;
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

  &:hover {
    background-color: #0056b3;
  }
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
