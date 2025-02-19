// components/overviews/HealthOverview.tsx
import React from "react";
import styled from "styled-components";
import { HealthFocus, MethodSpotlight, LifeStyleTips } from "@/types/dataProps";

// 예: /types/dataProps.ts 내에 아래처럼 인터페이스가 있을 수 있습니다.
// interface HealthFocus {
//   focus_name: string;
//   focus_description: string;
// }
// interface KeyBenefit {
//   benefit_name: string;
//   benefit_description: string;
// }
// interface MethodSpotlight {
//   method_name: string;
//   method_description: string;
//   key_benefits: KeyBenefit[];
// }
// interface RecommendedStep {
//   step_name: string;
//   usage_instruction: string;
// }
// interface LifestyleTip {
//   tip_title: string;
//   tip_description: string;
//   recommended_step: RecommendedStep[];
// }

interface HealthOverviewProps {
  overview: {
    health_focus?: HealthFocus[];
    method_spotlight?: MethodSpotlight[];
    lifestyle_tips?: LifeStyleTips[];
  };
}

const HealthOverview: React.FC<HealthOverviewProps> = ({ overview }) => {
  return (
    <OverviewContainer>
      {/* 상단 하이라이트 타이틀 */}
      <OverviewTitle>✨ 유티클 인사이트</OverviewTitle>

      {/* 1) 건강 포커스 섹션 */}
      <SectionTitle>건강 포커스</SectionTitle>
      <Description>
        유튜브 영상에서 다뤄진 주요 건강 이슈와 포커스를 정리합니다.
      </Description>
      {overview.health_focus?.map((focus, index) => (
        <Card key={index}>
          <FocusTitle>{focus.focus_name}</FocusTitle>
          <FocusDescription>{focus.focus_description}</FocusDescription>
        </Card>
      ))}

      {/* 2) 방법/접근 방식 섹션 */}
      <SectionTitle>방법 / 접근 방식</SectionTitle>
      <Description>
        영상에서 소개된 구체적인 건강 관리 방법이나 접근 방식을 살펴봅니다.
      </Description>
      {overview.method_spotlight?.map((method, index) => (
        <MethodCard key={index}>
          <MethodName>{method.method_name}</MethodName>
          <MethodDescription>{method.method_description}</MethodDescription>

          {method.key_benefits.map((benefit, idx) => (
            <BenefitCard key={idx}>
              <BenefitName>{benefit.benefit_name}</BenefitName>
              <BenefitDescription>
                {benefit.benefit_description}
              </BenefitDescription>
            </BenefitCard>
          ))}
        </MethodCard>
      ))}

      {/* 3) 라이프스타일 팁 섹션 */}
      <SectionTitle>라이프스타일 팁</SectionTitle>
      <Description>
        일상에서 적용할 수 있는 실천 팁을 간단히 정리했습니다.
      </Description>
      {overview.lifestyle_tips?.map((tip, index) => (
        <TipCard key={index}>
          <TipTitle>{tip.tip_title}</TipTitle>
          <TipDescription>{tip.tip_description}</TipDescription>

          {tip.recommended_step.map((step, idx) => (
            <RecommendedStepText key={idx}>
              <strong>{step.step_name}</strong>
              <br />
              {step.usage_instruction}
            </RecommendedStepText>
          ))}
        </TipCard>
      ))}
    </OverviewContainer>
  );
};

export default HealthOverview;

/* ============================ Styled Components ============================ */
const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 80px;
`;

const OverviewTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  margin-top: 12px;

  &:nth-of-type(2) {
    margin-top: 48px;
  }
  &:nth-of-type(3) {
    margin-top: 48px;
  }
  &:nth-of-type(4) {
    margin-top: 48px;
  }
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.4;
`;

const Card = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

/* 건강 포커스 */
const FocusTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  line-height: 132%;
`;

const FocusDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  line-height: 1.4;
`;

/* 방법/접근 방식 */
const MethodCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
`;

const MethodName = styled.h3`
  font-size: 16px;
  font-weight: 700;
`;

const MethodDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  margin-bottom: 12px;
  line-height: 1.4;
`;

/* key_benefits */
const BenefitCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
`;

const BenefitName = styled.h4`
  font-size: 14px;
  font-weight: 700;
`;

const BenefitDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  line-height: 1.4;
`;

/* 라이프스타일 팁 */
const TipCard = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const TipTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
`;

const TipDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const RecommendedStepText = styled.p`
  font-size: 13px;
  color: #555;
  margin-top: 16px;
  line-height: 1.4;

  strong {
    font-weight: 700;
    margin-bottom: 4px;
    color: #000;
  }
`;
