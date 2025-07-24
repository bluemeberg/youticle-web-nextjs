import styled from "styled-components";
import InfoIcon from "@/assets/subInfo.svg";
import GoogleLogin from "@/common/GoogleLogin";
import { Overview, Section } from "@/types/dataProps";
import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import RecommendDimmed from "@/detail/[id]/components/RecommendDimmed";

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

const AdminDimmedArea = ({
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
      ? `나만의 유튜브 아티클 무료 생성하기`
      : "나만의 유튜브 아티클 무료 생성하기";
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
    // 경제: () => ["1️⃣ 경제 동향", "2️⃣ 재무 분석", "3️⃣ 세계 시장 전망"],
    // 기타 섹션
    default: () => [],
  };

  const currentInsights = (
    isEditorPath
      ? insightsBySection.default
      : insightsBySection[section] || insightsBySection.default
  )().filter(Boolean);

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
            <LogoTitleSubs>
              유튜브 영상을 빠르게 요약하고 중요한 핵심만 담은 아티클로 시간
              낭비 없이 트렌드와 인사이트를 잡아보세요! 🙋
              <br />
            </LogoTitleSubs>
            {/* <LogoTitleSubs>
              해당 키워드 구독 시 전문 확인 가능합니다.
            </LogoTitleSubs> */}
          </>
        ) : (
          <>
            <LogoTitle>유튜브를 읽다, YouTicle</LogoTitle>
            <LogoTitleSubs>
              🎯 이제 관심 있는 유튜브 영상을 <br />
              나만의 아티클로 생성해보세요! <br /> <br />
              시간을 절약하고 인사이트를
              <br />
              빠르게 확인할 수 있습니다! 🕒
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
      <TOC>
        <div>
          {" "}
          {isEditorPath
            ? "😱 아티클 생성하고 남은 인사이트 확인하세요!"
            : "👇 아티클 생성하고 남은 인사이트 확인하기!"}
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
          <SubsKeywordInfo>이미 아티클을 생성했다면? </SubsKeywordInfo>
          <GoogleLogin variant="link" text="로그인해서 아티클 내용 마저 읽기" />
        </>
      )}
      {/* <Footer /> */}
      <RecommendDimmed
        section={section}
        videoId={videoId}
        isUnsubscribedSection={isUnsubscribedSection}
      />
      {/* {!isUnsubscribedSection && <Divider />} */}
    </Container>
  );
};

export default AdminDimmedArea;

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
  margin-bottom: 40px;
  font-family: "Pretendard Variable";
`;

const LogoTitleSubs = styled.div`
  font-size: 18px;
  font-weight: 700;
  line-height: 132%;
  margin-bottom: 16px;
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
