"use client";

import React from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { EditorDataProps } from "@/types/dataProps";
import { EDITOR_YOUTUBE_TOPICS } from "@/constants/editorTopic";
import { timeAgo } from "../../utils/formatter";
import { off } from "process";
import TopicCard from "@/components/TopicCard";
import { YOUTUBE_TOPICS } from "@/constants/topic";
import EditorThumbnail from "./EditorThumbnail";
import AdminTopicCard from "./AdminTopicCard";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import AdminIntroduce from "./AdminIntroduce";
import VideoAutoArticleSection from "./videoComponents/VideoArticleSection";

interface EditorArticleProps {
  data: EditorDataProps[];
}

interface Editor {
  id: string;
  name: string;
  image: string;
  keywords: string[];
}
// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

const AdminArticleBeforeLogin = () => {
  const [isFixed, setIsFixed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const user = useRecoilValue(userState); // 로그인 여부 확인
  const [data, setData] = useState<EditorDataProps[]>([]);

  const editors: Editor[] = [
    {
      id: "1",
      name: "유썸 투자",
      image: "/images/유썸스톡.png",
      keywords: ["주식", "부동산", "가상자산"],
    },
    {
      id: "2",
      name: "유썸 비즈",
      image: "/images/유썸비즈.png",
      keywords: ["비즈니스/사업", "여행"],
    },
    {
      id: "3",
      name: "유썸 메디컬",
      image: "/images/유썸메디컬.png",
      keywords: ["건강", "뷰티/메이크업", "육아"],
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
      keywords: ["인공지능", "IT/테크"],
    },
  ];
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null);
  const [archiveData, setArchiveData] = useState<EditorDataProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/all/article`,
          {
            method: "GET",
            cache: "no-store",
          }
        );
        if (!response.ok) throw new Error("API request failed");

        const result = await response.json();
        setData(result);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        // setTimeout(() => setIsLoading(false), 5000);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const handleEditorScroll = () => {
      if (listRef.current) {
        const offsetTop = listRef.current.getBoundingClientRect().top;
        setIsFixed(offsetTop <= 52); // 고정 여부 업데이트
      }
    };
    window.addEventListener("scroll", handleEditorScroll);
    handleEditorScroll(); // 초기 실행

    return () => {
      window.removeEventListener("scroll", handleEditorScroll);
    };
  }, []);

  useEffect(() => {
    // 로그인된 상태에서 아카이브 데이터를 가져오는 로직
    if (user.email) {
      fetch(`${NEXT_PUBLIC_API_BASE_URL}/editor/admin/videos/${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setArchiveData(data);
          }
          setTimeout(() => setIsLoading(false), 500); // 로딩 후 애니메이션
        })
        .catch((error) => {
          console.error("Failed to fetch archive data:", error);
        });
    } else {
      // setTimeout(() => setIsLoading(false), 500);
    }
  }, [user]);

  // 데이터 필터링 로직
  const filteredData = useMemo(() => {
    const filtered =
      selectedEditor === null
        ? data
        : data.filter(
            (item) =>
              item.section &&
              editors.some(
                (editor) =>
                  editor.name === selectedEditor &&
                  editor.keywords.some((keyword) =>
                    item.section.includes(keyword)
                  )
              )
          );

    // 복사본 생성 후 정렬
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.article_date).getTime();
      const dateB = new Date(b.article_date).getTime();
      return dateB - dateA;
    });
  }, [selectedEditor, data]);

  // 최신순 정렬된 데이터
  const sortedFilteredData = useMemo(() => {
    return [...archiveData].sort((a, b) => {
      const dateA = new Date(a.article_date).getTime();
      const dateB = new Date(b.article_date).getTime();
      return dateB - dateA; // 최신순 정렬
    });
  }, [archiveData]);
  console.log(sortedFilteredData);
  // 탭 상태: 'feed' | 'archive'
  const [activeTab, setActiveTab] = useState<"all" | "archive" | "today">(
    "all"
  );
  // (A) 새 useEffect: user.email 변경 시, 로그아웃 판단 -> 탭 전환
  useEffect(() => {
    if (!user.email && activeTab === "archive") {
      // 로그아웃 되었고, 현재 탭이 archive면 => "all"로 돌림
      setActiveTab("all");
    }
  }, [user.email, activeTab]);
  // 'today' 탭에서 선택된 필터(키워드)
  const [selectedKeyword, setSelectedKeyword] = useState<string>("전체");
  console.log(activeTab);
  const TODAY_KEYWORDS = [
    { label: "전체", icon: "🌐" },
    { label: "주식", icon: "📈" },
    { label: "부동산", icon: "🏢" },
    { label: "가상자산", icon: "💰" },
    { label: "비즈니스/사업", icon: "🏭" },
    { label: "IT/테크", icon: "💻" },
    { label: "인공지능", icon: "🤖" },
    { label: "건강", icon: "⚕️" },
    { label: "연애/결혼", icon: "💒" },
    // ... 총 19개...
  ];

  return (
    <>
      {/* 탭 영역 */}
      {/* <AdminIntroduce /> */}
      <VideoAutoArticleSection />
      {/* 탭별 안내 문구 */}
      {activeTab === "all" && (
        <>
          <TabDescription>
            <FeedTitle>영상 아티클 생성 이력</FeedTitle>
            <Description>
              에디터가 작성/업로드한 아티클들이 표시됩니다.
            </Description>
          </TabDescription>
        </>
      )}

      {/* {activeTab === "today" && (
        <>
          <TabDescription>
            오늘 새로 업로드된 유튜브 영상을 기반으로 생성된 아티클 목록입니다.
          </TabDescription>
          <TodayFilterContainer>
            {TODAY_KEYWORDS.map((item) => {
              const isSelected = selectedKeyword === item.label;
              return (
                <TodayFilterItem
                  key={item.label}
                  isSelected={isSelected}
                  onClick={() => setSelectedKeyword(item.label)}
                >
                  <span style={{ marginRight: 4 }}>{item.icon}</span>
                  {item.label}
                </TodayFilterItem>
              );
            })}
          </TodayFilterContainer>
        </>
      )} */}
      {user.email !== "" &&
        archiveData.length > 0 &&
        activeTab === "archive" && (
          <ArchiveContainer>
            <ArchiveHeader>
              <UserThumbnail
                src={user.picture}
                alt={`${user.name} Thumbnail`}
              />
              <ArchiveTitle>{user.name}님의 아카이브</ArchiveTitle>
            </ArchiveHeader>

            {isLoading ? (
              <SkeletonContainer>
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </SkeletonContainer>
            ) : (
              <FadeInContainer>
                <ArchiveList>
                  {sortedFilteredData.map((item) => {
                    const topicIcon = YOUTUBE_TOPICS.find(
                      (topic) => topic.topic === item.section
                    )?.icon;
                    return (
                      <AdminTopicCard
                        key={item.video_id}
                        icon={topicIcon}
                        subjects={[]}
                        {...item}
                      />
                    );
                  })}
                </ArchiveList>
              </FadeInContainer>
            )}
          </ArchiveContainer>
        )}

      {activeTab === "all" && (
        <EditorContainer>
          {isLoading ? (
            <SkeletonContainer>
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </SkeletonContainer>
          ) : (
            <FadeInContainer>
              {filteredData.map((item, index) => {
                const topicIcon = YOUTUBE_TOPICS.find(
                  (topic) => topic.topic === item.section
                )?.icon;
                // item.section에 해당하는 에디터 찾기
                const editor = editors.find((editor) =>
                  editor.keywords.includes(item.section)
                );
                // editor가 존재하면 image를 가져오고, 없으면 기본 이미지 사용
                const editorImage = editor
                  ? editor.image
                  : "/images/default.png";
                return (
                  <div key={item.video_id}>
                    {/* 추가 이미지 컴포넌트 */}
                    <EditorThumbnail
                      image={editorImage}
                      name={editor?.name || "Unknown"}
                      date={item.article_date}
                    />
                    <AdminTopicCard
                      key={item.video_id}
                      icon={topicIcon}
                      subjects={[]}
                      {...item}
                    />
                  </div>
                );
              })}
            </FadeInContainer>
          )}
        </EditorContainer>
      )}

      {/* (3) 오늘의 아티클 */}
    </>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 48px;
  background-color: #ffffff;
  height: 100vh;
  /* &::-webkit-scrollbar {
    display: none;
  } */

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;

/** 🎨 애니메이션 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const FadeInContainer = styled.div`
  animation: ${fadeIn} 0.6s ease-in-out;
`;

/** 📌 상단 고정 애니메이션 */
const smoothFixed = keyframes`
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const TabContainer = styled.div`
  display: flex;
  /* 기존에 margin: 16px; 대신, 상단에 고정될 수 있도록
     혹은 다른 컴포넌트 바로 아래에 자연스럽게 붙도록 조정 */
  margin-top: 12px;
  border-bottom: 1px solid #e7e7e7; /* 탭 구분선 */
  background-color: #ffffff; /* 상단 바 배경 */
  animation: ${smoothFixed} 0.4s ease-in-out;
`;
/** 탭 클릭 시 짧은 안내문을 보여줄 스타일 */
const TabDescription = styled.div`
  padding: 8px 16px 0px 16px;
  font-size: 14px;
  background-color: #fafafa;
  /* border-bottom: 1px solid #eee; */
`;

const FeedTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-top: 12px;
`;
const Description = styled.p`
  font-size: 14px;
  color: #666;
  /* margin-bottom: 16px; */
  margin-top: 4px;
`;
const TabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 12px 0; /* 세로 패딩만 주어 버튼 형태로 보이게 */
  background: none;
  border: none;
  outline: none;
  cursor: pointer;

  /* 폰트, 색상 */
  font-size: 16px;
  font-weight: 600;
  color: ${({ isActive }) => (isActive ? "#007bff" : "#888")};

  /* 밑줄 인디케이터 */
  border-bottom: 3px solid
    ${({ isActive }) => (isActive ? "#007bff" : "transparent")};
  transition: color 0.2s ease, border-bottom 0.2s ease;

  &:hover {
    color: #007bff;
  }
`;
const EditorContainer = styled.div`
  /* margin-top: 6px; */
  background-color: #f9f9f9;
`;
const TodayFilterContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px;
  margin-top: 8px;
  scrollbar-width: none; /* firefox */
  -ms-overflow-style: none; /* IE/Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }
`;

const TodayFilterItem = styled.div<{ isSelected: boolean }>`
  min-width: 64px;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: ${({ isSelected }) => (isSelected ? "#007bff" : "#f4f6f8")};
  color: ${({ isSelected }) => (isSelected ? "#fff" : "#333")};
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  flex-shrink: 0; /* 가로 스크롤시 버튼 너비 고정 */
`;

const ArticleDate = styled.div`
  color: #494848;
  font-size: 14px;
  margin-bottom: 8px;
  margin-left: 4px;
`;

const EditorListContainer = styled.div.attrs(({ ref }) => ({ ref }))`
  background-color: #ffffff;
  position: relative; /* 부모 컨테이너의 기준점 설정 */
  margin-top: 12px;
`;

const EditorListContainerSub = styled.div`
  background-color: #f8f9fa;
  padding: 0;
`;

const EditorList = styled.div<{ isFixed: boolean }>`
  display: flex;
  gap: 10px;
  overflow-x: auto; /* 가로 스크롤 허용 */
  padding: 6px 12px 4px 12px;
  position: ${({ isFixed }) => (isFixed ? "fixed !important" : "relative")};
  top: ${({ isFixed }) => (isFixed ? "52px !important" : "auto")};
  width: ${({ isFixed }) => (isFixed ? "calc(100vw)" : "100%")};
  background-color: #fff;
  z-index: 10;
  max-width: 430px;
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 및 Edge */
  border-bottom: ${({ isFixed }) => (isFixed ? "1px solid #c4c4c4" : null)};
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }
`;

const EditorItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border: none; /* EditorItem 자체에는 테두리 제거 */
  transition: all 0.3s ease-in-out;
  min-width: 80px; /* 최소 너비 */
  flex-shrink: 0; /* 스크롤 시 아이템이 줄어들지 않도록 설정 */
`;

const EditorImage = styled.img<{ isSelected: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-bottom: 8px;
  border: ${({ isSelected }) =>
    isSelected
      ? "2px solid #007bff"
      : "2px solid #ddd"}; /* 선택된 경우 파란색 테두리 */
  transition: border 0.3s ease-in-out;
  image-rendering: crisp-edges;
  object-fit: cover;*/
`;

const EditorName = styled.span<{ isSelected: boolean }>`
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${({ isSelected }) =>
    isSelected
      ? "rgba(0, 123, 255, 1)"
      : "transparent"}; /* 선택된 경우 배경색 변경 */
  color: ${({ isSelected }) =>
    isSelected ? "white" : "black"}; /* 선택된 경우 배경색 변경 */
  transition: background-color 0.3s ease-in-out;
`;

const ArchiveContainer = styled.div`
  margin-top: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
`;

const ArchiveTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #333;
`;

const ArchiveList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ArchiveCard = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
`;

const Thumbnail = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 4px;
  object-fit: cover;
`;

const ArchiveInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ArchiveDate = styled.span`
  font-size: 12px;
  color: #777;
`;
const ArchiveHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  margin-left: 12px;
  margin-top: 12px;
`;

const UserThumbnail = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
`;

/** 💠 Skeleton UI */
const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`;

/** 💡 Shimmer 효과 */
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonCard = styled.div`
  width: 100%;
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
`;

export default AdminArticleBeforeLogin;
