// components/overviews/EconomyOverview.tsx
import React from "react";
import {
  EconomicTrend,
  MarketAnalysisEconomy,
  InvestmentStrategyEconomy,
} from "@/types/dataProps";

import styled, { keyframes } from "styled-components";

interface EconomyOverviewProps {
  overview: {
    economic_trends?: EconomicTrend[];
    market_analysis_economy?: MarketAnalysisEconomy[];
    investment_strategies_economy?: InvestmentStrategyEconomy[];
  };
}

const EconomyOverview: React.FC<EconomyOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <SectionTitle>경제 트렌드</SectionTitle>
    <Description>
      유튜브 영상에서 소개된 최신 경제 트렌드를 소개합니다.
    </Description>
    {overview.economic_trends?.map((trend, index) => (
      <Card key={index}>
        <TrendTitle>{trend.trend_name}</TrendTitle>
        <TrendDescription>{trend.trend_description}</TrendDescription>
      </Card>
    ))}

    <SectionTitle>시장 분석</SectionTitle>
    <Description>주요 경제 지표와 시장 동향을 분석합니다.</Description>
    {overview.market_analysis_economy?.map((analysis, index) => (
      <BrandCard key={index}>
        <BrandName>{analysis.market_indicator}</BrandName>
        <BrandDescription>{analysis.analysis}</BrandDescription>
      </BrandCard>
    ))}

    <SectionTitle>투자 전략</SectionTitle>
    <Description>경제 트렌드를 기반으로 투자 전략을 제시합니다.</Description>
    {overview.investment_strategies_economy?.map((strategy, index) => (
      <Card key={index}>
        <TrendTitle>{strategy.strategy_title}</TrendTitle>
        <TrendDescription>{strategy.strategy_description}</TrendDescription>
      </Card>
    ))}
  </OverviewContainer>
);

export default EconomyOverview;

const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 20px;
`;

const Card = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const TrendTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
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

const BrandName = styled.h3`
  font-size: 16px;
  font-weight: 700;
`;

const BrandDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 8px;
  line-height: 128%;
`;

const StrategyDescription = styled.p`
  font-size: 14px;
  margin-bottom: 8px;
  margin-top: 8px;
  line-height: 128%;
`;

const ProductCard = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  margin-top: 12px;
  &:nth-of-type(2) {
    margin-top: 32px;
  }
  &:nth-of-type(3) {
    margin-top: 32px; // Different margin for the third SectionTitle
  }
  &:nth-of-type(4) {
    margin-top: 32px; // Different margin for the third SectionTitle
  }
`;
