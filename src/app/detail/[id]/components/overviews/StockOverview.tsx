// components/overviews/StockOverview.tsx
import React from "react";
import { StockAnalysis } from "@/types/dataProps";
import styled, { keyframes } from "styled-components";

interface StockOverviewProps {
  overview: {
    market_analysis?: string;
    stock_analysis?: StockAnalysis[];
    investment_strategy?: string;
  };
}

const StockOverview: React.FC<StockOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <SectionTitle>시장 분석</SectionTitle>
    <Description>
      이 정보는 유튜브 영상에서 제공된 시장 동향과 관련된 내용입니다.
    </Description>
    <Analysis>{overview.market_analysis}</Analysis>

    <SectionTitle>종목 분석</SectionTitle>
    <Description>
      유튜브 영상에 소개된 주식 종목들에 대한 심층 분석입니다.
    </Description>
    {overview.stock_analysis?.map((stock, index) => (
      <StockCard key={index}>
        <StockName>{stock.stock}</StockName>
        <StockDescription>{stock.stock_description}</StockDescription>
        <StockAnalysisText>{stock.analysis}</StockAnalysisText>
      </StockCard>
    ))}

    <SectionTitle>투자 전략</SectionTitle>
    <Description>영상에서 제안된 투자 전략과 조언을 포함합니다.</Description>
    <Analysis>{overview.investment_strategy}</Analysis>
  </OverviewContainer>
);

export default StockOverview;

const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 20px;
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

const Analysis = styled.p`
  font-size: 16px;
  line-height: 140%;
  background-color: #f0f4ff;
  padding: 16px 12px;
  border-radius: 4px;
  margin-top: 12px;
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
  margin-bottom: 16px;
  margin-top: 4px;
`;

const StockAnalysisText = styled.p`
  font-size: 16px;
  color: #000;
  line-height: 132%;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;
