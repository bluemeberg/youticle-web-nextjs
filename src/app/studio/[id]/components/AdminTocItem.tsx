"use client"; // Ensure the component is treated as a client component

import styled from "styled-components";
import PlayIcon from "@/assets/play.svg";
import { formatTimeRange, formatSummary } from "@/utils/formatter";
import AdminDimmedArea from "./AdminDimmedArea";
import { forwardRef } from "react";
import { Section } from "@/types/dataProps";
import { Overview } from "@/types/dataProps";
import { usePathname } from "../../../../../node_modules/next/navigation";

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
}
const AdminTocItem = forwardRef<HTMLDivElement, TocItemProps>(
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
    },
    ref
  ) => {
    const pathname = usePathname();
    const isEditorPath = pathname.includes("/editor");
    console.log(start);
    return (
      <Container ref={ref}>
        <ContentWrapper $dimmed={dimmed} $partialDimmed={partialDimmed}>
          <SectionCard ref={ref}>
            <Header>
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
              <Timeline onClick={onClick}>
                <PlayIcon width={16} height={16} />
                <span>{formatTimeRange(start)}</span>
              </Timeline>
            </Header>
            <Summary>
              {formatSummary(summary)}
              {explanation_keyword ? (
                <TipArea>
                  💡 <Tip>{explanation_keyword}</Tip>
                </TipArea>
              ) : null}
              {explanation_description && (
                <TipAreaDescription>
                  {explanation_description}
                </TipAreaDescription>
              )}
            </Summary>
          </SectionCard>
        </ContentWrapper>
        {/* {dimmed && (
          <AdminDimmedArea
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
        )} */}
      </Container>
    );
  }
);
AdminTocItem.displayName = "AdminTocItem";
export default AdminTocItem;

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

const SectionCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
    width: 16px;
    height: 16px;
  }
`;

const Timeline = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0px 12px 8px;
  border: 1px solid #007bff;
  border-radius: 8px;
  background-color: #eaf4ff;
  margin-left: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #007bff;
    span {
      color: white;
    }
  }

  svg {
    width: 14px;
    height: 14px;
    fill: #007bff;
    transition: fill 0.2s ease;
  }

  span {
    font-size: 12px;
    font-weight: 600;
    color: #007bff;
    transition: color 0.2s ease;
    min-width: 56px;
  }
`;

const Summary = styled.div`
  font-size: 16px;
  font-weight: 400;
  line-height: 168%;

  span {
    display: block;
  }

  span.line-break {
    font-weight: 400;
    line-height: 148%;
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
  color: #007bff;
`;

const TipAreaDescription = styled.div`
  font-size: 14px;
  line-height: 152%;
  margin-top: 8px;
`;

const PlayIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e9e9e9;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #007bff; /* 아이콘 배경 강조 */
  }

  svg {
    width: 16px;
    height: 16px;
    fill: white;
  }
`;
