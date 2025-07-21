"use client";
import { Search, HelpCircle } from "lucide-react";
import { BarChart2, BellRing } from "lucide-react";

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
  formatMinutesToTime,
  formatSecondsToMmSs,
  formatSummary,
  formatTimeRange,
  getOrCreateAnonId,
  parseTimeStringToSeconds,
  removeMarkTags,
} from "@/utils/formatter";
import { timeAgo } from "@/utils/formatter";
import { isDesktop } from "react-device-detect";
// import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { userState } from "@/store/user";
import {
  fetchSubscribedSubjects,
  logCtaClick,
  upsertNotificationRequest,
} from "@/api/apiClient";
import CommentsInsightSection from "@/editor/[id]/components/CommentInsightSection";
import CommentsInsightSectionDimmed from "@/editor/[id]/components/CommentInsightDimmed";
import Recommend from "./Recommend";
import { DailyTop5PreferenceSurvey } from "./DailyTop5PreferenceSurvey";

export interface ClientContext {
  country: string;
  acceptLanguage: string;
  userAgent: string;
  referer: string;
}

interface ClientSideProps {
  id: string;
  detailData: DataProps;
  clientContext: ClientContext;
}

const ClientSide = ({ id, detailData, clientContext }: ClientSideProps) => {
  console.log(detailData);
  console.log(clientContext);
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

  // a,b 테스트 버전
  const getVariant = () => {
    const match = document.cookie.match(/detailVariant=(a|b)/);
    return match ? match[1] : "unknown";
  };
  const variant = getVariant();
  console.log(variant, "옵션");

  // 1) 페이지 오픈 로깅
  useEffect(() => {
    const { country, acceptLanguage, userAgent, referer } = clientContext;
    logCtaClick(
      "page_open",
      user?.id ?? null,
      detailData.video_id ?? null,
      getOrCreateAnonId(),
      {
        country,
        accept_language: acceptLanguage,
        user_agent: userAgent,
        referer,
        ab_variant: variant, // <-- 여기
      }
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

  const [showChannelInputSection, setShowChannelInputSection] = useState(false);

  // 📣 설문 응답 핸들러: like가 boolean 으로 들어옵니다.
  const handleSurveyAnswer = (like: boolean): void => {
    const answer = like ? "yes" : "no";
    // 1) 비동기 설문 전송
    if (!like) {
      setShowChannelInputSection(true);
    }
  };
  // useState
  const [channelInput, setChannelInput] = useState("");
  const [notifyPref, setNotifyPref] = useState<"on" | "off">("on");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [customTime, setCustomTime] = useState("");

  // 모달 확인 핸들러
  const handleModalSubmit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (!(digits.length === 10 || digits.length === 11)) {
      alert("전화번호는 숫자 10자리 또는 11자리여야 합니다.");
      return;
    }
    try {
      logCtaClick(
        "kakao_apply",
        user?.id ?? null,
        detailData.video_id,
        getOrCreateAnonId()
      );
      const nr = await upsertNotificationRequest({
        anon_id: getOrCreateAnonId(),
        user_id: user?.id, // or omit if anonymous
        phone, // your phone state
        schedule, // your schedule state (e.g. "08")
        channel_name: channelInput, // your channel name state
      });
      console.log("saved notification request:", nr);
      setSubmitted(true);
      setIsModalOpen(false);
      setIsCompleteModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("알림 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const [schedule, setSchedule] = useState<
    "08" | "08_18" | "08_18_22" | "08_13_18_22"
  >("08");

  // 시간 선택 옵션
  const TIME_OPTIONS = [
    { value: "08", label: "매일 08:00 1회" },
    { value: "08_18", label: "매일 08:00, 18:00 2회" },
    { value: "08_18_22", label: "매일 08:00, 18:00, 22:00 3회" },
    { value: "08_13_18_22", label: "매일 08:00, 13:00, 18:00, 22:00 4회" },
  ];

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [extraChannel, setExtraChannel] = useState("");

  // 2) 채널 등록 핸들러
  const handleRegisterChannel = async () => {
    logCtaClick(
      "register_priority_channel",
      user?.id ?? null,
      detailData.video_id,
      getOrCreateAnonId()
    );
    if (!channelInput.trim()) {
      alert("유튜브 채널명을 입력해주세요.");
      return;
    }
    try {
      await upsertNotificationRequest({
        anon_id: getOrCreateAnonId(),
        user_id: user?.id,
        channel_name: channelInput,
        // you can also pass phone/schedule if already set in state
        phone,
        schedule,
      });
      alert(`"${channelInput}" 채널이 등록되었습니다! 앞으로 우선 반영돼요 😊`);
      setShowChannelInputSection(false);
      setIsCompleteModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("채널 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

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
        <Category>7/19, {detailData.section} TOP5 유튜브 영상</Category>
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
      {detailData.summary_data.comment_insight_front &&
      Object.keys(detailData.summary_data.comment_insight_front).length > 0 ? (
        <>
          <SectionTitle>💬 시청자 반응 요약</SectionTitle>
          <InsightContainer>
            {(["1st"] as const).map((key) => {
              const title = detailData.summary_data.comment_insight_front![key];
              const comments = detailData.summary_data.comment_insight_front![
                `${key}_comments`
              ] as { comment: string; likeCount: string; updatedAt: string }[];

              return (
                <InsightCard key={key}>
                  {/* <InsightHeader dangerouslySetInnerHTML={{ __html: title }} /> */}
                  <CommentList>
                    {comments.map((c, i) => (
                      <CommentItem key={i}>
                        <CommentText>{c.comment}</CommentText>
                        <CommentMeta>
                          👍 {c.likeCount} · {timeAgo(c.updatedAt)}
                        </CommentMeta>
                      </CommentItem>
                    ))}
                  </CommentList>
                </InsightCard>
              );
            })}
          </InsightContainer>
        </>
      ) : (
        <></>
        // <EmptyState>👥 아직 시청자 댓글 인사이트가 없습니다.</EmptyState>
      )}
      <MainBodyTitle>📝 영상 목차</MainBodyTitle>
      <TOC>
        <ContentWrapper
          fullPadding={detailData.summary_data.section.length < 8}
        >
          {isMultiPart ? (
            <>
              <PartCard>
                {/* <PartHeader>1부</PartHeader> */}
                {sections.slice(0, midIndex).map((sec, i) => (
                  <PartCardBox key={i}>
                    <Timeline
                      onClick={() =>
                        handleTocItemClick(
                          parseTimeStringToSeconds(sec.start_time)
                        )
                      }
                    >
                      {/* <PlayIcon width={16} height={16} /> */}
                      <span>
                        {formatSecondsToMmSs(
                          parseTimeStringToSeconds(sec.start_time)
                        )}
                      </span>
                    </Timeline>
                    <Item key={`part1-${i}`}>{removeMarkTags(sec.title)}</Item>
                  </PartCardBox>
                ))}
              </PartCard>
              <Divider />
              <PartCard>
                {/* <PartHeader>2부</PartHeader> */}
                {sections.slice(midIndex).map((sec, i) => (
                  <PartCardBox key={i}>
                    <Timeline
                      onClick={() =>
                        handleTocItemClick(
                          parseTimeStringToSeconds(sec.start_time)
                        )
                      }
                    >
                      {/* <PlayIcon width={16} height={16} /> */}
                      <span>
                        {formatSecondsToMmSs(
                          parseTimeStringToSeconds(sec.start_time)
                        )}
                      </span>
                    </Timeline>
                    <Item key={`part2-${i}`}>{removeMarkTags(sec.title)}</Item>
                  </PartCardBox>
                ))}
              </PartCard>
            </>
          ) : (
            <PartCard>
              {/* <PartHeader>1부</PartHeader> */}
              {sections.slice(0, 6).map((sec, i) => (
                <PartCardBox key={i}>
                  <Timeline
                    onClick={() =>
                      handleTocItemClick(
                        parseTimeStringToSeconds(sec.start_time)
                      )
                    }
                  >
                    {/* <PlayIcon width={16} height={16} /> */}
                    <span>
                      {formatSecondsToMmSs(
                        parseTimeStringToSeconds(sec.start_time)
                      )}
                    </span>
                  </Timeline>
                  <Item key={`part1-${i}`}>{removeMarkTags(sec.title)}</Item>
                </PartCardBox>
              ))}
            </PartCard>
          )}
        </ContentWrapper>
      </TOC>
      <MoreButton onClick={handleMoreClick}>
        {isArticleVisible ? "간단히 보기" : `즉시 상세 요약 확인하기 👇`}
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
      {/* ─── Hook for Daily Top5 Survey ─── */}
      <HookSection>
        <HookingCopy>
          매일 수십개 씩 쏟아지는 영상 속에서
          <br />
          {detailData.section} 핵심 정보를 놓치지 않으려면?
          <br />
          <br />
          <strong>
            📢 {detailData.section} 분야의 TOP5 영상 요약만 <br />
            매일 카톡으로 받아보세요!
          </strong>
        </HookingCopy>
        <ButtonGroup>
          <SurveyButton
            primary
            onClick={async () => {
              logCtaClick(
                "daily_top5_survey_like",
                user?.id,
                user?.email,
                getOrCreateAnonId()
              );
              setIsModalOpen(true);
            }}
          >
            좋아요
          </SurveyButton>
          <SurveyButton
            onClick={async () => {
              logCtaClick(
                "daily_top5_survey_dislike",
                user?.id,
                user?.email,
                getOrCreateAnonId()
              );
              handleSurveyAnswer(false);
            }}
          >
            관심 없어요
          </SurveyButton>
        </ButtonGroup>
        {!showChannelInputSection && (
          <Thumbnail
            src="/images/TOP5알림톡3.png"
            alt="오늘의 주식 TOP5 알림톡 예시"
          />
        )}
      </HookSection>
      {/* 설문 아래, 관심 없어요 눌렀을 때만 보이는 섹션 */}
      {showChannelInputSection && (
        <ChannelPrioritySection>
          <h4>
            {" "}
            🤔 잠깐, {detailData.section} TOP5 영상 요약에서 <br />
            우선 반영하고 싶은 채널이 있으신가요?
          </h4>
          <p>
            관심 채널을 등록하면 매일 TOP5 선정 시
            <br />
            해당 채널의 신규 영상이 있다면 우선 노출됩니다.
          </p>
          <Input
            placeholder="예) 삼프로TV"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
          />
          <Footer style={{ justifyContent: "center", gap: "12px" }}>
            <SurveyButton primary onClick={handleRegisterChannel}>
              채널 등록하기
            </SurveyButton>{" "}
            <SurveyButton
              onClick={async () => {
                logCtaClick(
                  "hide_priority_channel_section",
                  user?.id ?? null,
                  detailData.video_id,
                  getOrCreateAnonId()
                );
                setShowChannelInputSection(false);
              }}
            >
              다시 숨기기{" "}
            </SurveyButton>{" "}
          </Footer>
        </ChannelPrioritySection>
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
      {/* <Preview $isFixed={isFixed}>
        <div>
          <span>🔎 미리보기</span>
          {formatSummary(detailData.summary_data.short_summary)}
        </div>
      </Preview> */}
      {isModalOpen && (
        <ModalOverlay style={{ background: "rgba(0, 0, 0, 0.4)" }}>
          <ModalContent>
            <Header>✨ 새로운 기능 체험 신청!</Header>
            <Body>
              아직 준비 중인 <b>TOP5 영상 카톡 알림</b>을<br />
              가장 먼저 받아보고 싶으신가요?
              <br />
              아래에 전화번호와 알림 시간을 남겨주세요!
            </Body>

            <Form>
              <Label htmlFor="phone">카톡 받으실 번호</Label>
              <Input
                id="phone"
                placeholder="예) 010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Label>알림 받을 시간</Label>
              <RadioGroup>
                {TIME_OPTIONS.map((o) => (
                  <RadioLabel key={o.value}>
                    <input
                      type="radio"
                      name="schedule"
                      value={o.value}
                      checked={schedule === o.value}
                      onChange={() => setSchedule(o.value as any)}
                    />
                    {o.label}
                  </RadioLabel>
                ))}
                {/* <RadioLabel>
                  <input
                    type="radio"
                    name="schedule"
                    value="custom"
                    checked={schedule === "custom"}
                    onChange={() => setSchedule("custom")}
                  />
                  다른 시간 직접 입력
                </RadioLabel> */}
              </RadioGroup>

              {/* {schedule === "custom" && (
                <>
                  <Label htmlFor="customTime">원하는 시간 (HH:MM)</Label>
                  <Input
                    id="customTime"
                    placeholder="예) 14:30"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </>
              )} */}
            </Form>

            <Footer>
              <PrimaryButton onClick={handleModalSubmit}>
                신청하고 카톡 알림 받기
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  logCtaClick(
                    "kakao_apply_later",
                    user?.id ?? null,
                    detailData.video_id,
                    getOrCreateAnonId()
                  );
                  setIsModalOpen(false); // 1) 알림 모달 닫기
                  setShowChannelInputSection(true); // 2) 채널 우선 반영 섹션 활성화
                }}
              >
                {" "}
                나중에 할게요
              </SecondaryButton>
            </Footer>
          </ModalContent>
        </ModalOverlay>
      )}

      {isCompleteModalOpen && (
        <ModalOverlay style={{ background: "rgba(0, 0, 0, 0.4)" }}>
          <ModalContent>
            <Header style={{ marginBottom: "24px" }}>
              🎉 신청이 완료되었습니다!
            </Header>
            <Body style={{ marginBottom: "32px" }}>
              TOP5 영상 요약 카톡 알림 기능의 오픈 즉시 <br /> 등록하신 번호로
              가장 먼저 안내해드립니다.
            </Body>
            {/* 2. 채널 우선 반영 upsell with new hook */}
            <SubHeader style={{ margin: "24px 0 12px", color: "#007bff" }}>
              🤔 혹시 TOP5 영상 요약에서 <br />
              우선 반영하고 싶은 채널이 있으신가요?
            </SubHeader>
            <SubBody style={{ marginBottom: "24px" }}>
              관심 채널을 등록하면 매일 TOP5 선정 시
              <br />
              해당 채널의 신규 영상이 있다면 우선 노출됩니다.
              {/* <br />
              <br /> */}
              {/* 예) 즐겨보는 <strong>@YouticleLab</strong> 채널이
              <br />
              항상 최상위 리스트에 오르게 돼요. */}
            </SubBody>

            <Form>
              <Label htmlFor="channel">등록할 채널명</Label>
              <Input
                id="channel"
                placeholder="예) 삼프로TV"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
              />
            </Form>

            <Footer style={{ gap: "12px" }}>
              <PrimaryButton onClick={handleRegisterChannel}>
                채널 등록하기
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsCompleteModalOpen(false)}>
                건너뛰기
              </SecondaryButton>
            </Footer>
          </ModalContent>
        </ModalOverlay>
      )}
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
  margin-bottom: 60px;
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
  padding: ${({ fullPadding }) => (fullPadding ? "0px" : "0px")};
  transition: max-height 0.3s ease;
  display: flex;
  flex-direction: column; /* ← 가로가 아니라 세로로 */
  gap: 8px;
  background: ${({ fullPadding }) =>
    fullPadding ? "#transparent" : "transparent"};
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
  margin-bottom: 16px;
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
  margin: 48px 16px 4px;
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
  border-radius: 4px;
  background-color: #eaf4ff;
  /* margin-left: 4px; */
  cursor: pointer;
  transition: all 0.3s ease;
  max-height: 32px;
  margin-right: 8px;
  padding: 16px 8px;
  border: 1px solid #007bff;
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
    font-size: 14px;
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
  margin: 40px 16px 24px;
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
      : `0px`};
  z-index: ${(props) => (props.$hasDimmedItem ? `500` : "0")};
  padding-left: 16px;
  padding-right: 16px;
`;

// 2) PartCard: full-width 카드
const PartCard = styled.div`
  width: 100%; /* ← 전체 폭 차지 */
  /* background: #f9f9f9; */
  /* border: 1px solid #ddd; */
  border-radius: 8px;
  /* padding: 16px; */
  line-height: 160%;
`;

const PartCardBox = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 20px;
  align-items: center;
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
  /* margin-bottom: 16px; */
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
const InsightContainer = styled.div`
  margin: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InsightCard = styled.div`
  background: #ffffff;
  /* padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); */
`;

const InsightHeader = styled.h3`
  font-size: 16px;
  font-weight: 400;
  color: #000;
  line-height: 140%;
  margin-bottom: 8px;
  /* mark 태그 기본 스타일 제거 & font-weight만 강조 */
  mark {
    background: none;
    color: inherit;
    padding: 0;
    font-weight: 700;
  }
`;
const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CommentItem = styled.div`
  background: #f2f8ff;
  border-left: 4px solid #007bff;
  padding: 16px;
  border-radius: 4px;
`;

const CommentText = styled.div`
  font-size: 14px;
  line-height: 140%;
`;

const CommentMeta = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 8px;
`;
const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin: 0px 16px;
  /* color: #007bff; */
`;
const EmptyState = styled.div`
  font-size: 16px;
  color: #888;
  text-align: center;
  margin: 24px 16px;
`;

const Callout = styled.div`
  margin: 0 16px 8px;
  padding: 12px 16px;
  background: #f0f8ff;
  border-radius: 8px;
  font-size: 14px;
  color: #0056b3;
  font-weight: 600;
  &::before {
    content: "💬";
    margin-right: 8px;
  }
`;

// 1) bounce keyframes 정의 (작은 범위로 자연스럽게)
const bounceY = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
`;

const InfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 16px 12px;
  padding: 12px 16px;
  background: #eef6ff;
  border: 1px solid #007bff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #0056b3;
  /* 여기에 bounceY 넣기 */
  animation: ${bounceY} 2s ease-in-out infinite;
  line-height: 140%;
  svg {
    flex-shrink: 0;
  }
`;
// ─── Styled-components ───
const ActionSection = styled.section`
  max-width: 600px;
  margin: 32px auto;
  padding: 32px 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

// const HookingCopy = styled.div`
//   font-size: 18px;
//   font-weight: 700;
//   line-height: 1.5;
//   text-align: center;
//   color: #111;
// `;

const SectionHeader = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CardTitle = styled.h4`
  font-size: 16px;
  margin: 0;
`;

const UserDescription = styled.p`
  font-size: 14px;
  color: #444;
  margin: 0;
`;

const InputLabel = styled.label`
  font-size: 12px;
  color: #666;
`;

const ChannelInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ButtonBase = styled.button`
  border-radius: 4px;
  cursor: pointer;
  padding: 12px 16px;
  font-size: 14px;
  width: 100%;
  border: none;
`;

// const PrimaryButton = styled(ButtonBase)`
//   background: #007bff;
//   color: #fff;
//   &:hover {
//     background: #0056b3;
//   }
// `;
const HookSection = styled.section`
  background: #f5f7ff;
  padding: 32px 24px;
  padding-bottom: 0px;
  margin: 24px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  text-align: center;
  margin-top: 100px;
`;

const HookingCopy = styled.div`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: #1f2937;
  margin-bottom: 24px;
  strong {
    color: #007bff;
    font-size: 18px;
    font-weight: 700;
  }
`;

const SurveyWrapper = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e0e7ff;
  display: inline-block;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  svg {
    color: #007bff;
    margin-bottom: 16px;
  }
`;

const PromptText = styled.p`
  font-size: 16px;
  color: #374151;
  margin-bottom: 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
`;

const SurveyButton = styled.button<{ primary?: boolean }>`
  flex: 1;
  padding: 12px 0;
  font-size: 16px;
  font-weight: ${({ primary }) => (primary ? 700 : 0)};

  border-radius: 4px;
  border: none;
  cursor: pointer;

  background: ${({ primary }) => (primary ? "#007bff" : "#e0e0e0")};
  color: ${({ primary }) => (primary ? "#fff" : "#555")};

  &:hover {
    background: ${({ primary }) => (primary ? "#0056b3" : "#5a6268")};
  }
`;

const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;
const Label = styled.label`
  font-size: 16px;
  font-weight: 700;
  color: #444;
`;
const Input = styled.input`
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 12px;
  width: 100%;
`;
const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const RadioLabel = styled.label`
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  input {
    transform: scale(1.1);
  }
`;

const Thumbnail = styled.img`
  width: 80%;
  max-width: 320px;
  border-radius: 8px;
  margin: 0 auto 16px;
  display: block;
  margin-top: 60px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

// Header 아래 여백 강화
const Header = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
`;

// Body 여백 강화
const Body = styled.p`
  font-size: 16px;
  color: #000;
  line-height: 1.4;
  text-align: center;
  margin-bottom: 32px;
`;

// SubHeader 강조 스타일 (색상, 굵기)
const SubHeader = styled.h4`
  font-size: 18px;
  font-weight: 700;
  color: #007bff;
  text-align: center;
  margin: 24px 0 12px;
  line-height: 1.4;
`;

// SubBody 기본 여백 유지
const SubBody = styled.p`
  font-size: 16px;
  color: #000;
  line-height: 1.4;
  text-align: center;
  margin-bottom: 24px;
`;

// Footer 버튼 비율 유지
const Footer = styled.div`
  display: flex;
  gap: 12px;
`;

const PrimaryButton = styled.button`
  flex: 0 0 60%;
  background: #007bff;
  color: #fff;
  padding: 12px 0;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  flex: 0 0 40%;
  background: #e0e0e0;
  color: #555;
  padding: 12px 0;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(8px); }
  to   { opacity: 0; transform: translateY(0); }
`;
const ChannelPrioritySection = styled.div`
  margin: 24px 16px;
  padding: 20px;
  background: #f5f7ff;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.3s ease-out forwards;

  h4 {
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }
  p {
    font-size: 16px;
    color: #555;
    line-height: 1.4;
    margin-bottom: 20px;
  }
`;

const RegisterButton = styled.button`
  background: #007bff;
  color: #fff;
  padding: 16px 0;
  width: 100%;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #0056b3;
  }
`;
