"use client";

import { useState, useEffect, useRef, Key } from "react";
import styled, { keyframes } from "styled-components";
import YouTube, { YouTubeProps } from "react-youtube";
import { useRecoilValue, useSetRecoilState } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import Contents from "./Contents";
import { DataProps } from "@/types/dataProps";
import { formatSummary, removeMarkTags } from "@/utils/formatter";
import { playerState } from "@/store/player";
import { base64ToBlobUrl } from "@/utils/base64";
import { isDesktop } from "react-device-detect";
import { timeAgo } from "@/utils/formatter";
import VideoCard from "@/detail/[id]/components/VideoCard";

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

  // 상태 변화 시 높이 재계산
  useEffect(() => {
    setContentHeight(calculateHeight());
  }, [isExpanded, detailData]);
  useEffect(() => {
    const pollTaskStatus = async () => {
      try {
        const response = await fetch(
          `https://youticle.shop/editor/status/${taskId}`
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
            setProgress(25);
            setDetailData(data.meta?.youtube_article);
            break;
          case "PROGRESS":
            setProgress(50);
            setDetailData(data.meta?.youtube_article);
            break;
          case "PROGRESS1":
            setProgress(75);
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
          default:
            break;
        }
      } catch (error) {
        console.error("Error polling task:", error);
        setTaskMessage("작업 상태를 가져오는 중 오류가 발생했습니다.");
      }
    };

    const interval = setInterval(pollTaskStatus, 2000); // 2초 간격으로 폴링
    return () => clearInterval(interval);
  }, [taskId]);
  console.log(taskStatus);
  console.log(detailData);
  return (
    <Container $isFixed={isFixed}>
      {/* 상태에 따른 콘텐츠 렌더링 */}
      {taskStatus === "PENDING" && (
        <StatusMessage>작업을 준비 중입니다...</StatusMessage>
      )}

      <LogoHeader
        title={isFixed ? `${detailData.summary_data.headline_title}` : ""}
      />
      {/* 상태 메시지 및 로딩 표시 */}
      {isArticleLoading && (
        <LoaderContainer>
          <Spinner />
          <p>{taskMessage}</p>
          <ProgressBarContainer>
            <ProgressBar progress={progress} />
          </ProgressBarContainer>
        </LoaderContainer>
      )}
      {taskStatus === "START" && detailData && (
        <FadeInContainer>
          <PageInfo ref={scrollRef}>
            <Category>{detailData.section}</Category>
            {/* Title은 제외 */}
            <SkeletonText />
            <UploadContainer>
              <Upload>업로드 {timeAgo(detailData.upload_date)}</Upload> *
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
            title={detailData.title} // title은 포함
            channelName={detailData.channel_details.channel_name}
            subscriber={detailData.channel_details.channel_subscribers}
            upload_date={detailData.upload_date}
            description={""} // description은 제외
            channel_thumbnail={detailData.channel_details.channel_thumbnail}
          />
          <OverviewTitle>📹 영상 소개</OverviewTitle>
          <Preview $isFixed={isFixed}>
            <SkeletonText />
          </Preview>

          <TOC>
            목차
            <SkeletonText />
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
            {formatSummary(detailData.summary_data.short_summary)}
          </Preview>
          <TOC>
            <div>목차</div>
            <SkeletonText />
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
            {formatSummary(detailData.summary_data.short_summary)}
          </Preview>
          <TOC>
            <div>목차</div>
            <ContentWrapper
              ref={contentRef}
              $height={contentHeight}
              $isExpanded={isExpanded}
            >
              {detailData.summary_data.section.map(
                ({ title }: any, index: any) => (
                  <span key={index}>{title}</span>
                )
              )}
            </ContentWrapper>
            {detailData.summary_data.section.length > 5 && (
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
            {formatSummary(detailData.summary_data.short_summary)}
          </Preview>

          <TOC>
            <div>목차</div>
            <ContentWrapper
              ref={contentRef}
              $height={contentHeight}
              $isExpanded={isExpanded}
            >
              {detailData.summary_data.section.map(
                ({ title }: any, index: any) => (
                  <span key={index}>{title}</span>
                )
              )}
            </ContentWrapper>
            {detailData.summary_data.section.length > 5 && (
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
        </SlideInContainer>
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

const Container = styled.div<{ $isFixed: boolean }>`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: white;
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
  font-size: 20px;
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

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

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

const SkeletonText = styled.div`
  width: 80%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 5px;
  animation: shimmer 1.5s infinite;
`;
