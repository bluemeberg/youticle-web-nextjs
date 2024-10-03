"use client"; // Ensure this is a client component

import styled from "styled-components";
import TocItem from "./TocItem";
import { DataProps } from "@/types/dataProps";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { useEffect, useRef, useState } from "react";

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

  const hasDimmedItem = detailData.summary_data.section.some(
    (_, index) => index >= 3 && user.name === ""
  );

  // 서버 렌더링 타임에 넘어온 props를 client에서 초기화시켜서 사용해야 hydrate 에러가 안남
  const [clientData, setClientData] = useState<DataProps>();
  const [clientThumbnails, setClientThumbnails] = useState<string[]>([]);

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

  return (
    <>
      <ContentWrapper>
        {detailData.summary_data.section
          .slice(
            0,
            user.name === "" ? 4 : detailData.summary_data.section.length
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
                  (user.name === ""
                    ? 3
                    : detailData.summary_data.section.length - 1)
                    ? tocItemsRef
                    : null
                }
                title={title}
                start={Math.floor(Number(start_time))}
                summary={detail_contents}
                thumbnails={clientThumbnails[index]}
                partialDimmed={index === 2 && user.name === ""}
                explanation_keyword={explanation_keyword}
                explanation_description={explanation_description}
                dimmed={index >= 3 && user.name === ""}
                tocItemHeight={tocItemHeight}
                toc={detailData.summary_data.section}
                onClick={() =>
                  handleTocItemClick(Math.floor(Number(start_time)))
                }
              />
            )
          )}
      </ContentWrapper>
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
