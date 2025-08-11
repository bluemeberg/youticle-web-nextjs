"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";
import LogoHeader from "@/common/LogoHeader";
import { useRouter } from "next/navigation";

// --- (옵션) 기존 API 클라이언트들: 기존 구독 확인용만 사용 ---
import {
  getUserByEmail as getUserByEmailFromClient, // 이메일로 유저 조회/생성
  fetchSubscribedSubjects, // 기존 구독 키워드 확인용(배열)
} from "@/api/apiClient";

/* =========================================================
 * 1) 상수/타입
 * =======================================================*/
type KeywordOption = {
  id: string;
  label: string;
  emoji: string;
  category: "재테크" | "비즈" | "사회" | "라이프" | "IT" | "학습";
  popular?: boolean;
};

const ALL_KEYWORDS: KeywordOption[] = [
  {
    id: "stocks",
    label: "주식",
    emoji: "📈",
    category: "재테크",
    popular: true,
  },
  {
    id: "estate",
    label: "부동산",
    emoji: "🏢",
    category: "재테크",
    popular: true,
  },
  { id: "crypto", label: "가상자산", emoji: "🪙", category: "재테크" },
  {
    id: "economy",
    label: "경제",
    emoji: "💵",
    category: "비즈",
    popular: true,
  },
  { id: "biz", label: "비즈니스/사업", emoji: "💼", category: "비즈" },
  { id: "politic", label: "정치", emoji: "🏛️", category: "사회" },
  { id: "health", label: "건강", emoji: "🩺", category: "라이프" },
  { id: "fitness", label: "피트니스", emoji: "🏋️", category: "라이프" },
  { id: "love", label: "연애/결혼", emoji: "❤️", category: "라이프" },
  { id: "kids", label: "육아", emoji: "👶", category: "라이프" },
  { id: "beauty", label: "뷰티/메이크업", emoji: "💄", category: "라이프" },
  { id: "wstyle", label: "여자 패션", emoji: "👗", category: "라이프" },
  { id: "mstyle", label: "남자 패션", emoji: "👔", category: "라이프" },
  { id: "ai", label: "인공지능", emoji: "🤖", category: "IT", popular: true },
  { id: "it", label: "IT/테크", emoji: "💻", category: "IT" },
  { id: "auto", label: "자동차", emoji: "🚗", category: "라이프" },
  { id: "cook", label: "요리", emoji: "🍳", category: "라이프" },
  { id: "travel", label: "여행", emoji: "✈️", category: "라이프" },
  { id: "science", label: "과학", emoji: "🔬", category: "학습" },
  { id: "history", label: "역사", emoji: "📜", category: "학습" },
];

// id -> API에 넘길 subject_name(=label 한글명) 매핑
const SUBJECT_NAME_BY_ID = ALL_KEYWORDS.reduce<Record<string, string>>(
  (acc, k) => {
    acc[k.id] = k.label;
    return acc;
  },
  {}
);

/** 베네핏: 모바일 친화 배열 설명형 */
const BENEFITS = [
  {
    icon: "⚡",
    title: "핵심 5줄, 5분 컷",
    desc: "긴 영상 대신 결론과 근거만 요약해 드려요. 회의 전 필요한 논점만 빠르게 파악하고 시간을 절약하세요.",
  },
  {
    icon: "🧭",
    title: "검색 피로 제로",
    desc: "매일 수백 개 영상 중 노이즈를 제거하고 데이터로 선별한 TOP5만 전달합니다. 썸네일/제목 낚시에서 벗어나세요.",
  },
  {
    icon: "⚖️",
    title: "편향 없이 균형",
    desc: "국내·해외 채널을 교차 검증해 한쪽 관점에 치우치지 않게 큐레이션합니다. 서로 다른 시각을 한 번에 비교하세요.",
  },
  {
    icon: "💬",
    title: "바로 쓰는 인사이트",
    desc: "댓글/쟁점까지 정리해 액션 포인트로 연결합니다. 투자/업무/학습에 바로 적용 가능한 요약만 담습니다.",
  },
  {
    icon: "🔔",
    title: "매일 7시, 자동 도착",
    desc: "아침에 생각의 연료를 채워드립니다. 놓치지 않도록 자동 아카이브까지 제공해 나중에 다시 찾아보기 편해요.",
  },
  {
    icon: "✅",
    title: "키워드 맞춤",
    desc: "내가 고른 주제만 받아 집중력을 지킵니다. 관심 밖 콘텐츠로 흐트러지지 않게 ‘정보 다이어트’를 돕습니다.",
  },
];

/* =========================================================
 * 2) 페이지 컴포넌트
 * =======================================================*/
export default function SubscribePage() {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const setUser = useSetRecoilState(userState);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  // 선택: 정책상 1개만
  const [selected, setSelected] = useState<string | null>(null);

  // 기존 구독 목록(있으면 교체 안내)
  const [existing, setExisting] = useState<string[]>([]);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // 모달/로딩
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 비디오 제어
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // URL로부터 videoId (있으면 함께 전송)
  const [videoId, setVideoId] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const vid = p.get("videoId");
    if (vid) setVideoId(vid);
  }, []);

  // 기존 구독 불러오기 (로그인 시)
  useEffect(() => {
    if (!user.id) return;
    (async () => {
      try {
        const res = await fetchSubscribedSubjects(user.email, user.name);
        setExisting(res || []);
      } catch {
        setExisting([]);
      }
    })();
  }, [user.id]);

  // 히어로 사라지면 스티키 CTA 노출
  useEffect(() => {
    if (!heroRef.current) return;
    const io = new IntersectionObserver(
      (entries) => setShowSticky(!entries[0].isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(heroRef.current);
    return () => io.disconnect();
  }, []);
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    // 브리핑 피드 경로가 "/"라고 가정
    router.prefetch("/");
  }, [router]);
  const goFeed = () => {
    setIsRouting(true); // 오버레이 즉시 표시
    router.push("/"); // 피드로 이동
  };
  // 프리뷰 비디오: 보일 때만 재생
  useEffect(() => {
    if (!previewRef.current || !videoRef.current) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;
    const io = new IntersectionObserver(
      (entries) => {
        const inView = entries[0].isIntersecting;
        const v = videoRef.current!;
        if (inView) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(previewRef.current);
    return () => io.disconnect();
  }, []);

  // 선택 토글(정확히 1개만 유지)
  const toggle = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
  };

  const openPicker = () => setPickerOpen(true);
  // 기존 구독 안내 모달
  const [showExistingInfo, setShowExistingInfo] = useState(false);
  // --- 핵심: 구독 처리 함수(최초 포함) ---
  const subscribeWithApi = async (subjectId: string) => {
    console.log("로그인 정보 확인", user);
    if (!user.id || !user.email) throw new Error("로그인 정보가 없습니다.");
    const subjectName = SUBJECT_NAME_BY_ID[subjectId] ?? subjectId;

    // ✅ 제공해주신 '최초 구독' 코드 그대로 사용 (정책상 1개지만 그대로 안전하게 loop)
    for (const topic of [subjectName]) {
      const response = await fetch("https://youticle.shop/users/subject/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          subject_name: topic,
          article_id: videoId,
        }),
      });
      if (!response.ok) {
        throw new Error(`키워드 구독에 실패했습니다: ${topic}`);
      }
      // console.log(`키워드 ${topic} 구독 완료.`);
    }
  };

  // 로그인 모달에서 구글 로그인 처리
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const data = await getUserByEmailFromClient(
        result.user.email!,
        result.user.displayName || "User"
      );

      setUser({
        name: result.user.displayName || "",
        email: result.user.email || "",
        picture: result.user.photoURL || "",
        id: data.id,
      });

      setShowAuthModal(false);
      // 로그인 완료 후 구독 이어서 진행
      const res = await fetchSubscribedSubjects(
        result.user.email || "",
        result.user.displayName || ""
      );
      console.log(res);
      // 기존 구독 존재 시 교체 확인
      if (res.length) {
        setShowExistingInfo(true); // 안내 모달
        return;
      }
      if (selected) {
        await proceedSubscribe(selected);
      }
    } catch (e) {
      alert(
        "로그인에 실패했어요. Safari/Chrome 등 외부 브라우저에서 다시 시도해 주세요."
      );
    }
  };

  // 구독 버튼 핸들러
  const handleSubscribe = async () => {
    if (!selected) return alert("키워드를 1개 선택해 주세요.");
    if (/KAKAOTALK/i.test(navigator.userAgent)) {
      alert(
        "카카오톡 인앱 브라우저에서는 Google 로그인이 동작하지 않을 수 있어요. Safari/Chrome 등 외부 브라우저에서 다시 시도해 주세요."
      );
      return;
    }
    if (!user.id || !user.email) {
      // 미로그인 → 모달 열기
      setShowAuthModal(true);
      return;
    }
    // 기존 구독 존재 시 교체 확인
    if (existing.length && !existing.includes(selected)) {
      setShowExistingInfo(true);
      return;
    }
    await proceedSubscribe(selected);
  };

  // 실제 구독 처리(공통)
  const proceedSubscribe = async (subjectId: string) => {
    try {
      setLoading(true);
      await subscribeWithApi(subjectId);
      alert("구독이 완료되었습니다! 오늘의 아티클로 이동합니다.");
      router.push("/"); // 완료 후 홈/피드 이동
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "구독 처리 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
      setPickerOpen(false);
      setShowReplaceConfirm(false);
    }
  };

  /* ====================== render ======================*/
  return (
    <Page>
      <LogoHeader />
      {/* HERO */}
      <Hero ref={heroRef}>
        <HeroInner>
          <HeroTitle>
            <HeroTitleSub>매일 아침, 내가 고른 키워드로</HeroTitleSub>
            유튜브 TOP5 최신 영상 <br />
            핵심 내용 브리핑 받으세요.
          </HeroTitle>
          <HeroDesc>
            양질의 영상을 하루 다섯 개, <br />
            <b>5분 안에</b> 핵심만 전해드립니다. <br />
            <span className="muted"> (이메일 · 카카오톡)</span>
          </HeroDesc>

          <USPChips role="list" aria-label="핵심 장점">
            <USPPill role="listitem">TOP5 영상 선별</USPPill>
            <USPPill role="listitem">핵심 요약</USPPill>
            <USPPill role="listitem">매일 브리핑</USPPill>
          </USPChips>

          <HeroActions>
            <PrimaryBtn
              onClick={openPicker}
              aria-label="키워드 고르고 구독 시작"
            >
              키워드 고르고 즉시 브리핑받기
            </PrimaryBtn>
          </HeroActions>

          <HeroMeta>
            <SubLink>
              이미 구독 중이신가요?{" "}
              <a onClick={() => setShowAuthModal(true)}>로그인</a>
            </SubLink>
          </HeroMeta>
        </HeroInner>
      </Hero>

      {/* 프리뷰 섹션 */}
      <Section>
        <SectionTitle>📨 오늘 이렇게 도착해요</SectionTitle>
        <Sub>실제 브리핑 예시입니다. 형식과 밀도만 확인해 보세요.</Sub>

        <HeroVideoWrapper ref={previewRef}>
          <Video
            ref={videoRef}
            preload="metadata"
            muted
            autoPlay
            loop
            playsInline
            aria-label="브리핑 영상 예시"
            controls
            controlsList="nodownload"
            disablePictureInPicture
          >
            <source src="/videos/유티클브리핑_250810_up.mp4" type="video/mp4" />
            브라우저가 동영상을 지원하지 않습니다.
          </Video>
        </HeroVideoWrapper>

        <ExamplePoints>
          <li>영상 5개 × 각 5줄 핵심 요약</li>
          <li>쟁점/댓글 요약과 참고 링크 제공</li>
        </ExamplePoints>

        <SecondaryBtn onClick={openPicker}>키워드 골라서 받아보기</SecondaryBtn>
      </Section>

      {/* 베네핏 */}
      <Section>
        <SectionTitle>왜 ‘오늘의 TOP5 영상 브리핑’인가?</SectionTitle>
        <Sub>정보 과잉에서 결정까지, 필요한 건 단 5분.</Sub>

        <BenefitsList>
          {BENEFITS.map((b) => (
            <BenefitItem key={b.title}>
              <TitleRow>
                <Icon aria-hidden>{b.icon}</Icon>
                <BTitle>{b.title}</BTitle>
              </TitleRow>
              <BDesc>{b.desc}</BDesc>
            </BenefitItem>
          ))}
        </BenefitsList>
      </Section>

      {/* Sticky CTA */}
      {showSticky && (
        <StickyBar>
          <StickyBtn onClick={openPicker}>키워드 선택하고 시작하기</StickyBtn>
        </StickyBar>
      )}

      {/* 키워드 선택 모달 (1개 선택 정책) */}
      {pickerOpen && (
        <Modal onClick={() => setPickerOpen(false)} aria-modal>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>키워드 선택하기</ModalTitle>
              <ModalSub>정확히 1개 선택</ModalSub>
            </ModalHeader>

            <ModalBody>
              {/* 인기 먼저 */}
              <PopularRow>
                <PopularTitle>인기 키워드</PopularTitle>
                <PopularChips>
                  {ALL_KEYWORDS.filter((k) => k.popular).map((k) => {
                    const active = selected === k.id;
                    return (
                      <KeywordChip
                        key={k.id}
                        data-active={String(active)}
                        onClick={() => toggle(k.id)}
                        aria-pressed={active}
                        title={k.category}
                      >
                        <span>{k.emoji}</span>
                        {k.label}
                      </KeywordChip>
                    );
                  })}
                </PopularChips>
              </PopularRow>

              {/* 전체 그룹 */}
              <Grouped>
                {(
                  ["재테크", "비즈", "사회", "IT", "라이프", "학습"] as const
                ).map((cat) => (
                  <Group key={cat}>
                    <GroupTitle>{cat}</GroupTitle>
                    <KeywordGrid>
                      {ALL_KEYWORDS.filter((k) => k.category === cat).map(
                        (k) => {
                          const active = selected === k.id;
                          return (
                            <KeywordChip
                              key={k.id}
                              data-active={String(active)}
                              onClick={() => toggle(k.id)}
                              aria-pressed={active}
                            >
                              <span>{k.emoji}</span>
                              {k.label}
                            </KeywordChip>
                          );
                        }
                      )}
                    </KeywordGrid>
                  </Group>
                ))}
              </Grouped>
            </ModalBody>

            <ModalActions>
              <Cancel onClick={() => setPickerOpen(false)}>취소</Cancel>
              <Primary
                disabled={!selected || loading}
                onClick={handleSubscribe}
              >
                {loading ? "저장 중..." : "이 키워드로 구독 시작"}
              </Primary>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}

      {/* 기존 구독 교체 확인 모달 */}
      {showReplaceConfirm && (
        <Modal onClick={() => setShowReplaceConfirm(false)} aria-modal>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>기존 구독을 새 키워드로 바꿀까요?</ModalTitle>
            <ModalSub>정책상 한 번에 1개의 키워드만 구독할 수 있어요.</ModalSub>
            <ModalActions>
              <Cancel onClick={() => setShowReplaceConfirm(false)}>취소</Cancel>
              <Primary
                disabled={!selected || loading}
                onClick={() => selected && proceedSubscribe(selected)}
              >
                {loading ? "저장 중..." : "바꾸고 구독"}
              </Primary>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}

      {/* 구글 로그인 모달 */}
      {showAuthModal && (
        <Modal onClick={() => setShowAuthModal(false)} aria-modal>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>로그인이 필요합니다</ModalTitle>
            <ModalSub>
              이메일로 브리핑을 전달해 드리기 위해 Google 로그인이 필요해요.
            </ModalSub>
            <ModalActions>
              <Cancel onClick={() => setShowAuthModal(false)}>닫기</Cancel>
              <Primary onClick={handleGoogleSignIn}>Google로 계속</Primary>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}

      {/* 기존 구독 안내 모달 */}
      {showExistingInfo && (
        <Modal onClick={() => setShowExistingInfo(false)} aria-modal>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>이미 구독 중인 키워드가 있어요</ModalTitle>

            <ExistingWrap>
              <ExistingLabel>현재 구독 키워드</ExistingLabel>
              {(() => {
                // 라벨(예: "주식") 또는 id(예: "stocks") 어느 쪽이 와도 매칭
                const asKeyword = (name: string) =>
                  ALL_KEYWORDS.find((k) => k.label === name) ||
                  ALL_KEYWORDS.find((k) => k.id === name);

                // 중복 제거 → 키워드 객체로 매핑 → 유효항목만 필터
                const uniq = Array.from(new Set(existing || []));
                const items = uniq
                  .map(asKeyword)
                  .filter(Boolean) as typeof ALL_KEYWORDS;

                if (items.length === 0) {
                  return <ExistingPill data-empty>알 수 없음</ExistingPill>;
                }

                const shown = items.slice(0, 3);
                const more = items.length - shown.length;

                return (
                  <PillList>
                    {shown.map((k) => (
                      <ExistingPill key={k.id}>
                        <span className="emoji">{k.emoji}</span>
                        <span className="text">{k.label}</span>
                      </ExistingPill>
                    ))}
                    {more > 0 && <MoreBadge>+{more}</MoreBadge>}
                  </PillList>
                );
              })()}
            </ExistingWrap>

            <InfoNote>
              지금은 구독 키워드 변경 없이 <b>브리핑 피드</b>로 안내드릴게요.
              <br />
              (키워드는 마이페이지에서 언제든 변경할 수 있어요)
            </InfoNote>

            <ModalActions>
              <Primary onClick={goFeed}>브리핑 피드로 이동</Primary>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}
      {isRouting && (
        <RouteOverlay role="status" aria-live="polite" aria-busy="true">
          <Spinner />
          <RouteText>브리핑 불러오는 중… 잠시만요</RouteText>
        </RouteOverlay>
      )}
    </Page>
  );
}

/* =========================================================
 * 3) 스타일
 * =======================================================*/
const Page = styled.div`
  background: #f7f9fc;
  min-height: 100vh;
  padding-bottom: 96px;
  font-family: system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR",
    "Pretendard Variable", sans-serif;
`;

/* ---------- Common Sections ---------- */
const Section = styled.section`
  padding: 18px 16px 6px;
  margin-top: 40px;
  text-align: center;
`;
const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #0b1220;
  margin-bottom: 10px;
`;
const Sub = styled.p`
  font-size: 13px;
  color: #556070;
  margin-top: -4px;
  margin-bottom: 10px;
`;

const ExamplePoints = styled.ul`
  margin: 10px auto 14px;
  max-width: 420px;
  padding-left: 18px;
  color: #4b5563;
  font-size: 13px;
  text-align: left;
  li + li {
    margin-top: 4px;
  }
`;

/* ---------- Benefits (모바일 1열 리스트) ---------- */
const BenefitsList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 10px;
  padding: 0;
  list-style: none;
`;
const BenefitItem = styled.li`
  background: #fff;
  border: 1px solid #e8eef7;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
`;
const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
`;
const Icon = styled.div`
  font-size: 16px;
  line-height: 1;
`;
const BTitle = styled.div`
  font-weight: 800;
  color: #0b1220;
  font-size: 16px;
  line-height: 1.3;
`;
const BDesc = styled.p`
  margin: 6px 0 0;
  color: #445063;
  font-size: 14px;
  line-height: 1.3;
  text-align: left;
`;

/* ---------- Sticky CTA ---------- */
const StickyBar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  z-index: 20;
`;
const StickyBtn = styled.button`
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #0d6efd;
  color: #fff;
  font-weight: 800;
  font-size: 16px;
`;

/* ---------- Modal ---------- */
const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  padding: 12px;
  z-index: 50;
`;
const ModalBox = styled.div`
  width: min(640px, 100%);
  max-height: calc(100svh - 160px);
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8eef7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
`;
const ModalHeader = styled.div`
  padding: 14px 14px 8px;
  border-bottom: 1px solid #f0f3f8;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
`;
const ModalBody = styled.div`
  overflow: auto;
  padding: 12px 14px 4px;
  -webkit-overflow-scrolling: touch;
  min-height: 496px;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid #f0f3f8;
  background: #fff;
  position: sticky;
  bottom: 0;
  z-index: 1;
`;
const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 800;
  color: #0b1220;
`;
const ModalSub = styled.p`
  font-size: 13px;
  color: #556070;
  margin-top: 4px;
`;

/* ---------- 키워드 그리드 ---------- */
const PopularRow = styled.div`
  margin-top: 6px;
`;
const PopularTitle = styled.div`
  font-size: 12px;
  color: #748094;
  margin-bottom: 6px;
`;
const PopularChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;
const Grouped = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 10px;
`;
const GroupTitle = styled.h4`
  font-size: 12px;
  font-weight: 800;
  margin: 6px 0;
  color: #0b1220;
`;
const Group = styled.div``;
const KeywordGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  @media (min-width: 560px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
`;
const KeywordChip = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d4e2ff;
  background: #fff;
  color: #0b1220;
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
  transition: transform 0.05s ease, box-shadow 0.15s ease;

  &[data-active="true"] {
    background: #0d6efd;
    color: #fff;
    border-color: #0d6efd;
    box-shadow: 0 6px 18px rgba(13, 110, 253, 0.16);
  }
  span {
    font-size: 16px;
    line-height: 1;
  }
`;

/* ---------- Hero ---------- */
const Hero = styled.section`
  background: linear-gradient(180deg, #eaf3ff 0%, #f7f9fc 100%);
  padding: 28px 16px 18px;
  margin-top: 44px;
`;
const HeroInner = styled.div`
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
`;
const HeroTitle = styled.h1`
  margin: 10px 0 16px;
  font-weight: 900;
  color: #0b1220;
  line-height: 1.18;
  font-size: clamp(22px, 4.8vw, 26px);
  letter-spacing: -0.2px;
`;
const HeroTitleSub = styled.span`
  display: block;
  margin-top: 4px;
  margin-bottom: 8px;
  color: #334155;
  font-weight: 800;
  font-size: clamp(16px, 3.6vw, 18px);
  letter-spacing: -0.15px;
`;
const HeroDesc = styled.p`
  margin: 6px 0 20px;
  color: #4a5568;
  font-size: 14px;
  line-height: 1.45;
  .muted {
    color: #6b7586;
    font-weight: 600;
  }
`;
const USPChips = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: 6px 0 12px;
`;
const USPPill = styled.span`
  display: inline-block;
  font-size: 12px;
  color: #0d6efd;
  background: #eaf3ff;
  border-radius: 999px;
  padding: 4px 8px;
  font-weight: 700;
`;
const HeroActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
`;
const HeroMeta = styled.div`
  display: grid;
  gap: 6px;
  justify-items: center;
`;
const SubLink = styled.div`
  font-size: 14px;
  margin-top: 4px;
  color: #666;
  font-weight: 700;
  a {
    color: #007bff;
    cursor: pointer;
  }
`;

/* ---------- Buttons ---------- */
const SecondaryBtn = styled.button`
  padding: 10px 12px;
  border-radius: 10px;
  background: #f3f5f9;
  color: #0b1220;
  font-weight: 800;
  border: none;
  cursor: pointer;
`;
const PrimaryBtn = styled.button`
  background: #007bff;
  color: #fff;
  font-weight: 800;
  border: 0;
  border-radius: 8px;
  padding: 14px 18px;
  min-width: 240px;
  width: 100%;
  font-size: 16px;
  cursor: pointer;
  &:active {
    transform: translateY(1px);
  }
`;
const Cancel = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #f3f5f9;
  color: #0b1220;
  font-weight: 800;
  border: none;
`;
const Primary = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #0d6efd;
  color: #fff;
  font-weight: 800;
  border: none;
  &:disabled {
    opacity: 0.5;
  }
`;

/* ---------- Video ---------- */
const HeroVideoWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 14px 0 10px;
`;
const Video = styled.video`
  width: min(640px, 90%);
  aspect-ratio: 9 / 16;
  background: #000;
  border-radius: 40px 40px 4px 4px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
  outline: none;
`;
const ExistingWrap = styled.div`
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 12px 0 4px;
`;

const ExistingLabel = styled.div`
  font-size: 12px;
  color: #748094;
`;

const ExistingPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  border: 1px solid #e2e8f0;
  background: #f8fafc;

  &[data-empty] {
    color: #94a3b8;
    background: #f1f5f9;
    border-color: #e2e8f0;
  }

  .emoji {
    font-size: 16px;
    line-height: 1;
  }
  .text {
    font-size: 13px;
  }
`;

const InfoNote = styled.p`
  margin: 10px 14px 0;
  text-align: center;
  color: #475569;
  font-size: 13px;
  line-height: 1.45;
`;

const PillList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const MoreBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eff3f9;
  color: #4b5563;
  font-weight: 800;
  font-size: 12px;
  border: 1px solid #e2e8f0;
`;
const RouteOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  place-items: center;
  gap: 12px;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid #cfe2ff;
  border-top-color: #0d6efd;
  animation: ${spin} 0.8s linear infinite;
`;

const RouteText = styled.div`
  font-weight: 800;
  color: #0b1220;
  font-size: 14px;
`;
