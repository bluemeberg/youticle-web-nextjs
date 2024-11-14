// components/overviews/FashionOverview.tsx
import React from "react";
import {
  FashionTrend,
  FashionBrandSpotlight,
  FashionStylingTip,
} from "@/types/dataProps";
import styled, { keyframes } from "styled-components";

interface FashionOverviewProps {
  overview: {
    fashion_trends?: FashionTrend[];
    brand_spotlight_fashion?: FashionBrandSpotlight[];
    styling_tips_fashion?: FashionStylingTip[];
  };
}

const FashionOverview: React.FC<FashionOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <OverviewTitle>✨ 하이라이트</OverviewTitle>

    <SectionTitle>패션 트렌드</SectionTitle>
    <Description>
      유튜브 영상에서 언급된 최신 패션 트렌드를 소개합니다.
    </Description>
    {overview.fashion_trends?.map((trend, index) => (
      <Card key={index}>
        <TrendTitle>{trend.trend_name}</TrendTitle>
        <TrendDescription>{trend.trend_description}</TrendDescription>
      </Card>
    ))}

    <SectionTitle>브랜드 스포트라이트</SectionTitle>
    <Description>
      유튜브 영상에서 주목받은 브랜드와 그 제품들을 소개합니다.
    </Description>
    {overview.brand_spotlight_fashion?.map((brand, index) => (
      <BrandCard key={index}>
        <BrandName>{brand.brand_name}</BrandName>
        <BrandDescription>{brand.brand_description}</BrandDescription>
        <ProductCardTitle>👕 대표 제품</ProductCardTitle>
        {brand.highlighted_items.map((item, idx) => (
          <ProductCard key={idx}>
            <ProductName>{item.item_name}</ProductName>
            <ProductDescription>{item.item_description}</ProductDescription>
          </ProductCard>
        ))}
      </BrandCard>
    ))}

    <SectionTitle>스타일링 팁</SectionTitle>
    <Description>
      영상에 소개된 제품을 활용한 스타일링 팁을 제공합니다.
    </Description>
    {overview.styling_tips_fashion?.map((tip, index) => (
      <TipCard key={index}>
        <TipTitle>{tip.tip_title}</TipTitle>
        <TipDescription>{tip.tip_description}</TipDescription>
        {tip.recommended_item.map((item, idx) => (
          <ProductUsageTip key={idx}>
            <strong>👕 {item.item_name}</strong> <br />
            {item.usage_tip}
          </ProductUsageTip>
        ))}
      </TipCard>
    ))}
  </OverviewContainer>
);

export default FashionOverview;

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
  margin-bottom: 16px;
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
  margin-top: 20px;
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
