// components/overviews/BeautyOverview.tsx
import React from "react";
import { BeautyTrend, BrandSpotlight, StylingTip } from "@/types/dataProps";

interface BeautyOverviewProps {
  overview: {
    beauty_trends?: BeautyTrend[];
    brand_spotlight?: BrandSpotlight[];
    styling_tips?: StylingTip[];
  };
}
import styled, { keyframes } from "styled-components";
const BeautyOverview: React.FC<BeautyOverviewProps> = ({ overview }) => (
  <OverviewContainer>
    <SectionTitle>뷰티 트렌드</SectionTitle>
    <Description>
      유튜브 영상에서 소개된 최신 뷰티 트렌드를 제공합니다.
    </Description>
    {overview.beauty_trends?.map((trend, index) => (
      <Card key={index}>
        <TrendTitle>{trend.trend_name}</TrendTitle>
        <TrendDescription>{trend.trend_description}</TrendDescription>
      </Card>
    ))}

    <SectionTitle>브랜드 스포트라이트</SectionTitle>
    <Description>영상에서 주목받은 브랜드와 제품을 소개합니다.</Description>
    {overview.brand_spotlight?.map((brand, index) => (
      <BrandCard key={index}>
        <BrandName>{brand.brand_name}</BrandName>
        <BrandDescription>{brand.brand_description}</BrandDescription>
        <ProductCardTitle>💄 대표 제품</ProductCardTitle>
        {brand.highlighted_products.map((product, idx) => (
          <ProductCard key={idx}>
            <ProductName>{product.product_name}</ProductName>
            <ProductDescription>
              {product.product_description}
            </ProductDescription>
          </ProductCard>
        ))}
      </BrandCard>
    ))}

    <SectionTitle>스타일링 팁</SectionTitle>
    <Description>영상에 나온 뷰티 제품 활용 팁을 소개합니다.</Description>
    {overview.styling_tips?.map((tip, index) => (
      <TipCard key={index}>
        <TipTitle>{tip.tip_title}</TipTitle>
        <TipDescription>{tip.tip_description}</TipDescription>
        {tip.recommended_product.map((product, idx) => (
          <ProductUsageTip key={idx}>
            <strong>💄 {product.product_name}</strong> <br />
            {product.product_usage_tip}
          </ProductUsageTip>
        ))}
      </TipCard>
    ))}
  </OverviewContainer>
);

export default BeautyOverview;

const Card = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
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
    margin-top: 32px;
  }
  &:nth-of-type(3) {
    margin-top: 32px; // Different margin for the third SectionTitle
  }
  &:nth-of-type(4) {
    margin-top: 32px; // Different margin for the third SectionTitle
  }
`;
