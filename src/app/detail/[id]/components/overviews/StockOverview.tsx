// components/overviews/StockOverview.tsx
import React from "react";
import { Stock, InvestmentStrategy } from "@/types/dataProps";
import styled, { keyframes } from "styled-components";

interface StockOverviewProps {
  overview: {
    market_analysis?: string;
    stocks?: Stock[];
    investment_strategy?: InvestmentStrategy[];
  };
}

const StockOverview: React.FC<StockOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <OverviewTitle>✨ 하이라이트</OverviewTitle>
    <SectionTitle>시장 분석</SectionTitle>
    <Description>
      이 정보는 유튜브 영상에서 제공된 시장 동향과 관련된 내용입니다.
    </Description>
    <Analysis>{overview.market_analysis}</Analysis>

    <SectionTitle>종목 분석</SectionTitle>
    <Description>영상에 소개된 주요 종목들에 대한 분석입니다.</Description>
    {overview.stocks?.map((stock, index) => (
      <StockCard key={index}>
        <StockName>{stock.stock_name}</StockName>
        <StockDescription>{stock.company_description}</StockDescription>
        {stock.stock_analysis.map((analysis, idx) => (
          <ProductCard key={idx}>
            <StockAnalysisText>{analysis.description}</StockAnalysisText>
          </ProductCard>
        ))}
      </StockCard>
    ))}

    <SectionTitle>투자 전략</SectionTitle>
    <Description>영상에서 제안된 투자 전략과 조언을 포함합니다.</Description>
    {overview.investment_strategy?.map((strategy, index) => (
      <Analysis key={index}>
        <StockName>{strategy.strategy_title}</StockName>
        <StockAnalysisText>{strategy.strategy_description}</StockAnalysisText>
      </Analysis>
    ))}
  </OverviewContainer>
);

export default StockOverview;

const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 20px;
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
    margin-top: 48px; // Different margin for the third SectionTitle
  }
  &:nth-of-type(4) {
    margin-top: 48px; // Different margin for the third SectionTitle
  }
`;

const Analysis = styled.p`
  font-size: 16px;
  line-height: 140%;
  background-color: #f0f4ff;
  padding: 16px 12px;
  border-radius: 4px;
  margin-top: 4px;
`;

const StockCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 12px;
  margin-top: 8px;
  margin-bottom: 20px;
`;

const StockName = styled.h4`
  font-size: 16px;
  font-weight: 700;
`;

const StockDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  margin-top: 4px;
  line-height: 128%;
`;

const StockAnalysisText = styled.p`
  font-size: 14px;
  color: #000;
  line-height: 132%;
  font-weight: 400;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
`;

const ProductCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-top: 4px;
`;
