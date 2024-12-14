// components/overviews/CryptoOverview.tsx
import React from "react";
import { Crypto, InvestmentStrategy } from "@/types/dataProps";
import styled from "styled-components";

interface CryptoOverviewProps {
  overview: {
    market_analysis?: string;
    cryptos?: Crypto[];
    investment_strategy?: InvestmentStrategy[];
  };
}

const CryptoOverview: React.FC<CryptoOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <OverviewTitle>✨ 가상자산 하이라이트</OverviewTitle>

    <SectionTitle>시장 분석</SectionTitle>
    <Description>
      유튜브 영상에서 제공된 가상자산 시장 동향과 관련된 정보입니다.
    </Description>
    <Analysis>{overview.market_analysis}</Analysis>

    <SectionTitle>암호화폐 분석</SectionTitle>
    <Description>영상에 소개된 주요 암호화폐에 대한 분석입니다.</Description>
    {overview.cryptos?.map((crypto, index) => (
      <CryptoCard key={index}>
        <CryptoName>{crypto.crypto_name}</CryptoName>
        <CryptoDescription>{crypto.crypto_description}</CryptoDescription>
        {crypto.crypto_analysis.map((analysis, idx) => (
          <ProductCard key={idx}>
            <CryptoAnalysisText>{analysis.description}</CryptoAnalysisText>
          </ProductCard>
        ))}
      </CryptoCard>
    ))}

    <SectionTitle>투자 전략</SectionTitle>
    <Description>영상에서 제안된 투자 전략과 조언을 포함합니다.</Description>
    {overview.investment_strategy?.map((strategy, index) => (
      <Analysis key={index}>
        <CryptoName>{strategy.strategy_title}</CryptoName>
        <CryptoStrategyText>{strategy.strategy_description}</CryptoStrategyText>
      </Analysis>
    ))}
  </OverviewContainer>
);

export default CryptoOverview;

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
    margin-top: 48px;
  }
  &:nth-of-type(4) {
    margin-top: 48px;
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

const CryptoCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 12px;
  margin-top: 8px;
  margin-bottom: 20px;
`;

const CryptoName = styled.h4`
  font-size: 16px;
  font-weight: 700;
`;

const CryptoDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  margin-top: 4px;
  line-height: 128%;
`;

const CryptoAnalysisText = styled.p`
  font-size: 14px;
  color: #000;
  line-height: 132%;
  font-weight: 500;
`;

const CryptoStrategyText = styled.p`
  font-size: 14px;
  color: #000;
  line-height: 132%;
  font-weight: 400;
  margin-top: 4px;
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
