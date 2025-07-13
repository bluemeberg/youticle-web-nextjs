"use client"; // Ensure this is a client component

import styled from "styled-components";
import { DataProps, RealEstateAnalysis } from "@/types/dataProps";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import React, { useEffect, useRef, useState } from "react";
import TocItem from "@/detail/a/[id]/components/TocItem";
import AdminChannelTocItem from "./AdminChannelTocItem";
import StockOverview from "@/detail/a/[id]/components/overviews/StockOverview";
import HealthOverview from "@/detail/a/[id]/components/overviews/HealthOverview";
import { HealthFocus, MethodSpotlight, LifeStyleTips } from "@/types/dataProps";
import EconomyOverview from "@/detail/a/[id]/components/overviews/EconomyOverview";
import RealEstateOverview from "@/detail/a/[id]/components/overviews/RealEstateOverview";
import BeautyOverview from "@/detail/a/[id]/components/overviews/BeautyOverview";
import AIOverview from "@/detail/a/[id]/components/overviews/AIOverview";
import CryptoOverview from "@/detail/a/[id]/components/overviews/CryptoOverview";
import BusinessOverview from "@/detail/a/[id]/components/overviews/BusinessOverview";
import ItTechOverview from "@/detail/a/[id]/components/overviews/ItTechOverview";
import RelationshipOverview from "@/detail/a/[id]/components/overviews/RelationshipOverview";
import TravelOverviewUnified from "@/detail/a/[id]/components/overviews/TravelOverview";
import HealthOverviewBusinessStyle from "@/detail/a/[id]/components/overviews/HealthOverview";
import { parseTimeStringToSeconds } from "@/utils/formatter";
import { fetchSubscribedSubjects } from "@/api/apiClient";
import RecommendChannel from "./RecommendChannel";

interface ContentsProps {
  detailData: DataProps;
  thumbnails: string[];
  handleTocItemClick: (starTime: number) => void;
  taskStatus: string;
}

interface RealEstateOverviewProps {
  overview: {
    market_analysis?: string;
    real_estate_analysis?: RealEstateAnalysis[];
    investment_strategy?: string;
  };
}
// 1) Type Definitions
interface TargetAudience {
  label: string;
  description: string;
}
interface HealthTrend {
  trend_name: string;
  trend_description: string;
}
interface AppTip {
  tip_title: string;
  tip_description: string;
}
interface HealthStrategy {
  strategy_name: string;
  strategy_description: string;
  application_tips: AppTip[];
}
interface HealthOverviewBusinessProps {
  overview: {
    target_audience?: TargetAudience[];
    health_trends?: HealthTrend[];
    health_strategic_insights?: HealthStrategy[];
  };
}
interface Audience {
  label: string;
  description: string;
}
interface TechTrend {
  trend_name: string;
  trend_description: string;
}
interface ApplicationTip {
  tip_title: string;
  tip_description: string;
}
interface TechStrategy {
  technology_name: string;
  technology_description: string;
  usage_tips: ApplicationTip[];
}
interface ItTechOverviewProps {
  overview: {
    target_audience?: Audience[];
    tech_trends?: TechTrend[];
    tech_strategic_insights?: TechStrategy[];
  };
}

interface RelTrend {
  trend_name: string;
  trend_description: string;
}
interface ActionTip {
  tip_title: string;
  tip_description: string;
}
interface InsightItem {
  insight_name: string;
  insight_description: string;
  action_tips: ActionTip[];
}

interface RelationshipOverviewProps {
  overview: {
    target_audience?: Audience[];
    relationship_trends?: RelTrend[];
    practical_insights?: InsightItem[];
  };
}

interface TravelItem {
  place_type: string;
  place_name: string;
  cost_info: string;
  key_features: string;
  how_to_go: string;
  tips: string;
}

interface TravelOverviewUnifiedProps {
  overview: {
    travel_items?: TravelItem[]; // 🔹 travel_items가 undefined일 수 있음
  };
}
const Contents = ({
  detailData,
  thumbnails,
  handleTocItemClick,
  taskStatus,
}: ContentsProps) => {
  const user = useRecoilValue(userState);

  const [tocItemHeight, setTocItemHeight] = useState(0);
  const tocItemsRef = useRef<HTMLDivElement | null>(null);

  // 서버 렌더링 타임에 넘어온 props를 client에서 초기화시켜서 사용해야 hydrate 에러가 안남
  const [clientData, setClientData] = useState<DataProps>();
  const [clientThumbnails, setClientThumbnails] = useState<string[]>([]);

  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false); // For popup visibility

  useEffect(() => {
    setClientData(detailData);
    setClientThumbnails(thumbnails);
    const calculateHeight = () => {
      if (tocItemsRef.current) {
        setTocItemHeight(tocItemsRef.current.clientHeight);
      }
    };

    // DOM을 클라이언트에서만 조작
    if (typeof window !== "undefined") {
      calculateHeight();
    }
  }, [tocItemsRef, detailData, thumbnails]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (user.name !== "") {
        const subjects = await fetchSubscribedSubjects(user.email, user.name);
        console.log("로그인 후 구독한 키워드", subjects);
        setSubscribedSubjects(subjects); // 구독한 주제 설정
        if (subjects.length === 0) {
          setShowPopup(true); // Show popup if no subscribed subjects
        }
      }
    };
    fetchSubjects();
  }, [user]);

  // 미구독이면 true, 구독이면 false
  // const isUnsubscribedSection =
  //   !subscribedSubjects.includes(detailData.section) && user.name !== "";
  const isUnsubscribedSection = false;
  console.log(isUnsubscribedSection, "구독여부");
  console.log("height", tocItemHeight);
  // 구독한 주제가 있으면 false, 미구독상태이면 true
  const isNoSubscribedSubjects =
    subscribedSubjects.length === 0 && user.name !== "";

  // const hasDimmedItem =
  //   detailData.summary_data.section.some((_, index) => index >= 1) &&
  //   user.name === "";
  const hasDimmedItem = false;
  // const [wrapperHeight, setWrapperHeight] = useState(0);

  // useEffect(() => {
  //   const calculateHeight = () => {
  //     const contentWrapperElement = document.querySelector(
  //       ".content-wrapper"
  //     ) as HTMLDivElement;

  //     if (contentWrapperElement) {
  //       const contentHeight = contentWrapperElement.scrollHeight;
  //       setWrapperHeight(contentHeight + 600); // 기존 높이에 813px 추가
  //     }
  //   };

  //   calculateHeight();

  //   // 윈도우 크기 변경에 대응
  //   window.addEventListener("resize", calculateHeight);

  //   return () => {
  //     window.removeEventListener("resize", calculateHeight);
  //   };
  // }, []);

  const contentNumberNotLogin =
    Math.ceil(detailData.summary_data.section.length / 2) + 1;
  return (
    <>
      <ContentWrapper
      // style={{
      //   minHeight: `${wrapperHeight}px`,
      // }}
      // className="content-wrapper"
      >
        {detailData.summary_data.section
          // .slice(
          //   0,
          //   user.name === ""
          //     ? contentNumberNotLogin
          //     : detailData.summary_data.section.length
          // )
          .map(
            (
              {
                title,
                start_time,
                detail_contents,
                explanation_keyword,
                explanation_description,
              },
              index
            ) => (
              <React.Fragment key={index}>
                <AdminChannelTocItem
                  key={index}
                  ref={
                    index ===
                    (user.name === "" || isUnsubscribedSection
                      ? contentNumberNotLogin - 1
                      : detailData.summary_data.section.length - 1)
                      ? tocItemsRef
                      : null
                  }
                  section={detailData.section}
                  videoId={detailData.video_id}
                  title={title}
                  start={parseTimeStringToSeconds(start_time)}
                  summary={detail_contents}
                  thumbnails={clientThumbnails[index]}
                  // partialDimmed={
                  //   index === contentNumberNotLogin - 2 && user.name === ""
                  // }
                  partialDimmed={false}
                  explanation_keyword={explanation_keyword}
                  explanation_description={explanation_description}
                  dimmed={false}
                  tocItemHeight={tocItemHeight}
                  toc={detailData.summary_data.section}
                  onClick={() =>
                    handleTocItemClick(parseTimeStringToSeconds(start_time))
                  }
                  isLoggedOut={user.name === ""}
                  isUnsubscribedSection={isUnsubscribedSection}
                  isNoSubscribedSubjects={isNoSubscribedSubjects} // 새로운 상태 전달
                  subscribedSubjects={subscribedSubjects}
                  overview={detailData.summary_data.overview}
                />
                {/* 👇 세 번째( index===2 ) 뒤에 에디터 등장
                {index === 2 && (
                  <EditorCameo
                    message="안녕하세요, 유티클 에디터입니다!
여기까지 살펴본 내용에서 금리 인상에 따른 채권 매력도 상승과,
주식 시장의 변동성을 어떻게 자산 배분으로 대응하는지가 핵심이었어요.
다음에는 장기 채권 투자 성공 사례나 일본 시장과의 비교 등을 통해
장기적 안목이 왜 중요한지 구체적으로 알아볼 거예요.
조금만 더 집중하시면, 여러분만의 포트폴리오 전략을 만드는 멋진 팁을 얻으실 수 있답니다!"
                  />
                )} */}
              </React.Fragment>
            )
          )}
      </ContentWrapper>
      {taskStatus === "Success" && (
        <HilightContainer>
          {detailData.section === "주식" &&
            detailData.summary_data.overview && (
              <StockOverview overview={detailData.summary_data.overview} />
            )}
          {detailData.section === "건강" &&
            typeof detailData.summary_data.overview === "object" &&
            detailData.summary_data.overview !== null && (
              <HealthOverviewBusinessStyle
                overview={
                  detailData.summary_data
                    .overview as HealthOverviewBusinessProps["overview"]
                }
              />
            )}

          {/* {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "경제" &&
            detailData.summary_data.overview && (
              <EconomyOverview overview={detailData.summary_data.overview} />
            )} */}

          {detailData.section === "부동산" &&
            typeof detailData.summary_data.overview === "object" &&
            detailData.summary_data.overview !== null && (
              <RealEstateOverview
                overview={
                  detailData.summary_data
                    .overview as RealEstateOverviewProps["overview"]
                }
              />
            )}

          {detailData.section === "뷰티/메이크업" &&
            detailData.summary_data.overview && (
              <BeautyOverview overview={detailData.summary_data.overview} />
            )}

          {detailData.section === "인공지능" &&
            detailData.summary_data.overview && (
              <AIOverview overview={detailData.summary_data.overview} />
            )}

          {detailData.section === "비즈니스/사업" &&
            detailData.summary_data.overview && (
              <BusinessOverview overview={detailData.summary_data.overview} />
            )}

          {detailData.section === "가상자산" &&
            detailData.summary_data.overview && (
              <CryptoOverview overview={detailData.summary_data.overview} />
            )}

          {detailData.section === "IT/테크" &&
            detailData.summary_data.overview && (
              <ItTechOverview
                overview={
                  detailData.summary_data
                    .overview as ItTechOverviewProps["overview"]
                }
              />
            )}

          {detailData.section === "연애/결혼" &&
            detailData.summary_data.overview && (
              <RelationshipOverview
                overview={
                  detailData.summary_data
                    .overview as RelationshipOverviewProps["overview"]
                }
              />
            )}

          {detailData.section === "여행" &&
            detailData.summary_data.overview && (
              <TravelOverviewUnified
                overview={
                  detailData.summary_data
                    .overview as TravelOverviewUnifiedProps["overview"]
                }
              />
            )}
          {/* 패션 섹션 */}
          {/* {(detailData.section === "남자 패션" ||
            detailData.section === "여자 패션") &&
            detailData.summary_data.overview &&
            user.name !== "" &&
            !isUnsubscribedSection && (
              <FashionOverview overview={detailData.summary_data.overview} />
            )} */}
        </HilightContainer>
      )}

      {!hasDimmedItem && taskStatus === "Success" ? (
        <RecommendWrapper
          $hasDimmedItem={hasDimmedItem}
          $tocItemHeight={tocItemHeight}
          $isUnsubscribedSection={isUnsubscribedSection} // 새로운 속성 추가
        >
          <RecommendChannel
            section={detailData.section}
            videoId={detailData.video_id}
          />
        </RecommendWrapper>
      ) : (
        <></>
      )}
    </>
  );
};

export default Contents;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
`;

const RecommendWrapper = styled.div<{
  $hasDimmedItem: boolean;
  $isUnsubscribedSection: boolean;
  $tocItemHeight: number;
}>`
  margin-top: ${(props) =>
    props.$hasDimmedItem && props.$isUnsubscribedSection
      ? `240px`
      : props.$hasDimmedItem
      ? `${(360 / props.$tocItemHeight) * props.$tocItemHeight}px`
      : `40px`};
  z-index: ${(props) => (props.$hasDimmedItem ? `500` : "0")};
  padding-left: 20px;
  padding-right: 20px;
`;

const HilightContainer = styled.div`
  margin-top: 40px;
`;

const RecommendChannelWrapper = styled.div`
  margin-top: 40px;
`;
