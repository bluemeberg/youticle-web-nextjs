"use client"; // Ensure the component is treated as a client component

import styled from "styled-components";
import PlayIcon from "@/assets/play.svg";
import { formatTimeRange } from "@/utils/formatter";
import DimmedArea from "./DimmedArea";
import { forwardRef } from "react";
import { formatSummary } from "@/utils/formatter";
import { Section } from "@/types/dataProps";

interface TocItemProps {
  title: string;
  start: number;
  summary: string;
  thumbnails: string;
  explanation_keyword: string;
  explanation_description: string;
  toc: Section[];
  tocItemHeight: number;
  partialDimmed: boolean;
  dimmed: boolean;
  onClick: () => void;
}
const TocItem = forwardRef<HTMLDivElement, TocItemProps>(
  (
    {
      title,
      start,
      summary,
      thumbnails,
      explanation_keyword,
      explanation_description,
      partialDimmed,
      dimmed,
      toc,
      tocItemHeight,
      onClick,
    },
    ref
  ) => {
    return (
      <Container ref={ref}>
        <ContentWrapper $dimmed={dimmed} $partialDimmed={partialDimmed}>
          <Title>{title}</Title>
          <Thumbnail onClick={onClick}>
            <img src={thumbnails} alt={title} />
            <PlayIcon className="play-icon" />
          </Thumbnail>
          <Timeline>
            <PlayIcon width={16} height={16} />
            <span>{formatTimeRange(start)}</span>
          </Timeline>
          <Summary>
            {formatSummary(summary)}
            {explanation_keyword ? (
              <TipArea>
                💡 <Tip>{explanation_keyword}</Tip>
              </TipArea>
            ) : null}

            {explanation_description && (
              <TipAreaDescription>{explanation_description}</TipAreaDescription>
            )}
          </Summary>
        </ContentWrapper>
        {dimmed && <DimmedArea tocItemHeight={tocItemHeight} toc={toc} />}
      </Container>
    );
  }
);
TocItem.displayName = "TocItem";
export default TocItem;

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 60px;
`;

const ContentWrapper = styled.div<{
  $dimmed: boolean;
  $partialDimmed: boolean;
}>`
  opacity: ${(props) => (props.$dimmed ? 0.2 : 1)};
  ${({ $partialDimmed }) =>
    $partialDimmed
      ? `mask-image: linear-gradient(to top, transparent 20%, black 100%);`
      : ""}
`;

const Title = styled.span`
  font-size: 24px;
  font-weight: 600;
  line-height: 140%;
`;

const Thumbnail = styled.div`
  position: relative;
  margin-top: 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  width: 100%;
  padding-bottom: 56.25%;
  background-color: #f0f0f0;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .play-icon svg {
    width: 40px;
    height: 40px;
  }
`;

const Timeline = styled.div`
  display: flex;
  align-items: center;
  height: 18px;
  gap: 12px;
  margin-bottom: 24px;

  span {
    font-size: 14px;
    font-weight: 500;
    line-height: 16.71px;
  }
`;

const Summary = styled.div`
  font-size: 18px;
  font-weight: 400;
  line-height: 168%;
  margin-left: 8px;

  span {
    display: block;
  }

  span.line-break {
    font-weight: 400;
    line-height: 168%;
    margin-bottom: 12px;
  }
`;

const TipArea = styled.div`
  display: flex;
  font-size: 16px;
  margin-top: 36px;
`;

const Tip = styled.span`
  font-weight: 700;
  background-color: #30d5c8;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
  margin-left: 4px;
`;

const TipAreaDescription = styled.div`
  font-size: 16px;
  line-height: 152%;
  margin-top: 8px;
`;
