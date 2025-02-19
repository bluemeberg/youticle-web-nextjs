// components/overviews/AIOverview.tsx
import React from "react";
import { AITrend, RelatedTechnology } from "@/types/dataProps";
import styled, { keyframes } from "styled-components";

interface AIOverviewProps {
  overview: {
    ai_trends?: AITrend[];
    related_technologies?: RelatedTechnology[];
  };
}

const AIOverview: React.FC<AIOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <OverviewTitle>✨ 유티클 인사이트</OverviewTitle>

    <SectionTitle>AI 트렌드</SectionTitle>
    <Description>
      유튜브 영상에서 설명된 AI 기술의 발전 동향을 소개합니다.
    </Description>
    {overview.ai_trends?.map((trend, index) => (
      <Card key={index}>
        <TrendTitle>{trend.trend_name}</TrendTitle>
        <TrendDescription>{trend.trend_description}</TrendDescription>
      </Card>
    ))}

    <SectionTitle>AI 적용 기술</SectionTitle>
    <Description>영상에 소개된 AI 기술을 설명합니다.</Description>
    {overview.related_technologies?.map((tech, index) => (
      <BrandCard key={index}>
        <BrandName>{tech.technology_name}</BrandName>
        <BrandDescription>{tech.technology_description}</BrandDescription>
        <ProductCardTitle>주요 특징</ProductCardTitle>
        {tech.usage_tips.map((tip, idx) => (
          <ProductCard key={idx}>
            <ProductName>{tip.tip_title}</ProductName>
            <ProductDescription>{tip.tip_description}</ProductDescription>
          </ProductCard>
        ))}
      </BrandCard>
    ))}
  </OverviewContainer>
);

export default AIOverview;

const Card = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const OverviewTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
`;

const TrendTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  line-height: 132%;
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

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 128%;
`;

const BrandName = styled.h3`
  font-size: 18px;
  font-weight: 700;
`;

const BrandDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  margin-bottom: 12px;
  line-height: 120%;
`;

const ProductCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
`;

const ProductCardTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
`;

const ProductName = styled.h4`
  font-size: 14px;
  font-weight: 700;
`;

const ProductDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 8px;
  line-height: 128%;
`;

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
  line-height: 120%;
`;

const ProductUsageTip = styled.p`
  font-size: 13px;
  color: #555;
  margin-top: 16px;
  line-height: 132%;
  strong {
    font-weight: 700;
    margin-bottom: 4px;
    color: #000;
  }
`;

const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 80px;
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
