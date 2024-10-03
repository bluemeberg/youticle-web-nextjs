"use client";

import { calcuateTimeLeft } from "@/utils/formatter";
import { useState, useEffect, forwardRef, Ref, useRef } from "react";
import styled from "styled-components";
import InfoIcon from "@/assets/info.svg";

interface CountdownTimerProps {
  scrollRef?: Ref<HTMLSpanElement>;
}
const ReportCountdownTimer = ({ scrollRef }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcuateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <TimeContainer>
        <TimeWarning>
          {" "}
          다음 업데이트까지 남은 시간. (매일 오전 7시 30분 갱신)
        </TimeWarning>
      </TimeContainer>
      <Time ref={scrollRef} timeLeft={timeLeft} />
    </>
  );
};

ReportCountdownTimer.displayName = "ReportCountdownTimer";
export default ReportCountdownTimer;

const TimeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 8px;
  margin-bottom: 16px;
`;
const TimeWarning = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 120%;
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
  border-bottom: 1px solid rgba(0, 0, 0, 1);
  display: flex;
`;
