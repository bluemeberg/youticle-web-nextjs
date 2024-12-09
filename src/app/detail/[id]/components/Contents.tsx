"use client"; // Ensure this is a client component

import styled from "styled-components";
import TocItem from "./TocItem";
import Recommend from "./Recommend";
import { DataProps } from "@/types/dataProps";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { useEffect, useRef, useState } from "react";
import { fetchSubscribedSubjects } from "../../../api/apiClient";
import StockOverview from "./overviews/StockOverview";
import RealEstateOverview from "./overviews/RealEstateOverview";
import EconomyOverview from "./overviews/EconomyOverview";
import BeautyOverview from "./overviews/BeautyOverview";
import AIOverview from "./overviews/AIOverview";
import BusinessOverview from "./overviews/BusinessOverview";
import FashionOverview from "./overviews/FashionOverview";
import { useRouter } from "next/navigation"; // For navigation

interface ContentsProps {
  detailData: DataProps;
  thumbnails: string[];
  handleTocItemClick: (starTime: number) => void;
}

const Contents = ({
  detailData,
  thumbnails,
  handleTocItemClick,
}: ContentsProps) => {
  const user = useRecoilValue(userState);
  const router = useRouter(); // Navigation hook

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

    if (typeof window !== "undefined") {
      calculateHeight();
    }
  }, [tocItemsRef, detailData, thumbnails]);

  const navigateToSubscribePage = () => {
    router.push("/subject"); // Navigate to keyword subscription page
    setShowPopup(false);
  };
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

  // 구독한 주제가 있으면 false, 미구독상태이면 true
  const isNoSubscribedSubjects =
    subscribedSubjects.length === 0 && user.name !== "";

  const hasDimmedItem =
    detailData.summary_data.section.some((_, index) => index >= 3) &&
    (user.name === "" || isUnsubscribedSection);

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  return (
    <>
      <ContentWrapper>
        {detailData.summary_data.section
          .slice(
            0,
            user.name === "" || isUnsubscribedSection
              ? 4
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
              <TocItem
                key={index}
                ref={
                  index ===
                  (user.name === "" || isUnsubscribedSection
                    ? 3
                    : detailData.summary_data.section.length - 1)
                    ? tocItemsRef
                    : null
                }
                section={detailData.section}
                title={title}
                start={Math.floor(Number(start_time))}
                summary={detail_contents}
                thumbnails={clientThumbnails[index]}
                partialDimmed={
                  index === 2 &&
                  (user.name === "" ||
                    isUnsubscribedSection ||
                    isNoSubscribedSubjects)
                }
                explanation_keyword={explanation_keyword}
                explanation_description={explanation_description}
                dimmed={
                  index >= 3 &&
                  (user.name === "" ||
                    isUnsubscribedSection ||
                    isNoSubscribedSubjects)
                }
                tocItemHeight={tocItemHeight}
                toc={detailData.summary_data.section}
                onClick={() =>
                  handleTocItemClick(Math.floor(Number(start_time)))
                }
                isLoggedOut={user.name === ""}
                isUnsubscribedSection={isUnsubscribedSection}
                isNoSubscribedSubjects={isNoSubscribedSubjects} // 새로운 상태 전달
                subscribedSubjects={subscribedSubjects}
              />
            )
          )}
      </ContentWrapper>
      {/* 
      {showPopup && (
        <PopupOverlay>
          <PopupContainer>
            <PopupMessage>
              현재 구독한 키워드가 없습니다. 아티클 전문을 읽으려면{" "}
              <strong>{detailData.section} 키워드</strong>를 구독해주세요. 지금
              바로 키워드 구독 페이지로 이동합니다.
            </PopupMessage>
            <PopupButton onClick={navigateToSubscribePage}>
              {detailData.section} 키워드 구독하러가기
            </PopupButton>
            <CloseButton onClick={handlePopupClose}>X</CloseButton>
          </PopupContainer>
        </PopupOverlay>
      )} */}

      {user.name !== "" && !isUnsubscribedSection && (
        <HilightContainer>
          {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "주식" &&
            detailData.summary_data.overview && (
              <StockOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "경제" &&
            detailData.summary_data.overview && (
              <EconomyOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "부동산" &&
            detailData.summary_data.overview && (
              <RealEstateOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "뷰티/메이크업" &&
            detailData.summary_data.overview && (
              <BeautyOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "인공지능" &&
            detailData.summary_data.overview && (
              <AIOverview overview={detailData.summary_data.overview} />
            )}

          {user.name !== "" &&
            !isUnsubscribedSection &&
            detailData.section === "비즈니스/사업" &&
            detailData.summary_data.overview && (
              <BusinessOverview overview={detailData.summary_data.overview} />
            )}

          {/* 패션 섹션 */}
          {(detailData.section === "남자 패션" ||
            detailData.section === "여자 패션") &&
            detailData.summary_data.overview &&
            user.name !== "" &&
            !isUnsubscribedSection && (
              <FashionOverview overview={detailData.summary_data.overview} />
            )}
        </HilightContainer>
      )}
      <RecommendWrapper
        $hasDimmedItem={hasDimmedItem}
        $tocItemHeight={tocItemHeight}
        $isUnsubscribedSection={isUnsubscribedSection} // 새로운 속성 추가
      >
        <Recommend
          detailData={detailData}
          isUnsubscribedSection={isUnsubscribedSection}
        />
      </RecommendWrapper>
    </>
  );
};

export default Contents;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
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
      ? `400px`
      : `160px`};
  z-index: ${(props) => (props.$hasDimmedItem ? `500` : "0")};
`;

const HilightContainer = styled.div`
  margin-top: 40px;
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContainer = styled.div`
  position: relative;
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 300px;
`;

const PopupMessage = styled.div`
  font-size: 16px;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const PopupButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  width: 100%;
  border-radius: 4px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 20px;
  font-weight: bold;
  color: #000;
  cursor: pointer;
`;
