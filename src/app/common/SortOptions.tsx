"use client";

import { forwardRef, useEffect, useRef } from "react";
import styled from "styled-components";
import InfoIcon from "@/assets/info.svg";

const TOOLTIP_OPTION1 =
  "조회수 대비 참여도(좋아요, 댓글 수 등)가 높은 순으로 오늘 업로드된 최대 6개의 영상이 각 주제 별로 노출됩니다.";
const TOOLTIP_OPTION2 =
  "조회수가 높은 순으로 오늘 업로드된 최대 6개의 영상이 각 주제 별로 노출됩니다.";

interface SortOptionsProps {
  isFixed?: boolean;
  sortCriteria: string;
  tooltipVisible: boolean;
  setTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleSortClick: (criteria: string) => void;
  handleClickIcon: (e: React.MouseEvent) => void;
  variant: "default" | "border";
}

const SortOptions = forwardRef<HTMLDivElement, SortOptionsProps>(
  (
    {
      isFixed = false,
      sortCriteria,
      tooltipVisible,
      setTooltipVisible,
      handleSortClick,
      handleClickIcon,
      variant,
    },
    ref
  ) => {
    const infoIconRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        infoIconRef.current &&
        !infoIconRef.current.contains(e.target as Node)
      ) {
        setTooltipVisible(false);
      }
    };

    useEffect(() => {
      if (tooltipVisible)
        document.addEventListener("click", handleClickOutside);
      else document.removeEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, [tooltipVisible]);

    return (
      <Container $isFixed={isFixed} variant={variant} ref={ref}>
        <div>
          <OptionBtn
            selected={sortCriteria === "engagement"}
            onClick={() => handleSortClick("engagement")}
            variant={variant}
          >
            참여도
          </OptionBtn>
          <OptionBtn
            selected={sortCriteria === "views"}
            onClick={() => handleSortClick("views")}
            variant={variant}
          >
            조회수
          </OptionBtn>
        </div>
        <TooltipSection ref={infoIconRef}>
          <InfoIcon onClick={handleClickIcon} />
          {tooltipVisible && (
            <Tooltip $tooltipVisible={tooltipVisible}>
              <span>
                {sortCriteria === "engagement"
                  ? TOOLTIP_OPTION1
                  : TOOLTIP_OPTION2}
              </span>
            </Tooltip>
          )}
        </TooltipSection>
      </Container>
    );
  }
);
SortOptions.displayName = "SortOptions";
export default SortOptions;

const Container = styled.div<{
  $isFixed: boolean;
  variant: "default" | "border";
}>`
  display: flex;
  justify-content: right;
  align-items: center;
  margin-bottom: 16px;
  margin-top: ${(props) =>
    props.variant === "border" ? "32px" : props.$isFixed ? "130px" : "20px"};

  div {
    display: flex;
    gap: 4px;
  }
`;

const TooltipSection = styled.div`
  position: relative;
  cursor: pointer;
`;

const Tooltip = styled.div<{ $tooltipVisible: boolean }>`
  position: absolute;
  right: 0;
  top: 20px;
  background-color: #555555;
  color: #fff;
  z-index: 1000;
  display: ${(props) => (props.$tooltipVisible ? "block" : "none")};
  width: 180px;
  padding: 12px 13px;
  border-radius: 12px;

  span {
    font-family: Inter;
    font-size: 12px;
    font-weight: 500;
    line-height: 16.8px;
    text-align: left;
  }
`;

const OptionBtn = styled.button<{
  selected: boolean;
  variant: "default" | "border";
}>`
  width: 72px;
  height: 28px;
  border-radius: 4px;
  background-color: ${(props) => (props.selected ? "#007BFF" : "transparent")};
  font-family: var(--font-Pretendard);
  font-size: 12px;
  font-weight: 500;
  line-height: 14.52px;
  color: ${(props) => (props.selected ? "#FFFFFF" : "#007BFF")};
  border: 1px solid #007bff;
  ${({ variant, selected }) =>
    variant === "border"
      ? selected
        ? "border: 1px solid rgba(0,0,0,1);"
        : "border: none;"
      : ""}; /* color: ${(props) =>
    props.variant === "border"
      ? props.selected
        ? "rgba(0,0,0,0.9059)"
        : "rgba(126,126,126,1)"
      : props.selected
      ? "#000000E7"
      : "#7E7E7E"}; */
`;
