// components/overviews/BusinessOverview.tsx
import React from "react";
import {
  BusinessTrend,
  StrategicInsight,
  ApplicationTip,
  RelatedTool,
} from "@/types/dataProps";
import styled, { keyframes } from "styled-components";
interface BusinessOverviewProps {
  overview: {
    business_trends?: BusinessTrend[];
    strategic_insights?: StrategicInsight[];
  };
}

const BusinessOverview: React.FC<BusinessOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <OverviewTitle>✨ 하이라이트</OverviewTitle>
    <SectionTitle>비즈니스 트렌드</SectionTitle>
    <Description>
      유튜브 영상에서 설명된 비즈니스 업계의 최신 트렌드를 소개합니다.
    </Description>
    {overview.business_trends?.map((trend, index) => (
      <Card key={index}>
        <TrendTitle>{trend.trend_name}</TrendTitle>
        <TrendDescription>{trend.trend_description}</TrendDescription>
      </Card>
    ))}

    <SectionTitle>전략적 인사이트</SectionTitle>
    <Description>
      비즈니스 성장과 성과 향상을 위한 전략적 인사이트를 제공합니다.
    </Description>
    {overview.strategic_insights?.map((insight, index) => (
      <BrandCard key={index}>
        <BrandName>{insight.strategy_name}</BrandName>
        <BrandDescription>{insight.strategy_description}</BrandDescription>
        <ProductCardTitle>📌 주요 팁</ProductCardTitle>
        {insight.application_tips.map((tip, idx) => (
          <TipContainer key={idx}>
            <TipTitle>{tip.tip_title}</TipTitle>
            <TipDescription>{tip.tip_description}</TipDescription>
            {tip.related_tools.map((tool, toolIdx) => (
              <>
                <ToolTitle>💡 {tool.tool_name}</ToolTitle>
                <TipDescription>{tool.tool_usage_description}</TipDescription>
              </>
            ))}
          </TipContainer>
        ))}
      </BrandCard>
    ))}
  </OverviewContainer>
);

export default BusinessOverview;
const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 20px;
`;
const TrendTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  line-height: 132%;
`;

const OverviewTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
`;

const TrendDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  line-height: 128%;
`;

const BrandCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
`;

const BrandName = styled.h3`
  font-size: 18px;
  font-weight: 700;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 128%;
`;

const BrandDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  margin-bottom: 12px;
  line-height: 128%;
`;

const ProductCardTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
`;

const TipTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
`;

const ToolTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin-top: 20px;
`;

const TipDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  line-height: 132%;
`;

const TipContainer = styled.div`
  background-color: #f7f7f7;
  padding: 20px;
  margin-top: 8px;
  border-radius: 6px;
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
    margin-top: 48px; // Different margin for the third SectionTitle
  }
  &:nth-of-type(4) {
    margin-top: 48px; // Different margin for the third SectionTitle
  }
`;

const Card = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;
