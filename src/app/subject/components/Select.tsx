"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { formatDateKST } from "@/utils/briefingSlot";
import { useRouter } from "next/navigation";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { fetchSubscribedSubjects } from "@/api/apiClient"; // 구독 주제 가져오기 함수
import Loading from "@/assets/loading.svg";

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}
// 주제 목록 및 아이콘
const topics = [
  { name: "국내 주식", icon: "📈", description: "KOSPI·KOSDAQ 핵심 종목" },
  { name: "해외 주식", icon: "🌍", description: "미국·글로벌 증시 이슈" },
  { name: "국내 가상자산", icon: "🪙", description: "국내 거래소 트렌드" },
  { name: "해외 가상자산", icon: "🌐", description: "글로벌 거래·온체인" },
  { name: "부동산", icon: "🏢", description: "주요 지역 분양·시장" },
  { name: "경제", icon: "💵", description: "거시 지표와 경기 흐름" },
  { name: "정치", icon: "🏛️", description: "핵심 이슈·정책 요약" },
  { name: "비즈니스/사업", icon: "💼", description: "산업·경영 전략" },
  { name: "건강", icon: "🩺", description: "헬스케어 인사이트" },
  { name: "피트니스", icon: "🏋️", description: "운동 루틴·라이프스타일" },
  { name: "연애/결혼", icon: "❤️", description: "관계·커뮤니케이션" },
  { name: "육아", icon: "👶", description: "부모에게 필요한 정보" },
  { name: "뷰티/메이크업", icon: "💄", description: "신상 뷰티템 리뷰" },
  { name: "여자 패션", icon: "👗", description: "여성 패션·스타일링" },
  { name: "남자 패션", icon: "👔", description: "남성 패션·룩북" },
  { name: "인공지능", icon: "🤖", description: "AI 산업 트렌드" },
  { name: "IT/테크", icon: "💻", description: "테크 기업·제품 업데이트" },
  { name: "자동차", icon: "🚗", description: "전기차·모빌리티 이슈" },
  { name: "요리", icon: "🍳", description: "레시피·푸드 트렌드" },
  { name: "여행", icon: "✈️", description: "여행지 추천·플랜" },
  { name: "과학", icon: "🔬", description: "연구·우주·신기술" },
];

const benefitItems = [
  {
    icon: "🔔",
    title: "알림 채널 선택",
    description: "이메일 또는 카카오톡 중 원하는 경로로 받아보세요.",
  },
  {
    icon: "🧠",
    title: "관심 분야 인사이트",
    description: "TOP5 영상 근거를 엮어 핵심 흐름을 정리해 드려요.",
  },
  {
    icon: "🔁",
    title: "키워드 자유 변경",
    description: "관심사가 바뀌면 언제든지 키워드를 새로 고를 수 있어요.",
  },
];

const highlightPills = [
  {
    label: "✔ 이메일·카카오톡 수신",
    detail: "매일 아침 원하는 채널로 맞춤 브리핑",
  },
  {
    label: "✔ TOP5 기반 인사이트",
    detail: "영상 근거를 통합해 흐름을 해설",
  },
];

const KEYWORD_EXPANSION_MAP: Record<string, string[]> = {
  가상자산: ["국내 가상자산", "해외 가상자산"],
  국내가상자산: ["국내 가상자산", "해외 가상자산"],
  해외가상자산: ["국내 가상자산", "해외 가상자산"],
  crypto: ["국내 가상자산", "해외 가상자산"],
  주식: ["국내 주식", "해외 주식"],
  국내주식: ["국내 주식", "해외 주식"],
  해외주식: ["국내 주식", "해외 주식"],
  stocks: ["국내 주식", "해외 주식"],
};

const DEFAULT_BRIEFING_KEYWORDS = ["비즈니스/사업", "국내 주식", "부동산"];

const buildBriefingLandingHref = (keywords: string[]) => {
  const keywordList = keywords.length ? keywords : DEFAULT_BRIEFING_KEYWORDS;
  const params = new URLSearchParams();
  const generatedDate = formatDateKST(new Date()).replace(/-/g, "");
  if (generatedDate) {
    params.set("generated_date", generatedDate);
  }
  params.set("source", "email");
  const expandedSet = new Set<string>();
  keywordList.forEach((keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const normalized = trimmed.replace(/\s+/g, "");
    const expansion = KEYWORD_EXPANSION_MAP[normalized] ?? [trimmed];
    expansion.forEach((entry) => {
      if (entry && entry.trim().length > 0) {
        expandedSet.add(entry.trim());
      }
    });
  });
  if (expandedSet.size) {
    params.set("section", Array.from(expandedSet).join(", "));
  }
  return `/briefing/landing?${params.toString()}`;
};

const App = () => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [modalMessage, setModalMessage] = useState<string>(""); // 모달 메시지 상태
  const [showModal, setShowModal] = useState<boolean>(false); // 모달 표시 여부 상태
  const setUser = useSetRecoilState(userState);
  const user = useRecoilValue(userState);
  const [isLoading, setIsLoading] = useState<boolean>(false); // 로딩 상태 추가

  const router = useRouter();
  const [modalButtonLabel, setModalButtonLabel] =
    useState<string>("오늘의 브리핑 보기");
  const [briefingTargetHref, setBriefingTargetHref] =
    useState<string>("/today");
  const [modalDetail, setModalDetail] = useState<{
    primary?: string;
    secondary?: string;
  } | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    // URL에서 넘어온 section 값 가져오기
    const queryParams = new URLSearchParams(window.location.search);
    const section = queryParams.get("section");
    const videoId = queryParams.get("videoId");

    if (section && topics.some((topic) => topic.name === section)) {
      setSelectedTopics([section]); // 넘어온 section을 선택 상태로 설정
    }
    if (videoId) {
      setVideoId(videoId); // videoId 상태로 설정
    }
  }, []);

  useEffect(() => {
    if (!showModal) {
      setIsRedirecting(false);
      setModalDetail(null);
    }
  }, [showModal]);

  const handleTopicClick = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics([]);
      return;
    }
    setSelectedTopics([topic]);
  };

  const handleClearSelection = () => {
    setSelectedTopics([]);
  };

  const handleSubscribe = async () => {
    if (selectedTopics.length === 0) {
      setModalMessage("⚠️ 최소 1개의 키워드를 선택해주세요.");
      setModalDetail(null);
      setShowModal(true);
      return;
    }

    if (!user.email) {
      setModalMessage(
        "이메일로 브리핑을 받으려면 구글 계정 연결이 필요합니다.",
      );
      setModalDetail(null);
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getUserByEmail(user.email, user.name);
      console.log("구독 키워드 체크");
      const subscribedSubjects = await fetchSubscribedSubjects(
        user.email,
        user.name,
      );
      console.log(subscribedSubjects);
      if (subscribedSubjects.length > 0) {
        setBriefingTargetHref(buildBriefingLandingHref(selectedTopics));
        setModalMessage(
          "구독한 주제가 있습니다. <br/>오늘의 브리핑 페이지로 이동합니다.",
        );
        setModalButtonLabel("오늘의 브리핑 보기");
        setShowModal(true);
        setModalDetail(null);
        return;
      }

      for (const topic of selectedTopics) {
        const response = await fetch("https://youticle.shop/users/subject/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: data.id,
            subject_name: topic,
            article_id: videoId,
            channel: "email",
          }),
        });
        if (!response.ok) {
          throw new Error(`키워드 구독에 실패했습니다: ${topic}`);
        }
      }

      setModalMessage("구독 설정이 완료되었습니다!");
      setModalDetail({
        primary: "연결한 구글 이메일을 확인해 주세요.",
        secondary:
          "메일 발송까지 1-2분 정도 걸릴 수 있으며, 오늘 발송이 되지 않는다면 내일 오전 브리핑은 정상 확인 가능합니다.",
      });
      setModalButtonLabel("오늘의 브리핑 보기");
      setBriefingTargetHref(buildBriefingLandingHref(selectedTopics));
      setShowModal(true);
    } catch (error) {
      console.error("구독 처리 중 오류 발생:", error);
      setModalMessage("⚠️ 키워드 구독 처리 중 문제가 발생했습니다.");
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 유저 정보 최초 등록
  const createOrFetchUser = async (email: string, name: string) => {
    const url = `https://youticle.shop/users/${encodeURIComponent(email)}`;
    const localUrl = `http://0.0.0.0:8000/users/${encodeURIComponent(email)}`;

    try {
      const response = await fetch("https://youticle.shop/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log("유저 정보:", data);
      // // 키워드가 있다면 대기 페이지로 이동
      // getKeywordReportsForUser(data.id);
      return data;
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
    }
  };

  // 유저 정보 가져오기
  const getUserByEmail = async (
    email: string,
    name: string,
  ): Promise<{ id: number }> => {
    const url = `https://youticle.shop/users/${encodeURIComponent(email)}`;
    // const localUrl = `http://0.0.0.0:8000/users/${encodeURIComponent(email)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("User data:", data);
        return data;
      } else if (response.status === 404) {
        console.error("User not found. Creating new user...");
        // 새로운 유저 생성 로직
        const newUser = await createOrFetchUser(email, name);
        console.log("New user created:", newUser);
        return newUser;
      } else {
        console.error(`Error: ${response.status}, ${response.statusText}`);
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  };

  const handleLoginSuccess = async (user: User) => {
    setShowModal(false);
    if (user.email !== "") {
      // 사용자 정보 등록 및 가져오기
      const data = await getUserByEmail(user.email, user.displayName);

      // 주제 등록 및 구독 정보 확인
      const subscribedSubjects = await fetchSubscribedSubjects(
        user.email,
        user.displayName,
      );
      setUser({
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
        id: data.id,
      });

      if (subscribedSubjects.length > 0) {
        setModalMessage(
          "🙋 이미 구독 중인 키워드가 있어요.<br/>오늘의 브리핑 페이지로 이동합니다.",
        );
        setModalButtonLabel("오늘의 브리핑 보기");
        setBriefingTargetHref(buildBriefingLandingHref(selectedTopics));
        setModalDetail(null);
        setShowModal(true);
      } else {
        // 구독 주제가 없을 때 주제 등록
        setIsLoading(true); // 로딩 시작
        try {
          for (const subject of selectedTopics) {
            try {
              const response = await fetch(
                "https://youticle.shop/users/subject/",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    user_id: data.id, // 사용자 ID
                    subject_name: subject,
                    article_id: videoId,
                  }),
                },
              );

              if (!response.ok) {
                throw new Error(`Failed to add subject: ${subject}`);
              }

              const responseData = await response.json();
              console.log(`Subject ${subject} added for user:`, responseData);
            } catch (error) {
              console.error(`Error adding subject ${subject}:`, error);
            }
          }
          setModalMessage("구독 설정이 완료되었습니다!");
          setModalButtonLabel("오늘의 브리핑 보기");
          setBriefingTargetHref(buildBriefingLandingHref(selectedTopics));
          setModalDetail({
            primary: "연결한 구글 이메일을 확인해 주세요.",
            secondary:
              "메일 발송까지 1-2분 정도 걸릴 수 있으며, 오늘 발송이 되지 않는다면 내일 오전 브리핑은 정상 확인 가능합니다.",
          });
          setShowModal(true);
        } catch (error) {
          console.error("구독 처리 중 오류 발생:", error);
          setModalMessage("⚠️ 키워드 구독 처리 중 문제가 발생했습니다.");
          setShowModal(true);
        } finally {
          setIsLoading(false); // 로딩 종료
        }
      }
    }
  };
  const hasReachedLimit = selectedTopics.length >= 1;
  const isSelectionComplete = selectedTopics.length === 1;
  const selectionProgress = Math.min(selectedTopics.length / 1, 1);
  const primaryCtaLabel = isSelectionComplete
    ? "선택한 키워드로 무료 구독하기"
    : "키워드를 1개 선택해 주세요";

  const successMessageKeywords = [
    "구독 설정이 완료되었습니다",
    "구독한 주제가 있습니다",
    "이미 구독 중인 키워드",
  ];
  const isWarningModal = modalMessage.includes("⚠️");
  const isSuccessModal = successMessageKeywords.some((keyword) =>
    modalMessage.includes(keyword),
  );

  return (
    <PageWrapper>
      <LogoHeader />
      <MainContent>
        <IntroCard>
          <IntroTitle>관심 키워드 1개 선택</IntroTitle>
          <IntroDescription>
            관심 있는 분야를 고르면 TOP5 영상 근거를 엮어 만든{" "}
            <HighlightText>인사이트 브리핑</HighlightText>을 매일 아침{" "}
            <HighlightText>이메일 또는 카카오톡</HighlightText>으로 보내드려요.
          </IntroDescription>
          <BenefitList>
            {benefitItems.map((benefit) => (
              <BenefitItem key={benefit.title}>
                <BenefitIcon>{benefit.icon}</BenefitIcon>
                <BenefitCopy>
                  <strong>{benefit.title}</strong>
                  <span>{benefit.description}</span>
                </BenefitCopy>
              </BenefitItem>
            ))}
          </BenefitList>
        </IntroCard>

        <SelectionCard>
          <SelectionHeader>
            <SelectionTitle>선택한 키워드</SelectionTitle>
            {selectedTopics.length > 0 ? (
              <ClearButton type="button" onClick={handleClearSelection}>
                전체 해제
              </ClearButton>
            ) : null}
          </SelectionHeader>
          {selectedTopics.length > 0 ? (
            <ChipList>
              {selectedTopics.map((topic) => (
                <SelectionChip key={topic}>
                  <span>{topic}</span>
                  <ChipRemoveButton
                    type="button"
                    aria-label={`${topic} 제거`}
                    onClick={() => handleTopicClick(topic)}
                  >
                    ×
                  </ChipRemoveButton>
                </SelectionChip>
              ))}
            </ChipList>
          ) : (
            <SelectionEmpty>선택된 키워드가 없어요.</SelectionEmpty>
          )}
        </SelectionCard>

        <TopicSection>
          <TopicSectionTitle>관심 키워드 선택</TopicSectionTitle>
          <TopicGrid>
            {topics.map((topic) => {
              const isSelected = selectedTopics.includes(topic.name);
              const disabled = !isSelected && hasReachedLimit;
              return (
                <TopicCard
                  key={topic.name}
                  type="button"
                  onClick={() => handleTopicClick(topic.name)}
                  disabled={disabled}
                  $selected={isSelected}
                >
                  <TopicHeader>
                    <TopicIcon>{topic.icon}</TopicIcon>
                    <TopicName>{topic.name}</TopicName>
                  </TopicHeader>
                  <TopicDescription>{topic.description}</TopicDescription>
                </TopicCard>
              );
            })}
          </TopicGrid>
        </TopicSection>
      </MainContent>
      {/* // 모달 메시지에 따른 UI 렌더링 수정 */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowModal(false)}>×</ModalClose>
            {/* 모달 메시지와 메시지 타입에 따른 UI */}
            {isWarningModal ? (
              <WarningMessage>{modalMessage}</WarningMessage>
            ) : isSuccessModal ? (
              <>
                <InfoMessage
                  dangerouslySetInnerHTML={{ __html: modalMessage }}
                />
                {modalDetail ? (
                  <InfoDetailCard>
                    <strong>{modalDetail.primary}</strong>
                    {modalDetail.secondary ? (
                      <span>{modalDetail.secondary}</span>
                    ) : null}
                  </InfoDetailCard>
                ) : null}
                <ModalButton
                  disabled={isRedirecting}
                  onClick={() => {
                    setIsRedirecting(true);
                    router.push(briefingTargetHref);
                  }}
                >
                  {isRedirecting ? (
                    <LoadingSpinner>
                      <Loading />
                      <LoadingLabel>이동 중...</LoadingLabel>
                    </LoadingSpinner>
                  ) : (
                    modalButtonLabel || "오늘의 브리핑 보기"
                  )}
                </ModalButton>
              </>
            ) : (
              <>
                <InfoMessage>🙋 구글 계정 연결이 필요해요</InfoMessage>
                <InfoDescription>
                  <strong>
                    선택한 키워드의 브리핑을 이메일로 보내드리려면 구글 계정
                    연결이 필요합니다.
                  </strong>
                  <span>
                    연결 후에는 매일 아침 맞춤 브리핑을 이메일로 받아볼 수
                    있어요.
                  </span>
                </InfoDescription>
                <GoogleLogin onLoginSuccess={handleLoginSuccess} />
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
      <StickyCTA>
        <CTAButton
          type="button"
          onClick={handleSubscribe}
          disabled={!isSelectionComplete || isLoading}
        >
          {isLoading ? (
            <InlineSpinner>
              {/* <Loading aria-label="구독 요청 진행 중" /> */}
              <span>구독 요청 중...</span>
            </InlineSpinner>
          ) : (
            primaryCtaLabel
          )}
        </CTAButton>
        <CTAHelper>
          {isSelectionComplete
            ? "선택한 키워드의 맞춤 브리핑을 내일부터 보내드릴게요."
            : "관심 있는 키워드 하나만 골라도 맞춤형 브리핑을 만날 수 있어요."}
        </CTAHelper>
      </StickyCTA>
    </PageWrapper>
  );
};

// 스타일 정의
const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f5f7ff;
  font-family: "Pretendard Variable";
  display: flex;
  flex-direction: column;
  padding-bottom: 140px;
`;

const MainContent = styled.main`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const IntroCard = styled.section`
  background: linear-gradient(135deg, #f4f7ff 0%, #ffffff 85%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 52px;
`;

const StepLabel = styled.span`
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #2563eb;
`;

const IntroTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
`;

const IntroDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
`;

const HighlightText = styled.span`
  font-weight: 700;
  color: #111c4e;
`;
const HighlightPillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const HighlightPill = styled.div`
  flex: 1 1 230px;
  min-width: 0;
  background: #111c4e;
  color: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong {
    font-size: 13px;
  }
  span {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.85);
  }
`;

const ProgressTrack = styled.div`
  height: 0;
`;

const ProgressFill = styled.div`
  height: 0;
`;

const SelectionCard = styled.section`
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
`;

const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SelectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  color: #475569;
  text-decoration: underline;
  cursor: pointer;
`;

const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SelectionChip = styled.span`
  background: #eef2ff;
  color: #312e81;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const ChipRemoveButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
`;

const SelectionEmpty = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: #94a3b8;
`;

const TopicSection = styled.section`
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  box-shadow: inset 0 0 0 1px #eef2ff;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TopicSectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
`;

const TopicGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const TopicCard = styled.button<{ $selected: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? "#2563eb" : "#e2e8f0")};
  border-radius: 12px;
  padding: 12px;
  background: ${({ $selected }) => ($selected ? "#eff4ff" : "#fff")};
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TopicHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TopicIcon = styled.span`
  font-size: 18px;
`;

const TopicName = styled.span`
  font-weight: 700;
  color: #0f172a;
  font-size: 14px;
`;

const TopicDescription = styled.span`
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  text-align: left;
`;

const BenefitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BenefitItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  background: #f8faff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
`;

const BenefitIcon = styled.span`
  font-size: 16px;
  color: #2563eb;
`;

const BenefitCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong {
    font-size: 14px;
    color: #0f172a;
  }
  span {
    font-size: 12px;
    color: #475569;
  }
`;

const StickyCTA = styled.div`
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 560px;
  background: rgba(245, 247, 255, 0.95);
  border-top: 1px solid #e2e8f0;
  padding: 12px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CTAButton = styled.button`
  border: none;
  border-radius: 12px;
  background: #111c4e;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  padding: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const CTAHelper = styled.p`
  margin: 0;
  font-size: 12px;
  color: #475569;
  text-align: center;
`;

const LoadingSpinner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const LoadingLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const InlineSpinner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 20px;
`;

const ModalContent = styled.div`
  width: min(386px, 100%);
  border-radius: 20px;
  padding: 32px 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%);
  border: 1px solid #dce3f5;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
  position: relative;
  text-align: left;
`;

const InfoMessage = styled.h3`
  font-size: 19px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px;
`;

const InfoDescription = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 14.5px;
  color: #4b5563;
  line-height: 1.45;
`;

const InfoDetailCard = styled.div`
  background: #f8faff;
  border: 1px solid #e3ebff;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #475569;
  line-height: 1.45;
  margin-bottom: 12px;
  strong {
    font-size: 14px;
    color: #0f172a;
  }
`;

const ModalClose = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
`;

const ModalButton = styled.button`
  width: 100%;
  background: #2563eb;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  padding: 12px;
  cursor: pointer;
`;

const WarningMessage = styled.p`
  font-size: 14px;
  color: #dc2626;
  font-weight: 600;
`;

export default App;
