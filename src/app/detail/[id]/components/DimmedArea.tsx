import styled from "styled-components";
import InfoIcon from "@/assets/subInfo.svg";
import GoogleLogin from "@/common/GoogleLogin";
import { Overview, Section } from "@/types/dataProps";
import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import Recommend from "./Recommend";
import RecommendDimmed from "./RecommendDimmed";
import { usePathname } from "next/navigation";

const DIMMED_TITLE = `✨ 초기 무료 구독자에게만 제공되는 혜택`;
const DIMMED_SUBTITLE = `👇지금 바로 무료 구독하세요!`;
interface DimmedAreaProps {
  tocItemHeight: number;
  toc: Section[];
  isLoggedOut: boolean;
  isUnsubscribedSection: boolean;
  isNoSubscribedSubjects: boolean;
  subscribedSubjects: string[];
  section: string;
  videoId: string;
  overview: Overview | undefined;
}

const DimmedArea = ({
  tocItemHeight,
  toc,
  isLoggedOut,
  isUnsubscribedSection,
  isNoSubscribedSubjects,
  subscribedSubjects,
  section,
  overview,
  videoId,
}: DimmedAreaProps) => {
  const user = useRecoilValue(userState);
  const router = useRouter();
  const pathname = usePathname(); // 현재 경로 가져오기
  const isEditorPath = pathname.startsWith("/editor"); // editor 경로 확인

  // console.log("구독한 키워드", overview);
  const subscribedText = subscribedSubjects.join(", ");
  const subscribeText =
    isUnsubscribedSection && subscribedSubjects.length != 0
      ? "구독 키워드 변경하기"
      : isEditorPath
      ? `무료 구독하고 더 많은 인사이트 확인하기`
      : "무료 구독하고 더 많은 트렌드 확인하기";
  const subscribeText2 =
    isUnsubscribedSection && subscribedSubjects.length != 0
      ? "구독 키워드 변경하기"
      : `‘${section}’ 키워드 무료 구독하러가기`;
  // 섹션별 유티클 인사이트 내용 정의
  const insightsBySection: Record<string, () => (string | undefined)[]> = {
    주식: () => {
      if (overview?.stocks) {
        const stockNames = overview.stocks
          .map((stock) => stock.stock_name)
          .join(", ");
        return [
          "1️⃣ 시장 분석",
          `2️⃣ 종목 분석: ${stockNames}`,
          ,
          "3️⃣  투자 전략",
        ];
      }
      return ["1️⃣ 시장 분석", "2️⃣ 종목 분석", "3️⃣ 투자 전략"];
    },
    가상자산: () => {
      if (overview?.cryptos) {
        const stockNames = overview.cryptos
          .map((stock) => stock.crypto_name)
          .join(", ");
        return [
          "1️⃣ 시장 분석",
          `2️⃣ 암호화폐 분석: ${stockNames}`,
          ,
          "3️⃣  투자 전략",
        ];
      }
      return ["1️⃣ 시장 분석", "2️⃣ 종목 분석", "3️⃣ 투자 전략"];
    },
    "뷰티/메이크업": () => [
      "1️⃣ 뷰티 트렌드",
      "2️⃣ 브랜드 제품 소개",
      "3️⃣ 스타일링 꿀팁",
    ],
    "비즈니스/사업": () => ["1️⃣ 비즈니스 트렌드", "2️⃣ 전략적 인사이트"],
    부동산: () => ["1️⃣ 시장 분석", "2️⃣ 지역 분석", "3️⃣ 투자 전략"],
    경제: () => ["1️⃣ 경제 트렌드", "2️⃣ 시장 분석", "3️⃣ 투자 전략"],
    "여자 패션": () => [
      "1️⃣ 패션 트렌드",
      "2️⃣ 브랜드 스포트라이트",
      "3️⃣ 스타일링 팁",
    ],
    "남자 패션": () => [
      "1️⃣ 패션 트렌드",
      "2️⃣ 브랜드 스포트라이트",
      "3️⃣ 스타일링 팁",
    ],
    인공지능: () => ["1️⃣ AI 트렌드", "2️⃣ AI 적용 기술"],
    건강: () => ["1️⃣ 건강 포커스", "2️⃣ 방법/접근 방식", "3️⃣ 라이프스타일 팁"],

    // 경제: () => ["1️⃣ 경제 동향", "2️⃣ 재무 분석", "3️⃣ 세계 시장 전망"],
    // 기타 섹션
    default: () => [],
  };

  const currentInsights = (
    isEditorPath
      ? overview && insightsBySection[section] // 에디터 페이지면서 overview가 있으면 section에 맞는 인사이트
        ? insightsBySection[section]
        : insightsBySection.default // overview가 없으면 기본 인사이트 사용
      : insightsBySection[section] || insightsBySection.default
  )().filter(Boolean); // 일반 페이지에서는 해당 섹션이 없으면 기본값 사용

  const [dimmedHeight, setDimmedHeight] = useState<number>(0);
  const dimmedRef = useRef<HTMLDivElement>(null);
  // useEffect(() => {
  //   const updateHeight = () => {
  //     if (dimmedRef.current) {
  //       const height = dimmedRef.current.offsetHeight;
  //       console.log(height);
  //       setDimmedHeight(height);
  //       document.body.style.minHeight = `${height + window.innerHeight}px`;
  //     }
  //   };

  //   // 초기 실행 및 윈도우 리사이즈 대응
  //   updateHeight();
  //   window.addEventListener("resize", updateHeight);

  //   return () => {
  //     window.removeEventListener("resize", updateHeight);
  //   };
  // }, []);
  const contentNumberNotLogin = Math.ceil(toc.length / 2);
  // 설문 응답 처리 로직 (서버 전송이나 GA 이벤트 가능)
  const handleSurveyAnswer = async (answer: string) => {
    setSurveyAnswer(answer);
    console.log("사용자가 선택한 설문 답변:", answer);
    // 필요하다면 이벤트 전송
    // ex) window.gtag("event", "survey_answer", { answer });
    // (B) DB 저장용 API 호출
    try {
      const response = await fetch(
        "https://youticle.shop/editor/first-impressions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            video_id: videoId, // props로 받은 videoId
            reaction: answer,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to post impression", response.statusText);
      } else {
        console.log("Impression saved successfully!");
      }
    } catch (err) {
      console.error("Error posting impression:", err);
    }
  };
  // 간단 이모티콘 설문(원클릭) 응답 상태
  const [surveyAnswer, setSurveyAnswer] = useState<string | null>(null);

  const handleButtonClick = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "subscription_button_click", {
        event_category: "engagement",
        event_label: "Subscribe Button",
        value: 1,
      });
    }

    // section 값을 쿼리 파라미터로 전달
    const targetUrl =
      isUnsubscribedSection && subscribedSubjects.length !== 0
        ? `/subject/modify?section=${section}`
        : `/subject?section=${section}&videoId=${videoId}`;

    router.push(targetUrl);
  };

  return (
    <Container
      ref={dimmedRef}
      $height={tocItemHeight}
      $isUnsubscribed={isUnsubscribedSection}
    >
      <Info>
        {user.name !== "" && subscribedSubjects.length === 0 ? (
          <SubsKeywordInfoAfterLogin>
            🚫 구독중인 키워드가 없습니다. <br />
            아티클을 읽으려면 키워드를 구독하세요.
          </SubsKeywordInfoAfterLogin>
        ) : isUnsubscribedSection ? (
          <SubsKeywordInfoAfterLogin>
            🙋이미 &lsquo;{subscribedText}&rsquo; 키워드를 구독 중입니다.
          </SubsKeywordInfoAfterLogin>
        ) : isEditorPath ? ( // editor 경로에 따른 조건 추가
          <>
            <LogoTitle>유튜브를 읽다, YouTicle</LogoTitle>
            {/* (2) 첫 인상 이모티콘 설문 컨테이너 */}
            {!user.name && ( // 비로그인 상태에서만 표시 예시
              <OneClickSurveyContainer>
                <SurveyHeader>
                  현재까지 보신 내용의 첫 인상은 어떠셨나요?
                </SurveyHeader>
                <EmoticonRow>
                  <EmoticonButton
                    onClick={() => handleSurveyAnswer("유익했어요!")}
                    disabled={!!surveyAnswer} // 응답 후 비활성 (옵션)
                  >
                    😀
                  </EmoticonButton>
                  <EmoticonButton
                    onClick={() => handleSurveyAnswer("무난했어요!!")}
                    disabled={!!surveyAnswer}
                  >
                    😐
                  </EmoticonButton>
                  <EmoticonButton
                    onClick={() => handleSurveyAnswer("더 봐야할것 같아요!")}
                    disabled={!!surveyAnswer}
                  >
                    😞
                  </EmoticonButton>
                </EmoticonRow>

                {surveyAnswer && (
                  <SurveyFeedback>
                    선택하신 답변: <strong>{surveyAnswer}</strong>
                    <br />
                    <em>소중한 의견 감사합니다!</em>
                  </SurveyFeedback>
                )}
              </OneClickSurveyContainer>
            )}
            <LogoTitleSubs>
              이제 &lsquo;{section}&rsquo; 키워드 무료 구독하고 <br /> 양질의
              인사이트를 빠르게 확인해보세요!🙋
              <br />
            </LogoTitleSubs>
            {/* <LogoTitleSubs>
              해당 키워드 구독 시 전문 확인 가능합니다.
            </LogoTitleSubs> */}
          </>
        ) : (
          <>
            <LogoTitle>유튜브를 읽다, YouTicle</LogoTitle>
            {/* (2) 첫 인상 이모티콘 설문 컨테이너 */}
            {!user.name && ( // 비로그인 상태에서만 표시 예시
              <OneClickSurveyContainer>
                <SurveyHeader>
                  현재까지 보신 내용의 첫 인상은 어떠셨나요?
                </SurveyHeader>
                <EmoticonRow>
                  <EmoticonButton
                    onClick={() => handleSurveyAnswer("유익했어요!")}
                    disabled={!!surveyAnswer} // 응답 후 비활성 (옵션)
                  >
                    😀
                  </EmoticonButton>
                  <EmoticonButton
                    onClick={() => handleSurveyAnswer("무난했어요!!")}
                    disabled={!!surveyAnswer}
                  >
                    😐
                  </EmoticonButton>
                  <EmoticonButton
                    onClick={() => handleSurveyAnswer("더 봐야할것 같아요!")}
                    disabled={!!surveyAnswer}
                  >
                    😞
                  </EmoticonButton>
                </EmoticonRow>

                {surveyAnswer && (
                  <SurveyFeedback>
                    선택하신 답변: <strong>{surveyAnswer}</strong>
                    <br />
                    <em>소중한 의견 감사합니다!</em>
                  </SurveyFeedback>
                )}
              </OneClickSurveyContainer>
            )}
            <LogoTitleSubs>
              이제 &lsquo;{section}&rsquo; 키워드 무료 구독하고 <br /> 최신
              트렌드 정보를 매일 받아보세요!🙋 <br />
            </LogoTitleSubs>
            {/* <LogoTitleSubs>
              해당 키워드 구독 시 전문 확인 가능합니다.
            </LogoTitleSubs> */}
            {/* <SubsKeywordInfo>이미 구독중이라면? </SubsKeywordInfo>
            <GoogleLogin
              variant="link"
              text="로그인해서 아티클 아래 내용 마저 읽기"
            /> */}
          </>
        )}
      </Info>
      {/* 
      {!user.name && (
        <SurveyContainer>
          <SurveyTitle>아티클 사전 설문조사</SurveyTitle>
          <SurveyDescription>
            현재까지 보신 내용, <strong>첫인상은 어떠셨나요?</strong>
          </SurveyDescription>

          <SurveyOptions>
            <SurveyOption onClick={() => handleSurveyAnswer("매우 흥미롭다")}>
              매우 흥미롭다
            </SurveyOption>
            <SurveyOption onClick={() => handleSurveyAnswer("보통이다")}>
              보통이다
            </SurveyOption>
            <SurveyOption onClick={() => handleSurveyAnswer("별로다")}>
              별로다
            </SurveyOption>
          </SurveyOptions>

          {surveyAnswer && (
            <SurveyResult>
              선택하신 답변: <strong>{surveyAnswer}</strong>
            </SurveyResult>
          )}
        </SurveyContainer>
      )} */}

      <TOC>
        <div>
          {" "}
          {isEditorPath
            ? "😱 지금 구독하지 않으면 놓치는 인사이트!"
            : "😱 지금 구독하지 않으면 놓치는 트렌드들!"}
        </div>
        <div>
          {toc.slice(contentNumberNotLogin).map(({ title }, index) => (
            <span key={index}>{title}</span>
          ))}
          {currentInsights.length > 0 && (
            <InsightsContainer>
              <InsightsTitle>✨ 유티클 인사이트</InsightsTitle>
              <InsightsList>
                {currentInsights.map((insight, index) => (
                  <InsightItem key={index} section={section}>
                    {insight}
                  </InsightItem>
                ))}
              </InsightsList>
            </InsightsContainer>
          )}
        </div>
      </TOC>
      <ButtonContainer>
        <ServiceButton
          $variant={isUnsubscribedSection ? "secondaryBlack" : "primary"}
          onClick={handleButtonClick} // GA4 이벤트 추가
        >
          {subscribeText}
        </ServiceButton>
      </ButtonContainer>
      {user.name == "" && (
        <>
          {" "}
          <SubsKeywordInfo>이미 구독중이라면? </SubsKeywordInfo>
          <GoogleLogin variant="link" text="로그인해서 아티클 내용 마저 읽기" />
        </>
      )}
      {!isUnsubscribedSection && (
        <>
          {/* <Divider /> */}
          <ServiceTitle dangerouslySetInnerHTML={{ __html: DIMMED_TITLE }} />
          <UnSubscribeContainer>
            {/* <ServiceTitleSub
              dangerouslySetInnerHTML={{ __html: DIMMED_SUBTITLE }}
            /> */}
            <ServiceSubTitleContainer>
              <ServiceSubTitleSubContainer>
                <ServiceSubTitleIcon>
                  1️⃣ 매일 뉴스레터 제공!
                </ServiceSubTitleIcon>
                <ServiceSubTitleDescription>
                  구독 키워드 기반으로 자동 요약된 유튜브 아티클을 매일 이메일로
                  받아보세요!
                  <ul>
                    <li>
                      <strong>최신 트렌드 아티클:</strong> 최신 유튜브 영상을
                      요약한 아티클을 통해 빠르게 트렌드에 올라타세요.
                    </li>
                    <li>
                      <strong>에디터 추천 아티클:</strong> 에디터가 선정한
                      양질의 영상을 통해 인사이트를 키우고 더 나은 결정을
                      내리세요.
                    </li>
                  </ul>
                </ServiceSubTitleDescription>
              </ServiceSubTitleSubContainer>
              <ServiceSubTitleSubContainer>
                <ServiceSubTitleIcon>
                  2️⃣ 아티클 전문 열람 가능!
                </ServiceSubTitleIcon>
                <ServiceSubTitleDescription>
                  구독자만 누릴 수 있는 혜택! 아티클의 모든 전문 내용을 자유롭게
                  열람하고 완벽한 정보를 얻으세요.
                </ServiceSubTitleDescription>
              </ServiceSubTitleSubContainer>
              <ServiceSubTitleSubContainer>
                <ServiceSubTitleIcon>3️⃣ 관심 키워드 3Pick!</ServiceSubTitleIcon>
                <ServiceSubTitleDescription>
                  최대 3개의 관심 키워드를 선택하여 나만의 맞춤형 아티클을 매일
                  받아보세요.
                </ServiceSubTitleDescription>
              </ServiceSubTitleSubContainer>
            </ServiceSubTitleContainer>
          </UnSubscribeContainer>
          <ButtonContainer>
            <ServiceButton
              $variant={isUnsubscribedSection ? "secondaryBlack" : "primary"}
              onClick={handleButtonClick} // GA4 이벤트 추가
            >
              {subscribeText2}
            </ServiceButton>
          </ButtonContainer>
        </>
      )}

      <RecommendDimmed
        section={section}
        videoId={videoId}
        isUnsubscribedSection={isUnsubscribedSection}
      />
      {/* {!isUnsubscribedSection && <Divider />} */}
    </Container>
  );
};

export default DimmedArea;

// Styled Components
const Container = styled.div<{ $height: number; $isUnsubscribed: boolean }>`
  height: ${({ $height, $isUnsubscribed }) =>
    $height + ($isUnsubscribed ? 100 : 100)}px;
  position: absolute;
  top: -100px;
  padding-bottom: 50px;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: 100%;
  font-family: "Pretendard Variable";
`;

const LogoTitle = styled.div`
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
  font-family: "Pretendard Variable";
`;

const LogoTitleSubs = styled.div`
  font-size: 18px;
  font-weight: 700;
  line-height: 132%;
  margin-bottom: 4px;
  margin-top: 12px;
  text-align: center;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 1px;
  background-color: #dddddd;
  margin-top: 40px;
`;

const ServiceTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  line-height: 148%;
  margin-top: 68px;
  text-align: center;
  font-family: "Pretendard Variable";
`;

const ServiceTitleSub = styled.span`
  font-size: 18px;
  font-weight: 700;
  line-height: 148%;
  text-align: center;
  width: 100%;
  display: flex;
  font-family: "Pretendard Variable";
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`;

const ServiceSubTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ServiceSubTitleSubContainer = styled.div`
  display: flex;
  flex-direction: column;
  div:first-child {
    margin-bottom: 12px;
    margin-top: 4px;
    min-width: 92px;
  }
  div:nth-child(2) {
    margin-bottom: 32px;
  }
`;
const ServiceSubTitleIcon = styled.div`
  font-size: 18px;
  font-weight: 700;
`;

const ServiceSubTitleDescription = styled.div`
  font-size: 16px;
  line-height: 132%;
  ul {
    margin: 0;
    padding-left: 20px;
    list-style-type: disc;
    margin-top: 12px;
  }

  li {
    margin-bottom: 8px;
    font-size: 14px;
  }
  strong {
    font-weight: 600;
  }
`;

const ServiceSubTitle = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  span {
    font-size: 14px;
    margin-bottom: 12px;
    font-weight: 500;
  }
`;

const InsightContent = styled.div`
  margin-left: 40px;
  margin-top: -12px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 20px;
  width: 100%;
  span {
    font-size: 20px;
    font-weight: 700;
    line-height: 136%;
    display: flex;
    gap: 4px;
    b {
      font-weight: 700;
    }
  }
`;

const TOC = styled.div`
  width: 100%;
  margin-top: 4px;
  span {
    font-size: 18px;
    line-height: 132%;
  }
  div:first-child {
    height: 60px;
    display: flex;
    align-items: center;
    /* justify-content: center; */
    padding: 10px 16px;
    background-color: #f0f4ff;
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
    color: #020202;
    border-radius: 4px;
  }
  div:nth-child(2) {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background-color: #f6f6f6;
    font-size: 18px;
    font-weight: 500;
    line-height: 19.09px;
    border-radius: 4px;
  }
  /* InsightsContainer 제외 */
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
`;

const SubsKeywordInfo = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-top: 12px;
  margin-bottom: -18px;
`;

const SubsKeywordInfoAfterLogin = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
  line-height: 140%;
`;

const UnSubscribeContainer = styled.div`
  background-color: #e9f4ff;
  padding: 28px 24px 8px 24px;
  border-radius: 4px;
`;

const InsightsContainer = styled.div`
  background-color: #f9f9f9 !important;
  padding: 16px 4px !important;
  border-radius: 8px !important;
  border: 1px solid #e6e6e6 !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05) !important; /* 부드러운 그림자 */
`;

const InsightsTitle = styled.div`
  font-size: 18px !important;
  font-weight: 800 !important;
  /* color: #0033cc !important; 강조된 파란색 */
  background-color: #f9f9f9 !important;
  height: 42px !important;
  justify-content: left !important;
`;

const InsightsList = styled.div`
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important; /* 항목 간 간격 */
  background-color: #f9f9f9 !important;
  padding: 0px 20px !important;
`;

const InsightItem = styled.div<{ section: string }>`
  padding: 0px 0px !important;
  background-color: #f9f9f9 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  line-height: 1.5 !important; /* 줄바꿈 시 간격 조정 */
  color: #333333 !important;
  border-radius: 4px !important;
  /* border: 1px solid #e0e0e0 !important; */
  display: flex !important; /* flex를 활용하여 간격 조정 */
  align-items: center !important; /* 텍스트 정렬 */
  min-height: 40px !important; /* 최소 높이 설정 */
  white-space: pre-wrap !important; /* 줄바꿈 허용 */
  height: 42px !important ;
  justify-content: left !important;

  ${({ section }) =>
    `
    &:nth-child(2) {
      font-weight: 600 !important;
      flex-direction : row !important;
    }
  `}
`;

/* 설문 관련 Styled Components 추가 */
const SurveyContainer = styled.div`
  width: 90%;
  max-width: 560px;
  background-color: #f2f2f2;
  margin-top: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
  padding: 16px;
`;

const SurveyTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const SurveyDescription = styled.div`
  font-size: 16px;
  margin-bottom: 12px;
  strong {
    font-weight: 700;
  }
`;

const SurveyOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SurveyOption = styled.button`
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  &:hover {
    background-color: #e6e6e6;
  }
`;

const SurveyResult = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #333;
`;
const OneClickSurveyContainer = styled.div`
  width: 90%;
  max-width: 560px;
  background-color: #e9f4ff;
  margin-top: 12px;
  margin-bottom: 52px;
  border-radius: 8px;
  padding: 32px 24px;
  text-align: center;
`;

const SurveyHeader = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const EmoticonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
`;

const EmoticonButton = styled.button`
  font-size: 28px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background-color: #e6e6e6;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const SurveyFeedback = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #333;
  line-height: 132%;
  strong {
    font-weight: 700;
  }
  em {
    font-style: normal;
    color: #666;
    margin-left: 8px;
  }
`;
