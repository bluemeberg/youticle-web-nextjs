import styled from "styled-components";
import TocItem from "./TocItem";
import Recommend from "./Recommend";
import { DataProps } from "@/types/dataProps";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { useEffect, useRef, useState } from "react";
import { fetchSubscribedSubjects } from "../../../api/apiClient";

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

  useEffect(() => {
    const fetchSubjects = async () => {
      if (user.name !== "") {
        const subjects = await fetchSubscribedSubjects(user.email);
        setSubscribedSubjects(subjects); // 구독한 주제 설정
      }
    };

    fetchSubjects();
  }, [user]);

  // 미구독이면 true, 구독이면 false
  const isUnsubscribedSection =
    !subscribedSubjects.includes(detailData.section) && user.name !== "";

  // 구독한 주제가 있으면 false, 미구독상태이면 true
  const isNoSubscribedSubjects =
    subscribedSubjects.length === 0 && user.name !== "";

  const hasDimmedItem =
    detailData.summary_data.section.some((_, index) => index >= 3) &&
    (user.name === "" || isUnsubscribedSection);

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
      <RecommendWrapper
        $hasDimmedItem={hasDimmedItem}
        $tocItemHeight={tocItemHeight}
        $isUnsubscribedSection={isUnsubscribedSection} // 새로운 prop 전달
      >
        <Recommend detailData={detailData} />
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
  $tocItemHeight: number;
  $isUnsubscribedSection: boolean;
}>`
  margin-top: ${({ $hasDimmedItem, $isUnsubscribedSection }) =>
    $isUnsubscribedSection ? "-160px" : $hasDimmedItem ? "120px" : "160px"};
  z-index: ${({ $hasDimmedItem }) => ($hasDimmedItem ? `500` : "0")};
`;
