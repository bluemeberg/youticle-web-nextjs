// components/overviews/HealthOverviewBusinessStyle.tsx
import React from "react";
import styled from "styled-components";

// 1) Type Definitions
interface TargetAudience {
  label: string;
  description: string;
}
interface HealthTrend {
  trend_name: string;
  trend_description: string;
}
interface AppTip {
  tip_title: string;
  tip_description: string;
}
interface HealthStrategy {
  strategy_name: string;
  strategy_description: string;
  application_tips: AppTip[];
}
interface HealthOverviewBusinessProps {
  overview: {
    target_audience?: TargetAudience[];
    health_trends?: HealthTrend[];
    health_strategic_insights?: HealthStrategy[];
  };
}

// 2) Component
const HealthOverviewBusinessStyle: React.FC<HealthOverviewBusinessProps> = ({
  overview,
}) => {
  return (
    <Container>
      <Title>✨ 유티클 인사이트</Title>

      {/* (A) 타겟 오디언스 */}
      {overview.target_audience && overview.target_audience.length > 0 && (
        <Section>
          <SectionTitle>누가 보면 좋을까요?</SectionTitle>
          <SectionDesc>
            영상에서 다뤄진 건강 정보를 특히 유용하게 쓸 수 있는 타겟
            그룹입니다.
          </SectionDesc>
          {overview.target_audience.map((aud, idx) => (
            <AudienceBlock key={idx}>
              <AudienceLabel>{aud.label}</AudienceLabel>
              <AudienceDesc>{aud.description}</AudienceDesc>
            </AudienceBlock>
          ))}
        </Section>
      )}

      {/* (B) 건강 트렌드 */}
      {overview.health_trends && overview.health_trends.length > 0 && (
        <Section>
          <SectionTitle>건강 트렌드</SectionTitle>
          <SectionDesc>
            영상에서 강조된 주요 건강 이슈나 흐름을 요약했습니다.
          </SectionDesc>
          {overview.health_trends.map((trend, idx) => (
            <TrendBlock key={idx}>
              <TrendName>{trend.trend_name}</TrendName>
              <TrendDesc>{trend.trend_description}</TrendDesc>
            </TrendBlock>
          ))}
        </Section>
      )}

      {/* (C) 건강 전략적 인사이트 */}
      {overview.health_strategic_insights &&
        overview.health_strategic_insights.length > 0 && (
          <Section>
            <SectionTitle>전략적 건강 인사이트</SectionTitle>
            <SectionDesc>
              트렌드를 실제 생활에 적용하기 위한 핵심 전략과 팁을 살펴보세요.
            </SectionDesc>

            {overview.health_strategic_insights.map((strategy, idx) => (
              <StrategyBlock key={idx}>
                <StrategyName>{strategy.strategy_name}</StrategyName>
                <StrategyDesc>{strategy.strategy_description}</StrategyDesc>

                {strategy.application_tips.length > 0 && (
                  <TipsHeader>실천 팁</TipsHeader>
                )}
                {strategy.application_tips.map((tip, tidx) => (
                  <TipItem key={tidx}>
                    <TipTitle>{tip.tip_title}</TipTitle>
                    <TipDescription>{tip.tip_description}</TipDescription>
                  </TipItem>
                ))}
              </StrategyBlock>
            ))}
          </Section>
        )}
    </Container>
  );
};

export default HealthOverviewBusinessStyle;

// 3) Styled
const Container = styled.div`
  padding: 0 16px;
  margin-top: 80px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
`;

const Section = styled.div`
  margin-bottom: 36px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const SectionDesc = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.4;
`;

/* Target Audience */
const AudienceBlock = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
`;

const AudienceLabel = styled.h4`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const AudienceDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 132%;
`;

/* Health Trends */
const TrendBlock = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const TrendName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const TrendDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 132%;
`;

/* Health Strategic Insights */
const StrategyBlock = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const StrategyName = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const StrategyDesc = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const TipsHeader = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  margin-top: 8px;
`;

const TipItem = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
`;

const TipTitle = styled.h5`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const TipDescription = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 132%;
  margin-top: 8px;
`;
