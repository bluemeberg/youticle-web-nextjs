"use client";

import { useState, useEffect, useRef, Key } from "react";
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
import VideoCard from "@/detail/a/[id]/components/VideoCard";
import { useRouter } from "next/navigation";
import ThreadModal from "@/studio/[id]/components/ThreadModal";
import Contents from "@/studio/[id]/components/Contents";
import CommentsInsightSection from "@/studio/[id]/components/CommentInsightSection";

interface ClientSide2Props {
  id: string;
  taskId: string;
}

// DataProps에 추가적인 타입 정의가 필요할 경우:
interface SectionData {
  title: string;
  start_time: string;
  detail_contents: string;
  explanation_keyword?: string;
  explanation_description?: string;
}

// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

const ClientSide2 = ({ id, taskId }: ClientSide2Props) => {
  const [taskStatus, setTaskStatus] = useState("PENDING");
  const [taskMessage, setTaskMessage] = useState("작업을 시작합니다.");
  const [youtubeArticle, setYoutubeArticle] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any>({});
  const [videoPlayer, setVideoPlayer] = useState<any>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isArticleLoading, setIsArticleLoading] = useState(true);
  const isPlayerVisible = useRecoilValue(playerState);
  const setIsPlayerVisible = useSetRecoilState(playerState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // 🎨 소프트한 렌더링을 위한 상태
  const [fadeInComplete, setFadeInComplete] = useState(false);

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

  const [isExpanded, setIsExpanded] = useState(false);
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
  const [progress, setProgress] = useState(0); // 진행률 상태 추가

  useEffect(() => {
    if (!detailData?.summary_data?.section) return;

    const sectionCount = detailData.summary_data.section.length;
    if (contentRef.current) {
      const fullHeight = contentRef.current.scrollHeight;

      if (sectionCount <= 5) {
        // 항목이 5개 이하라면 접힘/펼침 구분 없이 전체
        setContentHeight(`${fullHeight}px`);
      } else {
        // 항목이 6개 이상
        if (isExpanded) {
          // 펼친 상태: 전체 높이
          setContentHeight(`${fullHeight}px`);
        } else {
          // 접힌 상태: 200px 정도로 고정
          setContentHeight("260px");
        }
      }
    }
  }, [isExpanded, detailData]);

  // 📌 페이지 로딩 후 애니메이션 시작
  useEffect(() => {
    setTimeout(() => setFadeInComplete(true), 300);
  }, []);

  //   // 상태 변화 시 높이 재계산
  //   useEffect(() => {
  //     setContentHeight(calculateHeight());
  //   }, [isExpanded, detailData]);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const pollTaskStatus = async () => {
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/status/${taskId}`
        );
        if (!response.ok) throw new Error("Task 상태 확인 실패");

        const data = await response.json();
        console.log(data);
        console.log("Task Status: ", data.status);

        setTaskStatus(data.status);
        setTaskMessage(data.meta?.message || "진행 중...");

        // 상태에 따른 progress bar 업데이트
        switch (data.status) {
          case "START":
            setProgress(10);
            setDetailData(data.meta?.youtube_article);
            break;
          case "PROGRESS":
            setProgress(25);
            setDetailData(data.meta?.youtube_article);
            break;
          case "COMMENT_UPDATE":
            setProgress(40);
            setDetailData(data.meta?.youtube_article);
            break;
          case "PROGRESS1":
            setProgress(60);
            setDetailData((prev: any) => ({
              ...prev,
              summary_data: {
                ...prev.summary_data,
                section: data.meta.result.flatMap((item: any) => item),
              },
            }));
            break;
          case "PROGRESS2":
            setProgress(80);
            setDetailData((prev: any) => ({
              ...prev,
              summary_data: {
                ...prev.summary_data,
                section: data.meta.result.flatMap((item: any) => item),
              },
            }));
            break;
          case "Success":
            setProgress(100);
            setDetailData(data.result?.youtube_article);
            setIsArticleLoading(false);
            clearInterval(interval); // 폴링 중단
            break;
          case "FAILURE":
            setErrorMessage(
              "해당 영상에서 아티클을 생성할 수 없습니다. \n다른 영상을 선택해주세요."
            );
            setShowErrorModal(true);
            clearInterval(interval); // 폴링 중단
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error polling task:", error);
        setTaskMessage("작업 상태를 가져오는 중 오류가 발생했습니다.");
        setErrorMessage(
          "해당 영상에서 아티클 생성하는데 오류가 발생했습니다.😭 \n다시 시도했을 때도 안된다면 다른 영상으로 진행해주세요🤔"
        );
        setShowErrorModal(true);
        clearInterval(interval); // 폴링 중단
      }
    };

    const interval = setInterval(pollTaskStatus, 2000); // 2초 간격으로 폴링
    return () => clearInterval(interval);
  }, [taskId]);

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
  /** 🔴 에러 팝업 확인 시 /studio로 이동 */
  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    router.push("/studio");
  };

  return (
    <Container $isFixed={isFixed} className={fadeInComplete ? "fadeIn" : ""}>
      {/* 상태에 따른 콘텐츠 렌더링 */}
      {/* {taskStatus === "PENDING" && (
        <StatusMessage>작업을 준비 중입니다...</StatusMessage>
      )} */}

      <LogoHeader
        title={isFixed ? `${detailData.summary_data.headline_title}` : ""}
        onBack={() => {
          setIsLeaving(true); // 로딩 유지
          setTimeout(() => {
            router.back();
          }, 500);
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

      {isArticleLoading && (
        <LoaderOverlay>
          <Spinner />
          <Message>{taskMessage}</Message>
          <ProgressBarContainer>
            <ProgressBar progress={progress} />
          </ProgressBarContainer>
        </LoaderOverlay>
      )}

      {/* 상태 메시지 및 로딩 표시 */}

      {taskStatus === "START" && detailData && (
        <FadeInContainer>
          <PageInfo ref={scrollRef}>
            <Category>{detailData.section}</Category>
            {/* Title은 제외 */}
            <SkeletonCard />
            <UploadContainer>
              <Upload>업로드 {timeAgo(detailData.upload_date)}</Upload> *
              <Upload>{detailData.duration}</Upload>
            </UploadContainer>
          </PageInfo>
          {/* <VideoContainer
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
                display: isLoading
                  ? "none"
                  : isPlayerVisible
                  ? "block"
                  : "none",
              }}
            />
          </VideoContainer> */}
          <VideoCard
            thumbnail={detailData.thumbnail}
            title={detailData.title} // title은 포함
            channelName={detailData.channel_details.channel_name}
            subscriber={detailData.channel_details.channel_subscribers}
            upload_date={detailData.upload_date}
            description={""} // description은 제외
            channel_thumbnail={detailData.channel_details.channel_thumbnail}
          />
          <OverviewTitle>📹 영상 소개</OverviewTitle>
          <Preview $isFixed={isFixed}>
            <SkeletonCard />
          </Preview>

          <TOC>
            <div>목차</div>
            <SkeletonContainer>
              {Array.from({ length: 1 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </SkeletonContainer>{" "}
          </TOC>
        </FadeInContainer>
      )}
      {taskStatus === "PROGRESS" && detailData && (
        <FadeInContainer>
          <PageInfo ref={scrollRef}>
            <Category>{detailData.section}</Category>
            {/* Title은 제외 */}
            <Title>{detailData.summary_data.headline_title}</Title>
            <UploadContainer>
              <Upload>업로드 {timeAgo(detailData.upload_date)}</Upload> *
              <Upload>{detailData.duration}</Upload>
            </UploadContainer>
          </PageInfo>

          <VideoCard
            thumbnail={detailData.thumbnail}
            title={detailData.title} // title은 포함
            channelName={detailData.channel_details.channel_name}
            subscriber={detailData.channel_details.channel_subscribers}
            upload_date={detailData.upload_date}
            description={detailData.summary_data.channel_overview} // description은 제외
            channel_thumbnail={detailData.channel_details.channel_thumbnail}
          />

          <OverviewTitle>📹 영상 소개</OverviewTitle>
          <Preview $isFixed={isFixed}>
            {formatSummary(
              removeMarkTags(detailData.summary_data.short_summary)
            )}
          </Preview>
          {/** 5줄 핵심 요약 배치 **/}
          <FiveLineSummarySection>
            <FiveLineTitle>📌 TL;DR : 핵심 요약 5가지</FiveLineTitle>
            <FiveLineList>
              {detailData.summary_data.five_lines_summary.map(
                (point: any, idx: any) => (
                  <FiveLineListWrapper key={idx}>
                    <FiveLineListWrapperIndex>
                      {NUMBER_EMOJIS[idx]}
                    </FiveLineListWrapperIndex>
                    <li key={idx}> {formatSummary(point)}</li>
                  </FiveLineListWrapper>
                )
              )}
            </FiveLineList>
          </FiveLineSummarySection>
          <TOC>
            <div>목차</div>
            <SkeletonContainer>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </SkeletonContainer>
          </TOC>
        </FadeInContainer>
      )}

      {taskStatus === "COMMENT_UPDATE" && detailData && (
        <FadeInContainer>
          <PageInfo ref={scrollRef}>
            <Category>{detailData.section}</Category>
            {/* Title은 제외 */}
            <Title>{detailData.summary_data.headline_title}</Title>
            <UploadContainer>
              <Upload>업로드 {timeAgo(detailData.upload_date)}</Upload> *
              <Upload>{detailData.duration}</Upload>
            </UploadContainer>
          </PageInfo>
          <VideoCard
            thumbnail={detailData.thumbnail}
            title={detailData.title} // title은 포함
            channelName={detailData.channel_details.channel_name}
            subscriber={detailData.channel_details.channel_subscribers}
            upload_date={detailData.upload_date}
            description={detailData.summary_data.channel_overview} // description은 제외
            channel_thumbnail={detailData.channel_details.channel_thumbnail}
          />
          <OverviewTitle>📹 영상 소개</OverviewTitle>
          <Preview $isFixed={isFixed}>
            {formatSummary(
              removeMarkTags(detailData.summary_data.short_summary)
            )}
          </Preview>
          {/** 5줄 핵심 요약 배치 **/}
          <FiveLineSummarySection>
            <FiveLineTitle>📌 TL;DR : 핵심 요약 5가지</FiveLineTitle>
            <FiveLineList>
              {detailData.summary_data.five_lines_summary.map(
                (point: any, idx: any) => (
                  <FiveLineListWrapper key={idx}>
                    <FiveLineListWrapperIndex>
                      {NUMBER_EMOJIS[idx]}
                    </FiveLineListWrapperIndex>
                    <li key={idx}> {formatSummary(point)}</li>
                  </FiveLineListWrapper>
                )
              )}
            </FiveLineList>
          </FiveLineSummarySection>
          {detailData.summary_data.comment_insight && (
            <>
              <CommentAnalysisWrapper>
                <AnalysisTitle>💬 시청자 반응 빠르게 알아보기</AnalysisTitle>
                <AnalysisDesc>
                  AI가 댓글을 분석해 <strong>{detailData.section}</strong>과
                  관련한 주요 감상 포인트를 정리했습니다. 시청자들은 어떤 의견을
                  남겼을까요?
                </AnalysisDesc>
                <ToggleButton2
                  onClick={() => setIsInsightVisible(!isInsightVisible)}
                >
                  {isInsightVisible ? "▲ 댓글 분석 접기" : "▼ 댓글 분석 보기"}
                </ToggleButton2>
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
          <TOC>
            <div>목차</div>
            <SkeletonContainer>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </SkeletonContainer>
          </TOC>
        </FadeInContainer>
      )}

      {taskStatus === "PROGRESS1" && detailData && (
        <FadeInContainer>
          <PageInfo ref={scrollRef}>
            <Category>{detailData.section}</Category>
            {/* Title은 제외 */}
            <Title>{detailData.summary_data.headline_title}</Title>
            <UploadContainer>
              <Upload>업로드 {timeAgo(detailData.upload_date)}</Upload> *
              <Upload>{detailData.duration}</Upload>
            </UploadContainer>
          </PageInfo>
          <VideoCard
            thumbnail={detailData.thumbnail}
            title={detailData.title} // title은 포함
            channelName={detailData.channel_details.channel_name}
            subscriber={detailData.channel_details.channel_subscribers}
            upload_date={detailData.upload_date}
            description={detailData.summary_data.channel_overview} // description은 제외
            channel_thumbnail={detailData.channel_details.channel_thumbnail}
          />
          <OverviewTitle>📹 영상 소개</OverviewTitle>
          <Preview $isFixed={isFixed}>
            {formatSummary(
              removeMarkTags(detailData.summary_data.short_summary)
            )}
          </Preview>
          {/* 목차 영역 */}
          {/** 5줄 핵심 요약 배치 **/}
          <FiveLineSummarySection>
            <FiveLineTitle>📌 TL;DR : 핵심 요약 5가지</FiveLineTitle>
            <FiveLineList>
              {detailData.summary_data.five_lines_summary.map(
                (point: any, idx: any) => (
                  <FiveLineListWrapper key={idx}>
                    <FiveLineListWrapperIndex>
                      {NUMBER_EMOJIS[idx]}
                    </FiveLineListWrapperIndex>
                    <li key={idx}> {formatSummary(point)}</li>
                  </FiveLineListWrapper>
                )
              )}
            </FiveLineList>
          </FiveLineSummarySection>
          {detailData.summary_data.comment_insight && (
            <>
              <CommentAnalysisWrapper>
                <AnalysisTitle>💬 시청자 반응 빠르게 알아보기</AnalysisTitle>
                <AnalysisDesc>
                  AI가 댓글을 분석해 <strong>{detailData.section}</strong>과
                  관련한 주요 감상 포인트를 정리했습니다. 시청자들은 어떤 의견을
                  남겼을까요?
                </AnalysisDesc>
                <ToggleButton2
                  onClick={() => setIsInsightVisible(!isInsightVisible)}
                >
                  {isInsightVisible ? "▲ 댓글 분석 접기" : "▼ 댓글 분석 보기"}
                </ToggleButton2>
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
          <Divider />
          {/* (B) "아티클 본문" 타이틀 추가 */}
          <MainBodyTitle>📝 아티클 본문 살펴보기</MainBodyTitle>
          <TOC>
            <div>목차</div>
            <ContentWrapper
              ref={contentRef}
              $height={contentHeight}
              $isExpanded={false}
            >
              {detailData.summary_data?.section?.map(
                ({ title }: any, index: number) => (
                  <span key={index}>{title}</span>
                )
              )}
            </ContentWrapper>

            {detailData.summary_data?.section?.length > 5 && (
              <ToggleButton onClick={toggleView}>
                {isExpanded ? "간단히 보기" : "더 보기"}
              </ToggleButton>
            )}
          </TOC>
          <Contents
            detailData={detailData}
            thumbnails={thumbnails}
            handleTocItemClick={handleTocItemClick}
            taskStatus={taskStatus}
          />
        </FadeInContainer>
      )}
      {taskStatus === "PROGRESS2" && detailData && (
        <FadeInContainer>
          <PageInfo ref={scrollRef}>
            <Category>{detailData.section}</Category>
            {/* Title은 제외 */}
            <Title>{detailData.summary_data.headline_title}</Title>
            <UploadContainer>
              <Upload>업로드 {timeAgo(detailData.upload_date)}</Upload> *
              <Upload>{detailData.duration}</Upload>
            </UploadContainer>
          </PageInfo>
          <VideoCard
            thumbnail={detailData.thumbnail}
            title={detailData.title} // title은 포함
            channelName={detailData.channel_details.channel_name}
            subscriber={detailData.channel_details.channel_subscribers}
            upload_date={detailData.upload_date}
            description={detailData.summary_data.channel_overview} // description은 제외
            channel_thumbnail={detailData.channel_details.channel_thumbnail}
          />
          <OverviewTitle>📹 영상 소개</OverviewTitle>
          <Preview $isFixed={isFixed}>
            {formatSummary(
              removeMarkTags(detailData.summary_data.short_summary)
            )}
          </Preview>
          {/* 목차 영역 */} {/** 5줄 핵심 요약 배치 **/}
          <FiveLineSummarySection>
            <FiveLineTitle>📌 TL;DR : 핵심 요약 5가지</FiveLineTitle>
            <FiveLineList>
              {detailData.summary_data.five_lines_summary.map(
                (point: any, idx: any) => (
                  <FiveLineListWrapper key={idx}>
                    <FiveLineListWrapperIndex>
                      {NUMBER_EMOJIS[idx]}
                    </FiveLineListWrapperIndex>
                    <li key={idx}> {formatSummary(point)}</li>
                  </FiveLineListWrapper>
                )
              )}
            </FiveLineList>
          </FiveLineSummarySection>
          {detailData.summary_data.comment_insight && (
            <>
              <CommentAnalysisWrapper>
                <AnalysisTitle>💬 시청자 반응 빠르게 알아보기</AnalysisTitle>
                <AnalysisDesc>
                  AI가 댓글을 분석해 <strong>{detailData.section}</strong>과
                  관련한 주요 감상 포인트를 정리했습니다. 시청자들은 어떤 의견을
                  남겼을까요?
                </AnalysisDesc>
                <ToggleButton2
                  onClick={() => setIsInsightVisible(!isInsightVisible)}
                >
                  {isInsightVisible ? "▲ 댓글 분석 접기" : "▼ 댓글 분석 보기"}
                </ToggleButton2>
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
          <Divider />
          {/* (B) "아티클 본문" 타이틀 추가 */}
          <MainBodyTitle>📝 아티클 본문 살펴보기</MainBodyTitle>
          <TOC>
            <div>목차</div>
            <ContentWrapper
              ref={contentRef}
              $height={contentHeight}
              $isExpanded={false}
            >
              {detailData.summary_data?.section?.map(
                ({ title }: any, index: number) => (
                  <span key={index}>{title}</span>
                )
              )}
            </ContentWrapper>

            {detailData.summary_data?.section?.length > 5 && (
              <ToggleButton onClick={toggleView}>
                {isExpanded ? "간단히 보기" : "더 보기"}
              </ToggleButton>
            )}
          </TOC>
          <Contents
            detailData={detailData}
            thumbnails={thumbnails}
            handleTocItemClick={handleTocItemClick}
            taskStatus={taskStatus}
          />
        </FadeInContainer>
      )}
      {taskStatus === "Success" && detailData && (
        <SlideInContainer>
          <PageInfo ref={scrollRef}>
            <Category>{detailData.section}</Category>
            <Title>{detailData.summary_data.headline_title}</Title>
            {""}
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
                display: isLoading
                  ? "none"
                  : isPlayerVisible
                  ? "block"
                  : "none",
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
            {formatSummary(
              removeMarkTags(detailData.summary_data.short_summary)
            )}
          </Preview>
          {/** 5줄 핵심 요약 배치 **/}
          <FiveLineSummarySection>
            <FiveLineTitle>📌 TL;DR : 핵심 요약 5가지</FiveLineTitle>
            <FiveLineList>
              {detailData.summary_data.five_lines_summary.map(
                (point: any, idx: any) => (
                  <FiveLineListWrapper key={idx}>
                    <FiveLineListWrapperIndex>
                      {NUMBER_EMOJIS[idx]}
                    </FiveLineListWrapperIndex>
                    <li key={idx}> {formatSummary(point)}</li>
                  </FiveLineListWrapper>
                )
              )}
            </FiveLineList>
          </FiveLineSummarySection>
          {detailData.summary_data.comment_insight && (
            <>
              <CommentAnalysisWrapper>
                <AnalysisTitle>💬 시청자 반응 빠르게 알아보기</AnalysisTitle>
                <AnalysisDesc>
                  AI가 댓글을 분석해 <strong>{detailData.section}</strong>과
                  관련한 주요 감상 포인트를 정리했습니다. 시청자들은 어떤 의견을
                  남겼을까요?
                </AnalysisDesc>
                <ToggleButton2
                  onClick={() => setIsInsightVisible(!isInsightVisible)}
                >
                  {isInsightVisible ? "▲ 댓글 분석 접기" : "▼ 댓글 분석 보기"}
                </ToggleButton2>
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
          <Divider />
          {/* (B) "아티클 본문" 타이틀 추가 */}
          <MainBodyTitle>📝 아티클 본문 살펴보기</MainBodyTitle>
          <TOC>
            <div>목차</div>
            <ContentWrapper
              ref={contentRef}
              $height={contentHeight}
              $isExpanded={false}
            >
              {detailData.summary_data?.section?.map(
                ({ title }: any, index: number) => (
                  <span key={index}>{title}</span>
                )
              )}
            </ContentWrapper>

            {detailData.summary_data?.section?.length > 5 && (
              <ToggleButton onClick={toggleView}>
                {isExpanded ? "간단히 보기" : "더 보기"}
              </ToggleButton>
            )}
          </TOC>
          <Contents
            detailData={detailData}
            thumbnails={thumbnails}
            handleTocItemClick={handleTocItemClick}
            taskStatus={taskStatus}
          />
          {isThreadModalOpen && (
            <ThreadModal
              videoId={id}
              section={detailData.section}
              onClose={() => setIsThreadModalOpen(false)}
            />
          )}
          {taskStatus === "Success" && (
            <FloatingButton onClick={handleOpenThreadModal}>
              스레드 생성하기
            </FloatingButton>
          )}
        </SlideInContainer>
      )}
      {/* ❌ 에러 팝업 */}
      {showErrorModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={handleErrorModalClose}>×</ModalClose>
            <InfoMessage>⚠️ 아티클 생성 실패</InfoMessage>
            <InfoDescription>{errorMessage}</InfoDescription>
            <ModalButton onClick={handleErrorModalClose}>확인</ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
      {/* 초기 데이터 렌더링 */}
      {/* {detailData && detailData.thumbnail && (
        <VideoCard
          thumbnail={detailData.thumbnail}
          title={detailData.title}
          channelName={detailData.channel_details?.channel_name}
          subscriber={detailData.channel_details?.channel_subscribers}
          upload_date={detailData.upload_date}
          description={detailData.summary_data?.channel_overview}
          channel_thumbnail={detailData.channel_details?.channel_thumbnail}
        />
      )} */}

      {/* Part 처리 데이터 렌더링 */}
      {/* {detailData?.section && (
        <TOC>
          <div>목차</div>
          <ContentWrapper>
            {detailData.section.map((section: any, index: number) => (
              <span key={index}>{section.title}</span>
            ))}
          </ContentWrapper>
        </TOC>
      )} */}

      {/* Contents 컴포넌트 */}
      {/* <Contents
        detailData={detailData}
        thumbnails={[]}
        handleTocItemClick={() => {}}
      /> */}
    </Container>
  );
};

export default ClientSide2;
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
    line-height: 148%;
    margin-bottom: 8px;
  }
`;

const TOC = styled.div`
  margin-top: 20px;
  padding: 0 16px;

  div:first-child {
    height: 44px;
    padding: 10px 16px;
    background-color: black;
    font-size: 20px;
    font-weight: 800;
    color: white;
  }

  span {
    line-height: 132%;
  }
`;

const ToggleButton = styled.button`
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  background-color: transparent;
  color: #007bff;
  border: none;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    text-decoration: underline;
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

const ContentWrapper = styled.div<{ $height: string; $isExpanded: boolean }>`
  overflow: hidden;
  height: ${({ $height }) => $height};
  transition: height 0.3s ease;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: rgb(248, 248, 248);
  font-size: 18px;
  font-weight: 600;
  line-height: 132%;
`;

const ContentWrapperProgress = styled.div`
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: rgb(248, 248, 248);
  font-size: 18px;
  font-weight: 600;
  line-height: 132%;
`;

const LoaderOverlay = styled.div`
  position: fixed; /* 스크롤 시에도 상단 고정 */
  top: 52px; /* 로고 헤더 아래에 고정 */
  left: 50%; /* 중앙 정렬 */
  transform: translateX(-50%); /* 중앙 정렬 */
  width: 100%;
  max-width: 430px; /* 아티클 컨테이너 초과 방지 */
  height: auto;
  min-height: 120px; /* 최소 높이 설정 */
  background: rgba(255, 255, 255, 0.9); /* 반투명 배경 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 12px 12px; /* 하단 모서리 둥글게 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* 그림자 효과 */
  z-index: 9999; /* 컨텐츠 위에 표시 */
  pointer-events: auto; /* 클릭 막음 */
`;

const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  margin-top: 12px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StatusMessage = styled.div`
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-top: 20px;
`;

const FadeInContainer = styled.div`
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const SlideInContainer = styled.div`
  animation: slideIn 0.5s ease-in-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
const Message = styled.div`
  padding-right: 20px;
  padding-left: 20px;
  line-height: 132%;
`;

const ProgressBarContainer = styled.div`
  width: 90%;
  height: 10px;
  background: #f3f3f3;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 12px;
  margin-bottom: 32px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: ${(props) => props.progress}%;
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
`;

/** 💡 Shimmer 효과 */
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

/** 💠 Skeleton UI */
const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`;

const SkeletonCard = styled.div`
  width: 100%;
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
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
  margin: 48px 16px;
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

/** ✅ 추가된 스타일 */
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
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px 16px;
  border-radius: 4px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  position: relative;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
`;

const ModalButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 16px 8px;
  border-radius: 4px;
  margin-top: 20px;
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
`;

const InfoMessage = styled.p`
  color: #333;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const InfoDescription = styled.p`
  font-size: 16px;
  line-height: 1.5;
`;
