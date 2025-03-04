// components/overviews/BeautyOverviewMerged.tsx
import React from "react";
import styled from "styled-components";

interface TargetAudience {
  label: string;
  description: string;
}
interface BeautyTrend {
  trend_name: string;
  trend_description: string;
}
interface RecommendedProduct {
  product_name: string;
  product_usage_tip: string;
}
interface BrandItem {
  product_name: string;
  product_description: string;
  tip_title: string;
  tip_description: string;
  recommended_product: RecommendedProduct[];
}
interface BrandSuggestion {
  brand_name: string;
  brand_description: string;
  items: BrandItem[];
}
interface BeautyOverviewMergedProps {
  overview: {
    target_audience?: TargetAudience[];
    beauty_trends?: BeautyTrend[];
    brand_suggestions?: BrandSuggestion[];
  };
}

const BeautyOverviewMerged: React.FC<BeautyOverviewMergedProps> = ({
  overview,
}) => {
  return (
    <Container>
      <Title>✨ 유티클 인사이트</Title>

      {/* Target Audience */}
      {overview.target_audience && overview.target_audience.length > 0 && (
        <Section>
          <SectionTitle>누가 보면 좋을까요?</SectionTitle>
          <SectionDesc>
            영상 정보를 유용하게 쓸 수 있는 타겟 유형을 소개합니다.
          </SectionDesc>
          {overview.target_audience.map((aud, idx) => (
            <AudienceBlock key={idx}>
              <AudienceLabel>{aud.label}</AudienceLabel>
              <AudienceDesc>{aud.description}</AudienceDesc>
            </AudienceBlock>
          ))}
        </Section>
      )}

      {/* Beauty Trends */}
      {overview.beauty_trends && overview.beauty_trends.length > 0 && (
        <Section>
          <SectionTitle>뷰티 트렌드</SectionTitle>
          <SectionDesc>영상에서 다뤄진 주요 트렌드를 정리했습니다.</SectionDesc>
          {overview.beauty_trends.map((trend, idx) => (
            <TrendBlock key={idx}>
              <TrendName>{trend.trend_name}</TrendName>
              <TrendDesc>{trend.trend_description}</TrendDesc>
            </TrendBlock>
          ))}
        </Section>
      )}

      {/* Brand Suggestions */}
      {overview.brand_suggestions && overview.brand_suggestions.length > 0 && (
        <Section>
          <SectionTitle>브랜드 & 제품 소개</SectionTitle>
          <SectionDesc>
            브랜드별 대표 제품과 함께, 활용 팁을 하나의 흐름으로 정리했습니다.
          </SectionDesc>

          {overview.brand_suggestions.map((brand, bIdx) => (
            <BrandBlock key={bIdx}>
              <BrandName>{brand.brand_name}</BrandName>
              <BrandDesc>{brand.brand_description}</BrandDesc>

              {brand.items.map((item, iIdx) => (
                <ItemBlock key={iIdx}>
                  <ProductName>{item.product_name}</ProductName>
                  <ProductDesc>{item.product_description}</ProductDesc>

                  <TipTitle>💡 사용 팁</TipTitle>
                  <TipDesc>{item.tip_description}</TipDesc>

                  {/* {item.recommended_product.map((rp, rIdx) => (
                    <RecommendedBlock key={rIdx}>
                      <RecommendedName>{rp.product_name}</RecommendedName>
                      <RecommendedUsage>
                        {rp.product_usage_tip}
                      </RecommendedUsage>
                    </RecommendedBlock>
                  ))} */}
                </ItemBlock>
              ))}
            </BrandBlock>
          ))}
        </Section>
      )}
    </Container>
  );
};

export default BeautyOverviewMerged;

/* ========== Styled ========== */
const Container = styled.div`
  padding: 0 16px;
  margin-top: 80px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
`;

const Section = styled.div`
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

/* target_audience */
const AudienceBlock = styled.div`
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
  line-height: 132%;
`;

/* beauty_trends */
const TrendBlock = styled.div`
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

/* brand_suggestions */
const BrandBlock = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const BrandName = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const BrandDesc = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
  line-height: 132%;
`;

const ItemBlock = styled.div`
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
`;

const ProductName = styled.h5`
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
`;

const ProductDesc = styled.p`
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
  line-height: 132%;
  margin-top: 4px;
`;

const TipTitle = styled.h5`
  font-size: 14px;
  font-weight: 600;
  margin-top: 16px;
`;

const TipDesc = styled.p`
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
  line-height: 132%;
  margin-top: 4px;
`;

const RecommendedBlock = styled.div`
  background-color: #fff;
  margin-top: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  padding: 8px;
`;

const RecommendedName = styled.h6`
  font-size: 13px;
  font-weight: 600;
`;

const RecommendedUsage = styled.p`
  font-size: 13px;
  color: #555;
  margin-top: 4px;
`;
