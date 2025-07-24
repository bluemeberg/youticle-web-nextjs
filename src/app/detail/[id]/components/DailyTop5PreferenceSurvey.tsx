import styled from "styled-components";
import { useState } from "react";

const SurveyCard = styled.div`
  margin: 24px 16px;
  padding: 16px;
  background: #f5f8ff;
  border: 1px solid #cce0ff;
  border-radius: 8px;
  text-align: center;
  font-size: 15px;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 12px;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ primary }) => (primary ? "#0066ff" : "#e0e0e0")};
  color: ${({ primary }) => (primary ? "#fff" : "#333")};
`;

interface PreferenceSurveyProps {
  onAnswer: (like: boolean) => void;
}

export function DailyTop5PreferenceSurvey({ onAnswer }: PreferenceSurveyProps) {
  const [answered, setAnswered] = useState<boolean | null>(null);

  const handleClick = (like: boolean) => {
    setAnswered(like);
    onAnswer(like);
  };

  if (answered !== null) {
    return (
      <SurveyCard>
        {answered
          ? "의견 감사합니다! 😊"
          : "의견 감사합니다! 언제든 변경 가능해요."}
      </SurveyCard>
    );
  }

  return (
    <SurveyCard>
      📊 <strong>매일 TOP5 영상 알림</strong>에 대해
      <br />
      어떻게 생각하세요?
      <ButtonGroup>
        <Button primary onClick={() => handleClick(true)}>
          좋아요
        </Button>
        <Button onClick={() => handleClick(false)}>관심 없어요</Button>
      </ButtonGroup>
    </SurveyCard>
  );
}
