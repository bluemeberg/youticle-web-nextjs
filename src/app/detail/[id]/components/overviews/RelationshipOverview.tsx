import React from "react";
import styled from "styled-components";

interface Audience {
  label: string;
  description: string;
}
interface RelTrend {
  trend_name: string;
  trend_description: string;
}
interface ActionTip {
  tip_title: string;
  tip_description: string;
}
interface InsightItem {
  insight_name: string;
  insight_description: string;
  action_tips: ActionTip[];
}

interface RelationshipOverviewProps {
  overview: {
    target_audience?: Audience[];
    relationship_trends?: RelTrend[];
    practical_insights?: InsightItem[];
  };
}

const RelationshipOverview: React.FC<RelationshipOverviewProps> = ({
  overview,
}) => {
  return (
    <Container>
      <Title>✨ 연애·결혼 인사이트</Title>

      {/* 타겟 오디언스 */}
      {overview.target_audience && overview.target_audience.length > 0 && (
        <Section>
          <SectionTitle>누가 보면 좋을까요?</SectionTitle>
          <SectionDesc>
            영상 정보가 특히 유용한 타겟 그룹을 정리했습니다.
          </SectionDesc>
          {overview.target_audience.map((aud, idx) => (
            <AudienceBlock key={idx}>
              <AudienceLabel>{aud.label}</AudienceLabel>
              <AudienceDesc>{aud.description}</AudienceDesc>
            </AudienceBlock>
          ))}
        </Section>
      )}

      {/* 연애/결혼 트렌드 */}
      {overview.relationship_trends &&
        overview.relationship_trends.length > 0 && (
          <Section>
            <SectionTitle>연애·결혼 트렌드</SectionTitle>
            <SectionDesc>
              영상에서 언급된 핵심 트렌드나 최신 결혼·연애 동향을 살펴봅니다.
            </SectionDesc>
            {overview.relationship_trends.map((trend, idx) => (
              <TrendBlock key={idx}>
                <TrendName>{trend.trend_name}</TrendName>
                <TrendDesc>{trend.trend_description}</TrendDesc>
              </TrendBlock>
            ))}
          </Section>
        )}

      {/* 실용적 인사이트 */}
      {overview.practical_insights &&
        overview.practical_insights.length > 0 && (
          <Section>
            <SectionTitle>실용적 인사이트</SectionTitle>
            <SectionDesc>
              실제 연애·결혼에 도움이 될 만한 팁과 방법을 정리했습니다.
            </SectionDesc>
            {overview.practical_insights.map((insight, idx) => (
              <InsightBlock key={idx}>
                <InsightName>{insight.insight_name}</InsightName>
                <InsightDesc>{insight.insight_description}</InsightDesc>

                {insight.action_tips.length > 0 && (
                  <TipsHeader>실천 팁</TipsHeader>
                )}
                {insight.action_tips.map((tip, tIdx) => (
                  <TipItem key={tIdx}>
                    <TipTitle>{tip.tip_title}</TipTitle>
                    <TipDesc>{tip.tip_description}</TipDesc>
                  </TipItem>
                ))}
              </InsightBlock>
            ))}
          </Section>
        )}
    </Container>
  );
};

export default RelationshipOverview;

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
  line-height: 132%;
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
  line-height: 120%;
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

const InsightBlock = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const InsightName = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const InsightDesc = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
  line-height: 132%;
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
  margin-bottom: 4px;
`;
const TipDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 132%;
  margin-top: 8px;
`;
