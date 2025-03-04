// components/overviews/BusinessOverview.tsx
import React from "react";
import styled from "styled-components";
import { BusinessTrend, StrategicInsight } from "@/types/dataProps";

interface TargetAudience {
  label: string;
  description: string;
}

interface BusinessOverviewProps {
  overview: {
    target_audience?: TargetAudience[];
    business_trends?: BusinessTrend[];
    strategic_insights?: StrategicInsight[];
  };
}

const BusinessOverview: React.FC<BusinessOverviewProps> = ({ overview }) => {
  return (
    <OverviewContainer>
      {/* 상단 하이라이트 */}
      <OverviewTitle>✨ 유티클 인사이트</OverviewTitle>

      {/* 타겟 오디언스 */}
      {overview.target_audience && overview.target_audience.length > 0 && (
        <SectionBlock>
          <SectionTitle>누가 보면 좋은 영상인가요?</SectionTitle>
          <SectionDesc>
            영상에서 소개된 기업/트렌드가 특히 도움이 될 이들을 정리했습니다.
          </SectionDesc>
          {overview.target_audience.map((aud, idx) => (
            <AudienceCard key={idx}>
              <AudienceLabel>{aud.label}</AudienceLabel>
              <AudienceDesc>{aud.description}</AudienceDesc>
            </AudienceCard>
          ))}
        </SectionBlock>
      )}

      {/* 비즈니스 트렌드 */}
      <SectionBlock>
        <SectionTitle>비즈니스 트렌드</SectionTitle>
        <SectionDesc>
          유튜브 영상에서 설명된 주요 트렌드와 시장 변화를 간단히 정리했습니다.
        </SectionDesc>
        {overview.business_trends?.map((trend, index) => (
          <TrendCard key={index}>
            <TrendName>{trend.trend_name}</TrendName>
            <TrendDesc>{trend.trend_description}</TrendDesc>
          </TrendCard>
        ))}
      </SectionBlock>

      {/* 전략적 인사이트 */}
      <SectionBlock>
        <SectionTitle>전략적 인사이트</SectionTitle>
        <SectionDesc>
          트렌드에 맞춰 성장 기회를 모색할 수 있는 핵심 전략을 살펴보세요.
        </SectionDesc>
        {overview.strategic_insights?.map((insight, i) => (
          <InsightCard key={i}>
            <InsightTitle>{insight.strategy_name}</InsightTitle>
            <InsightDesc>{insight.strategy_description}</InsightDesc>

            {/* 주요 팁 */}
            {insight.application_tips.length > 0 && (
              <>
                <TipsHeader>주요 팁</TipsHeader>
                {insight.application_tips.map((tip, idx) => (
                  <TipItem key={idx}>
                    <TipTitle>{tip.tip_title}</TipTitle>
                    <TipDesc>{tip.tip_description}</TipDesc>
                  </TipItem>
                ))}
              </>
            )}
          </InsightCard>
        ))}
      </SectionBlock>
    </OverviewContainer>
  );
};

export default BusinessOverview;

/* ================== Styled Components ================== */
const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 80px;
`;

const OverviewTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
`;

const SectionBlock = styled.div`
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

/* 타겟 오디언스 카드 */
const AudienceCard = styled.div`
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
  line-height: 1.3;
`;

/* 비즈니스 트렌드 */
const TrendCard = styled.div`
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
  line-height: 1.4;
`;

/* 전략적 인사이트 */
const InsightCard = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const InsightTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const InsightDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 1.4;
  margin-bottom: 12px;
`;

const TipsHeader = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
  margin-bottom: 8px;
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
  line-height: 1.4;
`;
