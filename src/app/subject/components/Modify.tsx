"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { useRouter } from "next/navigation";
import {
  fetchSubscribedSubjects,
  getUserByEmail,
  updateUserSubject,
  logCtaClick,
} from "@/api/apiClient";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { getOrCreateAnonId } from "@/utils/formatter";

/* ----------------------------- topics ----------------------------- */
const topics = [
  { name: "주식", icon: "📈" },
  { name: "부동산", icon: "🏢" },
  { name: "가상자산", icon: "💰" },
  { name: "경제", icon: "💵" },
  { name: "정치", icon: "🏛️" },
  { name: "비즈니스/사업", icon: "💼" },
  { name: "건강", icon: "🩺" },
  { name: "피트니스", icon: "🏋️" },
  { name: "연애/결혼", icon: "❤️" },
  { name: "육아", icon: "👶" },
  { name: "뷰티/메이크업", icon: "💄" },
  { name: "여자 패션", icon: "👗" },
  { name: "남자 패션", icon: "👔" },
  { name: "인공지능", icon: "🤖" },
  { name: "IT/테크", icon: "💻" },
  { name: "자동차", icon: "🚗" },
  { name: "요리", icon: "🍳" },
  { name: "여행", icon: "✈️" },
  // 필요 시 과학/역사 재오픈
  { name: "과학", icon: "🔬" },
  // { name: "역사", icon: "📜" },
];

/* ================================================================== */

const SubscriptionPage = () => {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const setUser = useSetRecoilState(userState);

  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  const [initialSubscribedSubjects, setInitialSubscribedSubjects] = useState<
    string[]
  >([]);
  const [unsubscribedTopics, setUnsubscribedTopics] =
    useState<{ name: string; icon: string }[]>(topics);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  const isAuthed = !!user?.email;

  /* --------------------------- prefetch home --------------------------- */
  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  /* -------------------------- load my subjects ------------------------- */
  useEffect(() => {
    const load = async () => {
      if (!user.email) {
        // 미로그인: 상단은 비우고 하단은 전체 키워드
        setSubscribedSubjects([]);
        setInitialSubscribedSubjects([]);
        setUnsubscribedTopics(topics);
        return;
      }
      const subs = await fetchSubscribedSubjects(user.email, user.name);
      setSubscribedSubjects(subs);
      setInitialSubscribedSubjects(subs);
      setUnsubscribedTopics(topics.filter((t) => !subs.includes(t.name)));
    };
    load();
  }, [user.email, user.name]);

  /* ------------------------------ actions ----------------------------- */
  const requireLogin = () => {
    setModalMessage("키워드 편집을 위해 구글 계정 연동이 필요해요!");
    setShowModal(true);
  };

  const handleRemoveTopic = (topic: string) => {
    if (!isAuthed) return;
    setSubscribedSubjects((prev) => prev.filter((t) => t !== topic));
    const removed = topics.find((t) => t.name === topic);
    if (removed) setUnsubscribedTopics((prev) => [...prev, removed]);
  };

  const handleAddTopic = (topic: string) => {
    if (!isAuthed) {
      requireLogin();
      return;
    }
    if (subscribedSubjects.includes(topic)) return;
    if (subscribedSubjects.length >= 3) {
      setModalMessage("⚠️ 최대 3개의 키워드만 구독할 수 있습니다.");
      setShowModal(true);
      return;
    }
    setSubscribedSubjects((prev) => [...prev, topic]);
    setUnsubscribedTopics((prev) => prev.filter((t) => t.name !== topic));
  };

  const handleConfirm = async () => {
    if (!isAuthed) {
      requireLogin();
      return;
    }
    if (subscribedSubjects.length < 3) {
      setModalMessage("⚠️ 3개의 주제를 선택해야 합니다.");
      setShowModal(true);
      return;
    }

    const newTopics = subscribedSubjects.filter(
      (t) => !initialSubscribedSubjects.includes(t)
    );
    const removedTopics = initialSubscribedSubjects.filter(
      (t) => !subscribedSubjects.includes(t)
    );

    if (newTopics.length === 0 && removedTopics.length === 0) {
      setModalMessage("변경된 구독 키워드가 없습니다.");
      setShowModal(true);
      return;
    }

    try {
      setIsUpdating(true);
      const me = await getUserByEmail(user.email!, user.name);
      for (let i = 0; i < newTopics.length; i++) {
        await updateUserSubject(me.id, removedTopics[i] || "", newTopics[i]);
      }
      setModalMessage(
        "구독 키워드가 성공적으로 업데이트되었습니다.\n내일부터 변경된 키워드가 반영된 브리핑을 이메일로 보내드릴게요."
      );
      setShowModal(true);
      setIsRouting(true);
      router.push("/");
    } catch (e) {
      console.error(e);
      setModalMessage(
        "주제를 업데이트하는 데 문제가 발생했습니다.\n다시 시도해 주세요."
      );
      setShowModal(true);
    } finally {
      setIsUpdating(false);
    }
  };

  /* -------------------------- login success --------------------------- */
  const handleLoginSuccess = async (gUser: {
    email: string;
    displayName: string;
    photoURL?: string;
  }) => {
    try {
      setShowModal(false);
      const me = await getUserByEmail(gUser.email, gUser.displayName);
      setUser({
        name: gUser.displayName,
        email: gUser.email,
        picture: gUser.photoURL ?? "",
        id: me.id,
      });
      const subs = await fetchSubscribedSubjects(
        gUser.email,
        gUser.displayName
      );
      setSubscribedSubjects(subs);
      setInitialSubscribedSubjects(subs);
      setUnsubscribedTopics(topics.filter((t) => !subs.includes(t.name)));
    } catch (e) {
      console.error(e);
      setModalMessage(
        "로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요."
      );
      setShowModal(true);
    }
  };

  const handleBack = () => {
    setIsRouting(true);
    router.push("/");
  };

  /* ------------------------------ labels ------------------------------ */
  const topTitle = isAuthed ? "내 키워드 (편집 중)" : "현재 구독 중인 키워드";
  const secondTitle = isAuthed
    ? "키워드 선택하기"
    : "유티클에서 브리핑중인 전체 키워드";
  const displayTopics = isAuthed ? unsubscribedTopics : topics;
  const canSubmit = isAuthed && subscribedSubjects.length === 3 && !isUpdating;

  /* ================================================================== */
  return (
    <Container>
      <LogoHeader onBack={handleBack} onBackHome={handleBack} />
      <Title>구독 키워드 변경</Title>
      <Subtitle>
        {isAuthed
          ? "현재 키워드를 해제/추가해 최대 3개까지 선택하세요. 저장하면 내일부터 반영됩니다."
          : "유티클이 브리핑 중인 키워드를 확인하고, 로그인 후 내 구독 키워드를 설정하세요."}
      </Subtitle>

      {/* 모달 */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowModal(false)}>×</ModalClose>
            <ModalMessage>{modalMessage}</ModalMessage>
            {(modalMessage.includes("로그인") ||
              modalMessage.includes("연동")) && (
              <GoogleWrap>
                <GoogleLogin onLoginSuccess={handleLoginSuccess} />
              </GoogleWrap>
            )}
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 섹션 A: 상단 (내 키워드) */}
      <Section bgColor="#EAF2FF">
        <SectionTitle>
          {topTitle} {isAuthed ? `(${subscribedSubjects.length}/3)` : ""}
        </SectionTitle>

        {!isAuthed ? (
          <InfoCard>
            <InfoTitle>구글 계정 연동이 필요해요</InfoTitle>
            <GoogleWrap>
              <GoogleLogin onLoginSuccess={handleLoginSuccess} />
            </GoogleWrap>
          </InfoCard>
        ) : subscribedSubjects.length === 0 ? (
          <EmptyCard>
            <EmptyTitle>선택된 키워드가 없어요</EmptyTitle>
            <EmptyDesc>
              아래에서 최대 <b>3개</b>를 선택해주세요.
            </EmptyDesc>
          </EmptyCard>
        ) : (
          <TopicContainer>
            {subscribedSubjects.map((topic) => (
              <Topic
                key={topic}
                selected
                onClick={() => handleRemoveTopic(topic)}
                role="button"
              >
                {topics.find((t) => t.name === topic)?.icon} {topic}
                <RemoveButton>해제</RemoveButton>
              </Topic>
            ))}
          </TopicContainer>
        )}
      </Section>

      {/* 섹션 B: 하단 (선택/브리핑 키워드) */}
      <Section bgColor="#F8F9FA">
        <SectionTitle>{secondTitle}</SectionTitle>
        <TopicContainer>
          {displayTopics.map((t) => (
            <Topic
              key={t.name}
              selected={subscribedSubjects.includes(t.name)}
              onClick={() => handleAddTopic(t.name)}
              role="button"
              aria-disabled={!isAuthed}
            >
              <TopicIcon>{t.icon}</TopicIcon> {t.name}
            </Topic>
          ))}
        </TopicContainer>
      </Section>

      {/* 하단 CTA */}
      <ButtonContainer>
        {isAuthed ? (
          <ConfirmButton
            disabled={!canSubmit}
            onClick={() => {
              logCtaClick(
                "confirm_channel_change",
                user?.id ?? null,
                user?.email ?? null,
                getOrCreateAnonId()
              );
              handleConfirm();
            }}
          >
            {isUpdating ? "업데이트 중..." : "변경하기"}
          </ConfirmButton>
        ) : (
          <ConfirmButton onClick={requireLogin}>
            구독중인 내 키워드 확인하기
          </ConfirmButton>
        )}
      </ButtonContainer>

      {/* 로딩/라우팅 오버레이 */}
      {isUpdating && (
        <Overlay role="status" aria-live="polite" aria-busy="true">
          <Spinner />
          <OverlayText>키워드 변경 반영 중…</OverlayText>
        </Overlay>
      )}
      {isRouting && (
        <RouteOverlay role="status" aria-live="polite" aria-busy="true">
          <RouteSpinner />
          <RouteText>브리핑 피드로 이동 중…</RouteText>
        </RouteOverlay>
      )}
    </Container>
  );
};

export default SubscriptionPage;

/* ============================== styles ============================== */

const Container = styled.div`
  text-align: center;
  padding-top: 80px;
  background-color: #fbfcff;
  font-family: "Pretendard Variable";
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-left: 16px;
  margin-right: 16px;
  line-height: 120%;
`;

const Subtitle = styled.div`
  font-size: 16px;
  margin-top: 8px;
  font-weight: 500;
  color: #555;
  margin: 20px;
  line-height: 130%;
`;

const Section = styled.div<{ bgColor: string }>`
  background-color: ${({ bgColor }) => bgColor};
  border-radius: 8px;
  padding: 20px;
  margin: 12px;
  margin-top: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
`;

const TopicContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const Topic = styled.div<{ selected?: boolean }>`
  background-color: ${({ selected }) => (selected ? "#D1E4FF" : "#f5f5f5")};
  color: ${({ selected }) => (selected ? "#1f2937" : "#111827")};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  transition: background-color 0.2s ease, color 0.2s ease;
  margin-top: 8px;

  &:hover {
    background-color: ${({ selected }) => (selected ? "#AAC4FF" : "#e9ecef")};
  }
`;

const RemoveButton = styled.span`
  font-size: 14px;
  color: #007bff;
  margin-left: 8px;
`;

const TopicIcon = styled.span`
  font-size: 18px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 15px;
`;

const ConfirmButton = styled.button<{ disabled?: boolean }>`
  background-color: #007bff;
  color: white;
  padding: 16px 20px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  width: 90%;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 100px;
  transition: background-color 0.2s ease, opacity 0.2s ease;

  &:hover {
    background-color: #0056b3;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* 모달 */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 88%;
  max-width: 420px;
  position: relative;
  text-align: center;
`;
const ModalClose = styled.button`
  position: absolute;
  top: 6px;
  right: 8px;
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #666;
`;
const ModalMessage = styled.p`
  font-size: 16px;
  font-weight: 600;
  white-space: pre-line;
  color: #111;
  margin: 6px 0 12px;
`;
const GoogleWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;
`;

/* 안내/빈 상태 카드 */
const InfoCard = styled.div`
  background: #f6faff;
  border: 1px solid #d9e8ff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
`;
const InfoTitle = styled.div`
  font-weight: 800;
  color: #0b63f6;
  margin-bottom: 6px;
`;
const EmptyCard = styled.div`
  background: #ffffff;
  border: 1px dashed #c7d7ff;
  border-radius: 12px;
  padding: 18px 16px;
`;
const EmptyTitle = styled.div`
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
`;
const EmptyDesc = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

/* 오버레이 */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #cfe2ff;
  border-top-color: #007bff;
  animation: spin 0.8s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
const OverlayText = styled.div`
  font-weight: 700;
  color: #0b1220;
  font-size: 14px;
`;

/* 라우팅 오버레이 */
const RouteOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;
const RouteSpinner = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid #cfe2ff;
  border-top-color: #007bff;
  animation: spin 0.8s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
const RouteText = styled.div`
  font-weight: 800;
  color: #0b1220;
  font-size: 14px;
`;
