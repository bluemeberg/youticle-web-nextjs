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
      (item) => item.section === section && item.video_id !== videoId
    );
    const sortedData = filteredData.sort((a, b) => {
      // upload_date를 Date 객체로 변환 후 비교
      const dateA = new Date(a.upload_date).getTime();
      const dateB = new Date(b.upload_date).getTime();
      return dateB - dateA;
    });
    return sortedData;
  }, [editorVideos]);

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

  return (
    <Container $isUnsubscribed={isUnsubscribedSection}>
      {pathname.includes("/studio") ? (
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
                    path="studio"
                    source="editor"
                    {...item}
                  />
                );
              })}
              {/* <ButtonContainer>
                <ServiceButton
                  $variant="secondary"
                  onClick={() => {
                    router.push("/editor");
                  }}
                >
                  에디터 픽 아티클 더 알아보기
                </ServiceButton>
              </ButtonContainer> */}
            </>
          ) : (
            <></>
          )}
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
                path="studio"
                source="briefing"
                {...item}
              />
            );
          })}
          {/* <ButtonContainer>
            <ServiceButton
              $variant="secondary"
              onClick={() => {
                router.push("/");
              }}
            >
              유티클 투데이 더 알아보기
            </ServiceButton>
          </ButtonContainer> */}
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
const Container = styled.div<{ $isUnsubscribed: boolean }>`
  margin-top: ${"100px"};
`;

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
