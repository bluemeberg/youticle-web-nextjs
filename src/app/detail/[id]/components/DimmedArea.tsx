import styled from "styled-components";
import InfoIcon from "@/assets/subInfo.svg";
import GoogleLogin from "@/common/GoogleLogin";
import { Overview, Section } from "@/types/dataProps";
import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import Recommend from "./Recommend";
import RecommendDimmed from "./RecommendDimmed";

const DIMMED_TITLE = `아직 구독중이 아니라면?!`;
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
  // console.log("구독한 키워드", overview);
  const subscribedText = subscribedSubjects.join(", ");
  const subscribeText =
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
    인공지능: () => ["1️⃣ AI 트렌드", "2️⃣ AI 적용 기술"],
    // 경제: () => ["1️⃣ 경제 동향", "2️⃣ 재무 분석", "3️⃣ 세계 시장 전망"],
    // 기타 섹션
    default: () => [],
  };

  const currentInsights = (
    insightsBySection[section] || insightsBySection.default
  )().filter(Boolean);

  return (
    <Container $height={tocItemHeight} $isUnsubscribed={isUnsubscribedSection}>
      <Info>
        {user.name !== "" && subscribedSubjects.length === 0 ? (
          <SubsKeywordInfo>
            🚫 구독중인 키워드가 없습니다. <br />
            아티클을 읽으려면 키워드를 구독하세요.
          </SubsKeywordInfo>
        ) : isUnsubscribedSection ? (
          <SubsKeywordInfo>
            🙋이미 &lsquo;{subscribedText}&rsquo; 키워드를 구독 중입니다.
          </SubsKeywordInfo>
        ) : (
          <>
            <LogoTitle>유튜브를 읽다, YouTicle</LogoTitle>
            <LogoTitleSubs>
              이미 &lsquo;{section}&rsquo; 키워드 구독 중이라면?
            </LogoTitleSubs>
            <GoogleLogin
              variant="link"
              text="로그인해서 아티클 아래 내용 마저 읽기"
            />
          </>
        )}
      </Info>
      <TOC>
        <div>👀 남은 목차</div>
        <div>
          {toc.slice(3).map(({ title }, index) => (
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
      {!isUnsubscribedSection && (
        <>
          {/* <Divider /> */}
          <ServiceTitle dangerouslySetInnerHTML={{ __html: DIMMED_TITLE }} />
          <UnSubscribeContainer>
            <ServiceTitleSub
              dangerouslySetInnerHTML={{ __html: DIMMED_SUBTITLE }}
            />
            <ServiceSubTitleContainer>
              <ServiceSubTitleSubContainer>
                <ServiceSubTitleIcon>📧</ServiceSubTitleIcon>
                <ServiceSubTitleDescription>
                  매일 자동 요약된 최신 유튜브 아티클을 이메일로 받기.
                </ServiceSubTitleDescription>
              </ServiceSubTitleSubContainer>
              <ServiceSubTitleSubContainer>
                <ServiceSubTitleIcon>🔍</ServiceSubTitleIcon>
                <ServiceSubTitleDescription>
                  매일 구독한 키워드의 아티클 전문을 자유롭게 탐색하기.
                </ServiceSubTitleDescription>
              </ServiceSubTitleSubContainer>
              <ServiceSubTitleSubContainer>
                <ServiceSubTitleIcon>✨</ServiceSubTitleIcon>
                <ServiceSubTitleDescription>
                  최대 3개의 관심 키워드 구독하기.{" "}
                </ServiceSubTitleDescription>
              </ServiceSubTitleSubContainer>
            </ServiceSubTitleContainer>
          </UnSubscribeContainer>
        </>
      )}
      <ButtonContainer>
        <ServiceButton
          $variant={isUnsubscribedSection ? "secondaryBlack" : "primary"}
          onClick={() => {
            router.push(
              isUnsubscribedSection && subscribedSubjects.length != 0
                ? "/subject/modify"
                : "/subject"
            );
          }}
        >
          {subscribeText}
        </ServiceButton>
      </ButtonContainer>
      {!isUnsubscribedSection && (
        <ButtonContainer>
          <ServiceButton
            $variant="secondary"
            onClick={() => {
              router.push("/");
            }}
          >
            유티클 더 알아보기
          </ServiceButton>
        </ButtonContainer>
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
  margin-bottom: 40px;
  font-family: "Pretendard Variable";
`;

const LogoTitleSubs = styled.div`
  font-size: 18px;
  font-weight: 700;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 1px;
  background-color: #dddddd;
  margin-top: 40px;
`;

const ServiceTitle = styled.span`
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
  flex-direction: row;
  div:first-child {
    margin-bottom: 24px;
  }
  div:nth-child(2) {
    margin-bottom: 24px;
  }
`;
const ServiceSubTitleIcon = styled.div`
  font-size: 16px;
`;

const ServiceSubTitleDescription = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-left: 10px;
  line-height: 132%;
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
    height: 44px;
    padding: 10px 16px;
    background-color: #f0f4ff;
    font-size: 20px;
    font-weight: 800;
    line-height: 24px;
    color: #020202;
    border-radius: 4px;
  }
  div:nth-child(2) {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background-color: rgba(242, 242, 242, 1);
    font-size: 18px;
    font-weight: 600;
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
  font-size: 16px;
  font-weight: 600;
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
  font-size: 20px !important;
  font-weight: 800 !important;
  /* color: #0033cc !important; 강조된 파란색 */
  background-color: #f9f9f9 !important;
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
  font-size: 18px !important;
  font-weight: 600 !important;
  line-height: 1.5 !important; /* 줄바꿈 시 간격 조정 */
  color: #333333 !important;
  border-radius: 4px !important;
  /* border: 1px solid #e0e0e0 !important; */
  display: flex !important; /* flex를 활용하여 간격 조정 */
  align-items: center !important; /* 텍스트 정렬 */
  min-height: 40px !important; /* 최소 높이 설정 */
  white-space: pre-wrap !important; /* 줄바꿈 허용 */

  ${({ section }) =>
    `
    &:nth-child(2) {
      font-weight: 600 !important;
      flex-direction : row !important;
    }
  `}
`;
