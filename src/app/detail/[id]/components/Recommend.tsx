"use client"; // Ensure this is a client component

import styled from "styled-components";
import { useMemo, useState, useEffect } from "react";
import { DataProps } from "@/types/dataProps";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { dataState } from "@/store/data";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import RecommendCard from "./RecommendCard";
import CountdownTimer from "@/common/CountdownTimer";
import SortOptions from "@/common/SortOptions";

import {
  fetchEditorArticle,
  fetchStockVideo,
  fetchTopVideosBySection,
} from "@/api/apiClient";
import { useRouter, usePathname } from "next/navigation";
import {
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
  timeAgoUTC,
} from "@/utils/formatter";

interface RecommendProps {
  isUnsubscribedSection: boolean;
  section: string;
  videoId: string;
}

interface Editor {
  id: string;
  name: string;
  image: string;
  keywords: string[];
}

const Recommend = ({
  isUnsubscribedSection,
  section,
  videoId,
}: RecommendProps) => {
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [videos, setVideos] = useState<DataProps[]>([]);
  const [editorVideos, setEditorVideos] = useState<DataProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // console.log("recommend", detailData.section);
  useEffect(() => {
    async function loadVideos() {
      setLoading(true);
      try {
        if (section == "주식") {
          const data = await fetchStockVideo();
          setVideos(data);
          const editorData = await fetchEditorArticle();
          setEditorVideos(editorData);
        } else {
          const data = await fetchTopVideosBySection(section);
          setVideos(data);
          const editorData = await fetchEditorArticle();
          setEditorVideos(editorData);
        }
      } catch (error) {
        setError("Error fetching videos");
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, [section]);

  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const filteredAndSortedData = useMemo(() => {
    const filteredData = videos.filter(
      (item) => item.section === section && item.video_id !== videoId
    );
    const sortedData = filteredData.sort((a, b) => {
      if (sortCriteria === "engagement") {
        return b.score - a.score;
      } else {
        return b.views + b.likes * 10 - a.views + a.likes * 10;
      }
    });
    return sortedData;
  }, [videos, sortCriteria]);

  const filteredAndSortedEditorData = useMemo(() => {
    const filteredData = editorVideos.filter(
      (item) =>
        item.section === section &&
        item.video_id !== videoId &&
        Object.keys(item.summary_data).length !== 0 // summary_data가 빈 객체인 경우 제외
    );

    const sortedData = filteredData.sort((a, b) => {
      // upload_date를 Date 객체로 변환 후 비교
      const dateA = new Date(a.upload_date).getTime();
      const dateB = new Date(b.upload_date).getTime();
      return dateB - dateA;
    });

    return sortedData;
  }, [editorVideos, section, videoId]);

  const editors: Editor[] = [
    {
      id: "1",
      name: "유썸 스톡",
      image: "/images/유썸스톡.png",
      keywords: ["주식"],
    },
    {
      id: "2",
      name: "유썸 비즈",
      image: "/images/유썸비즈.png",
      keywords: ["비즈니스/사업"],
    },
    {
      id: "3",
      name: "유썸 메디컬",
      image: "/images/유썸메디컬.png",
      keywords: ["건강"],
    },
    {
      id: "4",
      name: "유썸 로맨틱",
      image: "/images/유썸로맨틱.png",
      keywords: ["연애/결혼"],
    },
    {
      id: "5",
      name: "유썸 AI/테크",
      image: "/images/유썸테크.png",
      keywords: ["인공지능", "IT/테크", "IT/Tech"],
    },
  ];

  // section과 일치하는 editor를 찾기
  const matchedEditor = editors.find((editor) =>
    editor.keywords.includes(section)
  );

  const RECOMMEND_TITLE = pathname.includes("/editor")
    ? `<span class='highlight'>유티클 투데이</span>에서&nbsp;<span class='highlight'>${section}</span>&nbsp;아티클도 확인하기!`
    : `<span class='highlight'>유티클 투데이</span>에서&nbsp;다음 <span class='highlight'>${section}</span>&nbsp;아티클 확인하기!`;
  const SECTION_TITLE = `오늘의 ${section} TOP5 영상`;

  let EDITOR_TITLE = "";

  if (pathname.includes("/studio")) {
    // 관리자 페이지: 여러 에디터들 관련 안내
    EDITOR_TITLE = `<span class='highlight'>다른 에디터</span>가 업로드한 <span class='highlight'>${section} 아티클</span>도 확인해보세요!`;
  } else if (pathname.includes("/editor")) {
    // 에디터 페이지
    EDITOR_TITLE = matchedEditor
      ? `<span class='highlight'>${matchedEditor.name}</span>&nbsp;에디터의 다른 <span class='highlight'>${section}</span> 아티클 확인하기`
      : "다른 에디터의 아티클을 확인해보세요.";
  } else {
    // default = detail 등
    EDITOR_TITLE = matchedEditor
      ? `<span class='highlight'>${matchedEditor.name}</span>&nbsp;에디터가 업로드한 <span class='highlight'>${section}</span> 아티클도 확인해보세요!`
      : "다른 에디터의 아티클을 확인해보세요.";
  }
  console.log(filteredAndSortedData);
  // 1) 카드별 보여줄 메트릭 정의
  const metrics = [
    // 🔥 섹션 평균 대비 조회수가 2배(200%) 이상
    `${section}  평균 대비 2배 조회수 돌파`,

    // 👥 구독자당 조회수가 평소 대비 얼마나 올랐는지
    `구독자당 조회수 평소 대비 +50% 상승 중`,

    // 📈 지난 1시간 동안 어느 정도 조회수가 늘었는지 (절대치+증가율)
    `지난 1시간 조회수 +1.2천뷰`,

    // 💬 댓글 참여율이 섹션 내 1위라는 점 강조
    `댓글 참여율 ${section} 1위`,

    // ⏱️ 업로드 후 얼마나 빨리 TOP5에 진입했는지
    `업로드 3시간 만에 ${section} TOP5 진입`,
  ];
  // 2) 샘플 댓글 2개
  const sampleComments = [
    {
      text: `2025년에도 멀티태스킹이 개선되지 않았다면 스스로에게 질문을 던져봐야 할 것입니다...... 스마트폰에서 가장 중요한 것 중 하나인데 말이죠..... 알아서 판단하세요! 저는 안드로이드에 매우 만족하며 평생 그럴 것입니다.`,
      likes: 70,
    },
    {
      text: `이제서야 프로가 프로다워진 느낌이에요 너무 좋음! 저도 미리 베타 올렸는데 신세계입니다 ㅎㅎ 가벼운 맥북 쓰는 너낌~~`,
      likes: 5,
    },
    {
      text: `2025년에도 멀티태스킹이 개선되지 않았다면 스스로에게 질문을 던져봐야 할 것입니다...... 스마트폰에서 가장 중요한 것 중 하나인데 말이죠..... 알아서 판단하세요! 저는 안드로이드에 매우 만족하며 평생 그럴 것입니다.`,
      likes: 70,
    },
    {
      text: `이제서야 프로가 프로다워진 느낌이에요 너무 좋음! 저도 미리 베타 올렸는데 신세계입니다 ㅎㅎ 가벼운 맥북 쓰는 너낌~~`,
      likes: 5,
    },
    {
      text: `2025년에도 멀티태스킹이 개선되지 않았다면 스스로에게 질문을 던져봐야 할 것입니다...... 스마트폰에서 가장 중요한 것 중 하나인데 말이죠..... 알아서 판단하세요! 저는 안드로이드에 매우 만족하며 평생 그럴 것입니다.`,
      likes: 70,
    },
    {
      text: `이제서야 프로가 프로다워진 느낌이에요 너무 좋음! 저도 미리 베타 올렸는데 신세계입니다 ㅎㅎ 가벼운 맥북 쓰는 너낌~~`,
      likes: 5,
    },
  ];
  return (
    <Container $isUnsubscribed={isUnsubscribedSection}>
      {pathname.includes("/studio") ? (
        <>
          <Header>
            <SectionTitle>🔥 오늘의 {section} TOP5 영상</SectionTitle>
            <TimerWrapper>
              {/* <TimerIcon>👀</TimerIcon>
              <span>다음 업데이트까지</span> */}
              <CountdownTimer />
            </TimerWrapper>
          </Header>

          <VideoList>
            {filteredAndSortedData.slice(0, 5).map((item, idx) => {
              const metricText = metrics[idx] ?? metrics[metrics.length - 1];

              return (
                <Card
                  key={item.video_id}
                  onClick={() => router.push(`/detail/${item.video_id}`)}
                >
                  {/* 카드 상단: 메트릭 배지 */}
                  <MetricsContainer>
                    <MetricBadge bg="#EAF4FF" color="#007BFF">
                      {metricText}
                    </MetricBadge>
                  </MetricsContainer>
                  <VideoItem
                    key={item.video_id}
                    onClick={() => router.push(`/detail/${item.video_id}`)}
                  >
                    <ThumbWrapper>
                      <Thumbnail src={item.thumbnail} />
                    </ThumbWrapper>
                    <Info>
                      <VideoTitle>
                        {item.summary_data.headline_title}
                      </VideoTitle>

                      <Meta>
                        {removeMarkTags(item.summary_data.short_summary)}
                      </Meta>
                    </Info>
                  </VideoItem>
                  {/* 카드 하단: 채널 정보 */}
                  <ChannelFooter>
                    <ChannelThumb
                      src={item.channel_details.channel_thumbnail}
                    />
                    <ChannelInfo>
                      <ChannelName>
                        {item.channel_details.channel_name}
                      </ChannelName>
                      <ChannelMeta>
                        {parseSubscribersCount(
                          item.channel_details.channel_subscribers
                        )}{" "}
                        · {timeAgoUTC(item.upload_date)}
                      </ChannelMeta>
                    </ChannelInfo>
                  </ChannelFooter>
                  {/* 4. 댓글 섹션 */}
                  <CommentSection>
                    <CommentIcon>💬</CommentIcon>
                    <CommentText>
                      {/* 예시 댓글; 실제로는 API에서 가져온 데이터를 쓰세요 */}
                      {sampleComments[idx].text}
                    </CommentText>
                    <LikeCount>👍🏻 {sampleComments[idx].likes}</LikeCount>
                  </CommentSection>
                </Card>
              );
            })}
          </VideoList>
        </>
      ) : pathname.includes("/detail") ? (
        <>
          <SubContainer>
            <RecommendTitle
              dangerouslySetInnerHTML={{ __html: RECOMMEND_TITLE }}
            />
            <CountdownTimer />
          </SubContainer>
          <SubRecommendTitle>
            <span>📌 유티클 투데이란? </span> <br />
            유티클 AI 알고리즘을 통해 오늘 업로드된 {section} 영상 중 참여도
            높은 영상을 선정하여 자동 요약된 아티클로 제공합니다.
          </SubRecommendTitle>
          {filteredAndSortedData.slice(0, 4).map((item, index) => {
            const topicIcon = YOUTUBE_TOPICS.find(
              (topic) => topic.topic === item.section
            )?.icon;
            return (
              <RecommendCard
                key={index}
                icon={topicIcon}
                path="detail"
                source=""
                {...item}
              />
            );
          })}
          <ButtonContainer>
            <ServiceButton
              $variant="secondary"
              onClick={() => {
                router.push("/");
              }}
            >
              유티클 투데이 더 알아보기
            </ServiceButton>
          </ButtonContainer>
          {matchedEditor ? (
            <>
              <SubEditorContainer>
                {!pathname.includes("/studio") ? (
                  <EditorImage
                    src={matchedEditor.image}
                    alt={matchedEditor.name}
                    isSelected={false} // 선택 여부는 필요에 따라 수정
                  />
                ) : (
                  <></>
                )}
                <EditorRecommendTitle
                  dangerouslySetInnerHTML={{ __html: EDITOR_TITLE }}
                />
              </SubEditorContainer>
              {filteredAndSortedEditorData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="editor"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/editor");
                  }}
                >
                  에디터 픽 아티클 더 알아보기
                </ServiceButton>
              </ButtonContainer>
            </>
          ) : (
            <></>
          )}
        </>
      ) : (
        <>
          {matchedEditor ? (
            <>
              <SubEditorContainer>
                {!pathname.includes("/studio") ? (
                  <EditorImage
                    src={matchedEditor.image}
                    alt={matchedEditor.name}
                    isSelected={false} // 선택 여부는 필요에 따라 수정
                  />
                ) : (
                  <></>
                )}
                <EditorRecommendTitle
                  dangerouslySetInnerHTML={{ __html: EDITOR_TITLE }}
                />
              </SubEditorContainer>
              {filteredAndSortedEditorData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="editor"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/editor");
                  }}
                >
                  에디터 픽 아티클 더 알아보기
                </ServiceButton>
              </ButtonContainer>
              <SubContainer>
                <RecommendTitle
                  dangerouslySetInnerHTML={{ __html: RECOMMEND_TITLE }}
                />
                <CountdownTimer />
              </SubContainer>
              <SubRecommendTitle>
                <span>📌 유티클 투데이란? </span>
                유티클 AI 알고리즘을 통해 오늘 업로드된 {section} 영상 중 참여도
                높은 영상을 선정하여 자동 요약된 아티클로 제공합니다.
              </SubRecommendTitle>
              {filteredAndSortedData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="detail"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/");
                  }}
                >
                  유티클 투데이 더 알아보기
                </ServiceButton>
              </ButtonContainer>
            </>
          ) : (
            <>
              <SubContainer>
                <RecommendTitle
                  dangerouslySetInnerHTML={{ __html: RECOMMEND_TITLE }}
                />
                <CountdownTimer />
              </SubContainer>
              <SubRecommendTitle>
                <span>📌 유티클 투데이란? </span>
                <br />
                유티클 AI 알고리즘을 통해 오늘 업로드된 {section} 영상 중 참여도
                높은 영상을 선정하여 자동 요약된 아티클로 제공합니다.
              </SubRecommendTitle>
              {filteredAndSortedData.slice(0, 4).map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                return (
                  <RecommendCard
                    key={index}
                    icon={topicIcon}
                    path="detail"
                    source=""
                    {...item}
                  />
                );
              })}
              <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/");
                  }}
                >
                  유티클 투데이 더 알아보기
                </ServiceButton>
              </ButtonContainer>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default Recommend;

// Add the prop type for $isUnsubscribed
// const Container = styled.div<{ $isUnsubscribed: boolean }>`
//   margin-top: ${"100px"};
// `;

const SubContainer = styled.div`
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  padding-top: 32px;
  margin-top: 72px;
`;

const SubEditorContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const EditorRecommendTitle = styled.div`
  align-items: center;
  font-size: 16px;
  font-weight: 400;
  line-height: 132%;
  margin-left: 16px;
  .highlight {
    font-weight: 700;
    color: black;
  }
`;

const RecommendTitle = styled.div`
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 32px;
  line-height: 132%;
  .highlight {
    font-weight: 700;
    color: black;
  }
`;

const SubRecommendTitle = styled.div`
  font-size: 14px;
  margin-bottom: 32px;
  line-height: 132%;
  span {
    font-weight: 700;
  }
`;

const EditorImage = styled.img<{ isSelected: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-bottom: 8px;
  border: ${({ isSelected }) =>
    isSelected
      ? "2px solid #007bff"
      : "2px solid #ddd"}; /* 선택된 경우 파란색 테두리 */
  transition: border 0.3s ease-in-out;
`;

const ServiceButton = styled.button<{ $variant?: string }>`
  width: 100%;
  height: ${({ $variant }) =>
    $variant === "secondary"
      ? "52px"
      : $variant === "secondaryBlack"
      ? "60px"
      : "60px"};
  background-color: ${({ $variant }) =>
    $variant === "secondary"
      ? "#fff"
      : $variant === "secondaryBlack"
      ? "#000"
      : "#007bff"};
  color: ${({ $variant }) =>
    $variant === "secondary"
      ? "#007bff"
      : $variant === "secondaryBlack"
      ? "#fff"
      : "#fff"};
  border: ${({ $variant }) =>
    $variant === "secondary"
      ? "1px solid #007bff"
      : $variant === "secondaryBlack"
      ? ""
      : ""};
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  margin-top: ${({ $variant }) =>
    $variant === "secondary"
      ? "0px"
      : $variant === "secondaryBlack"
      ? "20px"
      : "0px"};
  margin-bottom: ${({ $variant }) =>
    $variant === "secondary"
      ? "20px"
      : $variant === "secondaryBlack"
      ? "20px"
      : "0px"};
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 100px;
`;
const Container = styled.div<{ $isUnsubscribed: boolean }>`
  margin: 24px auto;
  /* padding: 0 16px; */
  max-width: 500px;
`;

const Header = styled.div`
  /* background: #fff; */
  border-radius: 8px;
  padding: 32px 16px 8px 16px;
  display: flex;
  /* align-items: center; */
  justify-content: space-between;
  gap: 16px; // 아이템 간 간격 확보
  margin-bottom: 24px;
  /* box-shadow: -1px 2px 4px 4px rgba(0, 0, 0, 0.05); */
  /* flex 아이템이 최소 너비를 0으로 가질 수 있도록 해야 텍스트가 잘립니다 */
  min-width: 0;
  flex-direction: column;
  background: #f9f9f9;
`;

const SectionTitle = styled.h2`
  flex: 1 1 auto; // 남은 공간 모두 차지
  min-width: 240px; // flex-shrink 시 최소 너비 제한 해제+
  font-size: 18px;
  font-weight: 700;
  color: #222;
  white-space: nowrap; // 한 줄로 고정
  overflow: hidden;
  text-overflow: ellipsis; // 말줄임표 처리
`;

const TimerWrapper = styled.div`
  display: flex;
  flex-shrink: 0; // 크기가 줄어들지 않도록
  /* align-items: center; */
  gap: 8px;
  background: #f9f9f9;
  /* padding: 16px; */
  margin-top: 20px;
  border-radius: 8px;
  flex-direction: column;
`;

const TimerIcon = styled.span`
  font-size: 16px;
`;

const VideoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const VideoItem = styled.li`
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  /* border-bottom: 1px solid #eee; */
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
`;

const ThumbWrapper = styled.div`
  flex: 0 0 120px;
  margin-right: 12px;
  min-width: 148px;
`;

const Thumbnail = styled.img`
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 4px;
`;

// const Info = styled.div`
//   flex: 1;
// `;

const VideoTitle = styled.p`
  font-size: 16px;
  font-weight: 600;
  line-height: 1.32;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 6px;
`;

const Meta = styled.div`
  font-size: 13px;
  line-height: 1.32;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 최대 5줄 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(60, 60, 61);
  text-overflow: ellipsis;
`;

const MetricsContainer = styled.div`
  display: flex;
  /* padding: 8px;
  border-radius: 8px;
  min-width: 80px;
  margin-top: 12px; */
`;

const MetricBadge = styled.span<{ bg?: string; color?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${({ bg }) => bg};
  color: ${({ color }) => color};
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  /* margin-bottom: 8px; */
`;

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// 카드 하단 채널 정보 래퍼
const ChannelFooter = styled.div`
  display: flex;
  align-items: center;
  /* margin-top: auto;  */
  /* padding-top: 12px;
  border-bottom: 1px solid #eee; */
`;

const ChannelThumb = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
`;

const ChannelInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #222;
  line-height: 1.2;
`;

const ChannelMeta = styled.span`
  font-size: 12px;
  color: #666;
  line-height: 1.2;
  margin-top: 2px;
`;
const CommentSection = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  display: flex;
  align-items: center;
`;

const Comment = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between; /* 본문과 좋아요 카운트 사이 간격 확보 */
`;

const CommentIcon = styled.span`
  margin-right: 8px;
  font-size: 13px;
`;

const CommentText = styled.span`
  flex: 1; /* 본문이 길어져도 자리를 차지하도록 */
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  margin-right: 8px;

  /* ─── 2줄 클램프 ─── */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LikeCount = styled.span`
  font-size: 13px;
  color: #888;
`;

const Card = styled.li`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.08);
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
`;
