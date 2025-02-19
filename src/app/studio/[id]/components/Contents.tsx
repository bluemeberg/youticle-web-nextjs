"use client"; // Ensure this is a client component

import styled from "styled-components";
import { DataProps, RealEstateAnalysis } from "@/types/dataProps";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { useEffect, useRef, useState } from "react";
import { fetchSubscribedSubjects } from "../../../api/apiClient";
import TocItem from "@/detail/[id]/components/TocItem";
import Recommend from "@/detail/[id]/components/Recommend";
import AdminTocItem from "./AdminTocItem";
import StockOverview from "@/detail/[id]/components/overviews/StockOverview";
import HealthOverview from "@/detail/[id]/components/overviews/HealthOverview";
import { HealthFocus, MethodSpotlight, LifeStyleTips } from "@/types/dataProps";
import EconomyOverview from "@/detail/[id]/components/overviews/EconomyOverview";
import RealEstateOverview from "@/detail/[id]/components/overviews/RealEstateOverview";
import BeautyOverview from "@/detail/[id]/components/overviews/BeautyOverview";
import AIOverview from "@/detail/[id]/components/overviews/AIOverview";
import CryptoOverview from "@/detail/[id]/components/overviews/CryptoOverview";
import BusinessOverview from "@/detail/[id]/components/overviews/BusinessOverview";

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

interface HealthOverviewProps {
  overview: {
    health_focus?: HealthFocus[];
    method_spotlight?: MethodSpotlight[];
    lifestyle_tips?: LifeStyleTips[];
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
  const isUnsubscribedSection =
    !subscribedSubjects.includes(detailData.section) && user.name !== "";

  console.log(isUnsubscribedSection, "구독여부");
  console.log("height", tocItemHeight);
  // 구독한 주제가 있으면 false, 미구독상태이면 true
  const isNoSubscribedSubjects =
    subscribedSubjects.length === 0 && user.name !== "";

  const hasDimmedItem =
    detailData.summary_data.section.some((_, index) => index >= 1) &&
    user.name === "";
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
  console.log("task status", taskStatus);
  return (
    <>
      <ContentWrapper
      // style={{
      //   minHeight: `${wrapperHeight}px`,
      // }}
      // className="content-wrapper"
      >
        {detailData.summary_data.section
          .slice(
            0,
            user.name === ""
              ? contentNumberNotLogin
              : detailData.summary_data.section.length
          )
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
              <AdminTocItem
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
                start={Math.floor(Number(start_time))}
                summary={detail_contents}
                thumbnails={clientThumbnails[index]}
                partialDimmed={
                  index === contentNumberNotLogin - 2 && user.name === ""
                }
                explanation_keyword={explanation_keyword}
                explanation_description={explanation_description}
                dimmed={index >= contentNumberNotLogin - 1 && user.name === ""}
                tocItemHeight={tocItemHeight}
                toc={detailData.summary_data.section}
                onClick={() =>
                  handleTocItemClick(Math.floor(Number(start_time)))
                }
                isLoggedOut={user.name === ""}
                isUnsubscribedSection={isUnsubscribedSection}
                isNoSubscribedSubjects={isNoSubscribedSubjects} // 새로운 상태 전달
                subscribedSubjects={subscribedSubjects}
                overview={detailData.summary_data.overview}
              />
            )
          )}
      </ContentWrapper>
      {user.name !== "" && taskStatus === "Success" && (
        <HilightContainer>
          {user.name !== "" &&
            detailData.section === "주식" &&
            detailData.summary_data.overview && (
              <StockOverview overview={detailData.summary_data.overview} />
            )}
          {user.name !== "" &&
            detailData.section === "건강" &&
            typeof detailData.summary_data.overview === "object" &&
            detailData.summary_data.overview !== null && (
              <HealthOverview
                overview={
                  detailData.summary_data
                    .overview as HealthOverviewProps["overview"]
                }
              />
            )}

          {/* {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "경제" &&
            detailData.summary_data.overview && (
              <EconomyOverview overview={detailData.summary_data.overview} />
            )} */}

          {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "부동산" &&
            typeof detailData.summary_data.overview === "object" &&
            detailData.summary_data.overview !== null && (
              <RealEstateOverview
                overview={
                  detailData.summary_data
                    .overview as RealEstateOverviewProps["overview"]
                }
              />
            )}

          {user.name !== "" &&
            detailData.section === "뷰티/메이크업" &&
            detailData.summary_data.overview && (
              <BeautyOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            detailData.section === "인공지능" &&
            detailData.summary_data.overview && (
              <AIOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            detailData.section === "비즈니스/사업" &&
            detailData.summary_data.overview && (
              <BusinessOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            detailData.section === "가상자산" &&
            detailData.summary_data.overview && (
              <CryptoOverview overview={detailData.summary_data.overview} />
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
          <Recommend
            section={detailData.section}
            videoId={detailData.video_id}
            isUnsubscribedSection={isUnsubscribedSection}
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
      : `100px`};
  z-index: ${(props) => (props.$hasDimmedItem ? `500` : "0")};
  padding-left: 20px;
  padding-right: 20px;
`;

const HilightContainer = styled.div`
  margin-top: 40px;
`;
