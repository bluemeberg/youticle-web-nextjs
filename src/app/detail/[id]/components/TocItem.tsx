"use client"; // Ensure the component is treated as a client component

import styled from "styled-components";
import PlayIcon from "@/assets/play.svg";
import {
  formatTimeRange,
  formatSummary,
  formatSecondsToMmSs,
} from "@/utils/formatter";
import DimmedArea from "./DimmedArea";
import { forwardRef } from "react";
import { Section } from "@/types/dataProps";
import { Overview } from "@/types/dataProps";
import { usePathname } from "next/navigation";

interface TocItemProps {
  section: string;
  videoId: string;
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
  isLoggedOut: boolean;
  isUnsubscribedSection: boolean;
  isNoSubscribedSubjects: boolean;
  subscribedSubjects: string[];
  overview: Overview | undefined;
  summaryAnchor?: string;
  summaryStart?: number;
}
const TocItem = forwardRef<HTMLDivElement, TocItemProps>(
  (
    {
      section,
      videoId,
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
      isLoggedOut,
      isUnsubscribedSection,
      isNoSubscribedSubjects,
      subscribedSubjects,
      overview,
      summaryAnchor,
      summaryStart,
    },
    ref
  ) => {
    const pathname = usePathname();
    const isEditorPath = pathname.includes("/editor");
    const summaryAttr = Number.isFinite(summaryStart)
      ? Math.max(0, summaryStart as number)
      : Math.max(0, Math.floor(start));
    const normalizedStart = Math.max(0, Math.floor(start));
    const timelineLabel = formatSecondsToMmSs(normalizedStart);
    console.log("썸네일", thumbnails);
    return (
      <Container
        ref={ref}
        data-summary-start={summaryAttr.toString()}
        data-timeline-label={timelineLabel}
        id={summaryAnchor}
      >
        <ContentWrapper $dimmed={dimmed} $partialDimmed={partialDimmed}>
          <Title>{title}</Title>
          {thumbnails && (
            <Thumbnail onClick={onClick}>
              {!isEditorPath ? (
                <img
                  // src={`https://youticle.shop/captures/${videoId}/${thumbnails}`}
                  src={thumbnails}
                  alt={title}
                />
              ) : (
                <img src={thumbnails} alt={title} />
              )}
              <PlayIcon className="play-icon" />
            </Thumbnail>
          )}
          <Timeline
            type="button"
            onClick={onClick}
            data-summary-start={summaryAttr.toString()}
            data-timeline-label={timelineLabel}
          >
            <PlayIcon width={16} height={16} />
            <span>{formatTimeRange(start)}</span>
          </Timeline>
          <Summary>
            {Array.isArray(summary) ? (
              <ul>
                {(summary as string[]).map((line, i) => (
                  <li key={i}>{formatSummary(line)}</li>
                ))}
              </ul>
            ) : (
              formatSummary(summary as string)
            )}{" "}
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
        {dimmed && (
          <DimmedArea
            tocItemHeight={tocItemHeight}
            videoId={videoId}
            toc={toc}
            isLoggedOut={isLoggedOut}
            isUnsubscribedSection={isUnsubscribedSection}
            isNoSubscribedSubjects={isNoSubscribedSubjects}
            subscribedSubjects={subscribedSubjects}
            section={section}
            overview={overview}
          />
        )}
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
      ? `mask-image: linear-gradient(to top, transparent 20%, black 100%);
      `
      : ""}
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 700;
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

const Timeline = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
  padding: 8px 14px;
  background: #ececec;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  color: #0f172a;
  font-weight: 600;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  span {
    font-size: 14px;
    line-height: 1.2;
  }

  &:hover,
  &:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
    outline: none;
  }
`;

const Summary = styled.div`
  font-size: 16px;
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
  font-size: 14px;
  margin-top: 36px;
`;

const Tip = styled.span`
  font-weight: 700;
  background-color: #e9f4ff;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
  margin-left: 4px;
`;

const TipAreaDescription = styled.div`
  font-size: 14px;
  line-height: 152%;
  margin-top: 8px;
`;
