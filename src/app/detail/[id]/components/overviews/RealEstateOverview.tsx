// components/overviews/RealEstateOverview.tsx
import React from "react";
import { RealEstateAnalysis } from "@/types/dataProps";
import styled, { keyframes } from "styled-components";

interface RealEstateOverviewProps {
  overview: {
    market_analysis?: string;
    real_estate_analysis?: RealEstateAnalysis[];
    investment_strategy?: string;
  };
}

const RealEstateOverview: React.FC<RealEstateOverviewProps> = ({
  overview,
}) => (
  <OverviewContainer>
    <OverviewTitle>✨ 하이라이트</OverviewTitle>

    <SectionTitle>시장 분석</SectionTitle>
    <Description>유튜브 영상에서 제공된 부동산 시장 분석입니다.</Description>
    <Analysis>{overview.market_analysis}</Analysis>

    {overview.real_estate_analysis &&
      overview.real_estate_analysis.length > 0 && (
        <>
          <SectionTitle>지역 분석</SectionTitle>
          <Description>영상에 소개된 주요 부동산 지역 분석입니다.</Description>
          {overview.real_estate_analysis.map((realEstate, index) => (
            <StockCard key={index}>
              <StockName>{realEstate.real_estate_area}</StockName>
              <StockDescription>{realEstate.area_description}</StockDescription>
              <StockAnalysisText>{realEstate.analysis}</StockAnalysisText>
            </StockCard>
          ))}
        </>
      )}

    <SectionTitle>투자 전략</SectionTitle>
    <Description>부동산 관련 투자 전략을 제공합니다.</Description>
    <Analysis>{overview.investment_strategy}</Analysis>
  </OverviewContainer>
);

export default RealEstateOverview;

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
  line-height: 132%;
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
