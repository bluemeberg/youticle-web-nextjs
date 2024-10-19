"use client";

import { calcuateTimeLeft } from "@/utils/formatter";
import { useState, useEffect, forwardRef, Ref, useRef } from "react";
import styled from "styled-components";
import InfoIcon from "@/assets/info.svg";

interface CountdownTimerProps {
  scrollRef?: Ref<HTMLSpanElement>;
}
const TOOLTIP_OPTION1 =
  "매일 오전 7시 30분에 모든 주제의 아티클들이 갱신됩니다. 단, 주식 주제는 국내 증시 소식 갱신을 위해 오후 6시에 중간 갱신됩니다.";
const CountdownTimer = ({ scrollRef }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState("");
  const infoIconRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      infoIconRef.current &&
      !infoIconRef.current.contains(e.target as Node)
    ) {
      setTooltipVisible(false);
    }
  };

  useEffect(() => {
    if (tooltipVisible) document.addEventListener("click", handleClickOutside);
    else document.removeEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [tooltipVisible]);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcuateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Description>
        <TimeContainer>
          <TimeWarning>다음 업데이트까지 남은 시간.</TimeWarning>
        </TimeContainer>
        <TooltipSection ref={infoIconRef}>
          <InfoIcon onClick={handleClickIcon} />
          {tooltipVisible && (
            <Tooltip $tooltipVisible={tooltipVisible}>
              <span>{TOOLTIP_OPTION1}</span>
            </Tooltip>
          )}
        </TooltipSection>
      </Description>
      <Time ref={scrollRef} timeLeft={timeLeft} />
    </>
  );
};

CountdownTimer.displayName = "CountdownTimer";
export default CountdownTimer;

const TimeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 좌측 정렬로 맞춤 */
  margin-left: 8px;
`;
const TimeWarning = styled.span`
  font-size: 16px;
  font-weight: 600;
  line-height: 16.71px;
`;

interface TimeProps {
  timeLeft: string;
}

const Time = forwardRef<HTMLSpanElement, TimeProps>(({ timeLeft }, ref) => (
  <>
    <Container>
      <StyledTime ref={ref}>{timeLeft}</StyledTime>
    </Container>
  </>
));

Time.displayName = "Time"; // 추가된 부분
const TooltipSection = styled.div`
  position: relative;
  cursor: pointer;
`;
const StyledTime = styled.span`
  font-size: 32px;
  font-weight: 500;
  line-height: 16px;
  text-align: left;
  padding-bottom: 12px;
  min-width: 128px;
  max-width: 128px;
`;

const Container = styled.div`
  display: flex;
  margin-bottom: 12px;
  justify-content: flex-start;
  margin-left: 8px;
`;

const Description = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  justify-content: flex-start;
`;

const Tooltip = styled.div<{ $tooltipVisible: boolean }>`
  position: absolute;
  right: 0;
  top: 20px;
  background-color: #555555;
  color: #fff;
  z-index: 1000;
  display: ${(props) => (props.$tooltipVisible ? "block" : "none")};
  width: 240px;
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
