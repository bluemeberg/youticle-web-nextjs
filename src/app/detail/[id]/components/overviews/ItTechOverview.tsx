import React from "react";
import styled from "styled-components";

interface Audience {
  label: string;
  description: string;
}
interface TechTrend {
  trend_name: string;
  trend_description: string;
}
interface ApplicationTip {
  tip_title: string;
  tip_description: string;
}
interface TechStrategy {
  technology_name: string;
  technology_description: string;
  usage_tips: ApplicationTip[];
}
interface ItTechOverviewProps {
  overview: {
    target_audience?: Audience[];
    tech_trends?: TechTrend[];
    tech_strategic_insights?: TechStrategy[];
  };
}

const ItTechOverview: React.FC<ItTechOverviewProps> = ({ overview }) => {
  return (
    <Container>
      <Title>✨ 유티클 인사이트</Title>

      {/* 타겟 오디언스 */}
      {overview.target_audience && overview.target_audience.length > 0 && (
        <Section>
          <SectionTitle>누가 보면 좋을까요?</SectionTitle>
          <SectionDesc>영상 정보가 유용할 타겟 그룹을 소개합니다.</SectionDesc>

          {overview.target_audience.map((aud, idx) => (
            <AudienceBlock key={idx}>
              <AudienceLabel>{aud.label}</AudienceLabel>
              <AudienceDesc>{aud.description}</AudienceDesc>
            </AudienceBlock>
          ))}
        </Section>
      )}

      {/* 테크 트렌드 */}
      {overview.tech_trends && overview.tech_trends.length > 0 && (
        <Section>
          <SectionTitle>테크 트렌드</SectionTitle>
          <SectionDesc>영상에서 강조된 IT 흐름을 요약합니다.</SectionDesc>

          {overview.tech_trends.map((trend, idx) => (
            <TrendBlock key={idx}>
              <TrendName>{trend.trend_name}</TrendName>
              <TrendDesc>{trend.trend_description}</TrendDesc>
            </TrendBlock>
          ))}
        </Section>
      )}

      {/* 전략적 인사이트 */}
      {overview.tech_strategic_insights &&
        overview.tech_strategic_insights.length > 0 && (
          <Section>
            <SectionTitle>전략적 인사이트</SectionTitle>
            <SectionDesc>
              트렌드를 실제 환경에 적용하기 위한 핵심 전략을 살펴보세요.
            </SectionDesc>

            {overview.tech_strategic_insights.map((strategy, idx) => (
              <StrategyBlock key={idx}>
                <StrategyName>{strategy.technology_name}</StrategyName>
                <StrategyDesc>{strategy.technology_description}</StrategyDesc>

                {strategy.usage_tips.length > 0 && (
                  <TipsHeader>적용 팁</TipsHeader>
                )}
                {strategy.usage_tips.map((tip, tIdx) => (
                  <TipItem key={tIdx}>
                    <TipTitle>{tip.tip_title}</TipTitle>
                    <TipDesc>{tip.tip_description}</TipDesc>
                  </TipItem>
                ))}
              </StrategyBlock>
            ))}
          </Section>
        )}
    </Container>
  );
};

export default ItTechOverview;

// Styled:
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
  margin-bottom: 8px;
`;

const SectionDesc = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
`;

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
  margin-top: 8px;
`;

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
  line-height: 132%;
  margin-top: 4px;
`;
const TipsHeader = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  margin-top: 20px;
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
  margin-bottom: 8px;
`;
const TipDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 132%;
`;
