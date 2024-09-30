"use client";

import styled from "styled-components";
import TocItem from "./TocItem";
import { DataProps } from "@/types/dataProps";

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
  return (
    <ContentWrapper>
      {detailData.summary_data.section.map(
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
            title={title}
            start={Math.floor(Number(start_time))}
            summary={detail_contents}
            thumbnails={thumbnails[index]}
            explanation_keyword={explanation_keyword}
            explanation_description={explanation_description}
            onClick={() => handleTocItemClick(Math.floor(Number(start_time)))}
          />
        )
      )}
    </ContentWrapper>
  );
};

export default Contents;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
  margin-bottom: 20px;
`;
