"use client"; // Ensure this is a client component

import styled from "styled-components";
import { DataProps } from "@/types/dataProps";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { useEffect, useRef, useState } from "react";
import { fetchSubscribedSubjects } from "../../../api/apiClient";
import TocItem from "@/detail/[id]/components/TocItem";
import Recommend from "@/detail/[id]/components/Recommend";

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
    detailData.summary_data.section.some((_, index) => index >= 3) &&
    (user.name === "" || isUnsubscribedSection);

  const [wrapperHeight, setWrapperHeight] = useState(0);

  useEffect(() => {
    const calculateHeight = () => {
      const contentWrapperElement = document.querySelector(
        ".content-wrapper"
      ) as HTMLDivElement;

      if (contentWrapperElement) {
        const contentHeight = contentWrapperElement.scrollHeight;
        setWrapperHeight(contentHeight + 600); // 기존 높이에 813px 추가
      }
    };

    calculateHeight();

    // 윈도우 크기 변경에 대응
    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);
  const contentNumberNotLogin =
    Math.ceil(detailData.summary_data.section.length / 2) + 1;
  return (
    <>
      <ContentWrapper
        style={{
          minHeight: `${wrapperHeight}px`,
        }}
        className="content-wrapper"
      >
        {detailData.summary_data.section
          .slice(
            0,
            user.name === "" || isUnsubscribedSection
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
              <TocItem
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
                  index === contentNumberNotLogin - 2 &&
                  (user.name === "" ||
                    isUnsubscribedSection ||
                    isNoSubscribedSubjects)
                }
                explanation_keyword={explanation_keyword}
                explanation_description={explanation_description}
                dimmed={
                  index >= contentNumberNotLogin - 1 &&
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
                overview={detailData.summary_data.overview}
              />
            )
          )}
      </ContentWrapper>
      {!hasDimmedItem ? (
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
  padding: 0 20px;
`;

const RecommendWrapper = styled.div<{
  $hasDimmedItem: boolean;
  $tocItemHeight: number;
}>`
  margin-top: ${(props) => (props.$hasDimmedItem ? `120px` : "100px")};
  z-index: ${(props) => (props.$hasDimmedItem ? `500` : "0")};
`;
