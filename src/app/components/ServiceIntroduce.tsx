"use client";

import styled from "styled-components";
import TodayIcon from "@/assets/today.svg";
import { useRouter } from "next/navigation";
import { useState } from "react";

import CountdownTimer from "./CountdownTimerCenter";
import { formatDateKST } from "@/utils/briefingSlot";
// 🔽 추가: 구글 로그인용
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { getUserByEmail } from "@/api/apiClient"; // (이메일로 유저 조회/생성)
import { logCtaClick } from "@/api/apiClient";
import { getOrCreateAnonId } from "@/utils/formatter";

interface ServiceIntroduceProps {
  subjects: string[]; // 추가된 subjects prop
}

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
const getCurrentDateWithDay = () => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2); // 뒤 두 자리만 추출
  const month = (today.getMonth() + 1).toString().padStart(2, "0"); // 월은 0부터 시작
  const day = today.getDate().toString().padStart(2, "0");
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekDay = weekDays[today.getDay()]; // 요일 가져오기
  return `${year}.${month}.${day} (${weekDay})`; // YYYY.MM.DD (요일) 형식
};

const SERVICE_TITLE = "오늘의 유튜브 TOP5 브리핑";
const SERVICE_DESCRIPTION =
  "오늘 업로드된 주요 키워드의 영상들을 단 1초만에 아티클로 읽을 수 있습니다.";
const NO_SUBSCRIBED_TOPIC_MSG =
  "❗️현재 구독 중인 키워드가 없습니다. <br/>최대 3개의 관심 주제를 등록해주세요.";
const FREE_BENEFITS_TITLE = "🎁 무료 구독 혜택";
const FREE_BENEFITS_DESC = `
  <ul>
    <li>1️⃣ 매일 구독한 키워드의 아티클 전문 읽기.</li>
    <li>2️⃣ 매일 이메일로 아티클 편하게 확인하기.</li>
    <li>3️⃣ 오늘 놓친 이전 아티클 무제한 조회하기.</li>
  </ul>`;

const ServiceIntroduce = ({ subjects }: ServiceIntroduceProps) => {
  const router = useRouter();
  console.log(subjects.length);
  const goToPage = (url: string) => router.push(url);
  const currentDateWithDay = getCurrentDateWithDay();
  // 🔽 추가: 로그인 상태 제어
  const setUser = useSetRecoilState(userState);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isNavigatingToBriefing, setIsNavigatingToBriefing] = useState(false);
  const user = useRecoilValue(userState);

  // 🔽 추가: 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    if (/KAKAOTALK/i.test(navigator.userAgent)) {
      alert(
        "카카오톡 인앱 브라우저에서는 Google 로그인이 동작하지 않을 수 있어요.\nSafari/Chrome 등 외부 브라우저에서 다시 시도해 주세요.",
      );
      return;
    }
    try {
      setIsLoggingIn(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);

      // 백엔드에 유저 존재 확인(없으면 생성) 후 id 획득
      const data = await getUserByEmail(
        result.user.email!,
        result.user.displayName || "User",
      );

      const normalizedUser = {
        name: result.user.displayName || "",
        email: result.user.email || "",
        picture: result.user.photoURL || "",
        id: data.id,
      };
      setUser(normalizedUser);

      return normalizedUser;
    } catch (e) {
      console.error(e);
      alert(
        "로그인에 실패했어요. Safari/Chrome 등 외부 브라우저에서 다시 시도해 주세요.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoToMyBriefing = async () => {
    if (isNavigatingToBriefing) return;
    setIsNavigatingToBriefing(true);
    const keywordList = subjects.length
      ? subjects
      : ["비즈니스/사업", "국내 주식", "부동산"];
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
    const targetPath = `/briefing/landing?${params.toString()}`;
    logCtaClick(
      "home_go_to_briefing",
      user?.id ?? null,
      user?.email ?? null,
      getOrCreateAnonId(),
      { origin: "home_service_intro" },
    );
    try {
      if (user?.email) {
        router.push(targetPath);
        return;
      }
      const loggedIn = await handleGoogleLogin();
      if (loggedIn?.email) {
        router.push(targetPath);
      }
    } finally {
      setIsNavigatingToBriefing(false);
    }
  };

  return (
    <Container>
      <ContentBox>
        <CurrentDate>{currentDateWithDay}</CurrentDate>
        <TitleContainer>
          <TodayIcon />
          <ServiceTitle>{SERVICE_TITLE} </ServiceTitle>
        </TitleContainer>
        <Announcement>
          <DescriptionList>
            <DescriptionItem>
              주요 키워드별 시청자 반응 좋은 <Highlight>TOP5 영상</Highlight>을
              <Highlight> 핵심 요약</Highlight>과 함께 빠르게 살펴보세요.
            </DescriptionItem>
            <DescriptionItem>
              하루 <Highlight>4회</Highlight> 자동 큐레이션으로 지금 반응 좋은
              영상만 다시 뽑아드려요.
            </DescriptionItem>
          </DescriptionList>
        </Announcement>{" "}
        {subjects.length === 0 ? ( // 구독 주제가 없을 때만 노출
          <>
            <ButtonContainer>
              <ServiceButton
                onClick={() => {
                  logCtaClick(
                    "subscribe_keyword", // 액션 이름
                    user?.id ?? null, // 유저 ID
                    user?.email ?? null, // 유저 이메일
                    getOrCreateAnonId(), // 익명 ID
                  );
                  goToPage("/subject"); // 키워드 구독으로 이동
                }}
              >
                관심 키워드 무료 구독하기
              </ServiceButton>
              <SecondaryCTAButton onClick={handleGoToMyBriefing} disabled={isNavigatingToBriefing}>
                {isNavigatingToBriefing ? "브리핑 이동 중..." : "내 키워드 브리핑 보러가기"}
              </SecondaryCTAButton>
            </ButtonContainer>
            {/* 🔽 추가: 로그인 유도 행 */}
            <LoginRow>
              <LoginText>이미 구독하고 있나요?</LoginText>
              <LoginButton
                onClick={() => {
                  logCtaClick(
                    "login_button_click", // 액션 이름
                    user?.id ?? null, // 유저 ID
                    user?.email ?? null, // 유저 이메일
                    getOrCreateAnonId(), // 익명 ID
                  );
                  handleGoogleLogin(); // 기존 로그인 로직
                }}
                disabled={isLoggingIn}
              >
                {" "}
                {isLoggingIn ? "로그인 중..." : "로그인하기"}
              </LoginButton>
            </LoginRow>
          </>
        ) : (
          <ButtonContainer>
            <ServiceButton
              change={subjects.length !== 0}
              onClick={() => {
                logCtaClick(
                  "modify_subscribe_keyword", // CTA 액션명
                  user?.id ?? null, // 유저 ID
                  user?.email ?? null, // 유저 이메일
                  getOrCreateAnonId(), // 익명 ID
                );
                goToPage("/subject/modify");
              }}
            >
              구독 키워드 변경하기
            </ServiceButton>
            <SecondaryCTAButton
              onClick={handleGoToMyBriefing}
              disabled={isNavigatingToBriefing}
            >
              {isNavigatingToBriefing ? "브리핑 이동 중..." : "내 키워드 브리핑 보러가기"}
            </SecondaryCTAButton>
          </ButtonContainer>
        )}
        {/* <SecondaryEntryCard>
          <div>
            <SecondaryTitle>내 브리핑(카톡/이메일) 다시보기</SecondaryTitle>
            <SecondaryText>
              카톡으로 받았던 화면을 웹에서 그대로 열람할 수 있어요.
            </SecondaryText>
          </div>
          <SecondaryButton
            type="button"
            onClick={() => router.push(`/b/${BRIEFING_DEMO_ID}`)}
          >
            브리핑 예시 보기
          </SecondaryButton>
        </SecondaryEntryCard> */}
      </ContentBox>
    </Container>
  );
};

export default ServiceIntroduce;

// 스타일 정의
const Container = styled.div`
  display: flex;
  justify-content: center;
  background-color: #f0f4ff;
  font-family: "Pretendard Variable";
  width: 100%;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;
const CurrentDate = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #000;
  margin-bottom: 8px;
`;
const ContentBox = styled.div`
  background-color: #f0f4ff;
  padding-left: 16px;
  padding-right: 16px;
  /* padding-bottom: 20px; */
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const ServiceTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-left: 4px;
`;

const ServiceDesc = styled.p`
  font-size: 16px;
  color: #000;
  margin-bottom: 10px;
  font-weight: 500;
  line-height: 1.2;
`;

const NoSubscribedTopicMsg = styled.div`
  background-color: #f8f9fa;
  padding: 20px 16px 12px 16px;
  border-radius: 4px;
  margin-top: 20px;
`;

const NoSubsTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin-bottom: 20px;
  line-height: 1.2;
`;

const BenefitsContainer = styled.div`
  background-color: #e9f4ff;
  border-radius: 4px;
  padding: 20px 16px 12px 16px;
`;

const FreeBenefitsTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 16px;
`;

const FreeBenefitsDesc = styled.div`
  font-size: 16px;
  color: #000;
  font-weight: 400;
  line-height: 1.4;
  margin-top: 12px;
  li {
    margin-top: 4px;
  }
`;

const CTAButton = styled.button`
  background-color: #007bff;
  color: #ffffff;
  padding: 15px 30px;
  border-radius: 25px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;

  &:hover {
    background-color: #0056b3;
  }
`;
const ServiceButton = styled.button<{ change?: boolean }>`
  width: 100%;
  padding: 14px 18px;
  background-color: ${(props) => (props.change ? "#000" : "#007bff")};
  color: #ffffff;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  border-radius: 8px;
  font-weight: 800;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;
const Announcement = styled.div`
  margin-bottom: 20px;
`;

const SecondaryEntryCard = styled.div`
  margin-bottom: 20px;
  border-radius: 16px;
  border: 1px solid #dbe2ff;
  background: #fff;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const SecondaryTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
`;

const SecondaryText = styled.p`
  margin: 0;
  color: #5a6386;
  font-size: 14px;
`;

const SecondaryButton = styled.button`
  border-radius: 999px;
  padding: 10px 16px;
  border: none;
  background: #1f2b6c;
  color: #fff;
  font-weight: 700;
`;

const SecondaryCTAButton = styled.button`
  width: 100%;
  /* max-width: 320px; */
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #1f2b6c;
  background: #fff;
  color: #1f2b6c;
  font-weight: 800;
  font-size: 15px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: #000;
  margin-bottom: 12px;
  line-height: 128%;
  font-family: "Pretendard Variable";
`;

const DescriptionList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const DescriptionItem = styled.li`
  font-size: 16px;
  line-height: 1.5;
  color: #0f172a;
  font-family: "Pretendard Variable";
`;

const Highlight = styled.span`
  color: #0b63f6;
  font-weight: 700;
  background: rgba(11, 99, 246, 0.08);
  padding: 0 6px;
  border-radius: 6px;
`;

const CallToAction = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-top: 16px;
`;
/* 🔽 추가된 스타일 */
const LoginRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  margin-top: -16px;
`;

const LoginText = styled.span`
  font-size: 14px;
  color: #333;
`;

const LoginButton = styled.button`
  border: none;
  background: transparent;
  color: #007bff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: underline;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    text-decoration: none;
  }
`;
